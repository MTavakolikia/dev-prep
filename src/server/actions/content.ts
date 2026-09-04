'use server';

// ============================================================
// Dev Prep — content actions: home, articles, technologies,
// search, comments. Read paths + engagement mutations.
// ============================================================
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { mapArticle, mapArticleDetail, articleInclude, mapQuestion } from '@/server/mappers';
import type { ArticleDTO, ArticleDetailDTO, QuestionDTO, TechnologyDTO } from '@/types';
import { parseJsonArray } from '@/types';
import { slugify } from '@/lib/slug';

export interface ArticleListResult {
  articles: ArticleDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listArticlesAction(opts: {
  page?: number; pageSize?: number; technology?: string; category?: string;
  difficulty?: string; search?: string; sort?: 'trending' | 'newest' | 'popular' | 'discussed' | 'bookmarked';
  interviewOnly?: boolean; authorId?: string; status?: string; featured?: boolean;
}): Promise<ArticleListResult> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(48, Math.max(4, opts.pageSize ?? 12));
  const user = await getCurrentUser();

  const where: Record<string, unknown> = { deletedAt: null };
  where.status = opts.status ?? 'PUBLISHED';
  if (opts.technology) where.technology = { slug: opts.technology };
  if (opts.category) where.category = { slug: opts.category };
  if (opts.difficulty) where.difficulty = opts.difficulty;
  if (opts.interviewOnly) where.interviewRelevant = true;
  if (opts.featured) where.featured = true;
  if (opts.authorId) where.authorId = opts.authorId;
  if (opts.search) {
    const q = opts.search.trim();
    where.OR = [
      { title: { contains: q } }, { excerpt: { contains: q } }, { plainText: { contains: q } },
    ];
  }

  const orderBy =
    opts.sort === 'newest' ? [{ publishedAt: 'desc' }] :
    opts.sort === 'popular' ? [{ views: 'desc' }] :
    opts.sort === 'discussed' ? [{ comments: { _count: 'desc' } }] :
    opts.sort === 'bookmarked' ? [{ bookmarks: { _count: 'desc' } }] :
    [{ views: 'desc' }, { publishedAt: 'desc' }]; // trending

  const [rows, total] = await Promise.all([
    db.article.findMany({
      where: where as never, orderBy: orderBy as never,
      skip: (page - 1) * pageSize, take: pageSize,
      include: { ...articleInclude, _count: { select: { likes: true, bookmarks: true, comments: true } } },
    }),
    db.article.count({ where: where as never }),
  ]);

  let viewerState: Record<string, { liked?: boolean; bookmarked?: boolean; readPercent?: number | null }> = {};
  if (user) {
    const [likes, bookmarks, reads] = await Promise.all([
      db.like.findMany({ where: { userId: user.id, articleId: { in: rows.map((r) => r.id) } } }),
      db.articleBookmark.findMany({ where: { userId: user.id, articleId: { in: rows.map((r) => r.id) } } }),
      db.articleRead.findMany({ where: { userId: user.id, articleId: { in: rows.map((r) => r.id) } } }),
    ]);
    viewerState = Object.fromEntries([
      ...likes.map((l) => [l.articleId, { liked: true }]),
      ...bookmarks.map((b) => [b.articleId, { bookmarked: true }]),
      ...reads.map((r) => [r.articleId, { readPercent: r.percent }]),
    ]);
  }

  return {
    articles: rows.map((r) => mapArticle(r, viewerState[r.id] ?? {})),
    total, page, pageSize,
  };
}

