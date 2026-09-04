// ============================================================
// Dev Prep — shared server-side mappers (entity → DTO)
// ============================================================
import type { ArticleDetailDTO, ArticleDTO, QuestionDTO } from '@/types';
import type { Prisma } from '@prisma/client';
import { parseJsonArray } from '@/types';

type ArticleWithRelations = Omit<
  Prisma.ArticleGetPayload<{
    include: {
      author: { select: { id: true; name: true; avatarColor: true; headline: true } };
      technology: true;
      category: { select: { id: true; name: true; slug: true; color: true } };
      tags: { include: { tag: { select: { name: true } } } };
      _count: { select: { likes: true; bookmarks: true } };
    };
  }>,
  '_count'
> & {
  // _count is only present when the query explicitly requests it
  _count?: { likes: number; bookmarks: number };
};

export function mapArticle(a: ArticleWithRelations, viewer: { liked?: boolean; bookmarked?: boolean; readPercent?: number | null } = {}): ArticleDTO {
  return {
    id: a.id, title: a.title, slug: a.slug, excerpt: a.excerpt, coverStyle: a.coverStyle,
    difficulty: a.difficulty as ArticleDTO['difficulty'], status: a.status as ArticleDTO['status'],
    readingTime: a.readingTime, views: a.views, interviewRelevant: a.interviewRelevant,
    featured: a.featured,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    scheduledAt: a.scheduledAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString(),
    author: a.author,
    technology: a.technology ? { id: a.technology.id, name: a.technology.name, slug: a.technology.slug, icon: a.technology.icon, color: a.technology.color } : null,
    category: a.category,
    tags: a.tags.map((t) => t.tag.name),
    likeCount: a._count?.likes ?? 0,
    bookmarkCount: a._count?.bookmarks ?? 0,
    liked: viewer.liked ?? false,
    bookmarked: viewer.bookmarked ?? false,
    readPercent: viewer.readPercent ?? null,
  };
}

export const articleInclude = {
  author: { select: { id: true, name: true, avatarColor: true, headline: true } },
  technology: true,
  category: { select: { id: true, name: true, slug: true, color: true } },
  tags: { include: { tag: { select: { name: true } } } },
} as const;

export function mapQuestion(q: {
  id: string; question: string; shortAnswer: string; detailedAnswer: string; topic: string;
  category: string; difficulty: string; seniority: string; expectedMinutes: number; tags: string;
  technology: { name: string; slug: string; icon: string; color: string };
  bookmarks?: { userId: string }[];
}, viewerId?: string | null): QuestionDTO {
  return {
    id: q.id, question: q.question, shortAnswer: q.shortAnswer, detailedAnswer: q.detailedAnswer,
    topic: q.topic, category: q.category as QuestionDTO['category'], difficulty: q.difficulty,
    seniority: q.seniority as QuestionDTO['seniority'], expectedMinutes: q.expectedMinutes,
    tags: parseJsonArray(q.tags),
    technology: q.technology,
    bookmarked: viewerId ? (q.bookmarks ?? []).some((b) => b.userId === viewerId) : false,
  };
}

export function mapArticleDetail(a: ArticleWithRelations & { content: string; tldr: string | null; cheatSheet: string | null; seoTitle: string | null; seoDescription: string | null; seoKeywords: string | null }, viewer: { liked?: boolean; bookmarked?: boolean; readPercent?: number | null } = {}): ArticleDetailDTO {
  return {
    ...mapArticle(a, viewer),
    content: a.content,
    tldr: parseJsonArray(a.tldr),
    cheatSheet: a.cheatSheet ? safeParseCheatSheet(a.cheatSheet) : null,
    seoTitle: a.seoTitle, seoDescription: a.seoDescription, seoKeywords: a.seoKeywords,
    // populated by the detail action after mapping
    relatedQuestions: [], relatedArticles: [],
  };
}

function safeParseCheatSheet(v: string): { title: string; points: string[] } | null {
  try {
    const parsed = JSON.parse(v);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.points)) return parsed;
    return null;
  } catch { return null; }
}
