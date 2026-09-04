// ============================================================
// Dev Prep seed — generated technology banks: shared types
// and converters that turn compact concept tuples into
// SeedTechnology rows and SeedTopic[] for the composers.
// ============================================================
import { T, type SeedTopic } from './topic-types';
import type { SeedTechnology } from './taxonomy';

export type Concept = [title: string, description: string, diff: 0 | 1 | 2 | 3, interviewRelevant: boolean];

export interface GeneratedTech {
  name: string;
  slug: string;
  categorySlug: string;
  icon: string;
  color: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  popularity: number;
  description: string;
  longDescription: string;
  related: string[];
  concepts: Concept[];
}

const MINUTES = [7, 10, 13, 17];
const TAG_CYCLE = ['fundamentals', 'deep-dive', 'best-practices', 'performance', 'architecture', 'tutorial', 'case-study', 'tooling'];

/** Convert a GeneratedTech into a DB-ready SeedTechnology row. */
export function techToSeed(t: GeneratedTech): SeedTechnology {
  return {
    name: t.name, slug: t.slug, categorySlug: t.categorySlug,
    description: t.description, longDescription: t.longDescription,
    icon: t.icon, color: t.color, difficulty: t.difficulty,
    popularity: t.popularity, related: t.related,
  };
}

/** Convert concepts into SeedTopic[] the article/question composers consume. */
export function techToTopics(t: GeneratedTech): SeedTopic[] {
  return t.concepts.map(([title, desc, diff, ir], i) =>
    T(title, desc, diff, MINUTES[diff] + ((i * 3) % 5) - 1, ir, `${TAG_CYCLE[i % TAG_CYCLE.length]},${t.slug}`),
  );
}