export async function getArticleAction(slug: string): Promise<ArticleDetailDTO | null> {
  const user = await getCurrentUser();
  const article = await db.article.findFirst({
    where: { slug, deletedAt: null },
    include: {
      ...articleInclude,
      _count: { select: { likes: true, bookmarks: true } },
    },
  });
  if (!article) return null;
  if (article.status !== 'PUBLISHED') {
    const isStaff = user && ['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(user.role);
    const isOwner = user && article.authorId === user.id;
    if (!isStaff && !isOwner) return null;
  }

  // viewer state
  let viewer: { liked?: boolean; bookmarked?: boolean; readPercent?: number | null } = {};
  if (user) {
    const [like, bookmark, read] = await Promise.all([
      db.like.findUnique({ where: { userId_articleId: { userId: user.id, articleId: article.id } } }),
      db.articleBookmark.findUnique({ where: { userId_articleId: { userId: user.id, articleId: article.id } } }),
      db.articleRead.findUnique({ where: { userId_articleId: { userId: user.id, articleId: article.id } } }),
    ]);
    viewer = { liked: !!like, bookmarked: !!bookmark, readPercent: read?.percent ?? 0 };
  }

  // siblings & related
  const [siblings, relatedQuestions, relatedArticles] = await Promise.all([
    db.article.findMany({
      where: { status: 'PUBLISHED', deletedAt: null, technologyId: article.technologyId },
      orderBy: { publishedAt: 'desc' as const }, select: { title: true, slug: true, publishedAt: true },
    }),
    article.technologyId
      ? db.interviewQuestion.findMany({
          where: { technologyId: article.technologyId, topic: article.title },
          take: 3,
          include: { technology: { select: { name: true, slug: true, icon: true, color: true } }, bookmarks: { select: { userId: true } } },
        })
      : Promise.resolve([]),
    db.article.findMany({
      where: {
        status: 'PUBLISHED', deletedAt: null, id: { not: article.id },
        OR: [{ technologyId: article.technologyId ?? '___' }, { difficulty: article.difficulty }],
      },
      orderBy: { views: 'desc' }, take: 4,
      include: { ...articleInclude, _count: { select: { likes: true, bookmarks: true } } },
    }),
  ]);

  const idx = siblings.findIndex((s) => s.slug === article.slug);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const fallbackQuestions = relatedQuestions.length === 0 && article.technologyId
    ? await db.interviewQuestion.findMany({
        where: { technologyId: article.technologyId, seniority: { in: ['MID', 'SENIOR'] } },
        orderBy: { createdAt: 'asc' }, take: 3,
        include: { technology: { select: { name: true, slug: true, icon: true, color: true } }, bookmarks: { select: { userId: true } } },
      })
    : relatedQuestions;

  const detail = mapArticleDetail(article, viewer);
  detail.prev = prev ? { title: prev.title, slug: prev.slug } : null;
  detail.next = next ? { title: next.title, slug: next.slug } : null;
  detail.relatedQuestions = fallbackQuestions.map((q) => mapQuestion(q, user?.id));
  detail.relatedArticles = relatedArticles.map((a) => mapArticle(a));

  // fire-and-forget view count + analytics
  await Promise.all([
    db.article.update({ where: { id: article.id }, data: { views: { increment: 1 } } }),
    db.analyticsEvent.create({ data: { type: 'article_view', day: new Date().toISOString().slice(0, 10), path: `#/articles/${slug}`, userId: user?.id ?? null, ref: article.technology?.slug ?? null } }),
  ]).catch(() => {});

  return detail;
}

export async function getHomeAction(): Promise<{
  trending: ArticleDTO[];
  latest: ArticleDTO[];
  featured: ArticleDTO[];
  interviewPicks: QuestionDTO[];
  stats: { articles: number; questions: number; technologies: number; learners: number; interviews: number };
}> {
  const [trending, latest, featured, questionPicks, counts, learners, interviews] = await Promise.all([
    db.article.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      orderBy: [{ views: 'desc' }, { publishedAt: 'desc' }], take: 6,
      include: { ...articleInclude, _count: { select: { likes: true, bookmarks: true } } },
    }),
    db.article.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      orderBy: { publishedAt: 'desc' }, take: 6,
      include: { ...articleInclude, _count: { select: { likes: true, bookmarks: true } } },
    }),
    db.article.findMany({
      where: { status: 'PUBLISHED', deletedAt: null, featured: true },
      orderBy: { views: 'desc' }, take: 3,
      include: { ...articleInclude, _count: { select: { likes: true, bookmarks: true } } },
    }),
    db.interviewQuestion.findMany({
      where: { seniority: { in: ['SENIOR', 'MID'] }, category: { in: ['CONCEPTUAL', 'PERFORMANCE', 'ARCHITECTURE'] } },
      orderBy: { createdAt: 'asc' }, take: 6,
      include: { technology: { select: { name: true, slug: true, icon: true, color: true } }, bookmarks: { select: { userId: true } } },
    }),
    Promise.all([db.article.count({ where: { status: 'PUBLISHED' } }), db.interviewQuestion.count(), db.technology.count()]),
    db.user.count(),
    db.interviewAttempt.count(),
  ]);

  return {
    trending: trending.map((a) => mapArticle(a)),
    latest: latest.map((a) => mapArticle(a)),
    featured: featured.map((a) => mapArticle(a)),
    interviewPicks: questionPicks.map((q) => mapQuestion(q)),
    stats: { articles: counts[0], questions: counts[1], technologies: counts[2], learners, interviews },
  };
}

export async function listTechnologiesAction(category?: string): Promise<TechnologyDTO[]> {
  const techs = await db.technology.findMany({
    where: category ? { category: { slug: category } } : undefined,
    orderBy: { popularity: 'desc' },
    include: { category: true, _count: { select: { articles: true, questions: true } } },
  });
  return techs.map((t) => ({
    id: t.id, name: t.name, slug: t.slug, description: t.description, longDescription: t.longDescription,
    icon: t.icon, color: t.color, difficulty: t.difficulty, popularity: t.popularity,
    related: parseJsonArray(t.relatedSlugs), categorySlug: t.category.slug, categoryName: t.category.name,
    articleCount: t._count.articles, questionCount: t._count.questions,
  }));
}

