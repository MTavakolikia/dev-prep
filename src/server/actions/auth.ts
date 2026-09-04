'use server';

// ============================================================
// Dev Prep — auth server actions
// ============================================================
import { db } from '@/lib/db';
import { createSession, destroySession, getCurrentUser, hashPassword, verifyPassword, requireUser } from '@/lib/auth';
import { loginSchema, registerSchema } from '@/lib/validation';
import type { SessionUser } from '@/types';

export async function loginAction(input: { email: string; password: string }): Promise<{ ok: boolean; error?: string; user?: SessionUser }> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || user.deletedAt || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return { ok: false, error: 'Invalid email or password' };
  }
  await createSession(user.id);
  await db.analyticsEvent.create({ data: { type: 'login', day: new Date().toISOString().slice(0, 10), userId: user.id } }).catch(() => {});
  return {
    ok: true,
    user: {
      id: user.id, email: user.email, name: user.name, role: user.role as SessionUser['role'],
      avatarColor: user.avatarColor, headline: user.headline, xp: user.xp, level: user.level,
      streakCount: user.streakCount, longestStreak: user.longestStreak,
    },
  };
}

export async function registerAction(input: { name: string; email: string; password: string }): Promise<{ ok: boolean; error?: string; user?: SessionUser }> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const existing = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) return { ok: false, error: 'An account with this email already exists' };

  const user = await db.user.create({
    data: {
      name: parsed.data.name, email: parsed.data.email.toLowerCase(),
      passwordHash: hashPassword(parsed.data.password),
      avatarColor: ['violet', 'cyan', 'emerald', 'amber', 'rose'][Math.floor(Math.random() * 5)],
      lastActiveDay: new Date().toISOString().slice(0, 10),
      streakCount: 1, longestStreak: 1,
    },
  });
  await createSession(user.id);
  await db.analyticsEvent.create({ data: { type: 'signup', day: new Date().toISOString().slice(0, 10), userId: user.id } }).catch(() => {});
  await db.notification.create({
    data: { userId: user.id, type: 'system', title: 'Welcome to Dev Prep', body: 'Start with a learning path or take your first interview simulation.', link: '#/learning-paths' },
  }).catch(() => {});

  return {
    ok: true,
    user: {
      id: user.id, email: user.email, name: user.name, role: 'USER', avatarColor: user.avatarColor,
      headline: user.headline, xp: user.xp, level: user.level, streakCount: user.streakCount, longestStreak: user.longestStreak,
    },
  };
}

export async function logoutAction(): Promise<{ ok: true }> {
  await destroySession();
  return { ok: true };
}

export async function updateProfileAction(input: { name?: string; headline?: string; bio?: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = await requireUser();
    await db.user.update({
      where: { id: user.id },
      data: {
        name: input.name?.trim() || undefined,
        headline: input.headline?.trim() ?? undefined,
        bio: input.bio?.trim() ?? undefined,
      },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: 'Not authorized' };
  }
}

export async function changePasswordAction(input: { current: string; next: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const row = await db.user.findUnique({ where: { id: user.id } });
    if (!row || !verifyPassword(input.current, row.passwordHash)) return { ok: false, error: 'Current password is incorrect' };
    if (input.next.length < 8) return { ok: false, error: 'New password must be at least 8 characters' };
    await db.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(input.next) } });
    return { ok: true };
  } catch {
    return { ok: false, error: 'Not authorized' };
  }
}

export async function whoAmIAction(): Promise<SessionUser | null> {
  return getCurrentUser();
}
