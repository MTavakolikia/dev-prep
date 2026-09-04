// ============================================================
// Dev Prep — src/server/scoring.ts: interview grading rules
// ============================================================
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { computeInterviewScore, aggregateTopics, type AnswerInput } from '@/server/scoring';

const a = (questionId: string, result: AnswerInput['result']): AnswerInput => ({
  questionId, result, secondsSpent: 30, confidence: 3,
});

describe('computeInterviewScore()', () => {
  it('scores all-known as 100', () => {
    const r = computeInterviewScore([a('q1', 'KNOWN'), a('q2', 'KNOWN'), a('q3', 'KNOWN')]);
    expect(r).toMatchObject({ known: 3, difficult: 0, skipped: 0, graded: 3, score: 100 });
  });

  it('scores all-difficult as 0 (graded but incorrect)', () => {
    const r = computeInterviewScore([a('q1', 'DIFFICULT'), a('q2', 'DIFFICULT')]);
    expect(r).toMatchObject({ known: 0, difficult: 2, graded: 2, score: 0 });
  });

  it('excludes skipped answers from the denominator', () => {
    // 2 known, 1 difficult, 2 skipped → score is over the 3 graded
    const r = computeInterviewScore([a('q1', 'KNOWN'), a('q2', 'KNOWN'), a('q3', 'DIFFICULT'), a('q4', 'SKIPPED'), a('q5', 'SKIPPED')]);
    expect(r).toMatchObject({ known: 2, difficult: 1, skipped: 2, graded: 3, score: 67 });
  });

  it('rounds to the nearest integer', () => {
    // 1 of 3 graded = 33.33% → 33
    const r = computeInterviewScore([a('q1', 'KNOWN'), a('q2', 'DIFFICULT'), a('q3', 'DIFFICULT')]);
    expect(r.score).toBe(33);
    // 2 of 3 = 66.67% → 67
    const r2 = computeInterviewScore([a('q1', 'KNOWN'), a('q2', 'KNOWN'), a('q3', 'DIFFICULT')]);
    expect(r2.score).toBe(67);
  });

  it('returns score 0 (never NaN) when everything was skipped', () => {
    const r = computeInterviewScore([a('q1', 'SKIPPED'), a('q2', 'SKIPPED')]);
    expect(r.score).toBe(0);
    expect(r.graded).toBe(0);
    expect(Number.isFinite(r.score)).toBe(true);
  });

  it('handles an empty attempt', () => {
    expect(computeInterviewScore([])).toEqual({ known: 0, difficult: 0, skipped: 0, graded: 0, score: 0 });
  });

  it('ignores unanswered questions (null results) instead of counting them', () => {
    const r = computeInterviewScore([a('q1', 'KNOWN'), a('q2', null), a('q3', null)]);
    expect(r).toMatchObject({ known: 1, skipped: 0, graded: 1, score: 100 });
  });
});

describe('aggregateTopics()', () => {
  const topics = new Map([
    ['q1', 'Hooks'], ['q2', 'Hooks'], ['q3', 'Rendering'], ['q4', 'Closures'],
  ]);

  it('collects distinct known topics as strong', () => {
    const { strong } = aggregateTopics([a('q1', 'KNOWN'), a('q2', 'KNOWN'), a('q3', 'KNOWN')], topics);
    expect(strong).toEqual(['Hooks', 'Rendering']);
  });

  it('collects distinct difficult topics as weak', () => {
    const { weak } = aggregateTopics([a('q4', 'DIFFICULT'), a('q3', 'DIFFICULT')], topics);
    expect(weak).toEqual(['Closures', 'Rendering']);
  });

  it('keeps insertion order of first appearance', () => {
    const { strong } = aggregateTopics([a('q3', 'KNOWN'), a('q1', 'KNOWN')], topics);
    expect(strong).toEqual(['Rendering', 'Hooks']);
  });

  it('ignores skipped answers and unknown question ids', () => {
    const { strong, weak } = aggregateTopics(
      [a('q1', 'KNOWN'), a('q1', 'SKIPPED'), a('ghost', 'KNOWN'), a('ghost', 'DIFFICULT')],
      topics,
    );
    expect(strong).toEqual(['Hooks']);
    expect(weak).toEqual([]);
  });

  it('caps strong and weak lists at 6 entries', () => {
    const many = new Map(Array.from({ length: 20 }, (_, i) => [`q${i}`, `Topic ${i}`]));
    const input = Array.from({ length: 20 }, (_, i) => a(`q${i}`, 'KNOWN'));
    const { strong } = aggregateTopics(input, many);
    expect(strong).toHaveLength(6);
  });

  it('an empty attempt yields empty lists', () => {
    expect(aggregateTopics([], topics)).toEqual({ strong: [], weak: [] });
  });
});
