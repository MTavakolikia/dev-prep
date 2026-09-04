# 08 · Recommendation Architecture & AI Architecture

## 1. Recommendation architecture

**Principle: transparent, explainable scoring — no black box, no fake
"AI magic".** Every rail answers "why am I seeing this?" through its title
and source signal.

```
signals (server, per user)
  R1 article reads + completion        (ArticleRead rows)
  R2 graded interview answers          (KNOWN/DIFFICULT per topic)
  R3 bookmarks + notes                 (high-intent interest)
  R4 path enrollment + progress        (declared goals)
  R5 search history                    (explicit curiosity)

scoring (lib/server, deterministic)
  candidate set = published ∩ interviewRelevant ∪ same-technology
  score = 0.35·weakTopicMatch      (R2: DIFFICULT topics boost)
        + 0.20·technologyAffinity  (R1+R3 decayed by recency)
        + 0.15·pathAlignment       (R4: next unread path item's tech)
        + 0.10·searchInterest      (R5, 14-day window)
        + 0.20·qualityPrior        (views/age + difficulty fit to level)
  diversity guard: max 2 per technology per rail; exclude already-read
```

**Rails powered by it**

| Surface | Rail | Primary signal |
|---|---|---|
| Home | "Continue where you left off", trending | R1 recency, global quality |
| Article page | Related articles (same technology/tags) | content graph |
| Interview results | "Targeted reading" for weak topics | R2 |
| Dashboard | Daily challenge, next path item, weak-area queue | R2+R4 |
| Technology page | Deep-dive set (progression by difficulty) | taxonomy |

Future upgrade path: the `scoring` module is the only function to replace
with an embedding-based ranker; rail contracts stay identical.

## 2. AI architecture

```
Client: AiPanel (⌘⇧I overlay) ──turn────► server action ai.ts
                                          │ 'use server' + requireUser
                                          │ provider-agnostic boundary:
                                          │  today: z-ai-web-dev-sdk (server-only)
                                          │  tomorrow: OpenAI/Anthropic/Gemini/local
                                          ▼
                              persistence: AIConversation ── AIMessage
                              (role, content, tokens, model meta)
```

**Product behavior**

- Assistant is **context-aware**: current route (article/question/technology)
  is passed as grounding context, so "explain this simpler" or "give me a
  harder version" refer to what's on screen.
- **AI never writes the product silently:** generated suggestions enter
  editable surfaces (notes, editor drafts) — spec rule "AI content must be
  human-editable" is structural, not a promise.
- **Conversation history** persists per user (`AIConversation`/`AIMessage`),
  rendered in the panel with clear turn ownership.
- **Guardrails:** server-only SDK import (key never reaches the client),
  Zod-validated payloads, friendly degradation when the provider is
  unreachable (honest error toast, retry action — the panel never fakes an
  answer).

**Extensibility:** adding a provider = implementing `complete(messages,
context)` behind `ai.ts`; panel, persistence and guardrails unchanged.
Content-assist hooks in the article editor (outline/draft suggestions) call
the same boundary with editor-specific prompts.
