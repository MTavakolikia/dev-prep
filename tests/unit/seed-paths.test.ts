// ============================================================
// Dev Prep — learning-path seed composer: referential integrity
// The seed's title → slug → articleId lookup only resolves if
// every path item title comes from a real topic bank. These
// tests pin that guarantee at the composer level.
// ============================================================
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { composeTechPaths } from '@/db/seed/data/paths-gen';
import { javascriptTopics } from '@/db/seed/data/topics-js';
import { reactTopics } from '@/db/seed/data/topics-react';
import { nextjsTopics } from '@/db/seed/data/topics-next';
import { nodejsTopics, aiTopics } from '@/db/seed/data/topics-other';
import { seedTechnologies } from '@/db/seed/data/taxonomy';
import type { SeedTechnology } from '@/db/seed/data/taxonomy';
import type { SeedTopic } from '@/db/seed/data/topic-types';

const reactTech: SeedTechnology = {
  name: 'React', slug: 'react', categorySlug: 'frontend', description: 'UI library',
  longDescription: 'The UI library.', icon: 'atom', color: 'cyan', difficulty: 'intermediate',
  popularity: 95, related: ['typescript', 'nextjs'],
};

const banks: [string, SeedTopic[]][] = [
  ['javascript', javascriptTopics],
  ['react', reactTopics],
  ['nextjs', nextjsTopics],
  ['nodejs', nodejsTopics],
  ['ai', aiTopics],
];

describe('composeTechPaths() — structural contract', () => {
  it('produces paths with ≥3 items, ordered by difficulty', () => {
    for (const [slug, topics] of banks) {
      const paths = composeTechPaths(reactTech, topics);
      expect(paths.length, slug).toBeGreaterThan(0);
      for (const p of paths) {
        expect(p.items.length, `${slug}/${p.slug}`).toBeGreaterThanOrEqual(3);
        const diffs = p.items.map((item) => topics.find((t) => t.t === item.title)!.diff);
        const sorted = [...diffs].sort((a, b) => a - b);
        expect(diffs, `${slug}/${p.slug} item order`).toEqual(sorted);
      }
    }
  });

  it('every item title exists in the source topic bank (reference integrity)', () => {
    for (const [slug, topics] of banks) {
      const titles = new Set(topics.map((t) => t.t));
      for (const p of composeTechPaths(reactTech, topics)) {
        for (const item of p.items) {
          expect(titles.has(item.title), `${slug}/${p.slug} → "${item.title}"`).toBe(true);
        }
      }
    }
  });

  it('paths are slugged from titles and hour totals match item hours', () => {
    const paths = composeTechPaths(reactTech, reactTopics);
    for (const p of paths) {
      expect(p.slug).toBe(p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
      const sum = p.items.reduce((s, i) => s + i.hours, 0);
      expect(p.estimatedHours).toBe(sum);
      expect(p.technologySlug).toBe('react');
    }
  });

  it('marks exactly one milestone: the final item', () => {
    for (const p of composeTechPaths(reactTech, reactTopics)) {
      const milestones = p.items.map((i) => i.milestone);
      expect(milestones.filter(Boolean)).toHaveLength(1);
      expect(milestones[milestones.length - 1]).toBe(true);
    }
  });

  it('the interview-prep leg only contains interview-relevant topics', () => {
    const topics = reactTopics;
    const paths = composeTechPaths(reactTech, topics);
    const prep = paths.find((p) => p.slug.endsWith('interview-prep'));
    if (prep) {
      for (const item of prep.items) {
        expect(topics.find((t) => t.t === item.title)!.ir).toBe(true);
      }
    }
  });

  it('skips a leg when the bank cannot fill at least 3 items', () => {
    const tiny: SeedTopic[] = [
      { t: 'Only One', d: 'd', diff: 0, min: 4, ir: false, tags: '' },
      { t: 'Only Two', d: 'd', diff: 0, min: 4, ir: false, tags: '' },
    ];
    expect(composeTechPaths(reactTech, tiny)).toEqual([]);
  });
});

describe('seed taxonomy', () => {
  it('technology slugs are unique and slug-shaped', () => {
    const slugs = seedTechnologies.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});
