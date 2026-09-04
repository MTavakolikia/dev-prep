// ============================================================
// Dev Prep — interview scoring (pure functions)
// Extracted from completeInterviewAction so the grading rules
// are unit-testable in isolation from the database.
// ============================================================

export type AnswerResult = 'KNOWN' | 'DIFFICULT' | 'SKIPPED';

export interface AnswerInput {
  questionId: string;
  result: AnswerResult | null;
  secondsSpent: number;
  confidence: number;
}

export interface ScoreBreakdown {
  /** answers graded as known */
  known: number;
  /** answers graded as difficult (counted as graded, not correct) */
  difficult: number;
  /** answers skipped (excluded from the score, reported separately) */
  skipped: number;
  /** known + difficult — the denominator of the score */
  graded: number;
  /** 0–100 integer: share of graded answers the candidate knew */
  score: number;
}

/**
 * Honest self-assessment grading: skipped answers are excluded from the
 * denominator (they say "I don't know", not "I got it wrong"), so the score
 * measures accuracy over the material the candidate actually attempted.
 * An attempt with zero graded answers scores 0 (not NaN).
 */
export function computeInterviewScore(results: AnswerInput[]): ScoreBreakdown {
  const answered = results.filter((r) => r.result !== null);
  const known = answered.filter((r) => r.result === 'KNOWN').length;
  const difficult = answered.filter((r) => r.result === 'DIFFICULT').length;
  const skipped = answered.filter((r) => r.result === 'SKIPPED').length;
  const graded = known + difficult;
  const score = graded > 0 ? Math.round((known / graded) * 100) : 0;
  return { known, difficult, skipped, graded, score };
}

/**
 * Aggregate strong/weak topics (deduplicated, insertion order preserved,
 * capped at 6 each — mirrors the attempt summary DTO contract).
 */
export function aggregateTopics(
  results: AnswerInput[],
  topicById: Map<string, string>,
): { strong: string[]; weak: string[] } {
  const strong: string[] = [];
  const weak: string[] = [];
  for (const r of results) {
    const topic = topicById.get(r.questionId);
    if (!topic) continue;
    if (r.result === 'KNOWN' && !strong.includes(topic)) strong.push(topic);
    if (r.result === 'DIFFICULT' && !weak.includes(topic)) weak.push(topic);
  }
  return { strong: strong.slice(0, 6), weak: weak.slice(0, 6) };
}
