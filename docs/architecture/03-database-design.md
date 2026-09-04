# 03 · Database Design — ERD & Prisma Schema

Source of truth: [`prisma/schema.prisma`](../../prisma/schema.prisma) — **31
models**, SQLite dialect (PostgreSQL migration notes in §5).

## 1. ERD (domain-grouped)

```
IDENTITY & ACCESS
┌────────┐ 1    ∞ ┌─────────┐        User.role: USER<AUTHOR<EDITOR<ADMIN<SUPER_ADMIN
│  User  │────────│ Session │        (hierarchy enforced in lib/auth.ts)
└───┬────┘        └─────────┘
    │ 1:∞ (author)  1:∞ (reads/likes/bookmarks/comments/notes)
    ▼
CONTENT
┌──────────┐ ∞  1 ┌───────────┐        ┌──────────┐
│ Category │──────│Technology │───────*│   Tag    │ (via ArticleTag)
└────┬─────┘      └─────┬─────┘        └──────────┘
     │                  │ 1:∞
     │                  ├───────────────────────► InterviewQuestion
     │                  └───────────────────────► LearningPath ── LearningPathItem
     ▼ 1:∞
┌─────────┐ 1:∞ ┌─────────────────┐
│ Article │─────│ ArticleRevision │  (full history; every publish snapshots)
└────┬────┘     └─────────────────┘
     │ 1:∞ Like / Comment (threaded: parentId) / ArticleRead / ArticleBookmark / Note

PRACTICE
┌───────────────────┐ 1:∞ ┌──────────────────┐
│ InterviewAttempt  │─────│ InterviewAnswer  │  KNOWN|DIFFICULT|SKIPPED + timing
└───────────────────┘     └──────────────────┘
QuestionBookmark (user↔question)

GROWTH
User ── PathEnrollment ── PathItemProgress ── (LearningPathItem)
User ── UserAchievement ── Achievement
User ── UserActivity / Notification / DailyProgress (streaks, per-day counts)
User ── SearchHistory / AIConversation ── AIMessage

PLATFORM
Media (uploads, owner) · AnalyticsEvent (typed event log) · Note (article
highlights + personal notes)
```

## 2. Model inventory (31)

`User, Session, Category, Technology, Tag, Article, ArticleRevision, ArticleTag,
InterviewQuestion, InterviewAttempt, InterviewAnswer, LearningPath,
LearningPathItem, PathEnrollment, PathItemProgress, ArticleRead,
ArticleBookmark, QuestionBookmark, Like, Comment, Note, Achievement,
UserAchievement, UserActivity, Notification, DailyProgress, SearchHistory,
AIConversation, AIMessage, Media, AnalyticsEvent`

## 3. Key design rules

- **Soft delete:** `deletedAt` on User (and content where recovery matters);
  all reads filter `deletedAt: null`.
- **Timestamps everywhere:** `createdAt` + `updatedAt` (`@updatedAt`).
- **Enums as string unions** (SQLite): values live in `src/types/index.ts`
  (`Role`, result types, statuses) and are asserted at the action boundary —
  one grep to find every union.
- **JSON payloads as strings** with typed accessors (e.g. `relatedSlugs`,
  question `tags`, path item metadata) — never parsed ad hoc in views.
- **Referential integrity:** every relation carries `onDelete` semantics
  (Cascade for owned rows like sessions/answers; Restrict-by-default for
  content ownership).
- **Indexing:** every FK indexed; `slug @unique` on Article/Technology/
  Category/LearningPath; composite lookups (`userId+articleId`,
  `userId+questionId`, `userId+pathItemId`) are `@@unique` — which doubles as
  an idempotency guard for likes/bookmarks/progress.

## 4. Lifecycle examples

- **Publish article:** status `DRAFT → IN_REVIEW → SCHEDULED → PUBLISHED`;
  each transition writes an `ArticleRevision` (author, diff source, timestamp)
  so history is complete and rollback is possible.
- **Interview attempt:** create `InterviewAttempt(status=IN_PROGRESS)` →
  per-question `InterviewAnswer` rows → finish computes score/strong/weak
  topics → `status=COMPLETED` (or `ABANDONED` with kept progress) →
  engagement side-effects (XP, streak, achievements) in one transaction.
- **Daily streak:** `DailyProgress` upsert by `(userId, day)`; streak math
  reads yesterday's row — no timezone-fragile date arithmetic.

## 5. PostgreSQL migration notes

1. `provider = "postgresql"`; convert `String @default("[]")` JSON fields to
   `Json`, string unions to native `enum`.
2. `@@unique` composites stay; add `@@index([status, publishedAt])` for the
   public listing sort (already modelled where SQLite benefits).
3. `db push` (dev) → generate first `migrations/` baseline → CI gate
   `prisma migrate diff` to prevent drift.
