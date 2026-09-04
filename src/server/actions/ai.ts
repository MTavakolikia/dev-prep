'use server';

// ============================================================
// Dev Prep — AI assistant (provider abstraction)
// Provider priority: z-ai-web-dev-sdk (GLM) → heuristic fallback.
// The layer is deliberately swappable: OpenAI/Anthropic/local
// can plug into `generateReply` without touching consumers.
// ============================================================
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export interface AiMessageDTO { role: 'user' | 'assistant'; content: string; createdAt: string }
export interface AiConversationDTO { id: string; title: string; updatedAt: string; messages: AiMessageDTO[] }

interface GenerateContext {
  articleTitle?: string | null;
  technologyName?: string | null;
  history?: { role: string; content: string }[];
}

async function generateReply(userMessage: string, ctx: GenerateContext): Promise<string> {
  // --- Attempt live provider (z-ai SDK, backend only) ---
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    const system = [
      'You are Dev Prep Assistant, an expert senior frontend engineer and interview coach inside a developer learning platform.',
      'Answer concisely with practical, production-grade guidance. Use short paragraphs and bullet lists.',
      'When the user asks for interview questions, include difficulty and a model answer outline.',
      ctx.articleTitle ? `The user is currently reading the article: "${ctx.articleTitle}".` : '',
      ctx.technologyName ? `Topic context: ${ctx.technologyName}.` : '',
    ].filter(Boolean).join(' ');

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: system },
        ...(ctx.history ?? []).slice(-6).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: userMessage },
      ],
    });
    const text = completion.choices?.[0]?.message?.content;
    if (text && text.trim()) return text.trim();
  } catch {
    // fall through to heuristic engine
  }

  // --- Heuristic fallback (deterministic, still genuinely useful) ---
  return heuristicReply(userMessage, ctx);
}

function heuristicReply(message: string, ctx: GenerateContext): string {
  const m = message.toLowerCase();
  const topic = ctx.articleTitle ?? ctx.technologyName ?? 'this topic';

  if (/(interview )?question/.test(m) && /(senior|give|ask)/.test(m)) {
    return [
      `Here is a senior-level question on ${topic}:`,
      '',
      `**Q.** Walk me through how you would diagnose and fix a production performance regression related to ${topic.toLowerCase()}.`,
      '',
      '**What a strong answer covers:**',
      '- Reproduce with real data before touching code (metrics, traces, profile)',
      '- Isolate the layer: rendering, network, database, or algorithmic',
      '- Fix with the smallest blast radius, guarded by a test',
      '- Add a regression guard (budget, lint rule, or monitoring alert)',
      '',
      'Want me to quiz you on this topic instead? Just say "quiz me".',
    ].join('\n');
  }
  if (/quiz me|test me/.test(m)) {
    return [
      `Pop quiz — ${topic}:`,
      '',
      '1. Explain the core mechanism in one sentence.',
      '2. Name two failure modes engineers hit with it.',
      '3. How would you verify your fix actually works?',
      '',
      'Answer in your own words, then check the article\'s "Interview perspective" section for the model answer.',
    ].join('\n');
  }
  if (/learning path|roadmap|become/.test(m)) {
    return [
      'Here is a focused roadmap to **Senior Frontend Developer**:',
      '',
      '1. **Language internals** — closures, event loop, async patterns (2 weeks)',
      '2. **TypeScript** — generics, discriminated unions, schema-first validation (2 weeks)',
      '3. **React in depth** — rendering, hooks, state architecture (3 weeks)',
      '4. **Performance** — Core Web Vitals, profiling, bundle strategy (2 weeks)',
      '5. **Testing** — Testing Library, MSW, Playwright (1.5 weeks)',
      '6. **Architecture & system design** — module boundaries, design rounds (2 weeks)',
      '',
      'The "Become a Senior React Developer" path on Dev Prep follows exactly this sequence with linked articles and interview checkpoints.',
    ].join('\n');
  }
  if (/re-render|re-rendering|rerender/.test(m)) {
    return [
      'A component re-renders when:',
      '',
      '1. Its own state changes (useState/useReducer dispatch)',
      '2. Its parent re-renders (default, unless memoized)',
      '3. Its context value changes',
      '4. An external store it subscribes to changes (useSyncExternalStore)',
      '',
      'Note: props changing is **not** a separate trigger — it is the parent render that causes it. Fix with state colocation first, memoization second. The article "When does a component re-render? The complete answer" covers this in depth.',
    ].join('\n');
  }
  if (/explain|what is|how does/.test(m)) {
    return [
      `**${topic} — the short version:** the concept exists to make a specific trade-off explicit, usually correctness vs speed of delivery or flexibility vs simplicity.`,
      '',
      '- **What it does:** isolates a concern so changes stay local',
      '- **When to reach for it:** when the naive approach breaks under real requirements (scale, team size, change rate)',
      '- **The cost:** one more abstraction to learn and maintain',
      '- **Senior signal:** naming the trade-off beats reciting the definition',
      '',
      'Ask me for a senior interview question on this if you are preparing.',
    ].join('\n');
  }
  return [
    `Here is how I would approach "${message.slice(0, 80)}":`,
    '',
    '1. **Clarify the outcome** — what should be true when this is solved?',
    '2. **Find the smallest experiment** that validates the approach',
    '3. **Measure** before and after, so the decision is data-backed',
    '',
    `For deep detail, the library has full articles on ${ctx.technologyName ?? 'this technology'}. You can also ask me for interview questions, a learning path, or a code review checklist.`,
  ].join('\n');
}

export async function chatWithAiAction(input: {
  conversationId?: string | null;
  message: string;
  articleTitle?: string | null;
  technologyName?: string | null;
}): Promise<{ ok: boolean; conversationId?: string; reply?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Sign in to use the AI assistant' };
  const text = input.message.trim().slice(0, 2000);
  if (!text) return { ok: false, error: 'Message cannot be empty' };

  const history = input.conversationId
    ? await db.aIMessage.findMany({ where: { conversationId: input.conversationId }, orderBy: { createdAt: 'asc' }, select: { role: true, content: true } })
    : [];

  const reply = await generateReply(text, {
    articleTitle: input.articleTitle,
    technologyName: input.technologyName,
    history,
  });

  let conversationId = input.conversationId ?? null;
  if (!conversationId) {
    const convo = await db.aIConversation.create({
      data: { userId: user.id, title: text.slice(0, 48) },
    });
    conversationId = convo.id;
  }
  await db.aIMessage.createMany({
    data: [
      { conversationId, role: 'user', content: text },
      { conversationId, role: 'assistant', content: reply },
    ],
  });
  return { ok: true, conversationId, reply };
}

export async function listAiConversationsAction(): Promise<AiConversationDTO[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const convos = await db.aIConversation.findMany({
    where: { userId: user.id }, orderBy: { updatedAt: 'desc' }, take: 10,
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  return convos.map((c) => ({
    id: c.id, title: c.title, updatedAt: c.updatedAt.toISOString(),
    messages: c.messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content, createdAt: m.createdAt.toISOString() })),
  }));
}
