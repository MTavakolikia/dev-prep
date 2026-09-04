# 01 · Product Architecture

## 1. Vision

Dev Prep is not "another blog". It is a **Developer Operating System**: one
product that closes the loop between *learning → practicing → assessing →
interview readiness → career progression → continuous learning*. Content
(articles) is the fuel; the interview engine, skill graph, and gamification are
the engines that turn reading into measurable growth.

**Positioning:** the platform a frontend developer keeps open in a browser tab
from their first `useState` question to their Staff-level system-design loop.

## 2. Personas

| Persona | Goal | Primary surfaces |
|---|---|---|
| **Learner (Junior)** | Understand concepts, build fundamentals | Articles, Learning Paths, Cheat Sheets |
| **Job seeker (Mid)** | Pass screening loops | Interview simulator, Question bank, Readiness score |
| **Senior/Staff** | Fill gaps, prep for promotion loops | Senior/Staff modes, System-design questions, Skill graph |
| **Author/Editor** | Publish quality content | CMS: article editor, revisions, taxonomy, scheduling |
| **Admin** | Operate the platform | Admin analytics, users, roles, question bank, settings |

## 3. Domain map

```
┌────────────────────────────── Dev Prep ──────────────────────────────┐
│                                                                      │
│  CONTENT DOMAIN            PRACTICE DOMAIN         GROWTH DOMAIN     │
│  ───────────────           ─────────────────       ──────────────    │
│  · Articles (11-section)   · Interview engine      · XP / levels     │
│  · Revisions (history)     · Question bank (973)   · Achievements    │
│  · Taxonomy:               · Sessions & attempts   · Streaks         │
│    Category → Technology   · Self-graded reveal    · Daily progress  │
│    → Tag                   · Weak-area detection   · Notifications   │
│  · Search (FTS)            · Cheat sheets          · Activity feed   │
│  · Library (bookmarks,     · Daily challenge                         │
│    notes, highlights)                                                │
│                                                                      │
│  PLATFORM SERVICES: Auth+RBAC · AI assistant · Media · Analytics      │
└──────────────────────────────────────────────────────────────────────┘
```

The three domains reinforce each other: reading an article feeds the skill
graph; interview answers feed the skill graph **and** recommend articles
("weak areas → targeted reading"); finishing paths/challenges awards XP that
unlocks achievements, which produce notifications that pull users back.

## 4. Career progression model

`Junior → Mid → Senior → Staff` is a first-class axis, not a label:

- Every interview question carries a `seniority` (JUNIOR/MID/SENIOR/STAFF).
- Every session mode targets a level (including dedicated *Senior Frontend* and
  *Staff Frontend* loops).
- **Interview Readiness** (0–100%) is computed per user from session scores,
  question volume, and learning consistency — surfaced on `/interview` and the
  dashboard.
- The **skill graph** (per-technology %) gives each persona an honest map of
  where they stand per technology, derived from completed articles + graded
  answers (never fabricated progress).

## 5. User journeys (golden paths)

1. **Anonymous discovery** — Landing hero → *Start Learning* → articles →
   article page (TL;DR, TOC, interview questions) → register → save/bookmark.
2. **Interview prep** — `/interview` → configure (technology × level) →
   Quick/Standard/Full/Random/Senior/Staff loop → reveal → honest self-grade →
   results (score, strong/weak topics) → recommended reading for weak areas.
3. **Daily habit** — dashboard → daily challenge → streak/xp delta →
   achievements unlocked → notification digest.
4. **Authoring** — admin login → Content Studio → new article (11-section
   scaffold) → draft → preview → publish → revision history.

## 6. Content quality contract

Every published article follows the 11-section structure (Introduction → Why
it matters → Core concept → Practical example → Code example → Common
mistakes → Best practices → Performance → Interview perspective → Summary →
Related). The composer (`src/db/seed/generator.ts`) and the article page
renderer both enforce/consume this contract, which is what makes TL;DR, Cheat
Sheet, TOC and "Interview perspective" derivable instead of decorative.

## 7. Non-negotiable product rules (enforced in code)

- No fake affordances: every button navigates, submits, or is honestly
  disabled with a reason (e.g. admin gate explains the required role).
- Server is the source of truth; client stores never duplicate it.
- Grading is honest self-assessment — the UI says so explicitly.
- Unimplemented capability → clean abstraction + TODO, never a stub that lies.