export async function getTechnologyAction(slug: string): Promise<TechnologyDTO | null> {
  const user = await getCurrentUser();
  const tech = await db.technology.findUnique({
    where: { slug },
    include: { category: true, _count: { select: { articles: true, questions: true } } },
  });
  if (!tech) return null;

  let userProgress: TechnologyDTO['userProgress'] = null;
  if (user) {
    const [total, completed] = await Promise.all([
      db.article.count({ where: { technologyId: tech.id, status: 'PUBLISHED' } }),
      db.articleRead.count({ where: { userId: user.id, article: { technologyId: tech.id }, completedAt: { not: null } } }),
    ]);
    const percent = total > 0 ? Math.round((completed / Math.min(total, 25)) * 100) : 0;
    userProgress = { percent: Math.min(100, percent), completed, total };
  }

  return {
    id: tech.id, name: tech.name, slug: tech.slug, description: tech.description, longDescription: tech.longDescription,
    icon: tech.icon, color: tech.color, difficulty: tech.difficulty, popularity: tech.popularity,
    related: parseJsonArray(tech.relatedSlugs), categorySlug: tech.category.slug, categoryName: tech.category.name,
    articleCount: tech._count.articles, questionCount: tech._count.questions, userProgress,
  };
}

export async function searchAction(query: string, filters: { type?: string; technology?: string; difficulty?: string } = {}): Promise<{
  articles: ArticleDTO[];
  questions: QuestionDTO[];
  technologies: { name: string; slug: string; icon: string; color: string; description: string; articleCount: number }[];
  paths: { title: string; slug: string; icon: string; color: string; description: string }[];
  total: number;
}> {
  const q = query.trim();
  const user = await getCurrentUser();
  if (!q) return { articles: [], questions: [], technologies: [], paths: [], total: 0 };

  const words = q.split(/\s+/).filter(Boolean).slice(0, 5);
  const textMatch = (fields: string[]) => words.map((w) => ({ OR: fields.map((f) => ({ [f]: { contains: w } })) }));

  const [articles, questions, technologies, paths] = await Promise.all([
    db.article.findMany({
      where: {
        status: 'PUBLISHED', deletedAt: null,
        ...(filters.technology ? { technology: { slug: filters.technology } } : {}),
        ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
        AND: textMatch(['title', 'excerpt', 'plainText']),
      },
      orderBy: { views: 'desc' }, take: 12,
      include: { ...articleInclude, _count: { select: { likes: true, bookmarks: true } } },
    }),
    db.interviewQuestion.findMany({
      where: {
        ...(filters.technology ? { technology: { slug: filters.technology } } : {}),
        ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
        AND: textMatch(['question', 'shortAnswer', 'topic']),
      },
      take: 10,
      include: { technology: { select: { name: true, slug: true, icon: true, color: true } }, bookmarks: { select: { userId: true } } },
    }),
    db.technology.findMany({
      where: { OR: [{ name: { contains: q } }, { description: { contains: q } }] },
      take: 6, include: { _count: { select: { articles: true } } },
    }),
    db.learningPath.findMany({
      where: { OR: [{ title: { contains: q } }, { description: { contains: q } }] },
      take: 4,
    }),
  ]);

  await db.searchHistory.create({ data: { query: q, userId: user?.id ?? null, resultsCount: articles.length + questions.length } }).catch(() => {});
  await db.analyticsEvent.create({ data: { type: 'search', day: new Date().toISOString().slice(0, 10), userId: user?.id ?? null } }).catch(() => {});

  return {
    articles: articles.map((a) => mapArticle(a)),
    questions: questions.map((qq) => mapQuestion(qq, user?.id)),
    technologies: technologies.map((t) => ({ name: t.name, slug: t.slug, icon: t.icon, color: t.color, description: t.description, articleCount: t._count.articles })),
    paths: paths.map((p) => ({ title: p.title, slug: p.slug, icon: p.icon, color: p.color, description: p.description })),
    total: articles.length + questions.length + technologies.length + paths.length,
  };
}

