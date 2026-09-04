// ============================================================
// Dev Prep seed — main runner
// Populates: categories, technologies, tags, users, articles,
// interview questions, learning paths, achievements, demo
// engagement, comments and analytics events.
// Run: bun src/db/seed/seed.ts
// ============================================================

import { PrismaClient } from '@prisma/client';
import { scryptSync, randomBytes } from 'node:crypto';
import { seedCategories, seedTechnologies } from './data/taxonomy';
import { javascriptTopics } from './data/topics-js';
import { typescriptTopics } from './data/topics-ts';
import { reactTopics } from './data/topics-react';
import { nextjsTopics } from './data/topics-next';
import { cssTopics, htmlTopics } from './data/topics-css-html';
import {
  webPerformanceTopics, testingTopics, stateManagementTopics, dataFetchingTopics,
  accessibilityTopics, frontendArchitectureTopics, designPatternsTopics,
  browserApisTopics, frontendSecurityTopics, frontendSystemDesignTopics, miscFrontendTopics,
} from './data/topics-frontend';
import {
  nodejsTopics, restApiTopics, graphqlTopics, authenticationTopics, databasesTopics,
  devopsTopics, mobileTopics, aiTopics, engineeringTopics,
} from './data/topics-other';
import { seedPaths, seedAchievements, type SeedPath } from './data/paths';
import { composeArticle, composeQuestions, slugify } from './generator';
import { synthesizeTopics } from './data/topics-synth';
import { composeTechPaths, composeEssentialsPath, composeCareerPaths } from './data/paths-gen';
import { generatedAchievements } from './data/achievements-extra';
import { generateSynthUsers } from './data/users-synth';
import type { SeedTopic } from './data/topic-types';

const db = new PrismaClient();

