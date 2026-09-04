// ============================================================
// Dev Prep seed — article & interview-question composer
// Turns curated topic metadata into structured, realistic
// technical articles (HTML) and interview questions.
// ============================================================

import type { SeedTopic } from './data/topic-types';

export interface GeneratedArticle {
  title: string; slug: string; excerpt: string; content: string; plainText: string;
  difficulty: string; readingTime: number; interviewRelevant: boolean;
  tldr: string; cheatSheet: string; tags: string;
  seoTitle: string; seoDescription: string; seoKeywords: string; coverStyle: string;
}

export interface GeneratedQuestion {
  question: string; shortAnswer: string; detailedAnswer: string; explanation: string;
  topic: string; category: string; difficulty: string; seniority: string;
  expectedMinutes: number; tags: string;
}

// ---------------- deterministic helpers ----------------
function hash(n: number, mod: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return Math.abs(Math.floor((x - Math.floor(x)) * mod)) % mod;
}
const pick = <A,>(arr: A[], seed: number): A => arr[hash(seed, arr.length) % arr.length];

export function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[’'"`,:()&?!]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// ---------------- code snippet pools ----------------
const CODE_POOLS: Record<string, string[]> = {
  javascript: [
    `// Debounce: run fn only after quiet period\nfunction debounce(fn, wait = 300) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), wait);\n  };\n}\n\nconst onSearch = debounce((q) => fetchResults(q), 250);`,
    `// Closure counter with private state\nfunction createCounter() {\n  let count = 0;\n  return {\n    increment: () => ++count,\n    value: () => count,\n  };\n}\n\nconst counter = createCounter();\ncounter.increment();\nconsole.log(counter.value()); // 1`,
    `// Promise pool with bounded concurrency\nasync function runPool(tasks, limit = 4) {\n  const results = [];\n  const executing = new Set();\n  for (const task of tasks) {\n    const p = task().then((r) => {\n      executing.delete(p);\n      return r;\n    });\n    executing.add(p);\n    results.push(p);\n    if (executing.size >= limit) await Promise.race(executing);\n  }\n  return Promise.all(results);\n}`,
    `// Event delegation on a dynamic list\ndocument.querySelector('#todos')?.addEventListener('click', (e) => {\n  const btn = e.target.closest('button[data-action]');\n  if (!btn) return;\n  const id = btn.closest('li')?.dataset.id;\n  if (btn.dataset.action === 'delete' && id) removeTodo(id);\n});`,
    `// Group array items by key\nfunction groupBy(list, keyFn) {\n  return list.reduce((acc, item) => {\n    const key = keyFn(item);\n    (acc[key] ??= []).push(item);\n    return acc;\n  }, {});\n}\n\nconst byStatus = groupBy(orders, (o) => o.status);`,
    `// Retry with exponential backoff + jitter\nasync function retry(fn, { retries = 3, base = 300 } = {}) {\n  for (let i = 0; i <= retries; i++) {\n    try { return await fn(); }\n    catch (err) {\n      if (i === retries) throw err;\n      const delay = base * 2 ** i + Math.random() * 100;\n      await new Promise((r) => setTimeout(r, delay));\n    }\n  }\n}`,
  ],
  typescript: [
    `// Discriminated unions kill impossible states\ntype Result<T> =\n  | { ok: true; value: T }\n  | { ok: false; error: string };\n\nfunction handle(res: Result<number>) {\n  if (res.ok) console.log(res.value); // narrowed\n  else console.error(res.error);      // narrowed\n}`,
    `// Generic repository with constraints\ntype Identifiable = { id: string };\n\nclass Repository<T extends Identifiable> {\n  private items = new Map<string, T>();\n  save(item: T): T { this.items.set(item.id, item); return item; }\n  find(id: string): T | undefined { return this.items.get(id); }\n}`,
    `// Utility types composed from mapped types\ntype DeepPartial<T> = T extends object\n  ? { [K in keyof T]?: DeepPartial<T[K]> }\n  : T;\n\ntype UserPatch = DeepPartial<{ name: string; address: { city: string } }>;`,
    `// Type guard with predicate\ninterface Cat { meow(): void }\ninterface Dog { bark(): void }\n\nfunction isCat(pet: Cat | Dog): pet is Cat {\n  return 'meow' in pet;\n}\n\nconst pet: Cat | Dog = getPet();\nif (isCat(pet)) pet.meow();`,
    `// Satisfies keeps literal inference AND checking\nconst routes = {\n  home: '/',\n  article: (slug: string) => \`/articles/\${slug}\`,\n} satisfies Record<string, string | ((...args: any[]) => string)>;`,
    `// Exhaustive switch with never\ntype Shape =\n  | { kind: 'circle'; r: number }\n  | { kind: 'rect'; w: number; h: number };\n\nfunction area(s: Shape): number {\n  switch (s.kind) {\n    case 'circle': return Math.PI * s.r ** 2;\n    case 'rect': return s.w * s.h;\n    default: {\n      const _never: never = s;\n      return _never;\n    }\n  }\n}`,
  ],
  react: [
    `// Custom hook: debounced value\nfunction useDebounced<T>(value: T, delay = 300): T {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const t = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(t);\n  }, [value, delay]);\n  return debounced;\n}`,
    `// Correct async fetch with cancellation\nfunction useUser(id: string) {\n  const [user, setUser] = useState<User | null>(null);\n  useEffect(() => {\n    const ac = new AbortController();\n    fetch(\`/api/users/\${id}\`, { signal: ac.signal })\n      .then((r) => r.json())\n      .then(setUser)\n      .catch((e) => { if (e.name !== 'AbortError') throw e; });\n    return () => ac.abort();\n  }, [id]);\n  return user;\n}`,
    `// Compound component with context\nconst TabsCtx = createContext<{ active: string; setActive: (v: string) => void } | null>(null);\n\nexport function Tabs({ value, onChange, children }: TabsProps) {\n  return (\n    <TabsCtx.Provider value={{ active: value, setActive: onChange }}>\n      <div role="tablist">{children}</div>\n    </TabsCtx.Provider>\n  );\n}`,
    `// Reducer for predictable state transitions\ntype State = { items: string[]; loading: boolean };\ntype Action =\n  | { type: 'start' }\n  | { type: 'done'; items: string[] };\n\nfunction reducer(state: State, action: Action): State {\n  switch (action.type) {\n    case 'start': return { ...state, loading: true };\n    case 'done': return { items: action.items, loading: false };\n  }\n}`,
    `// Memoize the expensive list — measured, not guessed\nconst Row = memo(function Row({ item, onPick }: RowProps) {\n  return <li onClick={() => onPick(item.id)}>{item.label}</li>;\n});\n\nfunction List({ items, onPick }: ListProps) {\n  return <ul>{items.map((i) => <Row key={i.id} item={i} onPick={onPick} />)}</ul>;\n}`,
    `// Error boundary as a component class\nexport class FeatureErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {\n  state = { error: undefined as Error | undefined };\n  static getDerivedStateFromError(error: Error) { return { error }; }\n  render() {\n    if (this.state.error) return <FallbackUI retry={() => this.setState({ error: undefined })} />;\n    return this.props.children;\n  }\n}`,
  ],
  nextjs: [
    `// Server Component: fetch directly, no effects\nexport default async function Page({ params }: { params: Promise<{ slug: string }> }) {\n  const { slug } = await params;\n  const article = await db.article.findUnique({ where: { slug } });\n  if (!article) notFound();\n  return <ArticleView article={article} />;\n}`,
    `// Server Action with validation + revalidation\n'use server';\n\nexport async function createComment(formData: FormData) {\n  const parsed = commentSchema.safeParse({\n    body: formData.get('body'),\n    articleId: formData.get('articleId'),\n  });\n  if (!parsed.success) return { error: 'Invalid comment' };\n  await db.comment.create({ data: { ...parsed.data, userId: getSessionUser().id } });\n  revalidatePath('/articles');\n  return { ok: true };\n}`,
    `// Metadata per route, including OG image\nexport async function generateMetadata({ params }): Promise<Metadata> {\n  const { slug } = await params;\n  const post = await getPost(slug);\n  return {\n    title: post.title,\n    description: post.excerpt,\n    alternates: { canonical: \`/articles/\${slug}\` },\n    openGraph: { images: [\`/og/\${slug}\`] },\n  };\n}`,
    `// Stream slow sections with Suspense\nexport default function Dashboard() {\n  return (\n    <>\n      <HeaderStats />\n      <Suspense fallback={<ChartSkeleton />}>\n        <AsyncRevenueChart />\n      </Suspense>\n    </>\n  );\n}`,
    `// Middleware gate for authenticated areas\nexport function middleware(req: NextRequest) {\n  const token = req.cookies.get('session')?.value;\n  if (!token && req.nextUrl.pathname.startsWith('/dashboard')) {\n    return NextResponse.redirect(new URL('/login', req.url));\n  }\n  return NextResponse.next();\n}`,
    `// Cached data layer with tags\nexport const getTrendingArticles = async () => {\n  'use cache';\n  return db.article.findMany({\n    where: { status: 'PUBLISHED' },\n    orderBy: { views: 'desc' }, take: 8,\n  });\n};`,
  ],
  css: [
    `/* Fluid card grid — zero media queries */\n.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));\n  gap: clamp(1rem, 2.5vw, 2rem);\n}`,
    `/* Component-scoped container queries */\n.card-wrap { container-type: inline-size; }\n\n@container (min-width: 420px) {\n  .card { display: grid; grid-template-columns: 120px 1fr; }\n}`,
    `/* Accessible focus ring that looks designed */\n.button:focus-visible {\n  outline: 2px solid var(--ring);\n  outline-offset: 2px;\n}\n.button:focus:not(:focus-visible) { outline: none; }`,
    `/* Token-based theming with cascade layers */\n@layer tokens {\n  :root {\n    --bg: oklch(98% 0.005 270);\n    --fg: oklch(22% 0.02 270);\n  }\n  @media (prefers-color-scheme: dark) {\n    :root { --bg: oklch(16% 0.015 270); --fg: oklch(93% 0.01 270); }\n  }\n}`,
    `/* Sticky header with scroll margin anchors */\n.header { position: sticky; top: 0; z-index: 40; backdrop-filter: blur(8px); }\nsection[id] { scroll-margin-top: 5rem; }`,
    `/* Line clamping long text */\n.title {\n  display: -webkit-box;\n  -webkit-box-orient: vertical;\n  -webkit-line-clamp: 2;\n  overflow: hidden;\n}`,
  ],
  html: [
    `<!-- Semantic article structure -->\n<article>\n  <header>\n    <h1>Understanding the event loop</h1>\n    <time datetime="2026-03-14">Mar 14, 2026</time>\n  </header>\n  <p>First paragraph…</p>\n  <footer><address rel="author">By Dana Kim</address></footer>\n</article>`,
    `<!-- Native disclosure without JavaScript -->\n<details class="faq">\n  <summary>What is the difference between let and var?</summary>\n  <p>let is block-scoped and lives in the temporal dead zone…</p>\n</details>`,
    `<!-- Accessible form with hints and errors -->\n<form>\n  <label for="email">Email\n    <input id="email" name="email" type="email" required\n           aria-describedby="email-hint email-error" autocomplete="email">\n  </label>\n  <p id="email-hint">We never share your email.</p>\n  <p id="email-error" role="alert" hidden>Please enter a valid email.</p>\n</form>`,
    `<!-- Responsive image with art direction -->\n<picture>\n  <source media="(max-width: 600px)" srcset="hero-narrow.avif" type="image/avif">\n  <source srcset="hero-wide.avif" type="image/avif">\n  <img src="hero-wide.jpg" alt="Team celebrating a release" width="1200" height="630" loading="lazy">\n</picture>`,
    `<!-- Native dialog with focus management -->\n<button onclick="deleteDialog.showModal()">Delete</button>\n<dialog id="deleteDialog">\n  <p>Delete this article permanently?</p>\n  <form method="dialog">\n    <button value="cancel">Cancel</button>\n    <button value="confirm">Delete</button>\n  </form>\n</dialog>`,
  ],
  nodejs: [
    `// Graceful shutdown for Node services\nprocess.on('SIGTERM', async () => {\n  server.close(() => process.exit(0));\n  setTimeout(() => process.exit(1), 10_000).unref();\n});`,
    `// Stream a large file without buffering it all\nimport { createReadStream } from 'node:fs';\n\napp.get('/download', (req, res) => {\n  createReadStream(path).pipe(res);\n});`,
    `// Worker pool for CPU-bound work\nimport { Worker } from 'node:worker_threads';\n\nexport function renderOffthread(payload: string) {\n  return new Promise((resolve, reject) => {\n    const w = new Worker('./renderer.js', { workerData: payload });\n    w.once('message', resolve);\n    w.once('error', reject);\n  });\n}`,
  ],
  python: [
    `# Token bucket rate limiter\nimport time\n\nclass TokenBucket:\n    def __init__(self, rate: float, capacity: int):\n        self.rate, self.capacity = rate, capacity\n        self.tokens, self.updated = capacity, time.monotonic()\n\n    def allow(self) -> bool:\n        now = time.monotonic()\n        self.tokens = min(self.capacity, self.tokens + (now - self.updated) * self.rate)\n        self.updated = now\n        if self.tokens >= 1:\n            self.tokens -= 1\n            return True\n        return False`,
  ],
  generic: [
    `// Example: extract the step you are describing\n// into a small, named function — then compose.\nfunction step(input: Input): Output {\n  // 1. validate\n  // 2. transform\n  // 3. return\n  return transform(validate(input));\n}`,
    `// Configuration as data beats conditionals\nconst strategies = {\n  fast: { timeout: 2_000, retries: 1 },\n  safe: { timeout: 10_000, retries: 3 },\n} as const;\n\ntype Strategy = keyof typeof strategies;`,
  ],
};

function codeFor(techSlug: string, categorySlug: string, seed: number): { lang: string; code: string } {
  const pool = CODE_POOLS[techSlug] ?? CODE_POOLS[categorySlug] ?? CODE_POOLS.generic;
  const code = pick(pool, seed);
  const lang = ['css', 'html'].includes(techSlug) || techSlug === 'css' ? (techSlug === 'css' ? 'css' : 'html')
    : categorySlug === 'backend' ? 'ts'
    : 'ts';
  return { lang, code };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const MISTAKE_POOLS = [
  'Reaching for a library when the platform already provides the primitive — adding bundle weight for no benefit.',
  'Optimizing before measuring: guessing at hotspots instead of profiling the actual workload.',
  'Handling only the happy path and letting edge cases fail silently in production.',
  'Duplicating state or logic in two places and letting them drift apart over time.',
  'Hard-coding values that belong in configuration, making every change a deploy.',
  'Skipping input validation at the boundary and trusting callers to be well-behaved.',
  'Coupling implementation details to interfaces, so swapping one breaks the other.',
  'Leaning on defaults without understanding them — then being surprised by their behavior under load.',
];

// ---------------- article composition ----------------
export function composeArticle(topic: SeedTopic, techSlug: string, techName: string, categorySlug: string, index: number): GeneratedArticle {
  const diffNames = ['beginner', 'intermediate', 'advanced', 'expert'];
  const difficulty = diffNames[topic.diff];
  const subject = topic.t.replace(/^(Understanding|Mastering|Demystifying|The complete guide to|A practical guide to)\s+/i, '').toLowerCase();
  const { lang, code } = codeFor(techSlug, categorySlug, index);
  const mistakes = [0, 1, 2].map((k) => MISTAKE_POOLS[hash(index * 7 + k, MISTAKE_POOLS.length)]);
  const uniqueMistakes = [...new Set(mistakes)];

  const tldr = [
    `Core idea: ${topic.d.replace(/^Understand|^Learn|^Master|^Know/i, 'know')}`,
    `Where it applies in real ${techName} projects and why teams care about it.`,
    topic.ir ? `A recurring theme in ${techName} interviews — expect follow-up questions.` : `How experienced ${techName} engineers apply this in production.`,
    `The most common mistake to avoid (detailed below).`,
  ];
  const cheatPoints = [
    `Definition: ${topic.d}`,
    `Best for: scenarios where you need predictable, maintainable behavior in ${techName}.`,
    topic.diff >= 2 ? `Senior signal: discuss trade-offs and measurement before implementation details.` : `Junior signal: be able to explain it with one concrete example.`,
    `Watch out: ${uniqueMistakes[0].split(':')[0].toLowerCase()} — the failure mode interviewers probe.`,
    `Related: pairing this with the ${techName} fundamentals makes the answer senior-level.`,
  ];

  const perfSection = topic.diff >= 2 ? `
<h2 id="performance-considerations">Performance considerations</h2>
<p>At scale, the details of ${subject} stop being academic. The difference between a naive and a considered implementation usually shows up under real load — larger datasets, slower devices, or bursty traffic. Measure first: establish a baseline with realistic data, change one variable at a time, and keep the before/after numbers in the pull request so the team learns from the change.</p>
<p>Two questions are worth answering every time: what does the worst case look like, and what does the user actually feel? A technically worse algorithm that removes a layout thrash can beat a theoretically optimal one that blocks the main thread. Optimize for what users experience, then for what dashboards show.</p>` : '';

  const interviewSection = topic.ir ? `
<h2 id="interview-perspective">Interview perspective</h2>
<p>This topic appears regularly in ${techName} interviews, typically at the ${difficulty} level. A strong answer moves in three moves: define the concept in one crisp sentence, give a concrete example from real code you have written, then name the trade-off or pitfall most engineers miss. Interviewers are not checking whether you memorized a definition — they are checking whether you have shipped code where this mattered.</p>
<p>If you can connect ${subject} to an adjacent topic (performance, testing, or architecture), you signal seniority. Practice explaining it out loud in under two minutes; the compression forces clarity, and clarity is exactly what the interviewer is scoring.</p>` : '';

  const content = `
<p>${topic.t} sits at the heart of writing ${techName} code that holds up outside of tutorials. In practice, engineers meet this topic the first time something behaves differently than expected — a value that is not what they assumed, a render that happens at the wrong moment, a query that crawls under real data. This article builds the accurate mental model first, then turns it into decisions you can defend in code review.</p>
<p>By the end, you will be able to explain the concept in one sentence, recognize when it applies in a real codebase, and avoid the failure modes that show up in production. ${topic.ir ? 'It is also a frequent interview subject, so we close with how to talk about it under pressure.' : 'The examples are small on purpose: each one isolates a single idea you can transfer to larger systems.'}</p>

<h2 id="why-it-matters">Why it matters</h2>
<p>Modern ${techName} development rewards engineers who understand why systems behave the way they do, not just which API to call. ${topic.d.charAt(0).toUpperCase()}${topic.d.slice(1)} — that understanding compounds: every feature you build on top becomes easier to reason about, test, and change. Teams feel this in code review cycles, in bug rates, and in how quickly new engineers become productive.</p>
<p>There is also a career angle. Senior conversations are mostly trade-off conversations, and this is a topic where the trade-offs are concrete: performance versus clarity, flexibility versus simplicity, correctness versus speed of delivery. Being able to articulate where you would draw the line — and why — is exactly what separates mid-level from senior engineering.</p>

<blockquote><p><strong>Mental model:</strong> treat ${subject} as a contract. Know what it guarantees, what it does not, and what it costs you when you lean on it at scale.</p></blockquote>

<h2 id="the-core-concept">The core concept</h2>
<p>At its foundation, ${topic.d.replace(/\.$/, '')}. That single sentence hides several layers worth unpacking: what the mechanism actually does at runtime, what assumptions it makes about your code, and where those assumptions break. Most bugs attributed to mysterious behavior are violations of an assumption nobody wrote down.</p>
<p>Concretely, three properties define how this behaves in practice. First, <strong>scope of effect</strong> — what it changes and what it leaves untouched. Second, <strong>timing</strong> — when the effect happens relative to the surrounding code. Third, <strong>failure mode</strong> — what happens when inputs are wrong or the environment surprises you. Keep these three in mind and the edge cases stop being surprises.</p>

<h2 id="practical-example">A practical example</h2>
<p>Consider a realistic scenario: a mid-sized ${techName} application where a feature has grown organically, and the team is seeing symptoms — flickering UI, duplicated requests, or numbers that do not add up. The root cause traces back to how ${subject} was (or was not) handled. The fix is rarely more code; it is usually clearer boundaries around this exact concept.</p>
<p>Here is the pattern in its cleanest form:</p>

<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>

<p>Walk through it once slowly. The interesting part is not the syntax — it is the <em>sequence</em>: what happens first, what is deferred, and what invariants hold at each step. When you can narrate that sequence without looking, you understand the concept; when you cannot, you are pattern-matching, and pattern-matching fails the first time requirements shift.</p>

<h2 id="common-mistakes">Common mistakes</h2>
<ul>
${uniqueMistakes.map((m) => `<li>${m}</li>`).join('\n')}
<li>Testing only through the UI instead of isolating the behavior, which makes failures expensive to localize.</li>
</ul>

<h2 id="best-practices">Best practices</h2>
<ul>
<li>Keep the blast radius small: apply ${subject} at the narrowest boundary that solves the problem.</li>
<li>Make the implicit explicit — encode assumptions in types, tests, or runtime checks so violations fail fast.</li>
<li>Name things after their role in the domain; future readers should infer behavior from the call site.</li>
<li>Write one test that would have caught the bug this concept causes when misused.</li>
<li>Document the decision, not the mechanism: a short note on <em>why</em> beats a paragraph on <em>how</em>.</li>
</ul>
${perfSection}
${interviewSection}
<h2 id="summary">Summary</h2>
<p>${topic.t} is a small concept with a large blast radius: understood well, it makes surrounding systems simpler; understood loosely, it generates bugs that are expensive to localize. Build the mental model, practice narrating the sequence of events, and connect it to the adjacent topics in the ${techName} track. The related reading below pairs it with the concepts that most often appear alongside it in real code reviews and interviews.</p>`;

  const slug = slugify(topic.t);
  const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  return {
    title: topic.t, slug, excerpt: `${topic.d}. A focused, production-oriented guide with practical code, common mistakes, and the interview perspective for ${techName} engineers.`,
    content, plainText, difficulty, readingTime: topic.min, interviewRelevant: topic.ir,
    tldr: JSON.stringify(tldr), cheatSheet: JSON.stringify({ title: `Remember`, points: cheatPoints }),
    tags: topic.tags, seoTitle: `${topic.t} — ${techName} Guide`, seoDescription: topic.d,
    seoKeywords: [techSlug, ...topic.tags.split(',')].join(', '),
    coverStyle: ['violet', 'emerald', 'amber', 'rose', 'cyan', 'orange', 'teal', 'fuchsia', 'lime', 'sky'][hash(index, 10)],
  };
}

// ---------------- interview question composition ----------------
const Q_PATTERNS = [
  (t: string, tech: string) => `What is ${t}, and why does it matter in ${tech}?`,
  (t: string, tech: string) => `Explain ${t} to a junior developer on your ${tech} team.`,
  (t: string) => `What are the most common pitfalls with ${t}, and how do you avoid them?`,
  (t: string, tech: string) => `How would you apply ${t} in a production ${tech} codebase? Walk through your reasoning.`,
  (t: string, tech: string) => `How does ${t} affect performance and maintainability in ${tech} applications?`,
  (t: string) => `Describe a real bug or incident ${t} could cause if handled incorrectly.`,
];
const CATEGORIES = ['CONCEPTUAL', 'CONCEPTUAL', 'PRACTICAL', 'PERFORMANCE', 'ARCHITECTURE', 'DEBUGGING'];
const SENIORITY = ['JUNIOR', 'MID', 'SENIOR', 'STAFF'];

export function composeQuestions(topic: SeedTopic, techName: string, index: number): GeneratedQuestion[] {
  if (!topic.ir) return [];
  const lowerTitle = topic.t.charAt(0).toLowerCase() + topic.t.slice(1);
  const pattern = Q_PATTERNS[hash(index, Q_PATTERNS.length)];
  const question = pattern(lowerTitle, techName);
  const seniority = SENIORITY[topic.diff];
  const detailed = `
<p><strong>Short version:</strong> ${topic.d.charAt(0).toUpperCase()}${topic.d.slice(1)}</p>
<p>A complete answer covers three layers. First, the definition — one or two sentences naming what it is and the problem it solves. Second, a concrete example from code you have actually worked with; specificity here is what separates rehearsed answers from real experience. Third, the trade-off: what this costs, when it is the wrong choice, and what you would do instead in that case.</p>
<p>Strong candidates close by connecting the topic to adjacent concerns — testing, performance, or team workflow — which demonstrates that they think in systems rather than in isolated facts. If you are preparing: practice saying the definition out loud, then practice the example, then the trade-off, in that order and under two minutes total.</p>
<ul>
<li><strong>Do say:</strong> a concrete scenario where this mattered in a project.</li>
<li><strong>Do say:</strong> one trade-off and how you would decide between the options.</li>
<li><strong>Avoid:</strong> reciting documentation phrasing without a real example behind it.</li>
</ul>`;
  const questions: GeneratedQuestion[] = [{
    question, shortAnswer: topic.d, detailedAnswer: detailed,
    explanation: `Probed via the ${techName} track; difficulty "${['easy', 'medium', 'hard', 'hard'][topic.diff]}", typical seniority ${seniority.toLowerCase()}.`,
    topic: topic.t, category: CATEGORIES[hash(index, CATEGORIES.length)], difficulty: ['easy', 'medium', 'hard', 'hard'][topic.diff],
    seniority, expectedMinutes: [3, 5, 8, 12][topic.diff], tags: topic.tags || techName,
  }];
  if (topic.diff >= 2 && hash(index * 3 + 1, 100) < 45) {
    questions.push({
      question: `Senior-level: your team keeps shipping bugs related to ${lowerTitle}. How do you fix the systemic cause, not just the symptoms?`,
      shortAnswer: `Introduce guardrails: encode the invariant in types/tests, add a lint or review check, and fix the highest-traffic offender first.`,
      detailedAnswer: `<p>The systemic answer has four moves: (1) reproduce and measure — find where the mistake actually enters the codebase; (2) encode the invariant — types, a validation layer, or a unit test that fails loudly; (3) add friction to the wrong path and remove it from the right one (lint rules, code review checklist, a codemod for existing occurrences); (4) follow up with a metric — bug count in that area over the next month.</p>
<p>This is what the question is really testing: whether you think in systems and prevention rather than in one-off patches. Mentioning codemods, lint rules, and a follow-up metric is a strong senior/staff signal.</p>`,
      explanation: `Systemic-thinking variant, ${seniority === 'STAFF' ? 'staff' : 'senior'} level.`,
      topic: topic.t, category: 'ARCHITECTURE', difficulty: 'hard', seniority: topic.diff === 3 ? 'STAFF' : 'SENIOR',
      expectedMinutes: 10, tags: topic.tags || techName,
    });
  }
  return questions;
}
