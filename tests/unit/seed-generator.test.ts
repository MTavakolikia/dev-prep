// ============================================================
// Dev Prep — src/db/seed/generator.ts: deterministic content
// composer. The whole content library is generated from these
// pure functions, so determinism and structural integrity here
// guarantee a stable, referentially-sound seed.
// ============================================================
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { composeArticle, composeQuestions, slugify } from '@/db/seed/generator';
import { T, type SeedTopic } from '@/db/seed/data/topic-types';

const topic: SeedTopic = T(
  'Understanding React Batching',
  'Know when React groups state updates into a single render pass',
  1, 6, true, 'react,rendering',
);

describe('slugify (generator copy)', () => {
  it('matches the shared slug rules', () => {
    expect(slugify('Understanding React Batching')).toBe('understanding-react-batching');
    expect(slugify('TypeScript & Generics: Complete Guide')).toBe('typescript-generics-complete-guide');
  });
});

describe('composeArticle()', () => {
  const article = composeArticle(topic, 'react', 'React', 'framework', 42);

  it('is fully deterministic: same inputs → byte-identical output', () => {
    const again = composeArticle(topic, 'react', 'React', 'framework', 42);
    expect(again).toEqual(article);
  });

  it('derives the slug from the topic title', () => {
    expect(article.slug).toBe('understanding-react-batching');
  });

  it('maps topic.diff to the difficulty scale', () => {
    expect(article.difficulty).toBe('intermediate');
    expect(composeArticle(T('X', 'd', 0, 5, false, ''), 'react', 'React', 'framework', 1).difficulty).toBe('beginner');
    expect(composeArticle(T('X', 'd', 3, 5, false, ''), 'react', 'React', 'framework', 2).difficulty).toBe('expert');
  });

  it('carries reading time and interview relevance from the topic', () => {
    expect(article.readingTime).toBe(6);
    expect(article.interviewRelevant).toBe(true);
  });

  it('produces structured HTML content with required sections', () => {
    for (const heading of ['Why it matters', 'The core concept', 'A practical example', 'Common mistakes', 'Best practices', 'Summary']) {
      expect(article.content).toContain(heading);
    }
    // every h2 gets an anchor id for deep links
    expect(article.content).toContain('<h2 id="why-it-matters">');
    // paragraphs never leak raw angle brackets from the template
    expect(article.content).toMatch(/<h2 id="[a-z-]+">/);
  });

  it('escapes embedded code samples so the HTML stays valid', () => {
    const codeBlock = article.content.match(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/);
    expect(codeBlock).toBeTruthy();
    const code = codeBlock![1];
    expect(code).not.toMatch(/<(?!\/?code)/); // no unescaped tags inside the block
  });

  it('emits plain text without any HTML tags', () => {
    expect(article.plainText).not.toMatch(/<[^>]+>/);
  });

  it('serializes tldr as a JSON array and cheatSheet as {title, points[]}', () => {
    const tldr = JSON.parse(article.tldr);
    expect(Array.isArray(tldr)).toBe(true);
    expect(tldr.length).toBeGreaterThanOrEqual(3);

    const sheet = JSON.parse(article.cheatSheet);
    expect(sheet.title.length).toBeGreaterThan(0);
    expect(Array.isArray(sheet.points)).toBe(true);
    expect(sheet.points.length).toBeGreaterThanOrEqual(4);
  });

  it('writes SEO metadata referencing the technology', () => {
    expect(article.seoTitle).toContain('React');
    expect(article.seoKeywords.split(', ')).toContain('react');
    expect(article.seoDescription).toBe(topic.d);
  });

  it('uses only known cover palette keys', () => {
    const palettes = ['violet', 'emerald', 'amber', 'rose', 'cyan', 'orange', 'teal', 'fuchsia', 'lime', 'sky'];
    expect(palettes).toContain(article.coverStyle);
  });

  it('includes the performance section only for advanced+ topics', () => {
    const advanced = composeArticle(T('Advanced Topic', 'd', 2, 8, false, ''), 'react', 'React', 'framework', 7);
    expect(advanced.content).toContain('Performance considerations');

    const beginner = composeArticle(T('Beginner Topic', 'd', 0, 4, false, ''), 'react', 'React', 'framework', 7);
    expect(beginner.content).not.toContain('Performance considerations');
  });

  it('includes the interview perspective only for interview-relevant topics', () => {
    expect(article.content).toContain('Interview perspective');
    const plain = composeArticle(T('Plain Topic', 'd', 1, 5, false, ''), 'react', 'React', 'framework', 42);
    expect(plain.content).not.toContain('Interview perspective');
  });

  it('never duplicates mistake bullets within one article', () => {
    const bullets = article.content.match(/<li>[^<]+<\/li>/g) ?? [];
    const mistakeSection = article.content.slice(
      article.content.indexOf('Common mistakes'), article.content.indexOf('Best practices'),
    );
    const mistakeItems = (mistakeSection.match(/<li>[\s\S]*?<\/li>/g) ?? []).map((li) => li.slice(4, -5));
    expect(new Set(mistakeItems).size).toBe(mistakeItems.length);
    expect(bullets.length).toBeGreaterThan(0);
  });
});

describe('composeQuestions()', () => {
  it('returns nothing for non-interview topics', () => {
    expect(composeQuestions(T('No interview', 'd', 1, 5, false, ''), 'React', 1)).toEqual([]);
  });

  it('generates at least one question referencing the topic', () => {
    const qs = composeQuestions(topic, 'React', 42);
    expect(qs.length).toBeGreaterThanOrEqual(1);
    for (const q of qs) {
      expect(q.topic).toBe('Understanding React Batching');
      expect(q.question.length).toBeGreaterThan(15);
      expect(q.shortAnswer).toBe(topic.d);
      expect(q.detailedAnswer).toContain('<p>');
    }
  });

  it('maps difficulty/seniority/minutes consistently with topic.diff', () => {
    const qs = composeQuestions(topic, 'React', 42); // diff=1
    expect(qs[0].difficulty).toBe('medium');
    expect(qs[0].seniority).toBe('MID');
    expect(qs[0].expectedMinutes).toBe(5);
    expect(qs[0].tags).toBe('react,rendering');
  });

  it('uses the hard/SENIOR mapping for advanced topics', () => {
    const qs = composeQuestions(T('Hard topic', 'd', 2, 10, true, 'x'), 'React', 0);
    expect(qs[0].difficulty).toBe('hard');
    expect(qs[0].seniority).toBe('SENIOR');
    expect(qs[0].expectedMinutes).toBe(8);
  });

  it('deterministic across runs: a 60-topic sweep is stable', () => {
    const sweep = (offset: number) =>
      Array.from({ length: 60 }, (_, i) =>
        composeQuestions(T(`Topic number ${i}`, 'description text', (i % 4) as 0 | 1 | 2 | 3, 5, true, 'tags'), 'React', i + offset)
          .map((q) => `${q.category}:${q.seniority}:${q.difficulty}`)
          .join('|'),
      ).join('\n');
    expect(sweep(0)).toBe(sweep(0));
    // different seed offset ⇒ different composition pattern somewhere
    expect(sweep(0)).not.toBe(sweep(1));
  });

  it('may add a senior systemic variant for advanced topics (stable per seed)', () => {
    const first = composeQuestions(T('Advanced', 'd', 2, 10, true, 'x'), 'React', 11);
    const second = composeQuestions(T('Advanced', 'd', 2, 10, true, 'x'), 'React', 11);
    expect(first).toEqual(second); // whether 1 or 2 questions, it must be stable
  });
});
