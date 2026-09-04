'use server';

// ============================================================
// Dev Prep — interview engine: question bank, sessions,
// scoring, history, bookmarks.
// ============================================================
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { mapQuestion } from '@/server/mappers';
import { awardXp, checkAchievements, upsertDailyProgress, XP_RULES } from '@/server/engagement';
import { computeInterviewScore, aggregateTopics } from '@/server/scoring';
import type { AttemptSummaryDTO, QuestionDTO } from '@/types';
import { parseJsonArray } from '@/types';

export interface SessionQuestion {
  id: string; question: string; shortAnswer: string; detailedAnswer: string;
  topic: string; category: string; seniority: string; expectedMinutes: number;
  technologyName: string; technologyIcon: string; technologyColor: string;
}

const MODE_SPECS: Record<string, { count: number; seniorities?: string[] }> = {
  quick: { count: 5 },
  standard: { count: 15 },
  full: { count: 30 },
  random: { count: 12 },
  senior: { count: 18, seniorities: ['SENIOR'] },
  staff: { count: 15, seniorities: ['STAFF', 'SENIOR'] },
  daily: { count: 3 },
  quiz: { count: 5 },
};

export async function startInterviewAction(input: {
  mode: string; technology?: string | null; level?: string;
}): Promise<{ ok: boolean; error?: string; attemptId?: string; questions?: SessionQuestion[] }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Sign in to start an interview session' };

  const spec = MODE_SPECS[input.mode] ?? MODE_SPECS.standard;
  const level = input.level ?? 'MID';

  const where: Record<string, unknown> = {};
  if (input.technology && input.mode !== 'random') where.technology = { slug: input.technology };
  if (spec.seniorities) where.seniority = { in: spec.seniorities };
  else if (input.mode !== 'random') {
    // level-matched pool with an escape hatch if too few
    const seniorityRank: Record<string, string[]> = { JUNIOR: ['JUNIOR', 'MID'], MID: ['MID', 'JUNIOR', 'SENIOR'], SENIOR: ['SENIOR', 'MID', 'STAFF'], STAFF: ['STAFF', 'SENIOR'] };
    where.seniority = { in: seniorityRank[level] ?? ['MID', 'SENIOR'] };
  }

  let questions = await db.interviewQuestion.findMany({
    where: where as never,
    include: { technology: { select: { name: true, slug: true, icon: true, color: true } } },
    take: spec.count * 6,
  });
  if (questions.length < spec.count) {
    const techFilter = where.technology;
    delete where.technology;
    const extra = await db.interviewQuestion.findMany({
      where: where as never,
      include: { technology: { select: { name: true, slug: true, icon: true, color: true } } },
      take: spec.count * 3,
    });
    const seen = new Set(questions.map((q) => q.id));
    questions = [...questions, ...extra.filter((e) => !seen.has(e.id))];
    if (techFilter) where.technology = techFilter;
  }
  // deterministic-ish shuffle
  questions = questions.sort(() => Math.random() - 0.5).slice(0, spec.count);
  if (questions.length === 0) return { ok: false, error: 'No questions available for this configuration yet' };

  const tech = input.technology ? await db.technology.findUnique({ where: { slug: input.technology } }) : null;
  const attempt = await db.interviewAttempt.create({
    data: {
      userId: user.id, mode: input.mode, level,
      technologyId: tech?.id ?? null,
      totalQuestions: questions.length, status: 'IN_PROGRESS',
    },
  });

  await db.analyticsEvent.create({ data: { type: 'interview_start', day: new Date().toISOString().slice(0, 10), userId: user.id, ref: input.technology ?? null } }).catch(() => {});

  return {
    ok: true,
    attemptId: attempt.id,
    questions: questions.map((q) => ({
      id: q.id, question: q.question, shortAnswer: q.shortAnswer, detailedAnswer: q.detailedAnswer,
      topic: q.topic, category: q.category, seniority: q.seniority, expectedMinutes: q.expectedMinutes,
      technologyName: q.technology.name, technologyIcon: q.technology.icon, technologyColor: q.technology.color,
    })),
  };
}

