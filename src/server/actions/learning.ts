'use server';

// ============================================================
// Dev Prep — learning & growth: paths, progress, library,
// notes, notifications, dashboard, recommendations.
// ============================================================
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { mapArticle, articleInclude, mapQuestion } from '@/server/mappers';
import { awardXp, checkAchievements, upsertDailyProgress, touchStreak, XP_RULES } from '@/server/engagement';
import { levelProgress } from '@/lib/design';
import type { Prisma } from '@prisma/client';
import type { DashboardDTO, PathDTO, PathItemDTO } from '@/types';
import { parseJsonArray } from '@/types';

// The conditional `enrollments: user ? {...} : false` include defeats
// Prisma's payload inference, so the row shapes are declared explicitly.
type PathRow = Prisma.LearningPathGetPayload<{
  include: {
    technology: { select: { name: true; slug: true; icon: true; color: true } };
    _count: { select: { items: true; enrollments: true } };
    enrollments: true;
  };
}>;
type PathDetailRow = Prisma.LearningPathGetPayload<{
  include: {
    technology: { select: { name: true; slug: true; icon: true; color: true } };
    items: {
      include: {
        article: { select: { title: true; slug: true; readingTime: true } };
        technology: { select: { name: true; slug: true; icon: true; color: true } };
        progress: true;
      };
    };
    _count: { select: { items: true; enrollments: true } };
    enrollments: true;
  };
}>;

// ---------------- paths ----------------
export async function listPathsAction(): Promise<PathDTO[]> {
  const user = await getCurrentUser();
  const paths = (await db.learningPath.findMany({
    where: { published: true },
    orderBy: { createdAt: 'asc' },
    include: {
      technology: { select: { name: true, slug: true, icon: true, color: true } },
      _count: { select: { items: true, enrollments: true } },
      enrollments: user ? { where: { userId: user.id } } : false,
    } as never,
  })) as unknown as PathRow[];
  const pathIds = paths.map((p) => p.id);
  const progressMap = new Map<string, { completed: number; total: number }>();
  if (user && pathIds.length) {
    const items = await db.learningPathItem.findMany({
      where: { pathId: { in: pathIds } },
      select: { id: true, pathId: true, progress: { where: { userId: user.id } } },
    });
    for (const item of items) {
      const agg = progressMap.get(item.pathId) ?? { completed: 0, total: 0 };
      agg.total += 1;
      if (item.progress.length) agg.completed += 1;
      progressMap.set(item.pathId, agg);
    }
  } else if (pathIds.length) {
    const items = await db.learningPathItem.groupBy({ by: ['pathId'], _count: true });
    items.forEach((i) => progressMap.set(i.pathId, { completed: 0, total: i._count }));
  }

  return paths.map((p) => {
    const progress = progressMap.get(p.id);
    const enrollment = (p as { enrollments?: { startedAt: Date; completedAt: Date | null }[] }).enrollments?.[0];
    return {
      id: p.id, title: p.title, slug: p.slug, description: p.description, longDescription: p.longDescription,
      icon: p.icon, color: p.color, level: p.level, estimatedHours: p.estimatedHours, careerGoal: p.careerGoal,
      technology: p.technology, itemCount: p._count.items, enrolledCount: p._count.enrollments,
      enrollment: enrollment ? { startedAt: enrollment.startedAt.toISOString(), completedAt: enrollment.completedAt?.toISOString() ?? null } : null,
      progress: progress ? { completed: progress.completed, percent: progress.total ? Math.round((progress.completed / progress.total) * 100) : 0 } : undefined,
    };
  });
}

