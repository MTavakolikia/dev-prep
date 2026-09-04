'use server';

// ============================================================
// Dev Prep — admin CMS: analytics, article management,
// revisions, users, taxonomy, questions.
// All actions re-check permissions server-side (RBAC).
// ============================================================
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { mapArticle, articleInclude } from '@/server/mappers';
import { excerptFrom } from '@/lib/slug';
import type { AdminOverviewDTO, ArticleDTO, Role, UserDTO } from '@/types';

async function requireStaff(min: 'EDITOR' | 'ADMIN' | 'SUPER_ADMIN' = 'EDITOR') {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  const order: Record<string, number> = { USER: 0, AUTHOR: 1, EDITOR: 2, ADMIN: 3, SUPER_ADMIN: 4 };
  if (order[user.role] < order[min]) throw new Error('FORBIDDEN');
  return user;
}

const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

// ---------------- overview / analytics ----------------
export async function getAdminOverviewAction(range: 7 | 30 | 90 = 30): Promise<AdminOverviewDTO> {
  await requireStaff();
  const since = new Date(Date.now() - range * 86400000);

  const [users, activeUsers, articles, published, drafts, viewsAgg, questions, attempts, bookmarks, comments, avgScore, events] = await Promise.all([
    db.user.count({ where: { deletedAt: null } }),
    db.user.count({ where: { deletedAt: null, lastActiveDay: { gte: dayKey(since) } } }),
    db.article.count({ where: { deletedAt: null } }),
    db.article.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
    db.article.count({ where: { deletedAt: null, status: 'DRAFT' } }),
    db.article.aggregate({ _sum: { views: true } }),
    db.interviewQuestion.count(),
    db.interviewAttempt.count(),
    db.articleBookmark.count(),
    db.comment.count({ where: { deletedAt: null } }),
    db.interviewAttempt.aggregate({ where: { status: 'COMPLETED' }, _avg: { score: true } }),
    db.analyticsEvent.findMany({
      where: { day: { gte: dayKey(since) }, type: { in: ['page_view', 'article_view', 'signup'] } },
      select: { type: true, day: true },
    }),
  ]);

  const dayKeys = Array.from({ length: range }, (_, i) => dayKey(new Date(Date.now() - (range - 1 - i) * 86400000)));
  const viewsByDay = dayKeys.map((day) => ({
    day,
    views: events.filter((e) => e.day === day && e.type === 'page_view').length,
    articles: events.filter((e) => e.day === day && e.type === 'article_view').length,
  }));
  const signups = dayKeys.map((day) => ({ day, count: events.filter((e) => e.day === day && e.type === 'signup').length }));

  const [topArticles, techs, statusGroups, difficultyGroups, interviewModes, recentActivity] = await Promise.all([
    db.article.findMany({
      where: { deletedAt: null, status: 'PUBLISHED' }, orderBy: { views: 'desc' }, take: 8,
      select: { id: true, title: true, slug: true, views: true, technology: { select: { name: true } }, _count: { select: { likes: true } } },
    }),
    db.technology.findMany({ orderBy: { popularity: 'desc' }, take: 8, select: { name: true, color: true, _count: { select: { articles: true } } } }),
    db.article.groupBy({ by: ['status'], _count: true, where: { deletedAt: null } }),
    db.article.groupBy({ by: ['difficulty'], _count: true, where: { deletedAt: null, status: 'PUBLISHED' } }),
    db.interviewAttempt.groupBy({ by: ['mode'], _count: true, _avg: { score: true }, where: { status: 'COMPLETED' } }),
    db.userActivity.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { name: true } } } }),
  ]);

  return {
    totals: {
      users, activeUsers, articles, published, drafts,
      views: viewsAgg._sum.views ?? 0, questions, attempts,
      bookmarks, comments, avgScore: Math.round(avgScore._avg.score ?? 0),
    },
    viewsByDay, signups,
    topArticles: topArticles.map((a) => ({ id: a.id, title: a.title, slug: a.slug, views: a.views, likes: a._count.likes, technology: a.technology?.name ?? 'General' })),
    techPopularity: techs.map((t) => ({ name: t.name, articles: t._count.articles, color: t.color })),
    statusBreakdown: statusGroups.map((g) => ({ status: g.status, count: g._count })),
    difficultyBreakdown: difficultyGroups.map((g) => ({ difficulty: g.difficulty, count: g._count })),
    interviewStats: interviewModes.map((m) => ({ mode: m.mode, count: m._count, avgScore: Math.round(m._avg.score ?? 0) })),
    recentActivity: recentActivity.map((a) => ({ id: a.id, type: a.type, user: a.user.name, title: a.title ?? a.type, createdAt: a.createdAt.toISOString() })),
  };
}

