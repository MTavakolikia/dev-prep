# 04 · Route Map, Component Architecture & State Management

## 1. Route map

Hash routes inside the single exposed entry (`/`); every route maps 1:1 to a
future file-system route (right column):

| Hash route | View module | Future App Router route | Access |
|---|---|---|---|
| `/` | `features/home` | `app/page.tsx` | public |
| `/articles` | `features/articles/articles-page` | `app/articles/page.tsx` | public |
| `/articles/:slug` | `features/articles/article-page` | `app/articles/[slug]/page.tsx` | public |
| `/technologies` | `features/technologies` | `app/technologies/page.tsx` | public |
| `/technologies/:slug` | `features/technologies/technology-page` | `app/technologies/[slug]/page.tsx` | public |
| `/interview` | `features/interview/interview-page` | `app/interview/page.tsx` | public config, session auth-gated |
| `/interview/session?id=` | `features/interview/interview-session` | `app/interview/session/page.tsx` | auth (immersive chrome-less) |
| `/questions` | `features/interview/questions-page` | `app/questions/page.tsx` | public |
| `/learning-paths` | `features/learning/paths-page` | `app/learning-paths/page.tsx` | public |
| `/learning-paths/:slug` | `features/learning/path-page` | `app/learning-paths/[slug]/page.tsx` | public |
| `/dashboard` | `features/dashboard/dashboard-page` | `app/dashboard/page.tsx` | auth |
| `/library` | `features/library/library-page` | `app/library/page.tsx` | auth |
| `/cheatsheets` | `features/cheatsheets` | `app/cheatsheets/page.tsx` | public |
| `/search?q=` | `features/search/search-page` | `app/search/page.tsx` | public |
| `/login`, `/register` | `features/auth/auth-page` | `app/(auth)/…` | public |
| `/admin` (+tabs) | `features/admin/*` | `app/admin/…` | role ≥ AUTHOR (layout) / ≥ ADMIN |
| anything else | `features/not-found` | `app/not-found.tsx` | — |

Router implementation: `src/router/index.tsx` — `useRoute()` (parsed
path/segments/query via `useSyncExternalStore`), `<Link>` (modifier-safe,
scroll-reset, `replace` support), `navigate()`, `useIsActive()`, `buildPath()`.

## 2. Component architecture

Three strict tiers; dependencies only point downward:

```
shell/        DevPrepApp · Header · Footer · CommandPalette · AiPanel
              (composition + global chrome + keyboard shortcuts ⌘K ⌘⇧I /)
──────────────────────────────────────────────────────────────────────
shared/       ArticleCard · TechnologyCard · DynamicIcon · primitives
              (stateless presentation; tokens via lib/design)
ui/           shadcn/ui + Radix (button, dialog, tabs, command, table,
              chart, toast, sheet, …) — zero product knowledge
──────────────────────────────────────────────────────────────────────
features/*    One folder per domain; views compose shared/ui and talk to
              server actions through TanStack Query. Admin is split into
              overview/articles/questions/users/taxonomy/settings +
              article-editor (write surface).
```

Conventions: cards align on a `p-4/p-6 + gap-4/6` rhythm; long lists get
`max-h + overflow-y-auto` with styled scrollbars; every async surface renders
skeletons; empty states explain and offer the next action; dialogs are
client-only mounted (avoids SSR id mismatch).

## 3. State management strategy

**Rule: the server is the source of truth; client stores hold zero server
data.**

| Concern | Owner | Notes |
|---|---|---|
| Server data (articles, questions, stats, notifications…) | **TanStack Query** | `staleTime 60s`, `retry 1`, no refetch-on-focus; invalidation after mutations |
| Session identity | `SessionContext` (on top of Query, key `['session']`) | `whoAmIAction`, `refresh()` invalidates |
| UI preferences & panels | `stores/ui.ts` (Zustand) | commandOpen, mobileNavOpen, aiOpen, authOpen |
| Interview session runtime | `stores/interview.ts` (Zustand) | question queue, reveal flag, per-question results, timing; **transient by design** — each answer is persisted immediately via action, store only mirrors the active step |
| Theme | `next-themes` | class strategy, dark default |

Anti-patterns explicitly banned (and avoided): copying server rows into
Zustand, global loading spinners, prop-drilled fetches, effects that duplicate
Query's cache.

## 4. Keyboard & command surface

- `⌘/Ctrl+K` or `/` → command palette (search + goto, trending searches)
- `⌘/Ctrl+Shift+I` → AI assistant panel
- Palette and AI panel are overlay singletons in `Chrome`, mounted
  client-side only, focus-trapped by Radix `cmdk`/`Dialog`.