export async function getPathAction(slug: string): Promise<PathDTO | null> {
  const user = await getCurrentUser();
  const path = (await db.learningPath.findUnique({
    where: { slug },
    include: {
      technology: { select: { name: true, slug: true, icon: true, color: true } },
      items: {
        orderBy: { sortOrder: 'asc' },
        include: {
          article: { select: { title: true, slug: true, readingTime: true } },
          technology: { select: { name: true, slug: true, icon: true, color: true } },
          progress: user ? { where: { userId: user.id } } : false,
        } as never,
      },
      _count: { select: { items: true, enrollments: true } },
      enrollments: user ? { where: { userId: user.id } } : false,
    } as never,
  })) as unknown as PathDetailRow | null;
  if (!path) return null;

  const items: PathItemDTO[] = (path.items as unknown as Array<{
    id: string; sortOrder: number; title: string; description: string | null; estimatedHours: number; milestone: boolean;
    article: { title: string; slug: string; readingTime: number } | null;
    technology: { name: string; slug: string; icon: string; color: string } | null;
    progress: unknown[];
  }>).map((i) => ({
    id: i.id, sortOrder: i.sortOrder, title: i.title, description: i.description,
    estimatedHours: i.estimatedHours, milestone: i.milestone,
    article: i.article, technology: i.technology,
    completed: user ? (i.progress as { length: number }).length > 0 : false,
  }));

  const completed = items.filter((i) => i.completed).length;
  const enrollment = (path as { enrollments?: { startedAt: Date; completedAt: Date | null }[] }).enrollments?.[0];

  return {
    id: path.id, title: path.title, slug: path.slug, description: path.description, longDescription: path.longDescription,
    icon: path.icon, color: path.color, level: path.level, estimatedHours: path.estimatedHours, careerGoal: path.careerGoal,
    technology: path.technology, itemCount: items.length, enrolledCount: path._count.enrollments,
    enrollment: enrollment ? { startedAt: enrollment.startedAt.toISOString(), completedAt: enrollment.completedAt?.toISOString() ?? null } : null,
    progress: { completed, percent: items.length ? Math.round((completed / items.length) * 100) : 0 },
    items,
  };
}

export async function togglePathEnrollmentAction(pathId: string): Promise<{ ok: boolean; enrolled?: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Sign in to enroll in paths' };
  const existing = await db.pathEnrollment.findUnique({ where: { userId_pathId: { userId: user.id, pathId } } });
  if (existing) {
    await db.pathEnrollment.delete({ where: { userId_pathId: { userId: user.id, pathId } } });
    return { ok: true, enrolled: false };
  }
  await db.pathEnrollment.create({ data: { userId: user.id, pathId } });
  await awardXp(user.id, 10, { type: 'PATH_ENROLL', title: 'Enrolled in a learning path' });
  await checkAchievements(user.id);
  return { ok: true, enrolled: true };
}

export async function togglePathItemAction(itemId: string): Promise<{ ok: boolean; completed?: boolean; pathCompleted?: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Sign in to track progress' };
  const existing = await db.pathItemProgress.findUnique({ where: { userId_itemId: { userId: user.id, itemId } } });
  if (existing) {
    await db.pathItemProgress.delete({ where: { userId_itemId: { userId: user.id, itemId } } });
    return { ok: true, completed: false };
  }
  await db.pathItemProgress.create({ data: { userId: user.id, itemId } });
  await awardXp(user.id, XP_RULES.PATH_ITEM, { type: 'PATH_PROGRESS', refType: 'path-item', refId: itemId, title: 'Completed a path step' });
  const unlocked = await checkAchievements(user.id);

  const item = await db.learningPathItem.findUnique({ where: { id: itemId }, include: { path: { include: { items: true, enrollments: true } } } });
  let pathCompleted = false;
  if (item) {
    const [total, done] = await Promise.all([
      db.learningPathItem.count({ where: { pathId: item.pathId } }),
      db.pathItemProgress.count({ where: { item: { pathId: item.pathId }, userId: user.id } }),
    ]);
    if (total > 0 && done >= total) {
      pathCompleted = true;
      await db.pathEnrollment.updateMany({ where: { userId: user.id, pathId: item.pathId, completedAt: null }, data: { completedAt: new Date() } });
      await db.notification.create({ data: { userId: user.id, type: 'achievement', title: 'Learning path completed', body: `You finished "${item.path.title}". +300 XP bonus`, link: '#/learning-paths' } }).catch(() => {});
      await awardXp(user.id, 300, { type: 'PATH_COMPLETE', title: `Completed path: ${item.path.title}` });
    }
  }
  void unlocked;
  return { ok: true, completed: true, pathCompleted };
}