export async function completeInterviewAction(input: {
  attemptId: string;
  results: { questionId: string; result: 'KNOWN' | 'DIFFICULT' | 'SKIPPED'; secondsSpent: number; confidence: number }[];
  abandon?: boolean;
}): Promise<{ ok: boolean; score?: number; attempt?: AttemptSummaryDTO; unlocked?: { key: string; title: string; description: string; xpReward: number }[]; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Not authorized' };

  const attempt = await db.interviewAttempt.findUnique({ where: { id: input.attemptId } });
  if (!attempt || attempt.userId !== user.id) return { ok: false, error: 'Attempt not found' };

  const results = input.results.filter((r) => r.result !== null);
  const { known, difficult, skipped, score } = computeInterviewScore(input.results);
  const duration = Math.round((Date.now() - attempt.createdAt.getTime()) / 1000);

  // topic aggregation for strengths/weaknesses
  const answeredIds = results.filter((r) => r.result !== 'SKIPPED').map((r) => r.questionId);
  const answeredQuestions = answeredIds.length
    ? await db.interviewQuestion.findMany({ where: { id: { in: answeredIds } }, select: { id: true, topic: true } })
    : [];
  const topicById = new Map(answeredQuestions.map((q) => [q.id, q.topic]));
  const { strong, weak } = aggregateTopics(input.results, topicById);
  const status = input.abandon ? 'ABANDONED' : 'COMPLETED';
  await db.interviewAttempt.update({
    where: { id: attempt.id },
    data: {
      knownCount: known, difficultCount: difficult, skippedCount: skipped,
      score: input.abandon ? 0 : score, durationSeconds: Math.min(duration, 7200),
      status, strongTopics: JSON.stringify(strong.slice(0, 6)), weakTopics: JSON.stringify(weak.slice(0, 6)),
      completedAt: new Date(),
    },
  });
  await db.interviewAnswer.deleteMany({ where: { attemptId: attempt.id } });
  if (results.length) {
    await db.interviewAnswer.createMany({
      data: results.map((r, i) => ({
        attemptId: attempt.id, questionId: r.questionId, result: r.result as string,
        secondsSpent: Math.min(3600, r.secondsSpent), confidence: r.confidence, sortOrder: i,
      })),
    });
  }
  let unlocked: { key: string; title: string; description: string; xpReward: number }[] = [];
  if (!input.abandon) {
    const xp = results.length * XP_RULES.INTERVIEW_ANSWER + XP_RULES.INTERVIEW_COMPLETE;
    await awardXp(user.id, xp, { type: 'INTERVIEW_ATTEMPT', title: `Interview completed — ${score}%`, metadata: { mode: attempt.mode, score } });
    await upsertDailyProgress(user.id, { questionsAnswered: results.length });
    unlocked = await checkAchievements(user.id);
    await db.analyticsEvent.create({ data: { type: 'interview_complete', day: new Date().toISOString().slice(0, 10), userId: user.id } }).catch(() => {});
  }

  const tech = attempt.technologyId ? await db.technology.findUnique({ where: { id: attempt.technologyId } }) : null;
  return {
    ok: true, score,
    attempt: {
      id: attempt.id, mode: attempt.mode, level: attempt.level, score, totalQuestions: attempt.totalQuestions,
      knownCount: known, difficultCount: difficult, skippedCount: skipped,
      durationSeconds: Math.min(duration, 7200), status, createdAt: attempt.createdAt.toISOString(),
      strongTopics: strong.slice(0, 6), weakTopics: weak.slice(0, 6),
      technology: tech ? { name: tech.name, slug: tech.slug, icon: tech.icon, color: tech.color } : null,
    },
    unlocked,
  };
}

export async function listAttemptsAction(limit = 10): Promise<AttemptSummaryDTO[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const attempts = await db.interviewAttempt.findMany({
    where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: limit,
    include: { technology: { select: { name: true, slug: true, icon: true, color: true } } },
  });
  return attempts.map((a) => ({
    id: a.id, mode: a.mode, level: a.level, score: a.score, totalQuestions: a.totalQuestions,
    knownCount: a.knownCount, difficultCount: a.difficultCount, skippedCount: a.skippedCount,
    durationSeconds: a.durationSeconds, status: a.status, createdAt: a.createdAt.toISOString(),
    strongTopics: parseJsonArray(a.strongTopics), weakTopics: parseJsonArray(a.weakTopics),
    technology: a.technology,
  }));
}