// deterministic RNG
let rngState = 42;
function rng(): number {
  rngState = (rngState * 1103515245 + 12345) % 2147483648;
  return rngState / 2147483648;
}
const randInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const pickOne = <A,>(arr: A[]): A => arr[Math.floor(rng() * arr.length)];
function hash(n: number, mod: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return Math.abs(Math.floor((x - Math.floor(x)) * mod)) % mod;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const daysAgo = (n: number, jitterHours = 20) => new Date(now - n * DAY - randInt(0, jitterHours) * 60 * 60 * 1000);
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

interface TechTopics { slug: string; topics: SeedTopic[] }
const TECH_TOPICS: TechTopics[] = [
  { slug: 'javascript', topics: javascriptTopics },
  { slug: 'typescript', topics: typescriptTopics },
  { slug: 'react', topics: reactTopics },
  { slug: 'nextjs', topics: nextjsTopics },
  { slug: 'css', topics: cssTopics },
  { slug: 'html', topics: htmlTopics },
  { slug: 'web-performance', topics: webPerformanceTopics },
  { slug: 'testing', topics: testingTopics },
  { slug: 'state-management', topics: stateManagementTopics },
  { slug: 'data-fetching', topics: dataFetchingTopics },
  { slug: 'accessibility', topics: accessibilityTopics },
  { slug: 'frontend-architecture', topics: frontendArchitectureTopics },
  { slug: 'design-patterns', topics: designPatternsTopics },
  { slug: 'browser-apis', topics: browserApisTopics },
  { slug: 'frontend-security', topics: frontendSecurityTopics },
  { slug: 'frontend-system-design', topics: frontendSystemDesignTopics },
  { slug: 'tailwind', topics: miscFrontendTopics },
  { slug: 'nodejs', topics: nodejsTopics },
  { slug: 'rest-api', topics: restApiTopics },
  { slug: 'graphql', topics: graphqlTopics },
  { slug: 'authentication', topics: authenticationTopics },
  { slug: 'databases', topics: databasesTopics },
  { slug: 'docker', topics: devopsTopics.slice(0, 10) },
  { slug: 'kubernetes', topics: devopsTopics.slice(10, 20) },
  { slug: 'ci-cd', topics: devopsTopics.slice(20, 30) },
  { slug: 'github-actions', topics: devopsTopics.slice(30, 38) },
  { slug: 'linux', topics: devopsTopics.slice(38, 48) },
  { slug: 'cloud', topics: devopsTopics.slice(48, 58) },
  { slug: 'react-native', topics: mobileTopics.slice(0, 16) },
  { slug: 'flutter', topics: mobileTopics.slice(16, 26) },
  { slug: 'llm', topics: aiTopics.slice(0, 10) },
  { slug: 'rag', topics: aiTopics.slice(10, 18) },
  { slug: 'ai-agents', topics: aiTopics.slice(18, 26) },
  { slug: 'prompt-engineering', topics: aiTopics.slice(26, 34) },
  { slug: 'ai-apis', topics: aiTopics.slice(34, 44) },
  { slug: 'system-design', topics: engineeringTopics.slice(0, 15) },
  { slug: 'clean-code', topics: engineeringTopics.slice(15, 25) },
  { slug: 'git', topics: engineeringTopics.slice(25, 35) },
  { slug: 'algorithms', topics: engineeringTopics.slice(35, 47) },
  { slug: 'data-structures', topics: engineeringTopics.slice(47, 57) },
  { slug: 'solid', topics: engineeringTopics.slice(57, 63) },
];

// Extended catalog: technologies without a curated topic bank get a
// deterministic synthesized track (11 topics -> articles + questions),
// so every technology page is fully populated.
const CURATED_SLUGS = new Set(TECH_TOPICS.map((e) => e.slug));
const FULL_TECH_TOPICS: TechTopics[] = [
  ...TECH_TOPICS,
  ...seedTechnologies
    .filter((t) => !CURATED_SLUGS.has(t.slug))
    .map((t) => ({ slug: t.slug, topics: synthesizeTopics(t.name) })),
];

async function main() {
  console.log('🧹 Clearing existing data...');
  const tables = [
    db.analyticsEvent.deleteMany(), db.aIMessage.deleteMany(), db.aIConversation.deleteMany(),
    db.searchHistory.deleteMany(), db.dailyProgress.deleteMany(), db.notification.deleteMany(),
    db.userActivity.deleteMany(), db.userAchievement.deleteMany(), db.achievement.deleteMany(),
    db.note.deleteMany(), db.comment.deleteMany(), db.like.deleteMany(),
    db.questionBookmark.deleteMany(), db.articleBookmark.deleteMany(), db.articleRead.deleteMany(),
    db.pathItemProgress.deleteMany(), db.pathEnrollment.deleteMany(),
    db.interviewAnswer.deleteMany(), db.interviewAttempt.deleteMany(),
    db.learningPathItem.deleteMany(), db.learningPath.deleteMany(),
    db.articleRevision.deleteMany(), db.articleTag.deleteMany(), db.article.deleteMany(),
    db.interviewQuestion.deleteMany(), db.tag.deleteMany(),
    db.technology.deleteMany(), db.category.deleteMany(),
    db.session.deleteMany(), db.media.deleteMany(),
    db.user.deleteMany(),
  ];
  for (const t of tables) await t;

  // ---------- 1. Taxonomy ----------
  console.log('📚 Categories & technologies...');
  const categoryMap = new Map<string, string>();
  for (const c of seedCategories) {
    const row = await db.category.create({ data: { ...c } });
    categoryMap.set(c.slug, row.id);
  }
  const techMap = new Map<string, { id: string; name: string; categorySlug: string; popularity: number }>();
  const allTechSlugs = new Set(seedTechnologies.map((t) => t.slug));
  for (const t of seedTechnologies) {
    const row = await db.technology.create({
      data: {
        name: t.name, slug: t.slug, categoryId: categoryMap.get(t.categorySlug)!,
        description: t.description, longDescription: t.longDescription, icon: t.icon,
        color: t.color, difficulty: t.difficulty, popularity: t.popularity,
        relatedSlugs: JSON.stringify(t.related.filter((r) => allTechSlugs.has(r) && r !== t.slug)),
      },
    });
    techMap.set(t.slug, { id: row.id, name: t.name, categorySlug: t.categorySlug, popularity: t.popularity });
  }

  // ---------- 2. Users ----------
  console.log('👤 Users...');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@devprep.dev';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Forge-Admin-2026!';
  const demoEmail = process.env.DEMO_EMAIL || 'alex@devprep.dev';
  const demoPassword = process.env.DEMO_PASSWORD || 'Demo-2026!';

  const usersData = [
    { email: adminEmail, name: process.env.ADMIN_NAME || 'Sara Mitchell', role: 'SUPER_ADMIN', avatarColor: 'violet', headline: 'Platform Admin · Ex-FAANG, 12y frontend', bio: 'Curating the Dev Prep library and keeping content quality bars high.', createdAt: daysAgo(400) },
    { email: 'james@devprep.dev', name: 'James Okafor', role: 'EDITOR', avatarColor: 'emerald', headline: 'Managing Editor · Frontend systems', bio: 'I keep the React and architecture tracks sharp. Previously at Vercel-adjacent startups.', createdAt: daysAgo(380) },
    { email: 'elena@devprep.dev', name: 'Elena Petrova', role: 'AUTHOR', avatarColor: 'rose', headline: 'Staff Engineer · Performance & CSS', bio: 'Obsessed with rendering pipelines and cascade internals. Writing about what I debug.', createdAt: daysAgo(360) },
    { email: 'marcus@devprep.dev', name: 'Marcus Chen', role: 'AUTHOR', avatarColor: 'cyan', headline: 'Senior Engineer · React & Next.js', bio: 'I write the articles I wish I had when preparing for senior interviews.', createdAt: daysAgo(340) },
    { email: 'priya@devprep.dev', name: 'Priya Sharma', role: 'AUTHOR', avatarColor: 'amber', headline: 'Tech Lead · TypeScript & testing', bio: 'Types, tests and DX. Ex-agency, now scaling a design system.', createdAt: daysAgo(330) },
    { email: demoEmail, name: 'Alex Rivera', role: 'USER', avatarColor: 'violet', headline: 'Frontend Developer → aiming for Senior', bio: 'Learning in public. Currently deep in React internals and interview prep.', createdAt: daysAgo(90) },
    { email: 'sofia@devprep.dev', name: 'Sofia Lindqvist', role: 'USER', avatarColor: 'teal', headline: 'Junior Frontend Developer', bio: 'Bootcamp grad building fundamentals, one article a day.', createdAt: daysAgo(60) },
    { email: 'omar@devprep.dev', name: 'Omar Haddad', role: 'USER', avatarColor: 'orange', headline: 'Full-Stack Developer', bio: 'Node, React and everything in between.', createdAt: daysAgo(55) },
    { email: 'mia@devprep.dev', name: 'Mia Kowalski', role: 'USER', avatarColor: 'fuchsia', headline: 'Senior Frontend · a11y advocate', bio: 'Making the web usable for everyone, one audit at a time.', createdAt: daysAgo(45) },
    { email: 'dan@devprep.dev', name: 'Dan Park', role: 'USER', avatarColor: 'sky', headline: 'Career switcher → Frontend', bio: 'Ex-analyst, now shipping React at a fintech startup.', createdAt: daysAgo(30) },
    { email: 'yuki@devprep.dev', name: 'Yuki Tanaka', role: 'AUTHOR', avatarColor: 'lime', headline: 'Engineer · DevOps for frontend teams', bio: 'CI pipelines, containers and cloud cost sanity.', createdAt: daysAgo(120) },
  ];
  for (const u of usersData) {
    await db.user.create({
      data: {
        email: u.email, name: u.name, role: u.role, avatarColor: u.avatarColor,
        headline: u.headline, bio: u.bio, emailVerified: true,
        passwordHash: hashPassword(u.email === adminEmail ? adminPassword : u.email === demoEmail ? demoPassword : 'Password-2026!'),
        createdAt: u.createdAt, updatedAt: u.createdAt,
        xp: u.email === demoEmail ? 2450 : randInt(60, 1800),
        level: u.email === demoEmail ? 7 : randInt(1, 6),
        streakCount: u.email === demoEmail ? 12 : randInt(0, 9),
        longestStreak: u.email === demoEmail ? 21 : randInt(0, 18),
        lastActiveDay: dayKey(new Date()),
      },
    });
  }

  // Synthetic community users (deterministic) -> 100+ accounts total
  console.log('👥 Synthetic community users...');
  for (const s of generateSynthUsers(90)) {
    const createdAt = daysAgo(s.createdAtOffsetDays);
    await db.user.create({
      data: {
        email: s.email, name: s.name, role: 'USER', avatarColor: s.avatarColor,
        headline: s.headline, bio: s.bio, emailVerified: true,
        passwordHash: hashPassword('Password-2026!'),
        createdAt, updatedAt: createdAt,
        xp: s.xp, level: s.level, streakCount: s.streakCount, longestStreak: s.longestStreak,
        lastActiveDay: dayKey(new Date(now - randInt(0, 5) * DAY)),
      },
    });
  }
  const allUsers = await db.user.findMany();
  const demo = allUsers.find((u) => u.email === demoEmail)!;
  const authors = allUsers.filter((u) => ['SUPER_ADMIN', 'EDITOR', 'AUTHOR'].includes(u.role));

  // ---------- 3. Articles ----------
  console.log('📝 Composing articles...');
  const tagSet = new Set<string>(['interview-prep', 'best-practices', 'performance', 'architecture', 'fundamentals', 'deep-dive', 'tutorial', 'case-study']);
  const techArticleCounts = new Map<string, number>();

  interface PendingArticle {
    title: string; slug: string; excerpt: string; content: string; plainText: string;
    difficulty: string; readingTime: number; interviewRelevant: boolean; tldr: string; cheatSheet: string;
    seoTitle: string; seoDescription: string; seoKeywords: string; coverStyle: string;
    technologySlug: string; tags: string[]; featured: boolean; status: string;
    views: number; publishedAt: Date; scheduledAt: Date | null; authorIdx: number;
  }
  const pending: PendingArticle[] = [];
  const usedSlugs = new Set<string>();

  let ai = 0;
  for (const { slug: techSlug, topics } of FULL_TECH_TOPICS) {
    const tech = techMap.get(techSlug);
    if (!tech) continue;
    for (const topic of topics) {
      const art = composeArticle(topic, techSlug, tech.name, tech.categorySlug, ai);
      let slug = art.slug;
      let n = 2;
      while (usedSlugs.has(slug)) slug = `${art.slug}-${n++}`;
      usedSlugs.add(slug);
      topic.tags.split(',').forEach((t) => t.trim() && tagSet.add(t.trim()));
      if (art.interviewRelevant) tagSet.add('interview-prep');

      // status distribution: 93% published, rest draft/review/scheduled/archived
      const r = rng();
      const status = r < 0.93 ? 'PUBLISHED' : r < 0.955 ? 'DRAFT' : r < 0.97 ? 'IN_REVIEW' : r < 0.985 ? 'SCHEDULED' : 'ARCHIVED';
      const ageDays = Math.floor(rng() ** 1.6 * 150) + 1;
      const published = status === 'PUBLISHED' || status === 'ARCHIVED';
      const popFactor = tech.popularity / 100;
      const views = published ? Math.floor((rng() ** 2.4) * 22000 * popFactor) + 120 : randInt(0, 40);
      pending.push({
        ...art, slug, technologySlug: techSlug, tags: art.tags.split(',').map((t) => t.trim()).filter(Boolean),
        featured: art.difficulty === difficultyOf(topic) && views > 8000 && rng() < 0.25,
        status, views, publishedAt: published ? daysAgo(ageDays, 24) : new Date(),
        scheduledAt: status === 'SCHEDULED' ? new Date(now + randInt(1, 14) * DAY) : null,
        authorIdx: hash(ai * 13, authors.length),
      });
      techArticleCounts.set(techSlug, (techArticleCounts.get(techSlug) ?? 0) + 1);
      ai++;
    }
  }
  function difficultyOf(t: SeedTopic): string { return ['beginner', 'intermediate', 'advanced', 'expert'][t.diff]; }

  console.log(`   ${pending.length} articles prepared. Inserting in batches...`);
  const articleIdBySlug = new Map<string, string>();
  const BATCH = 80;
  for (let i = 0; i < pending.length; i += BATCH) {
    const chunk = pending.slice(i, i + BATCH);
    const rows = await db.$transaction(
      chunk.map((p) => db.article.create({
        data: {
          title: p.title, slug: p.slug, excerpt: p.excerpt, content: p.content, plainText: p.plainText.slice(0, 4000),
          coverStyle: p.coverStyle, authorId: authors[p.authorIdx].id,
          categoryId: categoryMap.get(techMap.get(p.technologySlug)!.categorySlug)!,
          technologyId: techMap.get(p.technologySlug)!.id,
          difficulty: p.difficulty, status: p.status, readingTime: p.readingTime, views: p.views,
          interviewRelevant: p.interviewRelevant, tldr: p.tldr, cheatSheet: p.cheatSheet,
          seoTitle: p.seoTitle, seoDescription: p.seoDescription, seoKeywords: p.seoKeywords,
          featured: p.featured, publishedAt: p.publishedAt, scheduledAt: p.scheduledAt,
          createdAt: p.publishedAt, updatedAt: p.publishedAt,
        },
      })),
    );
    rows.forEach((r, j) => articleIdBySlug.set(chunk[j].slug, r.id));
  }

  // ---------- 4. Tags ----------
  console.log('🏷️  Tags & revisions...');
  const tagRows = await db.$transaction([...tagSet].map((name) =>
    db.tag.create({ data: { name, slug: slugify(name) } })));
  const tagIdByName = new Map(tagRows.map((t) => [t.name, t.id]));
  const seenPairs = new Set<string>();
  pending.forEach((p) => {
    const articleId = articleIdBySlug.get(p.slug)!;
    p.tags.forEach((t) => { const tid = tagIdByName.get(t); if (tid) seenPairs.add(`${articleId}:${tid}`); });
    if (p.interviewRelevant) seenPairs.add(`${articleId}:${tagIdByName.get('interview-prep')!}`);
  });
  const articleTagData = [...seenPairs].map((pair) => { const [articleId, tagId] = pair.split(':'); return { articleId, tagId }; });
  for (let i = 0; i < articleTagData.length; i += 200) {
    await db.articleTag.createMany({ data: articleTagData.slice(i, i + 200) });
  }

  // Revisions for popular articles
  const topForRevisions = pending.filter((p) => p.views > 9000).slice(0, 60);
  await db.$transaction(topForRevisions.flatMap((p, i) => {
    const articleId = articleIdBySlug.get(p.slug)!;
    return [1, 2].map((rev) => db.articleRevision.create({
      data: {
        articleId, revisionNumber: rev, title: p.title, excerpt: p.excerpt, content: p.content,
        note: rev === 1 ? 'Initial draft' : 'Editorial pass: tightened intro, updated code samples',
        editedById: authors[(i + rev) % authors.length].id,
        createdAt: new Date(p.publishedAt.getTime() + rev * 3 * DAY),
      },
    }));
  }));

  // ---------- 5. Interview questions ----------
  console.log('❓ Interview questions...');
  const questionRows: {
    question: string; shortAnswer: string; detailedAnswer: string; explanation: string;
    technologyId: string; topic: string; category: string; difficulty: string; seniority: string;
    expectedMinutes: number; tags: string; articleId: string | null;
  }[] = [];
  let qi = 0;
  for (const { slug: techSlug, topics } of FULL_TECH_TOPICS) {
    const tech = techMap.get(techSlug)!;
    topics.forEach((topic, ti) => {
      const qs = composeQuestions(topic, tech.name, qi + ti);
      const techArticleSlug = slugify(topic.t);
      const linked = articleIdBySlug.get(techArticleSlug) ?? null;
      qs.forEach((q) => questionRows.push({
        question: q.question, shortAnswer: q.shortAnswer, detailedAnswer: q.detailedAnswer,
        explanation: q.explanation, technologyId: tech.id, topic: q.topic, category: q.category,
        difficulty: q.difficulty, seniority: q.seniority, expectedMinutes: q.expectedMinutes,
        tags: q.tags || techSlug, articleId: linked,
      }));
    });
    qi += topics.length;
  }
  for (let i = 0; i < questionRows.length; i += 200) {
    await db.interviewQuestion.createMany({ data: questionRows.slice(i, i + 200) });
  }

  // ---------- 6. Learning paths ----------
  console.log('🛤️  Learning paths...');
  // Hand-written flagships + career roadmaps + per-technology composed paths.
  // Generated item titles come from actual topics, so every item resolves
  // to a real article via the slug lookup below.
  const allSeedPaths: SeedPath[] = [
    ...seedPaths,
    ...composeCareerPaths(),
    ...FULL_TECH_TOPICS.flatMap(({ slug, topics }) => {
      const tech = seedTechnologies.find((t) => t.slug === slug);
      if (!tech) return [];
      return CURATED_SLUGS.has(slug) ? composeTechPaths(tech, topics) : composeEssentialsPath(tech, topics);
    }),
  ];
  const usedPathSlugs = new Set<string>();
  for (const p of allSeedPaths) {
    let slug = p.slug;
    let n = 2;
    while (usedPathSlugs.has(slug)) slug = `${p.slug}-${n++}`;
    usedPathSlugs.add(slug);
    const path = await db.learningPath.create({
      data: {
        title: p.title, slug, description: p.description, longDescription: p.longDescription,
        icon: p.icon, color: p.color, level: p.level, estimatedHours: p.estimatedHours,
        technologyId: p.technologySlug ? techMap.get(p.technologySlug)?.id : null,
        careerGoal: p.careerGoal ?? null,
      },
    });
    let order = 1;
    for (const item of p.items) {
      const articleId = articleIdBySlug.get(slugify(item.title)) ?? null;
      await db.learningPathItem.create({
        data: {
          pathId: path.id, sortOrder: order++, title: item.title, description: item.description,
          estimatedHours: item.hours, milestone: item.milestone ?? false, articleId,
        },
      });
    }
  }
  const unresolvedPathItems = await db.learningPathItem.count({ where: { articleId: null } });
  console.log(`   ${allSeedPaths.length} paths created; items without linked article: ${unresolvedPathItems}`);

  // ---------- 7. Achievements ----------
  console.log('🏆 Achievements...');
  const allAchievements = [...seedAchievements, ...generatedAchievements];
  const achKeySet = new Set<string>();
  for (const a of allAchievements) {
    if (achKeySet.has(a.key)) throw new Error(`Duplicate achievement key: ${a.key}`);
    achKeySet.add(a.key);
  }
  await db.achievement.createMany({ data: allAchievements });
  const achievements = await db.achievement.findMany();
  const achByKey = new Map(achievements.map((a) => [a.key, a]));
  // Guard: achievements the demo user earns must exist.
  for (const key of ['first-steps', 'bookworm-10', 'into-the-arena', 'sharp-mind', 'on-fire']) {
    if (!achByKey.has(key)) throw new Error(`Missing demo achievement key: ${key}`);
  }

  // ---------- 8. Demo engagement (Alex + synthetic users) ----------
  console.log('🔥 Demo engagement...');
  const publishedArticles = await db.article.findMany({
    where: { status: 'PUBLISHED' }, orderBy: { views: 'desc' }, take: 400,
    select: { id: true, slug: true, technologyId: true, views: true, difficulty: true, readingTime: true },
  });
  const synthUsers = allUsers.filter((u) => !['SUPER_ADMIN', 'EDITOR', 'AUTHOR'].includes(u.role) && u.id !== demo.id);

  // Reads for demo (28 articles incl. completed) + random synth users
  const demoReads = publishedArticles.slice(0, 120);
  const demoReadSample = demoReads.filter((_, i) => i % 4 === 0).slice(0, 28);
  await db.$transaction(demoReadSample.map((a, i) => db.articleRead.create({
    data: {
      userId: demo.id, articleId: a.id, percent: i < 16 ? 100 : randInt(25, 90),
      completedAt: i < 16 ? daysAgo(randInt(1, 70)) : null,
      createdAt: daysAgo(randInt(1, 80)), updatedAt: daysAgo(randInt(0, 30)),
    },
  })));
  for (const u of synthUsers) {
    const sample = publishedArticles.filter(() => rng() < 0.06).slice(0, 12);
    await db.$transaction(sample.map((a) => db.articleRead.create({
      data: { userId: u.id, articleId: a.id, percent: randInt(30, 100), completedAt: rng() < 0.6 ? daysAgo(randInt(1, 40)) : null },
    })));
  }

  // Bookmarks (demo: 12, synth: 2-5 each) + likes
  const demoBookmarks = publishedArticles.filter((_, i) => i % 7 === 0).slice(0, 12);
  await db.$transaction(demoBookmarks.map((a, i) => db.articleBookmark.create({
    data: { userId: demo.id, articleId: a.id, createdAt: daysAgo(randInt(1, 50)) },
  })));
  const demoLikes = publishedArticles.filter((_, i) => i % 5 === 0).slice(0, 18);
  await db.$transaction(demoLikes.map((a) => db.like.create({
    data: { userId: demo.id, articleId: a.id, createdAt: daysAgo(randInt(1, 60)) },
  })));
  for (const u of synthUsers) {
    const sample = publishedArticles.filter(() => rng() < 0.03).slice(0, 6);
    for (const a of sample) {
      await db.like.create({ data: { userId: u.id, articleId: a.id } }).catch(() => {});
      if (rng() < 0.5) await db.articleBookmark.create({ data: { userId: u.id, articleId: a.id } }).catch(() => {});
    }
  }

  // Notes for demo user
  const noteTargets = publishedArticles.slice(0, 6);
  const noteBodies = [
    { text: 'Reconciliation compares the previous and next element trees depth-first.', note: 'Key sentence for senior interviews — quote this when asked about renders.' },
    { text: 'The event loop processes one macrotask, then drains the entire microtask queue.', note: 'Explain with console.log ordering example.' },
    { text: 'sameSite=lax allows top-level navigation but blocks cross-site POST.', note: 'CSRF answer anchor.' },
    { text: 'structuredClone handles circular references natively.', note: 'Stop using JSON.parse(JSON.stringify(x)).' },
    { text: 'Prefer composition over configuration when designing component APIs.', note: 'Design system review takeaway.' },
    { text: 'Always measure before memoizing.', note: 'Performance review mantra.' },
  ];
  await db.$transaction(noteTargets.map((a, i) => db.note.create({
    data: { userId: demo.id, articleId: a.id, highlightedText: noteBodies[i].text, body: noteBodies[i].note, color: ['violet', 'amber', 'emerald'][i % 3], createdAt: daysAgo(randInt(2, 30)) },
  })));

  // Path enrollment for demo (senior-react path, 60% progress) + 1 synth
  const seniorPath = await db.learningPath.findUnique({ where: { slug: 'senior-react-developer' }, include: { items: { orderBy: { sortOrder: 'asc' } } } });
  const foundationsPath = await db.learningPath.findUnique({ where: { slug: 'modern-javascript-foundations' }, include: { items: true } });
  if (seniorPath) {
    await db.pathEnrollment.create({ data: { userId: demo.id, pathId: seniorPath.id, startedAt: daysAgo(45) } });
    const done = seniorPath.items.slice(0, 7);
    await db.$transaction(done.map((item, i) => db.pathItemProgress.create({
      data: { userId: demo.id, itemId: item.id, completedAt: daysAgo(45 - i * 5) },
    })));
  }
  if (foundationsPath) {
    await db.pathEnrollment.create({ data: { userId: demo.id, pathId: foundationsPath.id, startedAt: daysAgo(70) } });
    const done = foundationsPath.items.slice(0, 8);
    await db.$transaction(done.map((item, i) => db.pathItemProgress.create({
      data: { userId: demo.id, itemId: item.id, completedAt: daysAgo(70 - i * 6) },
    })));
  }
  const synthPath = await db.learningPath.findUnique({ where: { slug: 'typescript-mastery' } });
  if (synthPath && synthUsers[0]) {
    await db.pathEnrollment.create({ data: { userId: synthUsers[0].id, pathId: synthPath.id } });
  }

  // Interview attempts for demo (2 completed, 1 abandoned) + answers
  const questions = await db.interviewQuestion.findMany({
    where: { technology: { slug: { in: ['react', 'javascript', 'typescript'] } }, seniority: { in: ['MID', 'SENIOR'] } },
    take: 60, select: { id: true, topic: true, technologyId: true },
  });
  const reactTechId = techMap.get('react')!.id;
  const jsTechId = techMap.get('javascript')!.id;

  async function seedAttempt(mode: string, techId: string | null, level: string, count: number, score: number, days: number, status = 'COMPLETED') {
    const attempt = await db.interviewAttempt.create({
      data: {
        userId: demo.id, mode, technologyId: techId, level, title: null,
        totalQuestions: count, knownCount: Math.round((score / 100) * count),
        difficultCount: Math.round(((100 - score) / 100) * count * 0.6),
        skippedCount: count - Math.round((score / 100) * count) - Math.round(((100 - score) / 100) * count * 0.6),
        score, durationSeconds: count * randInt(60, 140), status,
        strongTopics: JSON.stringify(score >= 60 ? ['Hooks', 'Rendering', 'State Management'] : ['Fundamentals']),
        weakTopics: JSON.stringify(score >= 60 ? ['Concurrent Rendering', 'Server Components'] : ['Reconciliation', 'Performance']),
        createdAt: daysAgo(days), completedAt: status === 'COMPLETED' ? daysAgo(days) : null,
      },
    });
    const sample = questions.slice(0, count);
    await db.$transaction(sample.map((q, i) => db.interviewAnswer.create({
      data: {
        attemptId: attempt.id, questionId: q.id,
        result: i < Math.round((score / 100) * count) ? 'KNOWN' : i % 2 === 0 ? 'DIFFICULT' : 'SKIPPED',
        secondsSpent: randInt(40, 180), confidence: randInt(2, 5), sortOrder: i,
      },
    })));
    return attempt;
  }
  await seedAttempt('standard', reactTechId, 'SENIOR', 15, 82, 12);
  await seedAttempt('quick', jsTechId, 'MID', 5, 90, 8);
  await seedAttempt('senior', reactTechId, 'SENIOR', 20, 74, 5);
  await seedAttempt('full', null, 'SENIOR', 30, 0, 3, 'ABANDONED');

  // Activities for demo
  const activityTypes = ['READ_ARTICLE', 'COMPLETE_ARTICLE', 'INTERVIEW_ATTEMPT', 'BOOKMARK', 'ACHIEVEMENT', 'PATH_PROGRESS'];
  const activities: { userId: string; type: string; refType: string | null; refId: string | null; title: string; xp: number; createdAt: Date }[] = [];
  for (let i = 0; i < 36; i++) {
    const a = pickOne(publishedArticles.slice(0, 60));
    const type = pickOne(activityTypes);
    activities.push({
      userId: demo.id, type,
      refType: type === 'INTERVIEW_ATTEMPT' ? 'interview' : type === 'ACHIEVEMENT' ? 'achievement' : 'article',
      refId: type === 'INTERVIEW_ATTEMPT' ? null : a.id,
      title: type === 'READ_ARTICLE' ? `Read "${a.slug.replace(/-/g, ' ').slice(0, 48)}"`
        : type === 'COMPLETE_ARTICLE' ? `Completed an article`
        : type === 'INTERVIEW_ATTEMPT' ? 'Completed a React senior session — 82%'
        : type === 'BOOKMARK' ? 'Saved an article to library'
        : type === 'ACHIEVEMENT' ? `Earned "${pickOne(['On Fire', 'Sharp Mind', 'Bookworm'])}"` : 'Advanced in a learning path',
      xp: randInt(5, 40), createdAt: daysAgo(randInt(0, 45), 23),
    });
  }
  await db.userActivity.createMany({ data: activities });

  // Achievements for demo (5 earned) + synth
  const demoAch = ['first-steps', 'bookworm-10', 'into-the-arena', 'sharp-mind', 'on-fire'];
  await db.$transaction(demoAch.map((key, i) => db.userAchievement.create({
    data: { userId: demo.id, achievementId: achByKey.get(key)!.id, earnedAt: daysAgo(40 - i * 7) },
  })));
  await db.userAchievement.create({ data: { userId: synthUsers[0].id, achievementId: achByKey.get('first-steps')!.id } }).catch(() => {});

  // Daily progress: 14 days, challenge completed on 9
  const daily: { userId: string; day: string; articlesRead: number; questionsAnswered: number; challengeCompleted: boolean; xpEarned: number }[] = [];
  for (let d = 13; d >= 0; d--) {
    daily.push({
      userId: demo.id, day: dayKey(new Date(now - d * DAY)),
      articlesRead: randInt(0, 3), questionsAnswered: randInt(0, 12),
      challengeCompleted: d !== 13 && rng() < 0.68, xpEarned: randInt(10, 90),
    });
  }
  await db.dailyProgress.createMany({ data: daily });

  // Notifications for demo
  const notifications = [
    { type: 'achievement', title: 'Achievement unlocked: Sharp Mind', body: 'You scored 80%+ in a senior React session. +150 XP', link: '#/dashboard', read: false, days: 8 },
    { type: 'streak', title: '12-day streak — keep it alive', body: 'Complete today\'s daily challenge to extend the streak.', link: '#/dashboard', read: false, days: 0 },
    { type: 'interview', title: 'Your readiness score improved to 78%', body: 'Weak areas detected in Concurrent Rendering — 3 recommended articles.', link: '#/interview', read: false, days: 5 },
    { type: 'article', title: 'New in React: React Compiler: what automatic memoization changes', body: 'From a technology you follow', link: '#/articles', read: true, days: 11 },
    { type: 'system', title: 'Weekly digest ready', body: 'Your Frontend Daily: 6 new articles, 1 challenge, 20 questions.', link: '#/articles', read: true, days: 14 },
    { type: 'achievement', title: 'Achievement unlocked: On Fire', body: '7-day learning streak maintained. +100 XP', link: '#/dashboard', read: true, days: 20 },
  ];
  await db.$transaction(notifications.map((n) => db.notification.create({
    data: { userId: demo.id, type: n.type, title: n.title, body: n.body, link: n.link, read: n.read, createdAt: daysAgo(n.days) },
  })));

  // Search history (trending + demo user)
  const trending = ['react hooks', 'useeffect cleanup', 'css grid vs flexbox', 'typescript generics', 'server components', 'event loop', 'closure', 'nextjs caching', 'system design interview', 'react 19'];
  await db.$transaction(trending.map((q) => db.searchHistory.create({ data: { query: q, resultsCount: randInt(8, 120), createdAt: daysAgo(randInt(0, 6), 23) } })));
  await db.$transaction(['react reconciliation', 'memo vs usememo', 'abortcontroller', 'aria patterns'].map((q) =>
    db.searchHistory.create({ data: { userId: demo.id, query: q, resultsCount: randInt(5, 40), createdAt: daysAgo(randInt(1, 10)) } })));

  // Comments on popular articles
  console.log('💬 Comments...');
  const commentSeed = [
    'The reconciliation section finally made this click for me. Bookmarked for my senior prep.',
    'Great article. One question: how does this behave differently under StrictMode double-rendering?',
    'I hit exactly this bug last sprint — the common mistakes list is painfully accurate.',
    'Would love a follow-up covering the React Compiler angle on this.',
    'The code example is so much cleaner than the ones in the official docs. Thanks!',
    'Small nit: the second snippet could use the AbortController cleanup for completeness. Otherwise perfect.',
    'Sharing this with my team — we keep debating this in reviews and this settles it.',
    'As someone preparing for interviews, the "interview perspective" section is gold.',
    'This is the clearest explanation I have read on the topic. The mental model framing works.',
    'Bookmarking. The TL;DR bullets are perfect for spaced repetition.',
  ];
  for (let c = 0; c < 28; c++) {
    const a = pickOne(publishedArticles.slice(0, 80));
    const u = pickOne([...synthUsers, ...authors]);
    const parent = await db.comment.create({
      data: { articleId: a.id, userId: u.id, body: pickOne(commentSeed), createdAt: daysAgo(randInt(1, 40)) },
    });
    if (rng() < 0.25) {
      const replyUser = pickOne([...synthUsers, authors[0]]);
      await db.comment.create({
        data: { articleId: a.id, userId: replyUser.id, parentId: parent.id, body: pickOne(['Agreed — we adopted this pattern and incidents dropped to zero.', 'Thanks! StrictMode answer: yes, effects run twice in dev, which surfaces exactly this class of bug.', '+1. The follow-up on measurement is coming next week.']), createdAt: daysAgo(randInt(0, 10)) },
      });
    }
  }

  // ---------- 9. Analytics events ----------
  console.log('📈 Analytics events (90 days)...');
  const events: { type: string; day: string; path: string | null; userId: string | null; ref: string | null; createdAt: Date }[] = [];
  const techSlugs = [...techMap.keys()];
  for (let d = 89; d >= 0; d--) {
    const date = new Date(now - d * DAY);
    const dow = date.getDay();
    const weekend = dow === 0 || dow === 6 ? 0.62 : 1;
    const growth = 1 + (89 - d) / 60;
    const noise = 0.85 + rng() * 0.3;
    const base = Math.floor(26 * growth * weekend * noise);
    const push = (type: string, n: number, pathFn: () => string | null) => {
      for (let i = 0; i < n; i++) {
        events.push({ type, day: dayKey(date), path: pathFn(), userId: rng() < 0.55 ? demo.id : null, ref: null, createdAt: new Date(date.getTime() + randInt(0, 23) * 3600000 + randInt(0, 59) * 60000) });
      }
    };
    push('page_view', base, () => pickOne(['/', '#/articles', '#/technologies', '#/interview', '#/learning-paths', '#/cheatsheets']));
    push('article_view', Math.floor(base * 0.7), () => `#/articles/${pickOne(publishedArticles.slice(0, 100)).slug}`);
    push('search', Math.floor(base * 0.22), () => '#/search');
    push('interview_start', Math.floor(base * 0.14), () => '#/interview');
    push('interview_complete', Math.floor(base * 0.1), () => '#/interview');
    push('bookmark', Math.floor(base * 0.08), () => null);
    if (d % 4 === 0) push('signup', randInt(1, 3), () => '#/login');
  }
  for (let i = 0; i < events.length; i += 400) {
    await db.analyticsEvent.createMany({ data: events.slice(i, i + 400) });
  }
  void techSlugs;

  // ---------- 10. AI conversation sample ----------
  const convo = await db.aIConversation.create({
    data: { userId: demo.id, title: 'React re-renders', context: null },
  });
  await db.aIMessage.createMany({
    data: [
      { conversationId: convo.id, role: 'user', content: 'Why does my component re-render when the parent state changes even though props did not change?', createdAt: daysAgo(6) },
      { conversationId: convo.id, role: 'assistant', content: 'Short answer: a parent re-render re-renders all children by default — props changing is only one trigger. React re-renders a child when the parent renders, unless the child is memoized (React.memo) or its element identity is preserved with stable references. To stop it: memoize the component, pass stable props (useCallback for handlers, stable keys), or move the state down so fewer components re-render. I can point you to "When does a component re-render? The complete answer" and "React memo, useMemo and useCallback — the honest guide" in the library.', createdAt: daysAgo(6) },
    ],
  });

  // ---------- Summary ----------
  const counts = {
    categories: await db.category.count(), technologies: await db.technology.count(),
    users: await db.user.count(), articles: await db.article.count(),
    questions: await db.interviewQuestion.count(), paths: await db.learningPath.count(),
    achievements: await db.achievement.count(), events: await db.analyticsEvent.count(),
    comments: await db.comment.count(), tags: await db.tag.count(),
  };
  console.log('\n✅ Seed complete:');
  console.table(counts);
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => db.$disconnect());