// ---------------- reading progress ----------------
export async function trackReadAction(articleId: string, percent: number): Promise<{ ok: boolean; completed?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const existing = await db.articleRead.findUnique({ where: { userId_articleId: { userId: user.id, articleId } } });
  let completed = false;
  if (existing) {
    await db.articleRead.update({
      where: { userId_articleId: { userId: user.id, articleId } },
      data: { percent: Math.max(existing.percent, clamped), completedAt: existing.completedAt ?? (clamped >= 90 ? new Date() : null) },
    });
    completed = !!existing.completedAt;
  } else {
    completed = clamped >= 90;
    await db.articleRead.create({
      data: { userId: user.id, articleId, percent: clamped, completedAt: completed ? new Date() : null },
    });
    await awardXp(user.id, XP_RULES.READ_ARTICLE, { type: 'READ_ARTICLE', refType: 'article', refId: articleId, title: 'Read a new article' });
    await upsertDailyProgress(user.id, { articlesRead: 1 });
  }
  if (completed && !existing?.completedAt) {
    await awardXp(user.id, XP_RULES.COMPLETE_ARTICLE, { type: 'COMPLETE_ARTICLE', refType: 'article', refId: articleId, title: 'Completed an article' });
    await checkAchievements(user.id);
  }
  return { ok: true, completed };
}

// ---------------- bookmarks & likes ----------------
export async function toggleBookmarkAction(articleId: string): Promise<{ ok: boolean; bookmarked?: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Sign in to save articles' };
  const existing = await db.articleBookmark.findUnique({ where: { userId_articleId: { userId: user.id, articleId } } });
  if (existing) {
    await db.articleBookmark.delete({ where: { userId_articleId: { userId: user.id, articleId } } });
    return { ok: true, bookmarked: false };
  }
  await db.articleBookmark.create({ data: { userId: user.id, articleId } });
  await awardXp(user.id, XP_RULES.BOOKMARK, { type: 'BOOKMARK', refType: 'article', refId: articleId, title: 'Saved an article' });
  await checkAchievements(user.id);
  return { ok: true, bookmarked: true };
}

export async function toggleLikeAction(articleId: string): Promise<{ ok: boolean; liked?: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Sign in to like articles' };
  const existing = await db.like.findUnique({ where: { userId_articleId: { userId: user.id, articleId } } });
  if (existing) {
    await db.like.delete({ where: { userId_articleId: { userId: user.id, articleId } } });
    return { ok: true, liked: false };
  }
  await db.like.create({ data: { userId: user.id, articleId } });
  return { ok: true, liked: true };
}

// ---------------- notes ----------------
export async function listNotesAction(articleId?: string): Promise<{
  id: string; body: string; highlightedText: string | null; color: string; createdAt: string;
  article: { title: string; slug: string } | null;
}[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const notes = await db.note.findMany({
    where: { userId: user.id, ...(articleId ? { articleId } : {}) },
    orderBy: { createdAt: 'desc' },
    include: { article: { select: { title: true, slug: true } } },
  });
  return notes.map((n) => ({
    id: n.id, body: n.body, highlightedText: n.highlightedText, color: n.color,
    createdAt: n.createdAt.toISOString(), article: n.article,
  }));
}