// ---------------- articles management ----------------
export async function adminListArticlesAction(opts: {
  page?: number; pageSize?: number; search?: string; status?: string; technology?: string; sort?: string;
}): Promise<{ articles: ArticleDTO[]; total: number; page: number }> {
  const user = await requireStaff();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(50, opts.pageSize ?? 12);
  const where: Record<string, unknown> = { deletedAt: null };
  if (opts.status) where.status = opts.status;
  if (opts.technology) where.technology = { slug: opts.technology };
  if (opts.search) where.OR = [{ title: { contains: opts.search } }, { excerpt: { contains: opts.search } }];
  // authors only see their own
  if (user.role === 'AUTHOR') where.authorId = user.id;

  const orderBy: Record<string, string> =
    opts.sort === 'views' ? { views: 'desc' } :
    opts.sort === 'title' ? { title: 'asc' } :
    { updatedAt: 'desc' };

  const [rows, total] = await Promise.all([
    db.article.findMany({
      where: where as never, orderBy: orderBy as never,
      skip: (page - 1) * pageSize, take: pageSize,
      include: { ...articleInclude, _count: { select: { likes: true, bookmarks: true } } },
    }),
    db.article.count({ where: where as never }),
  ]);
  return { articles: rows.map((a) => mapArticle(a)), total, page };
}

export async function adminGetArticleAction(id: string): Promise<(ArticleDTO & { content: string; tldr: string[]; seoTitle: string | null; seoDescription: string | null; seoKeywords: string | null; canonicalUrl: string | null }) | null> {
  await requireStaff();
  const article = await db.article.findFirst({
    where: { id, deletedAt: null },
    include: { ...articleInclude, _count: { select: { likes: true, bookmarks: true } } },
  });
  if (!article) return null;
  return {
    ...mapArticle(article),
    content: article.content,
    tldr: (() => { try { return JSON.parse(article.tldr ?? '[]') as string[]; } catch { return []; } })(),
    seoTitle: article.seoTitle, seoDescription: article.seoDescription, seoKeywords: article.seoKeywords,
    canonicalUrl: article.canonicalUrl,
  };
}

export interface AdminArticleInput {
  title: string; excerpt?: string; content?: string; technologyId?: string | null;
  difficulty?: string; status?: string; tags?: string[]; featured?: boolean;
  readingTime?: number; interviewRelevant?: boolean;
  seoTitle?: string | null; seoDescription?: string | null; seoKeywords?: string | null; canonicalUrl?: string | null;
  tldr?: string[]; scheduledAt?: string | null;
  note?: string;
}