export async function searchSuggestAction(query: string): Promise<{ articles: { title: string; slug: string }[]; questions: { question: string; id: string }[]; recent: string[] }> {
  const q = query.trim();
  const user = await getCurrentUser();
  if (q.length < 2) {
    const recent = user ? await db.searchHistory.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, distinct: ['query'], take: 5 }) : [];
    const trending = await db.searchHistory.findMany({ orderBy: { createdAt: 'desc' }, take: 60 });
    const freq = new Map<string, number>();
    trending.forEach((t) => freq.set(t.query, (freq.get(t.query) ?? 0) + 1));
    const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
    return { articles: [], questions: [], recent: [...recent.map((r) => r.query), ...top].slice(0, 5) };
  }
  const words = q.split(/\s+/).filter(Boolean).slice(0, 5);
  const [articles, questions] = await Promise.all([
    db.article.findMany({
      where: { status: 'PUBLISHED', deletedAt: null, AND: words.map((w) => ({ title: { contains: w } })) },
      orderBy: { views: 'desc' }, take: 5, select: { title: true, slug: true },
    }),
    db.interviewQuestion.findMany({ where: { OR: words.map((w) => ({ question: { contains: w } })) }, take: 4, select: { question: true, id: true } }),
  ]);
  return { articles, questions, recent: [] };
}

export async function getTrendingSearchesAction(): Promise<string[]> {
  const rows = await db.searchHistory.findMany({ orderBy: { createdAt: 'desc' }, take: 120 });
  const freq = new Map<string, number>();
  rows.forEach((r) => freq.set(r.query, (freq.get(r.query) ?? 0) + 1));
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k);
}

// ---------------- comments ----------------
export async function listCommentsAction(articleId: string): Promise<{
  id: string; body: string; createdAt: string; author: { name: string; avatarColor: string; headline: string | null };
  replies: { id: string; body: string; createdAt: string; author: { name: string; avatarColor: string } }[];
}[]> {
  const comments = await db.comment.findMany({
    where: { articleId, status: 'VISIBLE', parentId: null, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, avatarColor: true, headline: true } },
      replies: {
        where: { status: 'VISIBLE', deletedAt: null },
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { name: true, avatarColor: true } } },
      },
    },
  });
  return comments.map((c) => ({
    id: c.id, body: c.body, createdAt: c.createdAt.toISOString(),
    author: c.user,
    replies: c.replies.map((r) => ({ id: r.id, body: r.body, createdAt: r.createdAt.toISOString(), author: r.user })),
  }));
}

export async function addCommentAction(articleId: string, body: string, parentId?: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Sign in to join the discussion' };
  const text = body.trim();
  if (text.length < 3) return { ok: false, error: 'Comment is too short' };
  if (text.length > 2000) return { ok: false, error: 'Comment is too long' };
  await db.comment.create({ data: { articleId, userId: user.id, body: text, parentId: parentId ?? null } });
  return { ok: true };
}

export async function deleteCommentAction(commentId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Not authorized' };
  const comment = await db.comment.findUnique({ where: { id: commentId } });
  if (!comment) return { ok: false, error: 'Comment not found' };
  const canModerate = ['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(user.role);
  if (comment.userId !== user.id && !canModerate) return { ok: false, error: 'Not authorized' };
  await db.comment.update({ where: { id: commentId }, data: { deletedAt: new Date(), status: 'HIDDEN' } });
  return { ok: true };
}

// ---------------- cheatsheet hub data ----------------
export async function getCheatSheetsAction(): Promise<{ slug: string; name: string; icon: string; color: string; articleCount: number }[]> {
  const slugs = ['javascript', 'react', 'css', 'typescript', 'git', 'nextjs'];
  const techs = await db.technology.findMany({ where: { slug: { in: slugs } }, include: { _count: { select: { articles: true } } } });
  const order = new Map(slugs.map((s, i) => [s, i]));
  return techs
    .sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99))
    .map((t) => ({ slug: t.slug, name: t.name, icon: t.icon, color: t.color, articleCount: t._count.articles }));
}

/** Cheat-sheet content: top interview-relevant articles of a tech, with their cheat sheets. */
export async function getCheatSheetAction(techSlug: string): Promise<{
  name: string; icon: string; color: string;
  sections: { title: string; points: string[]; articleSlug: string }[];
} | null> {
  const tech = await db.technology.findUnique({ where: { slug: techSlug } });
  if (!tech) return null;
  const articles = await db.article.findMany({
    where: { technologyId: tech.id, status: 'PUBLISHED', interviewRelevant: true, cheatSheet: { not: null } },
    orderBy: { views: 'desc' }, take: 8,
    select: { title: true, slug: true, cheatSheet: true },
  });
  const sections = articles.map((a) => {
    let points: string[] = [];
    try { const cs = JSON.parse(a.cheatSheet ?? '{}'); points = Array.isArray(cs.points) ? cs.points : []; } catch { /* noop */ }
    return { title: a.title, points, articleSlug: a.slug };
  }).filter((s) => s.points.length > 0);
  return { name: tech.name, icon: tech.icon, color: tech.color, sections };
}

export { slugify };