export async function addNoteAction(articleId: string, body: string, highlightedText?: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Sign in to take notes' };
  const text = body.trim();
  if (!text) return { ok: false, error: 'Note cannot be empty' };
  await db.note.create({ data: { userId: user.id, articleId, body: text.slice(0, 2000), highlightedText: highlightedText?.slice(0, 500) ?? null } });
  await awardXp(user.id, XP_RULES.NOTE, { type: 'NOTE', refType: 'article', refId: articleId, title: 'Added a personal note' });
  await checkAchievements(user.id);
  return { ok: true };
}

export async function deleteNoteAction(noteId: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  await db.note.deleteMany({ where: { id: noteId, userId: user.id } });
  return { ok: true };
}

// ---------------- notifications ----------------
export async function listNotificationsAction(): Promise<{ items: { id: string; type: string; title: string; body: string | null; link: string | null; read: boolean; createdAt: string }[]; unread: number }> {
  const user = await getCurrentUser();
  if (!user) return { items: [], unread: 0 };
  const [items, unread] = await Promise.all([
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 20 }),
    db.notification.count({ where: { userId: user.id, read: false } }),
  ]);
  return {
    items: items.map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, link: n.link, read: n.read, createdAt: n.createdAt.toISOString() })),
    unread,
  };
}

export async function markNotificationsReadAction(): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  return { ok: true };
}

// ---------------- recommendations ----------------
async function weakTopicsFor(userId: string): Promise<{ topic: string; technologySlug: string | null }[]> {
  const rows = await db.interviewAnswer.findMany({
    where: { attempt: { userId, status: 'COMPLETED' }, result: 'DIFFICULT' },
    orderBy: { id: 'desc' }, take: 10,
    include: { question: { include: { technology: { select: { slug: true } } } } },
  });
  return rows.map((r) => ({ topic: r.question.topic, technologySlug: r.question.technology?.slug ?? null }));
}

export async function getRecommendationsAction(): Promise<{
  articles: ReturnType<typeof mapArticle>[];
  questions: ReturnType<typeof mapQuestion>[];
  reason: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    const articles = await db.article.findMany({
      where: { status: 'PUBLISHED', difficulty: 'beginner' },
      orderBy: { views: 'desc' }, take: 3,
      include: { ...articleInclude, _count: { select: { likes: true, bookmarks: true } } },
    });
    return { articles: articles.map((a) => mapArticle(a)), questions: [], reason: 'Popular starting points for new members' };
  }
  const weak = await weakTopicsFor(user.id);
  if (weak.length) {
    const slugs = weak.map((w) => w.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80));
    const articles = await db.article.findMany({
      where: { status: 'PUBLISHED', slug: { in: slugs } },
      take: 4,
      include: { ...articleInclude, _count: { select: { likes: true, bookmarks: true } } },
    });
    if (articles.length) {
      const questions = await db.interviewQuestion.findMany({
        where: { topic: { in: weak.slice(0, 3).map((w) => w.topic) } },
        take: 3,
        include: { technology: { select: { name: true, slug: true, icon: true, color: true } }, bookmarks: { select: { userId: true } } },
      });
      return {
        articles: articles.map((a) => mapArticle(a)),
        questions: questions.map((q) => mapQuestion(q, user.id)),
        reason: `You flagged ${weak.length} topic${weak.length > 1 ? 's' : ''} as difficult — here is targeted repair material`,
      };
    }
  }
  // fallback: unexplored technology
  const [readTechs, allTechs] = await Promise.all([
    db.articleRead.findMany({ where: { userId: user.id }, include: { article: { select: { technologyId: true } } } }),
    db.technology.findMany({ orderBy: { popularity: 'desc' }, take: 8, select: { id: true } }),
  ]);
  const readIds = new Set(readTechs.map((r) => r.article.technologyId).filter(Boolean));
  const nextTech = allTechs.find((t) => !readIds.has(t.id));
  const articles = await db.article.findMany({
    where: { status: 'PUBLISHED', technologyId: nextTech?.id },
    orderBy: { views: 'desc' }, take: 3,
    include: { ...articleInclude, _count: { select: { likes: true, bookmarks: true } } },
  });
  return { articles: articles.map((a) => mapArticle(a)), questions: [], reason: 'Broaden your graph — a technology you have not explored yet' };
}

