import 'server-only';
import { db } from '@/lib/db';
import { levelFromXp, XP_RULES } from '@/lib/design';

// ============================================================
// Dev Prep — engagement engine: XP, streaks, achievements
// ============================================================

const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

/** Update streak state for a user active "today". */
export async function touchStreak(userId: string): Promise<number> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { lastActiveDay: true, streakCount: true, longestStreak: true } });
  if (!user) return 0;
  const today = dayKey();
  if (user.lastActiveDay === today) return user.streakCount;

  const yesterday = dayKey(new Date(Date.now() - 86400000));
  const nextStreak = user.lastActiveDay === yesterday ? user.streakCount + 1 : 1;
  await db.user.update({
    where: { id: userId },
    data: {
      lastActiveDay: today,
      streakCount: nextStreak,
      longestStreak: Math.max(nextStreak, user.longestStreak),
    },
  });
  return nextStreak;
}

/** Add XP, recompute level, log activity. Returns new level. */
export async function awardXp(userId: string, amount: number, activity: {
  type: string; refType?: string; refId?: string; title?: string; metadata?: Record<string, unknown>;
}): Promise<{ xp: number; level: number }> {
  const [user] = await Promise.all([
    db.user.update({ where: { id: userId }, data: { xp: { increment: amount } } }),
    db.userActivity.create({
      data: {
        userId, type: activity.type, refType: activity.refType, refId: activity.refId,
        title: activity.title, xp: amount, metadata: activity.metadata ? JSON.stringify(activity.metadata) : null,
      },
    }),
  ]);
  const level = levelFromXp(user.xp);
  if (level !== user.level) {
    await db.user.update({ where: { id: userId }, data: { level } });
  }
  await touchStreak(userId);
  await upsertDailyProgress(userId, { xpEarned: amount });
  return { xp: user.xp, level };
}

export async function upsertDailyProgress(userId: string, delta: { articlesRead?: number; questionsAnswered?: number; xpEarned?: number; challengeCompleted?: boolean }): Promise<void> {
  const day = dayKey();
  const existing = await db.dailyProgress.findUnique({ where: { userId_day: { userId, day } } });
  if (existing) {
    await db.dailyProgress.update({
      where: { userId_day: { userId, day } },
      data: {
        articlesRead: { increment: delta.articlesRead ?? 0 },
        questionsAnswered: { increment: delta.questionsAnswered ?? 0 },
        xpEarned: { increment: delta.xpEarned ?? 0 },
        challengeCompleted: existing.challengeCompleted || !!delta.challengeCompleted,
      },
    });
  } else {
    await db.dailyProgress.create({
      data: {
        userId, day,
        articlesRead: delta.articlesRead ?? 0,
        questionsAnswered: delta.questionsAnswered ?? 0,
        xpEarned: delta.xpEarned ?? 0,
        challengeCompleted: !!delta.challengeCompleted,
      },
    });
  }
}

/** Evaluate all achievement rules for a user; grants newly earned ones. */
export async function checkAchievements(userId: string): Promise<{ key: string; title: string; description: string; xpReward: number }[]> {
  const [user, reads, bookmarks, attempts, answers, notes, enrollments, pathCompletions, dailies, owned] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.articleRead.count({ where: { userId, completedAt: { not: null } } }),
    db.articleBookmark.count({ where: { userId } }),
    db.interviewAttempt.count({ where: { userId, status: 'COMPLETED' } }),
    db.interviewAnswer.count({ where: { attempt: { userId }, result: { not: 'SKIPPED' } } }),
    db.note.count({ where: { userId } }),
    db.pathEnrollment.count({ where: { userId } }),
    db.pathEnrollment.count({ where: { userId, completedAt: { not: null } } }),
    db.dailyProgress.count({ where: { userId, challengeCompleted: true } }),
    db.userAchievement.findMany({ where: { userId }, include: { achievement: { select: { key: true } } } }),
  ]);
  void pathCompletions;
  if (!user) return [];

  const bestScore = await db.interviewAttempt.findFirst({
    where: { userId, status: 'COMPLETED' }, orderBy: { score: 'desc' }, select: { score: true },
  });
  // readiness approximation for the achievement check
  const avg = await db.interviewAttempt.aggregate({ where: { userId, status: 'COMPLETED' }, _avg: { score: true } });

  const earnedKeys = new Set(owned.map((o) => o.achievement.key));
  const all = await db.achievement.findMany();
  const unlocked: { key: string; title: string; description: string; xpReward: number }[] = [];

  const qualifies: Record<string, boolean> = {
    'first-steps': reads >= 1,
    'bookworm-10': reads >= 10,
    'librarian-50': reads >= 50,
    'century-reader': reads >= 100,
    'into-the-arena': attempts >= 1,
    'seasoned-candidate': attempts >= 10,
    'sharp-mind': (bestScore?.score ?? 0) >= 80,
    'interview-ready': Math.round(avg._avg.score ?? 0) >= 85 && attempts >= 3,
    'on-fire': user.streakCount >= 7,
    'unstoppable': user.streakCount >= 30,
    'century-club': answers >= 100,
    pathfinder: enrollments >= 1,
    trailblazer: pathCompletions >= 1,
    'note-taker': notes >= 1,
    curator: bookmarks >= 10,
    'daily-challenger': dailies >= 5,
  };

  for (const ach of all) {
    if (earnedKeys.has(ach.key)) continue;
    if (qualifies[ach.key]) {
      await db.userAchievement.create({ data: { userId, achievementId: ach.id } }).catch(() => {});
      await db.notification.create({
        data: { userId, type: 'achievement', title: `Achievement unlocked: ${ach.title}`, body: `${ach.description} · +${ach.xpReward} XP`, link: '#/dashboard' },
      }).catch(() => {});
      unlocked.push({ key: ach.key, title: ach.title, description: ach.description, xpReward: ach.xpReward });
    }
  }
  return unlocked;
}

export { XP_RULES, dayKey };
