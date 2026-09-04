// ============================================================
// Dev Prep — src/lib/design.ts tests: level math & tokens
// ============================================================
import { describe, it, expect } from 'vitest';
import {
  levelFromXp, levelProgress, tokens, XP_RULES, DIFFICULTY_STYLES,
  SENIORITY_LABELS, QUESTION_CATEGORY_LABELS, STATUS_STYLES, INTERVIEW_MODES,
} from '@/lib/design';
import { ARTICLE_STATUSES, DIFFICULTIES, ROLE_ORDER } from '@/types';

describe('levelFromXp()', () => {
  it('starts at level 1 with zero XP', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
  });

  it('levels up monotonically as XP grows', () => {
    let prev = 1;
    for (let xp = 0; xp <= 20000; xp += 137) {
      const level = levelFromXp(xp);
      expect(level).toBeGreaterThanOrEqual(prev);
      prev = level;
    }
    expect(prev).toBeGreaterThan(1);
  });

  it('crosses the first threshold exactly at 100 XP', () => {
    expect(levelFromXp(100)).toBe(2);
  });

  it('caps at level 50 even with absurd XP', () => {
    expect(levelFromXp(1e9)).toBe(50);
  });
});

describe('levelProgress()', () => {
  it('reports percent within 0..100', () => {
    for (const xp of [0, 50, 100, 250, 1000, 5321, 99999]) {
      const p = levelProgress(xp);
      expect(p.percent).toBeGreaterThanOrEqual(0);
      expect(p.percent).toBeLessThanOrEqual(100);
    }
  });

  it('is consistent with levelFromXp', () => {
    const p = levelProgress(500);
    expect(p.level).toBe(levelFromXp(500));
    expect(p.needed).toBeGreaterThan(0);
    expect(p.current).toBeGreaterThanOrEqual(0);
    expect(p.current).toBeLessThanOrEqual(p.needed);
  });

  it('shows 0 progress at the start of a level', () => {
    const p = levelProgress(100); // exactly level 2 threshold
    expect(p.level).toBe(2);
    expect(p.current).toBe(0);
    expect(p.percent).toBe(0);
  });
});

describe('tokens()', () => {
  it('returns the requested palette', () => {
    expect(tokens('emerald').solid).toBe('bg-emerald-600');
  });

  it('falls back to violet for unknown colors', () => {
    expect(tokens('chartreuse-neon')).toEqual(tokens('violet'));
  });
});

describe('lookup tables stay in sync with domain unions', () => {
  it('every article status has a style', () => {
    for (const s of ARTICLE_STATUSES) expect(STATUS_STYLES[s]).toBeTruthy();
  });

  it('every difficulty has a style', () => {
    for (const d of DIFFICULTIES) expect(DIFFICULTY_STYLES[d]).toBeTruthy();
  });

  it('every seniority has a label', () => {
    for (const s of ['JUNIOR', 'MID', 'SENIOR', 'STAFF'] as const) expect(SENIORITY_LABELS[s]).toBeTruthy();
  });

  it('question category labels cover all 9 categories', () => {
    expect(Object.keys(QUESTION_CATEGORY_LABELS)).toHaveLength(9);
  });

  it('interview modes declare a question budget', () => {
    for (const [mode, cfg] of Object.entries(INTERVIEW_MODES)) {
      expect(cfg.label.length).toBeGreaterThan(0);
      expect(cfg.questions === null || cfg.questions > 0, `mode ${mode}`).toBe(true);
    }
  });

  it('RBAC order is strictly increasing', () => {
    expect(ROLE_ORDER.USER).toBeLessThan(ROLE_ORDER.AUTHOR);
    expect(ROLE_ORDER.AUTHOR).toBeLessThan(ROLE_ORDER.EDITOR);
    expect(ROLE_ORDER.EDITOR).toBeLessThan(ROLE_ORDER.ADMIN);
    expect(ROLE_ORDER.ADMIN).toBeLessThan(ROLE_ORDER.SUPER_ADMIN);
  });

  it('XP rules are positive integers', () => {
    for (const [rule, xp] of Object.entries(XP_RULES)) {
      expect(Number.isInteger(xp), rule).toBe(true);
      expect(xp, rule).toBeGreaterThan(0);
    }
  });
});
