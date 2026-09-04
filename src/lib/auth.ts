import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import type { Role, SessionUser } from '@/types';
import { ROLE_ORDER } from '@/types';

const SESSION_COOKIE = 'df_session';
const SESSION_TTL_DAYS = 30;

// ---------------- passwords ----------------
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const candidate = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  } catch { return false; }
}

// ---------------- sessions ----------------
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { token, userId, expiresAt } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    path: '/', expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } }).catch(() => {});
    jar.delete(SESSION_COOKIE);
  }
}

export type SessionRow = {
  id: string; token: string; userId: string; expiresAt: Date;
};

export async function getSessionRow(): Promise<SessionRow | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

/** Request-cached current user (or null). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await getSessionRow();
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || user.deletedAt) return null;
  return {
    id: user.id, email: user.email, name: user.name, role: user.role as Role,
    avatarColor: user.avatarColor, headline: user.headline, xp: user.xp,
    level: user.level, streakCount: user.streakCount, longestStreak: user.longestStreak,
  };
});

// ---------------- RBAC ----------------
export function hasRole(user: SessionUser | null, min: Role): boolean {
  if (!user) return false;
  return ROLE_ORDER[user.role] >= ROLE_ORDER[min];
}

export function isStaff(user: SessionUser | null): boolean {
  return hasRole(user, 'ADMIN');
}

export function canManageArticles(user: SessionUser | null): boolean {
  return hasRole(user, 'AUTHOR');
}

/** Throws when unauthorized — call inside server actions. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requireRole(min: Role): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasRole(user, min)) throw new Error('FORBIDDEN');
  return user;
}
