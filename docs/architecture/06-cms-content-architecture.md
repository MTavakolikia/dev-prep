# 06 · CMS Architecture & Content Architecture

## 1. CMS architecture

**Content Studio** (`#/admin`) — role-gated back office with six surfaces:

| Surface | Capability |
|---|---|
| **Overview** | Real-time platform health: users, views, articles by status, interview sessions, question bank, bookmarks, comments, traffic chart (7d/30d/90d), top-performing articles, articles-per-technology |
| **Articles** | TanStack Table data grid: search, status filter, bulk actions, duplicate, delete, status transitions; opens the **Article Editor** |
| **Questions** | Interview question bank CRUD with seniority/category/technology filters and model answers |
| **Users** | Search, role filter, create, edit (name/email/headline/bio/role), password reset, remove (soft) + restore — "Show removed" toggle (respecting hierarchy: you cannot out-rank yourself) |
| **Taxonomy** | Categories, technologies, tags CRUD with icon/color/difficulty metadata |
| **Settings** | Platform preferences (site identity, feature flags seam) |

**Editorial pipeline:** `DRAFT → IN_REVIEW → SCHEDULED → PUBLISHED →
(ARCHIVED)` with `ArticleRevision` snapshot on every saved change — full
history, rollback-ready, author attribution. The editor scaffold enforces the
11-section structure so every article ships with TL;DR, cheat sheet, SEO
fields and interview linkage (no blank-page problem, no structure drift).

**Write surface:** structured 11-section composer + live preview, slug
auto-generation (`lib/slug`), reading-time computation, SEO title/description/
keywords fields, cover style tokens, tag picker, technology binding,
`interviewRelevant` flag that promotes the article into weak-area
recommendations.

**Analytics as a first-class CMS feature:** `AnalyticsEvent` rows power the
overview (page views, article reads, engagement ratio = bookmarks/views) —
the same event log a future job/ETL would consume; nothing is computed by
eyeballing client state.

## 2. Content architecture

### 2.1 Taxonomy (3 levels)

```
Category (e.g. Languages, Frameworks, Styling, Architecture, Tooling)
   └── Technology (slug, icon, color, difficulty, popularity, related→)
          └── Article (1 technology binding) ──* Tag (many-to-many)
```

41 seeded technologies across 8 categories; `relatedSlugs` powers the "Deep
dive → related technologies" graph on technology pages.

### 2.2 The 11-section article contract

Every article (seeded or hand-written) renders the same skeleton — this is
what makes the reading experience consistent and the extractions possible:

`Introduction → Why it matters → Core concept → Practical example → Code
example → Common mistakes → Best practices → Performance → Interview
perspective → Summary → Related`

Derived/structured fields stored per article:

| Field | Feeds |
|---|---|
| `tldr` (4 bullets) | Article hero block, daily digest |
| `cheatSheet` | `/cheatsheets` index (per-technology quick reference) |
| `interviewRelevant` + linked questions | "Interview questions" sidebar, weak-area reading list |
| `seoTitle/Description/Keywords`, `coverStyle` | OG/Twitter cards, cover gradient |
| `readingTime`, `views`, `status` | Cards, admin analytics, pipeline |

### 2.3 Seed corpus (install = alive platform)

- **Deterministic composer** (`db/seed/generator.ts`): curated topic metadata
  (title, outcome, difficulty, minutes, interview flag, tags) expands into
  full 11-section articles with domain-accurate code snippet pools (JS, TS,
  React, Next, CSS…), unique slugs, realistic authors, view counts and dates.
- **Corpus:** 1,000+ published articles across 8 domains (React, TypeScript,
  JavaScript, Next.js, CSS/HTML, Frontend architecture, Performance, Testing,
  Tooling) + 33 drafts + 973 interview questions + 12 users + 11 learning
  paths + 16 achievements.
- **Batched by design:** seeding is chunked per domain and idempotent
  (unique-slug upserts) — re-running never duplicates; partial imports
  resume cleanly. (Spec: "if you cannot generate all at once, build a robust
  seed architecture" — exactly this.)
- **No lorem ipsum, no repeated filler:** every title/outcome is hand-curated;
  code pools contain real production patterns (debounce, promise pools,
  discriminated unions, retry with jitter…).

### 2.4 Discovery surfaces (all connected)

Trending (popularity+recency) · filtered article index (level/technology/sort/
interview-prep) · search (FTS with ranked scoring + history) · technology
hubs · learning paths · cheatsheets · daily challenge · related-article rails
— every rail links to real filtered views, zero dead ends.
