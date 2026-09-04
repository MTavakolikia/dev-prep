# 10 · Implementation Roadmap — 10 Phases (status of record)

Spec §65 defined the delivery order. Status legend: ✅ shipped · 🟡 partial
(seam exists, depth pending) · ⏳ planned.

| Phase | Scope | Status | Evidence |
|---|---|---|---|
| **1** Architecture · DB · Auth · Design system · Routing · Core layout | ✅ | 31-model schema · session auth + RBAC · token system + shell · hash router · header/footer/palette/AI panel |
| **2** CMS · articles · editor | ✅ | Content Studio (articles/questions/users/taxonomy/settings) · 11-section editor · revisions · publish pipeline |
| **3** Public site · home · search | ✅ | Home (hero, trending, rails) · article index w/ filters · search + history · cheatsheets · technology hubs |
| **4** Interview system | ✅ | 6 modes · immersive session · reveal grading · results · readiness · question bank (973) |
| **5** Learning paths · skill graph · career mode | ✅ | 11 paths + enrollment/progress · per-technology skill graph · seniority ladder (Junior→Staff) |
| **6** Gamification | ✅ | XP/levels (curve in `lib/design`) · 16 achievements · streaks (DailyProgress) · daily challenge · notifications |
| **7** AI features | 🟡 | Context-aware assistant panel + persistence + guardrails; editor co-writing hooks pending |
| **8** Analytics | ✅ | Admin overview: traffic (7/30/90d), top articles, per-technology, engagement ratio · AnalyticsEvent log |
| **9** Testing · security · performance · SEO · a11y | 🟡 | lint clean · security controls shipped (§05) · a11y via Radix/landmarks/rings · TODO: Vitest/RTL/Playwright suites, sitemap endpoint |
| **10** Final polish | 🟡 | Empty/loading/error states, reduced-motion, mobile layouts, honest states verified in browser; remaining: PWA manifest, i18n routing (next-intl installed) |

## Phase 9–10 completion checklist (next increments)

1. **Test suites** — Vitest unit (level math, recommendation scorer, question
   sampler), RTL for interview session & auth flows, Playwright smoke for the
   6 golden paths (already scripted in this repo's verification runs).
2. **SEO artifacts** — dynamic `sitemap.ts`, `robots.ts`, per-view metadata +
   JSON-LD (Article/FAQ/Breadcrumb) once views move to file routes.
3. **PWA** — manifest + service worker (offline reading for saved articles).
4. **i18n** — enable `next-intl` routing (en → fa/de/it/nl), RTL mirror for fa.
5. **Rate limiting** — token bucket at the action boundary (login/register/ai).
6. **Email flows** — verification + password reset (token models + sender
   behind provider seam).

## Definition of Done (per spec §66)

Every feature: real data (no stubs) · loading + empty + error states ·
mobile + desktop · keyboard + a11y · dark + light · honest affordances ·
connected navigation (no orphans) · env-driven config · documented in
`docs/architecture/`.
