# Dev Prep — Architecture Documentation

> **Dev Prep — The Developer Operating System.** A production-grade SaaS CMS +
> developer education & interview-preparation platform, built frontend-first.
>
> This documentation set satisfies §64 of the product specification: the 17
> pre-implementation deliverables. Every document describes the system **as
> built** (documentation of record), including deliberate deviations and their
> migration paths.

## The 17 deliverables — index

| # | Deliverable | Document |
|---|-------------|----------|
| 1 | Product architecture | [01-product-architecture.md](./01-product-architecture.md) |
| 2 | Technical architecture | [02-technical-architecture.md](./02-technical-architecture.md) |
| 3 | Folder structure | [02-technical-architecture.md §3](./02-technical-architecture.md) |
| 4 | Database ERD | [03-database-design.md](./03-database-design.md) |
| 5 | Prisma schema | [03-database-design.md](./03-database-design.md) · living schema at `prisma/schema.prisma` |
| 6 | Route map | [04-routing-components-state.md §1](./04-routing-components-state.md) |
| 7 | Component architecture | [04-routing-components-state.md §2](./04-routing-components-state.md) |
| 8 | State management strategy | [04-routing-components-state.md §3](./04-routing-components-state.md) |
| 9 | API / Server Action strategy | [05-api-auth-security.md §1](./05-api-auth-security.md) |
| 10 | Authentication architecture | [05-api-auth-security.md §2](./05-api-auth-security.md) |
| 11 | CMS architecture | [06-cms-content-architecture.md §1](./06-cms-content-architecture.md) |
| 12 | Content architecture | [06-cms-content-architecture.md §2](./06-cms-content-architecture.md) |
| 13 | Interview engine architecture | [07-interview-engine.md](./07-interview-engine.md) |
| 14 | Recommendation architecture | [08-recommendation-ai.md §1](./08-recommendation-ai.md) |
| 15 | AI architecture | [08-recommendation-ai.md §2](./08-recommendation-ai.md) |
| 16 | Design system | [09-design-system.md](./09-design-system.md) |
| 17 | Implementation roadmap | [10-implementation-roadmap.md](./10-implementation-roadmap.md) |

## Deliberate environment adaptations (with migration paths)

The product targets PostgreSQL + a multi-route Next.js deployment. The current
execution environment is a single-port sandbox with SQLite. All adaptations are
behind seams designed for swap, none leak into product logic:

| Spec target | As built here | Migration path |
|---|---|---|
| PostgreSQL + Prisma | SQLite + Prisma (31 models, same relations/indexes) | Change `datasource` provider, swap scalar types per [03-database-design.md](./03-database-design.md), `db push` |
| App Router multi-route (`/articles/[slug]`, …) | Single exposed route + typed hash router (`src/router`); every view maps 1:1 to a future file route | Convert each feature view in the outlet into `app/<segment>/page.tsx`; `Link` swaps to `next/link` |
| Auth.js / Better Auth / Clerk | First-party session auth (scrypt + DB session tokens + RBAC hierarchy) — chosen as the optimal decision for full control & zero external dependency | The `SessionUser`/`hasRole` seam in `src/lib/auth.ts` is provider-agnostic; swap token issuance, keep RBAC |
| Meilisearch/Typesense/Algolia | FTS over SQLite (LIKE + ranked scoring) behind `searchContent()` | Replace the search service body; call sites unchanged |
| OpenAI/Anthropic/Gemini/local LLM | `z-ai-web-dev-sdk` server-side behind an action boundary (`server/actions/ai.ts`) | Replace provider inside the action; UI contract unchanged |

## Source of truth

- Schema: `prisma/schema.prisma` (31 models)
- Domain logic: `src/server/actions/*.ts` (6 action modules)
- Client runtime: `src/features/*`, `src/components/shell/*`, `src/stores/*`
- Seed system: `src/db/seed/*` (batched, deterministic composer)
