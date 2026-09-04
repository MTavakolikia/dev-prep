// ============================================================
// Dev Prep seed — deterministic topic synthesizer
// Generates a coherent 11-topic track for technologies that do
// not have hand-curated topic banks, so every technology page
// ships with real articles and interview questions.
// ============================================================
import { T, type SeedTopic } from './topic-types';

interface SynthTemplate {
  t: (n: string) => string;
  d: (n: string) => string;
  diff: 0 | 1 | 2 | 3;
  min: number;
  ir: boolean;
  tags: string;
}

const SYNTH_TEMPLATES: SynthTemplate[] = [
  {
    t: (n) => `Getting started with ${n}: setup, tooling and your first project`,
    d: (n) => `Set up ${n} locally, learn its core primitives and ship a small but real project end to end.`,
    diff: 0, min: 11, ir: false, tags: 'getting-started',
  },
  {
    t: (n) => `${n} core concepts in one focused sitting`,
    d: (n) => `Build the essential mental model of ${n}: the vocabulary, the primitives and how they fit together.`,
    diff: 0, min: 12, ir: true, tags: 'fundamentals',
  },
  {
    t: (n) => `The architecture of ${n}: how it works under the hood`,
    d: (n) => `Understand how ${n} works internally: its execution model, core abstractions and extension points.`,
    diff: 1, min: 13, ir: true, tags: 'internals',
  },
  {
    t: (n) => `${n} in production: structure, configuration and conventions`,
    d: (n) => `Structure a real ${n} project the way experienced teams do, from configuration to conventions.`,
    diff: 1, min: 12, ir: true, tags: 'production',
  },
  {
    t: (n) => `Common ${n} mistakes and how to avoid them`,
    d: (n) => `Recognize the failure modes teams hit with ${n} and adopt the practices that prevent them.`,
    diff: 1, min: 11, ir: true, tags: 'mistakes,best-practices',
  },
  {
    t: (n) => `Testing strategies for ${n}`,
    d: (n) => `Test ${n} work with confidence: what to test, how to isolate dependencies and where tooling helps.`,
    diff: 1, min: 12, ir: false, tags: 'testing',
  },
  {
    t: (n) => `${n} performance: measuring and improving what matters`,
    d: (n) => `Profile ${n} workloads, find the real bottlenecks and improve them without guessing.`,
    diff: 2, min: 13, ir: true, tags: 'performance',
  },
  {
    t: (n) => `Advanced ${n} patterns for complex applications`,
    d: (n) => `Apply the patterns experienced ${n} engineers reach for when requirements get genuinely hard.`,
    diff: 2, min: 14, ir: true, tags: 'patterns,architecture',
  },
  {
    t: (n) => `Securing ${n}: threats, hardening and safe defaults`,
    d: (n) => `Threat-model ${n}: the common attack surfaces, hardening steps and safe defaults to adopt.`,
    diff: 2, min: 12, ir: false, tags: 'security',
  },
  {
    t: (n) => `${n} at scale: lessons from real systems`,
    d: (n) => `Operate ${n} at scale: the scaling levers, failure modes and the trade-offs behind them.`,
    diff: 3, min: 15, ir: true, tags: 'scaling,architecture',
  },
  {
    t: (n) => `The ${n} ecosystem: tooling, libraries and how to choose`,
    d: (n) => `Map the ${n} ecosystem: the tools worth learning, the libraries worth using and how to evaluate new ones.`,
    diff: 1, min: 11, ir: false, tags: 'ecosystem',
  },
];

/**
 * Deterministic: same technology name always yields the same topic list.
 */
export function synthesizeTopics(name: string): SeedTopic[] {
  return SYNTH_TEMPLATES.map((tpl) => T(tpl.t(name), tpl.d(name), tpl.diff, tpl.min, tpl.ir, tpl.tags));
}
