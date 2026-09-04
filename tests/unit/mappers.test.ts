// ============================================================
// Dev Prep — src/server/mappers.ts: entity → DTO serialization
// ============================================================
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { mapArticle, mapQuestion, mapArticleDetail } from '@/server/mappers';
import type { Technology } from '@prisma/client';

// The row shape the mappers accept — derived from the functions themselves
// so the fixture is checked against the real Prisma payload contract.
type ArticleRow = Parameters<typeof mapArticle>[0];
type DetailRow = Parameters<typeof mapArticleDetail>[0];

// Prisma rows arrive as JSON from actions in tests; dates are rehydrated
// with new Date() to mirror what Prisma returns.
const baseArticle = {
  id: 'a1', title: 'React Batching', slug: 'react-batching', excerpt: 'About batching',
  content: '<p>hi</p>', plainText: 'hi', coverStyle: 'violet', difficulty: 'intermediate',
  status: 'PUBLISHED', readingTime: 6, views: 42, interviewRelevant: true, featured: false,
  tldr: null, cheatSheet: null, seoTitle: null, seoDescription: null, seoKeywords: null,
  authorId: 'u1', technologyId: 't1', categoryId: 'c1', publishedAt: new Date('2026-01-15T00:00:00Z'),
  scheduledAt: null, createdAt: new Date('2026-01-01T00:00:00Z'), updatedAt: new Date('2026-02-01T00:00:00Z'),
  canonicalUrl: null, deletedAt: null,
};

const relations = {
  author: { id: 'u1', name: 'Sara Mitchell', avatarColor: 'rose', headline: 'Staff Engineer' },
  technology: { id: 't1', name: 'React', slug: 'react', categoryId: 'c1', description: '', longDescription: null, icon: 'atom', color: 'cyan', difficulty: 'intermediate', popularity: 95, relatedSlugs: '[]', createdAt: new Date() } satisfies Technology,
  category: { id: 'c1', name: 'Framework', slug: 'framework', color: 'violet' },
  tags: [
    { articleId: 'a1', tagId: 'tag-react', tag: { name: 'react' } },
    { articleId: 'a1', tagId: 'tag-concurrency', tag: { name: 'concurrency' } },
  ],
};

const row = (): ArticleRow => ({ ...baseArticle, ...relations });

describe('mapArticle()', () => {
  it('serializes dates to ISO strings and flattens tags', () => {
    const dto = mapArticle(row());
    expect(dto.publishedAt).toBe('2026-01-15T00:00:00.000Z');
    expect(dto.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(dto.updatedAt).toBe('2026-02-01T00:00:00.000Z');
    expect(dto.scheduledAt).toBeNull();
    expect(dto.tags).toEqual(['react', 'concurrency']);
    expect(dto.difficulty).toBe('intermediate');
    expect(dto.status).toBe('PUBLISHED');
  });

  it('maps the technology relation to its narrow shape', () => {
    const dto = mapArticle(row());
    expect(dto.technology).toEqual({ id: 't1', name: 'React', slug: 'react', icon: 'atom', color: 'cyan' });
  });

  it('defaults counts and viewer flags without engagement data', () => {
    const dto = mapArticle(row());
    expect(dto.likeCount).toBe(0);
    expect(dto.bookmarkCount).toBe(0);
    expect(dto.liked).toBe(false);
    expect(dto.bookmarked).toBe(false);
    expect(dto.readPercent).toBeNull();
  });

  it('surfaces engagement counts and viewer state when provided', () => {
    const dto = mapArticle(
      { ...row(), _count: { likes: 7, bookmarks: 3 } },
      { liked: true, bookmarked: true, readPercent: 80 },
    );
    expect(dto.likeCount).toBe(7);
    expect(dto.bookmarkCount).toBe(3);
    expect(dto.liked).toBe(true);
    expect(dto.bookmarked).toBe(true);
    expect(dto.readPercent).toBe(80);
  });

  it('handles a null technology', () => {
    const dto = mapArticle({ ...row(), technology: null, technologyId: null });
    expect(dto.technology).toBeNull();
  });
});

describe('mapArticleDetail()', () => {
  it('parses the TLDR JSON array', () => {
    const dto = mapArticleDetail({
      ...baseArticle, ...relations,
      tldr: JSON.stringify(['point one', 'point two']),
    });
    expect(dto.tldr).toEqual(['point one', 'point two']);
    expect(dto.content).toBe('<p>hi</p>');
  });

  it('parses a well-formed cheat sheet', () => {
    const sheet = { title: 'Remember', points: ['a', 'b'] };
    const dto = mapArticleDetail({ ...baseArticle, ...relations, cheatSheet: JSON.stringify(sheet) });
    expect(dto.cheatSheet).toEqual(sheet);
  });

  it('nulls out a corrupt cheat sheet instead of throwing', () => {
    const dto = mapArticleDetail({ ...baseArticle, ...relations, cheatSheet: '{broken json' });
    expect(dto.cheatSheet).toBeNull();
  });

  it('nulls out a cheat sheet without a points array', () => {
    const dto = mapArticleDetail({ ...baseArticle, ...relations, cheatSheet: '{"title":"x"}' });
    expect(dto.cheatSheet).toBeNull();
  });
});

describe('mapQuestion()', () => {
  const baseQuestion = {
    id: 'q1', question: 'What is reconciliation?', shortAnswer: 'Diffing of renders',
    detailedAnswer: '<p>Long answer</p>', topic: 'Rendering', category: 'CONCEPTUAL',
    difficulty: 'medium', seniority: 'MID', expectedMinutes: 5, tags: '["react","render"]',
    technology: { name: 'React', slug: 'react', icon: 'atom', color: 'cyan' },
  };

  it('parses the tags JSON and maps core fields', () => {
    const dto = mapQuestion(baseQuestion);
    expect(dto.tags).toEqual(['react', 'render']);
    expect(dto.category).toBe('CONCEPTUAL');
    expect(dto.seniority).toBe('MID');
    expect(dto.technology.slug).toBe('react');
  });

  it('marks bookmarked only when the viewer owns a bookmark', () => {
    const withBookmarks = { ...baseQuestion, bookmarks: [{ userId: 'u1' }, { userId: 'u2' }] };
    expect(mapQuestion(withBookmarks, 'u1').bookmarked).toBe(true);
    expect(mapQuestion(withBookmarks, 'u9').bookmarked).toBe(false);
  });

  it('never reports bookmarks for anonymous viewers', () => {
    const withBookmarks = { ...baseQuestion, bookmarks: [{ userId: 'u1' }] };
    expect(mapQuestion(withBookmarks).bookmarked).toBe(false);
  });
});
