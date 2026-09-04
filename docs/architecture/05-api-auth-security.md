# 05 · API / Server Action Strategy, Authentication & Security

## 1. API / Server Action strategy

**Decision: Server Actions are the primary RPC layer; Route Handlers exist only
for what HTTP uniquely provides.**

```
src/server/actions/
├─ auth.ts        register · login · logout · whoAmI · updateProfile
├─ content.ts     listArticles(filtered/paginated) · getArticle · toggleBookmark
│                 · toggleLike · addComment · recordRead · saveNote · search
├─ interview.ts   getSessionQuestions(mode, tech, level) · submitAnswer
│                 · finishAttempt · dailyChallenge · readiness
├─ learning.ts    paths · enroll · progress · dashboardAggregates · skillGraph
├─ ai.ts          assistantTurn (server-only SDK call, provider-agnostic)
└─ admin.ts       article CRUD + publish pipeline · question CRUD · user management (create / edit / roles / password reset / remove + restore)
                  · taxonomy CRUD · analytics aggregates
```

**Action contract (every mutating action):**

1. `requireUser()` / `requireRole(min)` — throws `UNAUTHORIZED`/`FORBIDDEN`.
2. Zod-parse all inputs at the boundary; never trust client shapes.
3. Single Prisma transaction for multi-row invariants.
4. Side-effects (XP, streak, achievements, notifications) centralized in
   `server/engagement.ts` so no action can forget gamification or double-award.
5. Return plain DTOs via `server/mappers.ts` — Prisma types never cross the
   boundary; Date/Decimal serialized deliberately.
6. Errors: typed sentinel strings; client maps them to toasts/inline states.

**Route Handlers (`app/api`)** are reserved for: health check, future webhooks
and streaming — anything needing raw HTTP semantics. This keeps CSRF surface
minimal (actions are origin-checked by the framework) and types end-to-end.

**Caching & invalidation:** Query keys are hierarchical
(`['session']`, `['articles', filters]`, `['dashboard']`); mutations invalidate
the narrowest key; admin analytics reads run on demand with `30d/7d/90d` range
params — no stale dashboards.

## 2. Authentication architecture

**Chosen option: first-party session auth** (of the spec's Auth.js / Better
Auth / Clerk menu) — full control, zero external dependency, trivially
replaceable because all consumers depend on the `SessionUser` + `hasRole`
seam, not on the provider.

```
login ──► scrypt.verify ──► Session{token: 32B-hex, expiresAt: +30d} ──► DB
              │                                                        │
              └──► cookie df_session (httpOnly, sameSite=lax,          │
                   secure in prod, path=/)                             │
                                                                       ▼
request ──► getCurrentUser() [React cache per request] ──► SessionUser DTO
              │ expired/missing/deleted → null (anonymous)
              └──► RBAC: ROLE_ORDER[USER<AUTHOR<EDITOR<ADMIN<SUPER_ADMIN]
```

- **Passwords:** `scrypt` (N=16384 default, 64-byte key, 16-byte salt,
  per-user), verification via `timingSafeEqual` — no bcrypt/argon native deps,
  no plaintext anywhere, reset-ready (token table addition is one model).
- **Sessions:** opaque server-side tokens (not JWT) → instant revocation,
  no secret rotation headaches; expiry checked on every read; logout deletes
  row + cookie.
- **Bootstrap admin:** credentials come **only** from env
  (`ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_NAME`), consumed by the seed — enforced
  by `.env.example` documentation and Zod env validation at startup.
- **OAuth (Google/GitHub):** buttons present in the auth surface with honest
  disabled/unavailable state until provider credentials exist in env — the
  auth page and session model already carry the external-identity seam.

## 3. RBAC matrix

| Capability | USER | AUTHOR | EDITOR | ADMIN | SUPER_ADMIN |
|---|---|---|---|---|---|
| Read/bookmark/like/comment/note | ✓ | ✓ | ✓ | ✓ | ✓ |
| Interview sessions, paths, dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create/edit **own** articles (drafts, revisions) | | ✓ | ✓ | ✓ | ✓ |
| Publish/ archive **any** article | | | ✓ | ✓ | ✓ |
| Taxonomy + question bank management | | | ✓ | ✓ | ✓ |
| User role management, platform settings, analytics | | | | ✓ | ✓ |
| Role grant to SUPER_ADMIN / destructive ops | | | | | ✓ |

Enforcement is server-side in every action (`requireRole`); the UI gates
(`/admin` panel) are UX mirrors, never the security boundary.

## 4. Security checklist (as implemented)

- ✅ httpOnly + SameSite=Lax + Secure(prod) session cookie; opaque tokens
- ✅ scrypt password hashing; timing-safe comparison
- ✅ Zod validation on every action boundary; parameterized Prisma queries (no
  raw SQL string interpolation)
- ✅ RBAC on every mutating action; admin UI mirrors (not relies on) it
- ✅ Secrets only via env; `.env.example` documents every variable; no keys in
  repo, no client-side `NEXT_PUBLIC_` leakage of sensitive values
- ✅ AI SDK invoked exclusively server-side
- ✅ React auto-escaping everywhere (no `dangerouslySetInnerHTML` for
  user-generated content; seeded article HTML is build-time trusted corpus)
- ✅ Soft delete + audit trails (revisions, activity) for forensic recovery
- ⏳ Rate limiting: clean seam at the action boundary (TODO: token bucket per
  IP+action for login/register/ai in multi-tenant deployment)
