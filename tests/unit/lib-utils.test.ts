// ============================================================
// Dev Prep — src/lib/slug.ts + src/lib/utils.ts tests
// ============================================================
import { describe, it, expect } from 'vitest';
import { slugify, excerptFrom } from '@/lib/slug';
import { cn } from '@/lib/utils';

describe('slugify()', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugify('Understanding React Batching')).toBe('understanding-react-batching');
  });

  it('strips punctuation that would produce noisy slugs', () => {
    expect(slugify("What's New in React's Compiler?")).toBe('whats-new-in-reacts-compiler');
    expect(slugify('Types & Generics: A Deep Dive')).toBe('types-generics-a-deep-dive');
  });

  it('collapses consecutive separators', () => {
    expect(slugify('React   19   —   Features')).toBe('react-19-features');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  -- Hello World --  ')).toBe('hello-world');
  });

  it('caps the length at 80 characters', () => {
    const slug = slugify('a'.repeat(200));
    expect(slug.length).toBe(80);
  });

  it('keeps digits and ascii letters only', () => {
    expect(slugify('ES2024 & Émile')).toBe('es2024-mile'); // É dropped, digits kept
    expect(slugify('v2.1 release')).toBe('v2-1-release');
  });

  it('returns an empty string for symbols-only input', () => {
    expect(slugify('???')).toBe('');
  });
});

describe('excerptFrom()', () => {
  it('strips HTML tags', () => {
    expect(excerptFrom('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('collapses whitespace including newlines', () => {
    expect(excerptFrom('Line one\n\nLine   two')).toBe('Line one Line two');
  });

  it('truncates long text with an ellipsis without cutting mid-word', () => {
    const text = 'word '.repeat(50).trim();
    const out = excerptFrom(text, 20);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(21);
  });

  it('returns short text untouched', () => {
    expect(excerptFrom('Short and sweet')).toBe('Short and sweet');
  });

  it('honors a custom length', () => {
    expect(excerptFrom('abcdefghij', 5)).toBe('abcd…');
  });
});

describe('cn()', () => {
  it('joins conditional classes', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });

  it('lets later Tailwind utilities win (tailwind-merge)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('keeps non-conflicting utilities', () => {
    expect(cn('p-2', 'text-sm')).toBe('p-2 text-sm');
  });
});
