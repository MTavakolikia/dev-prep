# 09 · Design System — "Calm technical, dark-first"

Original system: inspired by the *discipline* of Linear/Vercel/Stripe (spacing
rhythm, restraint, typography-led hierarchy) — zero copied UI.

## 1. Foundations

### Color (OKLCH token layer, `globals.css`)

| Token | Light | Dark (default) |
|---|---|---|
| background | warm white `oklch(0.985 0.002 270)` | near-black zinc |
| foreground | `oklch(0.18 0.012 270)` | `oklch(0.93 …)` |
| primary / accent | violet `oklch(0.53 0.23 292)` | violet (vivid family) |
| destructive | red 500-family | red 500-family |

Dark mode is a **first-class palette** (not an inversion): surfaces, borders
(`white/α` steps), glow shadows and chart tokens each have dark values.
`.dark` class strategy via `next-themes`; transition suppression to avoid
theme-flicker.

### Semantic color families (12)

`violet (brand) · emerald (success/beginner) · amber (warning/intermediate) ·
rose (error/advanced) · cyan · orange · teal · fuchsia (expert) · lime · sky ·
red · zinc` — each exposing a full token set (`bg/bgSoft/text/border/solid/
ring/gradient/glow`) via `lib/design.ts → tokens(color)`, used for technology
identities, badges, covers and charts.

### Typography & spacing

- System UI sans stack; mono for code (`react-syntax-highlighter`, themed to
  the token palette).
- Scale: `text-sm` body in dense surfaces, `base` reading, display sizes only
  on home/marketing moments. Reading measure capped (~65ch) on article prose.
- Spacing rhythm: cards `p-4/p-6`, grids `gap-4/6`, sections `py-10/16`;
  radius token `--radius 0.5rem` (+sm/xl derivations).

## 2. Component contracts (product layer)

| Component | Contract |
|---|---|
| `ArticleCard` | cover gradient (deterministic by slug), tech dot + level badge, title, excerpt, author, views; hover lift + border accent |
| `TechnologyCard` | icon tile (DynamicIcon + family color), name, article count, difficulty |
| `InterviewQuestionCard` | seniority/category chips, reveal-gated answer, grade actions |
| `ProgressBar` | token-colored fill, label + % (skill graph, paths, readiness) |
| `StatsCard` | icon tile, value, caption; used in dashboard & admin overview |
| `CodeBlock` | language chip, copy button, memoized highlighter |
| `TableOfContents` | sticky "On this page", active-section highlight, anchor scroll |
| `LearningPathCard` | order/step progress, per-item states |
| `CommandPalette` | cmdk: goto + search + trending, keyboard-first |
| `AiPanel` | side overlay, grounded to current view, streaming turn UI |
| Skeletons/Empty states | every async surface; empty states explain + CTA |

## 3. Motion

Framer Motion, 150–300ms, ease-out; hover lifts (`-y-0.5` + glow), reveal
stagger on card grids, palette scale-fade. **`prefers-reduced-motion` honored
globally** (transitions collapse to opacity only).

## 4. Accessibility rules (enforced in review)

- Radix primitives everywhere (focus trap, roving tabindex, aria-wired)
- Landmarks: `header/nav/main/footer`; skip content link; `sr-only` labels on
  icon-only buttons
- Focus-visible rings on every interactive element (token `--ring`)
- Contrast: text tokens ≥ 4.5:1 in both themes (badge pairs validated)
- Touch targets ≥ 44px on mobile; palettes operable fully by keyboard

## 5. Iconography & illustration

Lucide only (`DynamicIcon` maps DB string → icon; unknown falls back safely).
Covers are **procedural gradients** (deterministic from slug hash — no image
dependencies, instant LCP, zero placeholder art).
