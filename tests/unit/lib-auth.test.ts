// ============================================================
// Dev Prep — src/lib/auth.ts crypto primitives (node env)
// Only the pure password functions are exercised; sessions and
// RBAC helpers that need cookies/DB are stubbed out in config.
// ============================================================
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, hasRole, isStaff, canManageArticles } from '@/lib/auth';
import type { SessionUser } from '@/types';

describe('hashPassword()/verifyPassword()', () => {
  it('round-trips a correct password', () => {
    const stored = hashPassword('Forge-Admin-2026!');
    expect(verifyPassword('Forge-Admin-2026!', stored)).toBe(true);
  });

  it('rejects a wrong password', () => {
    const stored = hashPassword('correct-horse-battery');
    expect(verifyPassword('wrong-staple-horse', stored)).toBe(false);
  });

  it('salts every hash (same password, different digests)', () => {
    const a = hashPassword('same-password');
    const b = hashPassword('same-password');
    expect(a).not.toBe(b);
    expect(verifyPassword('same-password', a)).toBe(true);
    expect(verifyPassword('same-password', b)).toBe(true);
  });

  it('produces salt:hash hex format with a 64-byte digest', () => {
    const [salt, hash] = hashPassword('shape-check').split(':');
    expect(salt).toMatch(/^[0-9a-f]{32}$/); // 16 bytes
    expect(hash).toMatch(/^[0-9a-f]{128}$/); // 64 bytes
  });

  it('rejects malformed stored digests instead of throwing', () => {
    expect(verifyPassword('x', 'no-colon-here')).toBe(false);
    expect(verifyPassword('x', '')).toBe(false);
    expect(verifyPassword('x', ':')).toBe(false);
    expect(verifyPassword('x', 'salt:not-hex!!')).toBe(false);
  });

  it('is case-sensitive', () => {
    const stored = hashPassword('Passw0rd');
    expect(verifyPassword('passw0rd', stored)).toBe(false);
  });
});

// ---------------- RBAC ----------------
function userWith(role: SessionUser['role']): SessionUser {
  return {
    id: 'u1', email: 'u@devprep.dev', name: 'U', role, avatarColor: 'violet',
    headline: null, xp: 0, level: 1, streakCount: 0, longestStreak: 0,
  };
}

describe('RBAC helpers', () => {
  it('hasRole(): anonymous users never qualify', () => {
    expect(hasRole(null, 'USER')).toBe(false);
    expect(hasRole(null, 'ADMIN')).toBe(false);
  });

  it('hasRole(): role meets its own minimum', () => {
    expect(hasRole(userWith('AUTHOR'), 'AUTHOR')).toBe(true);
  });

  it('hasRole(): higher roles satisfy lower minimums', () => {
    expect(hasRole(userWith('ADMIN'), 'AUTHOR')).toBe(true);
    expect(hasRole(userWith('SUPER_ADMIN'), 'EDITOR')).toBe(true);
  });

  it('hasRole(): lower roles fail higher minimums', () => {
    expect(hasRole(userWith('USER'), 'AUTHOR')).toBe(false);
    expect(hasRole(userWith('AUTHOR'), 'ADMIN')).toBe(false);
  });

  it('isStaff(): true only for ADMIN and above', () => {
    expect(isStaff(userWith('EDITOR'))).toBe(false);
    expect(isStaff(userWith('ADMIN'))).toBe(true);
    expect(isStaff(userWith('SUPER_ADMIN'))).toBe(true);
    expect(isStaff(null)).toBe(false);
  });

  it('canManageArticles(): true for AUTHOR and above', () => {
    expect(canManageArticles(userWith('USER'))).toBe(false);
    expect(canManageArticles(userWith('AUTHOR'))).toBe(true);
    expect(canManageArticles(null)).toBe(false);
  });
});