// ---------------- dashboard ----------------
export async function getDashboardAction(): Promise<DashboardDTO | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  await touchStreak(user.id);

  const [reads, completedReads, bookmarks, answers, attempts, notes, dailyRows, enrolledPathsRaw, recommendations, notifications] = await Promise.all([
    db.articleRead.count({ where: { userId: user.id } }),
    db.articleRead.count({ where: { userId: user.id, completedAt: { not: null } } }),
    db.articleBookmark.count({ where: { userId: user.id } }),
    db.interviewAnswer.count({ where: { attempt: { userId: user.id }, result: { not: 'SKIPPED' } } }),
    db.interviewAttempt.findMany({ where: { userId: user.id, status: 'COMPLETED' }, orderBy: { createdAt: 'desc' }, take: 6, include: { technology: { select: { name: true, slug: true, icon: true, color: true } } } }),
    db.note.count({ where: { userId: user.id } }),
    db.dailyProgress.findMany({ where: { userId: user.id, day: { gte: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10) } }, orderBy: { day: 'asc' } }),
    listPathsAction(),
    getRecommendationsAction(),
    listNotificationsAction(),
  ]);

  const completedScores = attempts.filter((a) => a.status === 'COMPLETED');
  const avgScore = completedScores.length ? Math.round(completedScores.reduce((s, a) => s + a.score, 0) / completedScores.length) : 0;
  const consistencyBonus = Math.min(15, user.streakCount * 2);
  const volumeBonus = Math.min(15, Math.floor(answers / 20) * 3);
  const readiness = completedScores.length ? Math.min(100, Math.round(avgScore * 0.6 + volumeBonus + consistencyBonus)) : Math.min(30, volumeBonus + consistencyBonus);

  // skill graph
  const focusTechs = ['javascript', 'typescript', 'react', 'nextjs', 'css', 'web-performance', 'testing', 'frontend-system-design'];
  const techRows = await db.technology.findMany({
    where: { slug: { in: focusTechs } },
    select: { id: true, name: true, slug: true, icon: true, color: true, _count: { select: { articles: true } } },
  });
  const readArticles = await db.articleRead.findMany({
    where: { userId: user.id, completedAt: { not: null }, article: { technologyId: { not: null } } },
    include: { article: { select: { technologyId: true } } },
  });
  const completedByTech = new Map<string, number>();
  readArticles.forEach((r) => {
    const tid = r.article.technologyId!;
    completedByTech.set(tid, (completedByTech.get(tid) ?? 0) + 1);
  });
  const answeredByTech = new Map<string, number>();
  const ansRows = await db.interviewAnswer.findMany({
    where: { attempt: { userId: user.id }, result: { not: 'SKIPPED' } },
    include: { question: { select: { technologyId: true } } },
  });
  ansRows.forEach((r) => {
    if (!r.question.technologyId) return;
    answeredByTech.set(r.question.technologyId, (answeredByTech.get(r.question.technologyId) ?? 0) + 1);
  });
  const skillGraph = techRows.map((t) => {
    const articleScore = Math.min(1, (completedByTech.get(t.id) ?? 0) / 10); // 10 articles = article mastery
    const questionScore = Math.min(1, (answeredByTech.get(t.id) ?? 0) / 25); // 25 questions = interview mastery
    const percent = Math.round((articleScore * 55 + questionScore * 45));
    return { slug: t.slug, name: t.name, icon: t.icon, color: t.color, percent };
  });

  const activityByDay = dailyRows.map((d) => ({ day: d.day, xp: d.xpEarned, articles: d.articlesRead, questions: d.questionsAnswered }));

  const recentActivity = await db.userActivity.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 12 });
  const [allAchievements, ownedAchievements] = await Promise.all([
    db.achievement.findMany({ orderBy: { xpReward: 'asc' } }),
    db.userAchievement.findMany({ where: { userId: user.id }, select: { achievementId: true, earnedAt: true } }),
  ]);
  const ownedById = new Map(ownedAchievements.map((o) => [o.achievementId, o]));
  const achievements = allAchievements.map((a) => {
    const owned = ownedById.get(a.id);
    return { key: a.key, title: a.title, description: a.description, icon: a.icon, tier: a.tier, earned: !!owned, earnedAt: owned?.earnedAt.toISOString() ?? null };
  });
  const today = new Date().toISOString().slice(0, 10);
  const dailyToday = dailyRows.find((d) => d.day === today) ?? null;

  return {
    user: { ...user },
    stats: {
      articlesRead: reads, completedArticles: completedReads, bookmarks,
      questionsAnswered: answers, attempts: completedScores.length, avgScore,
      readiness, notes,
    },
    skillGraph,
    activityByDay,
    recentAttempts: attempts.map((a) => ({
      id: a.id, mode: a.mode, level: a.level, score: a.score, totalQuestions: a.totalQuestions,
      knownCount: a.knownCount, difficultCount: a.difficultCount, skippedCount: a.skippedCount,
      durationSeconds: a.durationSeconds, status: a.status, createdAt: a.createdAt.toISOString(),
      strongTopics: parseJsonArray(a.strongTopics), weakTopics: parseJsonArray(a.weakTopics),
      technology: a.technology,
    })),
    recommendations,
    achievements,
    recentActivity: recentActivity.map((a) => ({ id: a.id, type: a.type, title: a.title, xp: a.xp, createdAt: a.createdAt.toISOString(), refType: a.refType, refId: a.refId })),
    notifications: notifications.items,
    enrolledPaths: enrolledPathsRaw.filter((p) => p.enrollment),
    daily: dailyToday ? { challengeCompleted: dailyToday.challengeCompleted, articlesRead: dailyToday.articlesRead, questionsAnswered: dailyToday.questionsAnswered, day: dailyToday.day } : { challengeCompleted: false, articlesRead: 0, questionsAnswered: 0, day: today },
  };
}

