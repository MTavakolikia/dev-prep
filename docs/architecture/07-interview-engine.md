# 07 · Interview Engine Architecture

## 1. Concepts

```
InterviewQuestion (bank: 973)
  technology ── seniority: JUNIOR|MID|SENIOR|STAFF
  category: CONCEPTUAL|CODING|DEBUGGING|ARCHITECTURE|SYSTEM_DESIGN|
            BEHAVIORAL|PERFORMANCE|SECURITY|PRACTICAL
  difficulty + expectedMinutes + shortAnswer + detailedAnswer + explanation

SessionMode
  quick(5) · standard(15) · full(30) · random(mixed,12) ·
  senior-frontend(18, seniority≥SENIOR) · staff-frontend(15, ARCHITECTURE/SYSTEM_DESIGN)
```

## 2. Flow (two-phase reveal, honest grading)

```
InterviewPage ──configure(technology × level)──► "Start"
   │ server action: selectQuestions(mode, tech, level)
   │   balanced sampler: stratified by category & difficulty, no repeats
   │   within recent attempts (per user memory)
   ▼
InterviewAttempt {status: IN_PROGRESS}  ── attemptId + question DTOs ──►
   │                                                    client store
   ▼ (immersive route, chrome hidden, one question per screen)
Think ──► Reveal ──► self-grade: KNOWN | DIFFICULT | SKIPPED
   │        (each grade persisted immediately: InterviewAnswer + timing)
   ▼
finishAttempt() [transaction]
   score = weighted(known/difficult/skip, seniority, timing)
   strongTopics / weakTopics per category & technology
   attempt.status = COMPLETED (or ABANDONED with kept progress)
   side-effects via engagement.ts: XP, streak, achievements, notification
   ▼
Results: score ring · per-topic breakdown · weak-area reading list
(deep-linked articles) · unlocked achievements · readiness delta
```

## 3. Component/store split

- `stores/interview.ts` (Zustand) owns **transient runtime only**: queue,
  current index, reveal flag, per-question pending grade. Every grade is
  sent to the server at once — a refresh never loses scored answers; the
  store holds no server-owned data.
- `InterviewSession` view is a pure function of that store + server DTOs —
  timer, progress dots, keyboard shortcuts, exit-intent confirmation dialog
  ("N of M answered; progress is kept; session marked abandoned") are honest
  by construction.

## 3b. Guest access policy

**Browse free, sign in to track.** The question bank and every model answer
are open to anonymous visitors (server action takes an optional user). Anything
that *writes progress* — starting a session, bookmarking, completing the daily
challenge — opens the shared `AuthGateDialog` ("Sign in to track your
progress") with Sign in / Create account CTAs that carry a validated `?next=`
return URL; after authenticating the user lands exactly where they were. The
readiness card renders an honest locked state for guests (never a fake 0%).
The server remains the enforcement boundary — the gate dialog is UX, not
security (`startInterviewAction`/`toggleQuestionBookmarkAction` independently
require a user).

## 4. Question selection algorithm

```
pool = questions where (tech = target OR mode = random)
      and seniority ≤ level ceiling (senior/staff modes raise the floor)
weights: category quota per mode (e.g. staff: ARCHITECTURE/SYSTEM_DESIGN ≥ 50%)
        × difficulty spread (1/2/2/1 beginner→expert-ish curve)
        × novelty penalty (recently seen → down-weight)
sample without replacement → order easiest-first within mixed sets
```

Deterministic given the same user state (seeded shuffle) so results pages and
retries stay explainable.

## 5. Downstream consumers

- **Skill graph:** graded answers update per-technology mastery (articles
  contribute reads; answers contribute weighted scores).
- **Readiness %:** `f(avg score, answered volume, learning consistency)` —
  computed server-side, displayed on `/interview` and dashboard.
- **Recommendations:** `weakTopics` → highest-relevance `interviewRelevant`
  articles → "Targeted reading" rails on results + dashboard.
- **Question bank admin:** authors add/edit questions with model answers; the
  engine consumes them instantly (no deploy step).