export async function listQuestionsAction(opts: {
  technology?: string; seniority?: string; category?: string; difficulty?: string;
  search?: string; page?: number; bookmarked?: boolean;
}): Promise<{ questions: QuestionDTO[]; total: number; page: number }> {
  const user = await getCurrentUser();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = 12;
  const where: Record<string, unknown> = {};
  if (opts.technology) where.technology = { slug: opts.technology };
  if (opts.seniority) where.seniority = opts.seniority;
  if (opts.category) where.category = opts.category;
  if (opts.difficulty) where.difficulty = opts.difficulty;
  if (opts.search) {
    where.OR = [{ question: { contains: opts.search } }, { topic: { contains: opts.search } }, { shortAnswer: { contains: opts.search } }];
  }
  if (opts.bookmarked) where.bookmarks = { some: { userId: user?.id } };

  const [rows, total] = await Promise.all([
    db.interviewQuestion.findMany({
      where: where as never, orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize, take: pageSize,
      include: { technology: { select: { name: true, slug: true, icon: true, color: true } }, bookmarks: { select: { userId: true } } },
    }),
    db.interviewQuestion.count({ where: where as never }),
  ]);
  return { questions: rows.map((q) => mapQuestion(q, user?.id)), total, page };
}

export async function toggleQuestionBookmarkAction(questionId: string): Promise<{ ok: boolean; bookmarked?: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Sign in to save questions' };
  const existing = await db.questionBookmark.findUnique({ where: { userId_questionId: { userId: user.id, questionId } } });
  if (existing) {
    await db.questionBookmark.delete({ where: { userId_questionId: { userId: user.id, questionId } } });
    return { ok: true, bookmarked: false };
  }
  await db.questionBookmark.create({ data: { userId: user.id, questionId } });
  return { ok: true, bookmarked: true };
}

export async function getInterviewHubAction(): Promise<{
  attempts: AttemptSummaryDTO[];
  readiness: number;
  stats: { answered: number; attempts: number; avgScore: number; bookmarks: number };
  weakTopics: { topic: string; technologySlug: string }[];
  dailyQuestion: QuestionDTO | null;
}> {
  const user = await getCurrentUser();
  if (!user) {
    const dailyQuestion = await getDailyQuestion();
    return { attempts: [], readiness: 0, stats: { answered: 0, attempts: 0, avgScore: 0, bookmarks: 0 }, weakTopics: [], dailyQuestion };
  }
  const [attempts, answers, bookmarks, weakRows, dailyQuestion] = await Promise.all([
    listAttemptsAction(6),
    db.interviewAnswer.count({ where: { attempt: { userId: user.id }, result: { not: 'SKIPPED' } } }),
    db.questionBookmark.count({ where: { userId: user.id } }),
    db.interviewAnswer.findMany({
      where: { attempt: { userId: user.id, status: 'COMPLETED' }, result: 'DIFFICULT' },
      orderBy: { id: 'desc' }, take: 12,
      include: { question: { include: { technology: { select: { slug: true } } } } },
    }),
    getDailyQuestion(),
  ]);
  const completed = attempts.filter((a) => a.status === 'COMPLETED');
  const avgScore = completed.length ? Math.round(completed.reduce((s, a) => s + a.score, 0) / completed.length) : 0;
  const consistencyBonus = Math.min(15, user.streakCount * 2);
  const volumeBonus = Math.min(15, Math.floor(answers / 20) * 3);
  const readiness = completed.length
    ? Math.min(100, Math.round(avgScore * 0.6 + volumeBonus + consistencyBonus))
    : Math.min(30, volumeBonus + consistencyBonus);

  const weakTopics = weakRows
    .map((r) => ({ topic: r.question.topic, technologySlug: r.question.technology.slug }))
    .filter((t, i, arr) => arr.findIndex((x) => x.topic === t.topic) === i)
    .slice(0, 6);

  return {
    attempts, readiness,
    stats: { answered: answers, attempts: completed.length, avgScore, bookmarks },
    weakTopics, dailyQuestion,
  };
}

async function getDailyQuestion(): Promise<QuestionDTO | null> {
  // deterministic "question of the day" by date hash
  const seed = new Date().toISOString().slice(0, 10).split('-').reduce((a, p) => a + parseInt(p, 10), 0);
  const count = await db.interviewQuestion.count();
  if (count === 0) return null;
  const q = await db.interviewQuestion.findFirst({
    skip: seed % count,
    include: { technology: { select: { name: true, slug: true, icon: true, color: true } }, bookmarks: { select: { userId: true } } },
  });
  return q ? mapQuestion(q) : null;
}

export async function completeDailyChallengeAction(): Promise<{ ok: boolean; unlocked?: { key: string; title: string; description: string; xpReward: number }[] }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  await awardXp(user.id, 30, { type: 'DAILY_CHALLENGE', title: 'Daily challenge completed' });
  await upsertDailyProgress(user.id, { challengeCompleted: true, xpEarned: 30 });
  const unlocked = await checkAchievements(user.id);
  return { ok: true, unlocked };
}