export async function adminCreateArticleAction(input: AdminArticleInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  const user = await requireStaff();
  if (!input.title.trim()) return { ok: false, error: 'Title is required' };
  const baseSlug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  let slug = baseSlug || `article-${Date.now()}`;
  let n = 2;
  while (await db.article.findUnique({ where: { slug } })) slug = `${baseSlug}-${n++}`;

  const fallbackTech = await db.technology.findFirst({ select: { id: true, categoryId: true } });
  const tech = input.technologyId ? await db.technology.findUnique({ where: { id: input.technologyId } }) : fallbackTech;

  const article = await db.article.create({
    data: {
      title: input.title.trim(), slug,
      excerpt: input.excerpt?.trim() || excerptFrom(input.content ?? input.title),
      content: input.content ?? '',
      plainText: (input.content ?? '').replace(/<[^>]+>/g, ' ').slice(0, 4000),
      coverStyle: ['violet', 'emerald', 'amber', 'rose', 'cyan', 'teal', 'fuchsia', 'orange'][Math.floor(Math.random() * 8)],
      authorId: user.id,
      categoryId: tech?.categoryId ?? (await db.category.findFirst())!.id,
      technologyId: tech?.id ?? null,
      difficulty: input.difficulty ?? 'intermediate',
      status: input.status ?? 'DRAFT',
      readingTime: input.readingTime ?? Math.max(2, Math.round((input.content ?? '').replace(/<[^>]+>/g, ' ').split(/\s+/).length / 200)),
      interviewRelevant: input.interviewRelevant ?? false,
      tldr: JSON.stringify(input.tldr ?? []),
      seoTitle: input.seoTitle ?? null, seoDescription: input.seoDescription ?? null,
      seoKeywords: input.seoKeywords ?? null, canonicalUrl: input.canonicalUrl ?? null,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
      featured: input.featured ?? false,
    },
  });
  if (input.tags?.length) {
    for (const name of input.tags.slice(0, 8)) {
      const tag = await db.tag.upsert({ where: { name }, update: {}, create: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') } });
      await db.articleTag.create({ data: { articleId: article.id, tagId: tag.id } }).catch(() => {});
    }
  }
  await db.articleRevision.create({
    data: { articleId: article.id, revisionNumber: 1, title: article.title, excerpt: article.excerpt, content: article.content, note: 'Created', editedById: user.id },
  });
  return { ok: true, id: article.id };
}

export async function adminUpdateArticleAction(id: string, input: AdminArticleInput): Promise<{ ok: boolean; error?: string }> {
  const user = await requireStaff();
  const article = await db.article.findFirst({ where: { id, deletedAt: null } });
  if (!article) return { ok: false, error: 'Article not found' };
  if (user.role === 'AUTHOR' && article.authorId !== user.id) return { ok: false, error: 'Authors can only edit their own articles' };

  const content = input.content ?? article.content;
  const wasPublished = article.status === 'PUBLISHED';
  const nowPublished = (input.status ?? article.status) === 'PUBLISHED';

  await db.article.update({
    where: { id },
    data: {
      title: input.title?.trim() || article.title,
      excerpt: input.excerpt?.trim() || article.excerpt,
      content,
      plainText: content.replace(/<[^>]+>/g, ' ').slice(0, 4000),
      technologyId: input.technologyId !== undefined ? input.technologyId : article.technologyId,
      difficulty: input.difficulty ?? article.difficulty,
      status: input.status ?? article.status,
      readingTime: input.readingTime ?? Math.max(2, Math.round(content.replace(/<[^>]+>/g, ' ').split(/\s+/).length / 200)),
      interviewRelevant: input.interviewRelevant ?? article.interviewRelevant,
      tldr: input.tldr ? JSON.stringify(input.tldr) : article.tldr,
      seoTitle: input.seoTitle !== undefined ? input.seoTitle : article.seoTitle,
      seoDescription: input.seoDescription !== undefined ? input.seoDescription : article.seoDescription,
      seoKeywords: input.seoKeywords !== undefined ? input.seoKeywords : article.seoKeywords,
      canonicalUrl: input.canonicalUrl !== undefined ? input.canonicalUrl : article.canonicalUrl,
      featured: input.featured ?? article.featured,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : article.scheduledAt,
      publishedAt: !wasPublished && nowPublished ? new Date() : article.publishedAt,
      updatedAt: new Date(),
    },
  });

  if (input.content !== undefined && input.content !== article.content) {
    const lastRev = await db.articleRevision.findFirst({ where: { articleId: id }, orderBy: { revisionNumber: 'desc' } });
    await db.articleRevision.create({
      data: {
        articleId: id, revisionNumber: (lastRev?.revisionNumber ?? 0) + 1,
        title: input.title ?? article.title, excerpt: input.excerpt ?? article.excerpt, content,
        note: input.note ?? 'Editorial update', editedById: user.id,
      },
    });
  }
  return { ok: true };
}

export async function adminSetArticleStatusAction(id: string, status: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireStaff();
  const article = await db.article.findFirst({ where: { id, deletedAt: null } });
  if (!article) return { ok: false, error: 'Article not found' };
  if (user.role === 'AUTHOR' && article.authorId !== user.id) return { ok: false, error: 'Not allowed' };
  if (user.role === 'AUTHOR' && status === 'PUBLISHED') return { ok: false, error: 'Only editors can publish' };
  await db.article.update({
    where: { id },
    data: { status, publishedAt: status === 'PUBLISHED' && !article.publishedAt ? new Date() : article.publishedAt },
  });
  return { ok: true };
}

export async function adminDuplicateArticleAction(id: string): Promise<{ ok: boolean; newId?: string; error?: string }> {
  const user = await requireStaff();
  const article = await db.article.findFirst({ where: { id, deletedAt: null }, include: { tags: true } });
  if (!article) return { ok: false, error: 'Article not found' };
  const newSlug = `${article.slug}-copy-${Date.now().toString(36)}`;
  const copy = await db.article.create({
    data: {
      title: `${article.title} (Copy)`, slug: newSlug, excerpt: article.excerpt, content: article.content,
      plainText: article.plainText, coverStyle: article.coverStyle, authorId: user.id,
      categoryId: article.categoryId, technologyId: article.technologyId, difficulty: article.difficulty,
      status: 'DRAFT', readingTime: article.readingTime, interviewRelevant: article.interviewRelevant,
      tldr: article.tldr, cheatSheet: article.cheatSheet, seoTitle: article.seoTitle,
      seoDescription: article.seoDescription, seoKeywords: article.seoKeywords,
    },
  });
  for (const t of article.tags) {
    await db.articleTag.create({ data: { articleId: copy.id, tagId: t.tagId } }).catch(() => {});
  }
  return { ok: true, newId: copy.id };
}

export async function adminSoftDeleteArticleAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireStaff();
  const article = await db.article.findFirst({ where: { id, deletedAt: null } });
  if (!article) return { ok: false, error: 'Not found' };
  if (user.role === 'AUTHOR' && article.authorId !== user.id) return { ok: false, error: 'Not allowed' };
  await db.article.update({ where: { id }, data: { deletedAt: new Date(), status: 'ARCHIVED' } });
  return { ok: true };
}

export async function adminListRevisionsAction(articleId: string): Promise<{
  id: string; revisionNumber: number; title: string; note: string | null; createdAt: string; editor: string;
}[]> {
  await requireStaff();
  const revs = await db.articleRevision.findMany({
    where: { articleId }, orderBy: { revisionNumber: 'desc' },
    include: { editedBy: { select: { name: true } } },
  });
  return revs.map((r) => ({ id: r.id, revisionNumber: r.revisionNumber, title: r.title, note: r.note, createdAt: r.createdAt.toISOString(), editor: r.editedBy.name }));
}

export async function adminRestoreRevisionAction(articleId: string, revisionId: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireStaff();
  const [article, rev] = await Promise.all([
    db.article.findFirst({ where: { id: articleId, deletedAt: null } }),
    db.articleRevision.findUnique({ where: { id: revisionId } }),
  ]);
  if (!article || !rev || rev.articleId !== articleId) return { ok: false, error: 'Revision not found' };
  const lastRev = await db.articleRevision.findFirst({ where: { articleId }, orderBy: { revisionNumber: 'desc' } });
  await db.$transaction([
    db.article.update({ where: { id: articleId }, data: { content: rev.content, title: rev.title, excerpt: rev.excerpt, updatedAt: new Date() } }),
    db.articleRevision.create({
      data: { articleId, revisionNumber: (lastRev?.revisionNumber ?? 0) + 1, title: rev.title, excerpt: rev.excerpt, content: rev.content, note: `Restored from revision #${rev.revisionNumber}`, editedById: user.id },
    }),
  ]);
  return { ok: true };
}

// ---------------- users ----------------
export async function adminListUsersAction(opts: { search?: string; role?: string; page?: number }): Promise<{ users: UserDTO[]; total: number }> {
  await requireStaff();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = 12;
  const where: Record<string, unknown> = { deletedAt: null };
  if (opts.role) where.role = opts.role;
  if (opts.search) where.OR = [{ name: { contains: opts.search } }, { email: { contains: opts.search } }];
  const [rows, total] = await Promise.all([
    db.user.findMany({
      where: where as never, orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize, take: pageSize,
      include: { _count: { select: { articles: true } } },
    }),
    db.user.count({ where: where as never }),
  ]);
  return {
    users: rows.map((u) => ({
      id: u.id, name: u.name, email: u.email, role: u.role as Role, avatarColor: u.avatarColor,
      headline: u.headline, bio: u.bio, xp: u.xp, level: u.level, streakCount: u.streakCount,
      longestStreak: u.longestStreak, createdAt: u.createdAt.toISOString(), articleCount: u._count.articles,
    })),
    total,
  };
}

export async function adminSetUserRoleAction(userId: string, role: string): Promise<{ ok: boolean; error?: string }> {
  const me = await requireStaff('ADMIN');
  if (me.id === userId) return { ok: false, error: 'You cannot change your own role' };
  if (!['USER', 'AUTHOR', 'EDITOR', 'ADMIN', 'SUPER_ADMIN'].includes(role)) return { ok: false, error: 'Invalid role' };
  if (role === 'SUPER_ADMIN' && me.role !== 'SUPER_ADMIN') return { ok: false, error: 'Only a super admin can grant super admin' };
  const target = await db.user.findUnique({ where: { id: userId } });
  if (target?.role === 'SUPER_ADMIN' && me.role !== 'SUPER_ADMIN') return { ok: false, error: 'Only a super admin can modify a super admin' };
  await db.user.update({ where: { id: userId }, data: { role } });
  return { ok: true };
}

// ---------------- taxonomy ----------------
export async function adminListTaxonomyAction(): Promise<{
  categories: { id: string; name: string; slug: string; description: string | null; icon: string; color: string; articleCount: number; technologyCount: number }[];
  technologies: { id: string; name: string; slug: string; icon: string; color: string; categoryId: string; articleCount: number; questionCount: number }[];
  tags: { id: string; name: string; slug: string; usage: number }[];
}> {
  await requireStaff();
  const [categories, technologies, tags] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: 'asc' }, include: { _count: { select: { articles: true, technologies: true } } } }),
    db.technology.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { articles: true, questions: true } } } }),
    db.tag.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { articles: true } } } }),
  ]);
  return {
    categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description, icon: c.icon, color: c.color, articleCount: c._count.articles, technologyCount: c._count.technologies })),
    technologies: technologies.map((t) => ({ id: t.id, name: t.name, slug: t.slug, icon: t.icon, color: t.color, categoryId: t.categoryId, articleCount: t._count.articles, questionCount: t._count.questions })),
    tags: tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug, usage: t._count.articles })),
  };
}

