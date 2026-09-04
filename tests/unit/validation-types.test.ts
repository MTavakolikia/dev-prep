// ============================================================
// Dev Prep — src/lib/validation.ts (Zod schemas) + parseJsonArray
// ============================================================
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from '@/lib/validation';
import { parseJsonArray, ROLE_ORDER, ROLE_LABELS, ARTICLE_STATUSES } from '@/types';

describe('loginSchema', () => {
  it('accepts valid credentials shape', () => {
    const parsed = loginSchema.safeParse({ email: 'alex@devprep.dev', password: 'x' });
    expect(parsed.success).toBe(true);
  });

  it('rejects malformed emails with a friendly message', () => {
    const parsed = loginSchema.safeParse({ email: 'not-an-email', password: 'x' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues[0].message).toBe('Enter a valid email');
  });

  it('requires a non-empty password', () => {
    const parsed = loginSchema.safeParse({ email: 'a@b.co', password: '' });
    expect(parsed.success).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co' }).success).toBe(false);
    expect(loginSchema.safeParse({ password: 'x' }).success).toBe(false);
  });
});

describe('registerSchema', () => {
  const valid = { name: 'Alex Chen', email: 'alex@example.com', password: 'Demo-2026!' };

  it('accepts a valid registration', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('enforces the 8-character password minimum', () => {
    const parsed = registerSchema.safeParse({ ...valid, password: 'short1!' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues[0].message).toContain('at least 8');
  });

  it('enforces the name length bounds', () => {
    expect(registerSchema.safeParse({ ...valid, name: 'A' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, name: 'X'.repeat(61) }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, name: 'Al' }).success).toBe(true);
    expect(registerSchema.safeParse({ ...valid, name: 'X'.repeat(60) }).success).toBe(true);
  });

  it('rejects malformed emails', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false);
  });
});

describe('parseJsonArray()', () => {
  it('parses a JSON string array', () => {
    expect(parseJsonArray('["react","hooks"]')).toEqual(['react', 'hooks']);
  });

  it('returns the fallback for non-array JSON', () => {
    expect(parseJsonArray('{"a":1}', ['fb'])).toEqual(['fb']);
    expect(parseJsonArray('42', [])).toEqual([]);
  });

  it('returns the fallback for invalid JSON', () => {
    expect(parseJsonArray('not-json{', [])).toEqual([]);
  });

  it('returns the fallback for empty/null input', () => {
    expect(parseJsonArray(null)).toEqual([]);
    expect(parseJsonArray(undefined)).toEqual([]);
    expect(parseJsonArray('')).toEqual([]);
  });

  it('preserves element types for non-string generics', () => {
    expect(parseJsonArray<number>('[1,2,3]')).toEqual([1, 2, 3]);
  });
});

describe('role metadata completeness', () => {
  it('every role has an order and a display label', () => {
    for (const role of Object.keys(ROLE_ORDER) as (keyof typeof ROLE_ORDER)[]) {
      expect(typeof ROLE_ORDER[role]).toBe('number');
      expect(ROLE_LABELS[role].length).toBeGreaterThan(0);
    }
    expect(Object.keys(ROLE_ORDER)).toHaveLength(5);
  });

  it('article status list is exhaustive and ordered', () => {
    expect(ARTICLE_STATUSES).toEqual(['DRAFT', 'IN_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']);
  });
});
