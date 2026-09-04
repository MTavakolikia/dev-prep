# 02 · Technical Architecture & Folder Structure

## 1. Stack (as built)

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 16, App Router, React 19, TypeScript 5 (strict)** | Non-negotiable baseline; RSC-ready even though the sandbox runs the SPA composition client-side |
| Styling | **Tailwind CSS 4** + CSS custom-property token layer (OKLCH) | Dark-first token system in `globals.css`; utility speed with design discipline |
| UI kit | **shadcn/ui (New York)** on Radix primitives + Lucide icons | Accessible, composable, ownable — all 40+ components vendored in `src/components/ui` |
| Motion | Framer Motion (prefers-reduced-motion respected) | Purposeful transitions only |
| Server state | **TanStack Query v5** | Caching, invalidation, retry, staleTime discipline |
| Client state | **Zustand v5** | Only UI preferences + interview session runtime — never server data |
| Forms | React Hook Form + **Zod v4** | Zod schemas are the single validation language (client + server) |
| Data | **Prisma ORM + SQLite** (PostgreSQL-ready) | 31-model normalized schema; swap = provider change |
| Charts | Recharts | Admin analytics (traffic, per-technology) |
| Tables | TanStack Table | Admin articles/users data grids |
| AI | `z-ai-web-dev-sdk` **server-side only** | Provider-agnostic action boundary |

## 2. Architecture style — feature-sliced SPA over RSC-ready seams

```
            ┌───────────────────────── app/ (Next.js) ─────────────────────────┐
            │  layout.tsx  page.tsx  globals.css   (single exposed entry)      │
            └──────────────────────────────┬───────────────────────────────────┘
                                           │ renders
            ┌──────────────────────────────▼───────────────────────────────────┐
            │  DevPrepApp = Providers → Chrome(Header/Footer/CommandPalette/  │
            │               AiPanel) → Outlet(hash route → feature view)       │
            └──────────────────────────────┬───────────────────────────────────┘
       TanStack Query                      │                        Zustand
   ┌───────────────────────────┐           │              ┌───────────────────┐
   │ features/* (views)        │───────────┼──────────────│ stores/ui (panels)│
   │ server-state via useQuery │  actions  │              │ stores/interview  │
   └───────────────┬───────────┘           │              └───────────────────┘
                   │                       ▼
   ┌───────────────▼───────────────────────────────────────────────────────┐
   │ server/actions/*  ('use server' action boundary — auth, content,      │
   │ interview, learning, ai, admin)  ·  validation: Zod · RBAC: lib/auth  │
   └───────────────────────────────┬───────────────────────────────────────┘
                                   │ Prisma
                       ┌───────────▼────────────┐
                       │ SQLite (Postgres-ready)│
                       └────────────────────────┘
```

**Why a hash router inside `/`?** The sandbox exposes exactly one HTTP route.
Instead of faking navigation or dropping pages, `src/router/index.tsx` is a
1.5 kB typed router (path/segments/query, `Link`, `useIsActive`,
programmatic `navigate`) whose routes map 1:1 to future file routes. Deep
links, back/forward and query strings all work; migration is mechanical
(swap `Link` → `next/link`, move views to `app/<segment>/page.tsx`).

**RSC-readiness:** server actions are pure server modules (`'use server'`,
`server-only` guards); views consume them through TanStack Query so moving a
view to a Server Component only changes the data-fetching call site.

## 3. Folder structure (domain-driven)

```
src/
├─ app/                      # Next.js entry (layout, page, globals.css, api/)
├─ components/
│  ├─ ui/                    # shadcn/ui primitives (vendored, ownable)
│  ├─ shared/                # cross-feature presentational: ArticleCard,
│  │                         #   DynamicIcon, design primitives
│  └─ shell/                 # DevPrepApp, Header, Footer, CommandPalette, AiPanel
├─ features/                 # one folder per product domain (views only)
│  ├─ home/ articles/ technologies/ interview/ learning/
│  ├─ dashboard/ library/ cheatsheets/ search/ auth/ admin/
│  └─ not-found.tsx
├─ server/
│  ├─ actions/               # 'use server' boundary: auth, content, interview,
│  │                         #   learning, ai, admin
│  ├─ engagement.ts          # xp/streak/achievement side-effects
│  └─ mappers.ts             # row → DTO mapping (no raw Prisma types out)
├─ lib/                      # auth (session+RBAC), db (Prisma singleton),
│                            #   design (tokens/labels/XP math), slug, utils
├─ stores/                   # zustand: ui (panels) · interview (session runtime)
├─ hooks/                    # use-mobile, use-toast
├─ providers/                # QueryClient + ThemeProvider + SessionContext
├─ types/                    # Role hierarchy, SessionUser, domain unions
├─ router/                   # hash router (Link, navigate, useRoute)
└─ db/seed/                  # deterministic composer + curated topic corpus
   ├─ seed.ts generator.ts
   └─ data/ (taxonomy, topics-react/ts/js/next/css-html/frontend/other, paths)
prisma/schema.prisma         # 31 models — source of truth
db/custom.db                 # SQLite database file
docs/architecture/           # this documentation set
```

**Dependency rule:** `features → (components, stores, router, lib, actions)`;
`actions → lib/db + server/*`; nothing imports upward; `components/ui` knows
nothing about the product.

## 4. Cross-cutting decisions

- **Error handling:** actions throw typed sentinels (`UNAUTHORIZED`,
  `FORBIDDEN`, `NOT_FOUND`); views translate to empty/error states with
  recovery actions — no silent failures, no raw stack traces in UI.
- **Performance:** server-side pagination + filtering per query; client
  caching via `staleTime`; code-block rendering isolated in a memoized
  component; skeletons for every async surface.
- **A11y:** Radix primitives, semantic landmarks, focus rings, keyboard
  shortcuts (`⌘K`, `⌘⇧I`, `/`), 44px touch targets, `sr-only` labels.
- **Security:** env-only secrets (`ADMIN_EMAIL/PASSWORD` read by seed only from
  env), scrypt password hashing, httpOnly session cookies, RBAC on every
  mutating action, Zod validation at the boundary.