// ---------------- library ----------------
export async function getLibraryAction(): Promise<{
  bookmarkedArticles: ReturnType<typeof mapArticle>[];
  bookmarkedQuestions: ReturnType<typeof mapQuestion>[];
  notes: Awaited<ReturnType<typeof listNotesAction>>;
  enrolledPaths: PathDTO[];
}> {
  const user = await getCurrentUser();
  if (!user) return { bookmarkedArticles: [], bookmarkedQuestions: [], notes: [], enrolledPaths: [] };
  const [bookmarks, questionBookmarks, notes, paths] = await Promise.all([
    db.articleBookmark.findMany({
      where: { userId: user.id }, orderBy: { createdAt: 'desc' },
      include: { article: { include: { ...articleInclude, _count: { select: { likes: true, bookmarks: true } } } } },
    }),
    db.questionBookmark.findMany({
      where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 30,
      include: { question: { include: { technology: { select: { name: true, slug: true, icon: true, color: true } }, bookmarks: { select: { userId: true } } } } },
    }),
    listNotesAction(),
    listPathsAction(),
  ]);
  return {
    bookmarkedArticles: bookmarks.filter((b) => b.article).map((b) => mapArticle(b.article as never)),
    bookmarkedQuestions: questionBookmarks.map((b) => mapQuestion(b.question, user.id)),
    notes,
    enrolledPaths: paths.filter((p) => p.enrollment),
  };
}

export async function completeDailyChallengeLearningAction(): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  await awardXp(user.id, XP_RULES.DAILY_CHALLENGE, { type: 'DAILY_CHALLENGE', title: 'Daily challenge completed' });
  await upsertDailyProgress(user.id, { challengeCompleted: true });
  await checkAchievements(user.id);
  return { ok: true };
}

export { levelProgress };