export async function adminUpsertTechnologyAction(input: {
  id?: string; name: string; slug: string; categoryId: string; description: string;
  icon?: string; color?: string; difficulty?: string; popularity?: number;
}): Promise<{ ok: boolean; error?: string }> {
  await requireStaff('ADMIN');
  if (!input.name.trim() || !input.slug.trim()) return { ok: false, error: 'Name and slug are required' };
  if (input.id) {
    await db.technology.update({
      where: { id: input.id },
      data: { name: input.name, slug: input.slug, categoryId: input.categoryId, description: input.description, icon: input.icon ?? 'code', color: input.color ?? 'violet', difficulty: input.difficulty ?? 'intermediate', popularity: input.popularity ?? 50 },
    });
  } else {
    const exists = await db.technology.findUnique({ where: { slug: input.slug } });
    if (exists) return { ok: false, error: 'A technology with this slug already exists' };
    await db.technology.create({
      data: { name: input.name, slug: input.slug, categoryId: input.categoryId, description: input.description, icon: input.icon ?? 'code', color: input.color ?? 'violet', difficulty: input.difficulty ?? 'intermediate', popularity: input.popularity ?? 50 },
    });
  }
  return { ok: true };
}

export async function adminListQuestionsAction(opts: { search?: string; technology?: string; seniority?: string; page?: number }): Promise<{
  questions: { id: string; question: string; topic: string; category: string; difficulty: string; seniority: string; expectedMinutes: number; technology: { name: string; slug: string; color: string } }[];
  total: number;
}> {
  await requireStaff();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = 12;
  const where: Record<string, unknown> = {};
  if (opts.technology) where.technology = { slug: opts.technology };
  if (opts.seniority) where.seniority = opts.seniority;
  if (opts.search) where.OR = [{ question: { contains: opts.search } }, { topic: { contains: opts.search } }];
  const [rows, total] = await Promise.all([
    db.interviewQuestion.findMany({
      where: where as never, orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize, take: pageSize,
      include: { technology: { select: { name: true, slug: true, color: true } } },
    }),
    db.interviewQuestion.count({ where: where as never }),
  ]);
  return {
    questions: rows.map((q) => ({ id: q.id, question: q.question, topic: q.topic, category: q.category, difficulty: q.difficulty, seniority: q.seniority, expectedMinutes: q.expectedMinutes, technology: q.technology })),
    total,
  };
}

export async function adminDeleteQuestionAction(id: string): Promise<{ ok: boolean }> {
  await requireStaff('ADMIN');
  await db.interviewQuestion.delete({ where: { id } }).catch(() => {});
  return { ok: true };
}

// ---------------- settings (site config from DB-less env abstraction) ----------------
export async function adminGetSettingsAction(): Promise<{
  siteName: string; siteDescription: string; aiProvider: string; storageDriver: string;
  adminEmail: string; version: string;
}> {
  await requireStaff();
  return {
    siteName: 'Dev Prep',
    siteDescription: 'The Developer Operating System — learn, practice, prepare.',
    aiProvider: process.env.AI_PROVIDER ?? 'zai',
    storageDriver: process.env.STORAGE_DRIVER ?? 'local',
    adminEmail: process.env.ADMIN_EMAIL ?? '—',
    version: '1.0.0',
  };
}
