// ============================================================
// Dev Prep seed — learning paths & achievements
// Item article titles MUST match titles in the topic banks.
// ============================================================

export interface SeedPath {
  title: string; slug: string; description: string; longDescription: string;
  icon: string; color: string; level: string; estimatedHours: number;
  technologySlug?: string; careerGoal?: string;
  items: { title: string; description: string; hours: number; milestone?: boolean }[];
}

export const seedPaths: SeedPath[] = [
  {
    title: 'Become a Senior React Developer', slug: 'senior-react-developer',
    description: 'The complete road from solid React fundamentals to senior-level architecture, performance and system design.',
    longDescription: 'This is the flagship path for frontend engineers aiming at senior roles. It sequences the exact skills senior React interviews test: language internals, hooks mastery, rendering behavior, state architecture, performance engineering, testing, Next.js production patterns and frontend system design. Every step links to focused articles and interview questions, and the path ends with a full senior interview simulation.',
    icon: 'atom', color: 'cyan', level: 'advanced', estimatedHours: 64, technologySlug: 'react', careerGoal: 'Senior Frontend Developer',
    items: [
      { title: 'Execution contexts, the call stack and how code actually runs', description: 'Language internals first: how JavaScript evaluates your code.', hours: 4 },
      { title: 'Closures explained with real-world examples', description: 'The closure model every React hook relies on.', hours: 4 },
      { title: 'TypeScript in 30 minutes: why types and how the compiler thinks', description: 'Types as a design tool before component work.', hours: 4 },
      { title: 'React in one page: components, elements and the render cycle', description: 'The core React mental model, precisely.', hours: 5, milestone: true },
      { title: 'useEffect for people who want zero infinite loops', description: 'Effects done right — the #1 source of real-world bugs.', hours: 5 },
      { title: 'Reconciliation and the diff algorithm explained', description: 'What React actually does between state and pixels.', hours: 5 },
      { title: 'The four kinds of state: server, client, URL and form', description: 'State architecture that scales with the app.', hours: 4, milestone: true },
      { title: 'React memo, useMemo and useCallback — the honest guide', description: 'Measured performance work, not memoization theater.', hours: 5 },
      { title: 'Testing React components with Testing Library', description: 'Confidence through behavior-driven tests.', hours: 4 },
      { title: 'Server Components in Next.js: where they run and what they cost', description: 'Production React with the App Router.', hours: 6 },
      { title: 'Frontend system design: the interview framework', description: 'The senior loop skill: designing client systems.', hours: 8, milestone: true },
      { title: 'Design a social media news feed', description: 'Full worked system design with virtualization and real-time.', hours: 6 },
    ],
  },
  {
    title: 'Modern JavaScript Foundations', slug: 'modern-javascript-foundations',
    description: 'Build an unshakeable JavaScript base: scope, closures, the event loop, async and modules.',
    longDescription: 'Everything in modern frontend engineering stands on JavaScript fundamentals. This path closes the gaps interviewers love to probe: execution and hoisting, closures, this-binding, prototypes, the event loop, promises and modules. You finish with a language model strong enough to learn any framework faster.',
    icon: 'braces', color: 'amber', level: 'beginner', estimatedHours: 32, technologySlug: 'javascript',
    items: [
      { title: 'var, let and const — scope, hoisting and when to use each', description: 'Scope and the temporal dead zone, precisely.', hours: 3 },
      { title: 'Execution contexts, the call stack and how code actually runs', description: 'How the engine runs your code.', hours: 4, milestone: true },
      { title: 'Closures explained with real-world examples', description: 'The most-asked JS interview topic, made intuitive.', hours: 4 },
      { title: 'The this keyword: rules, binding and arrow function traps', description: 'All four binding rules, no hand-waving.', hours: 4 },
      { title: 'Prototypes and prototypal inheritance from first principles', description: 'How objects actually link.', hours: 4 },
      { title: 'The event loop, microtasks and macrotasks visualized', description: 'Async scheduling, visualized.', hours: 5, milestone: true },
      { title: 'Promises from the ground up: states, chaining and error paths', description: 'Promise semantics from scratch.', hours: 4 },
      { title: 'The module system: ESM vs CommonJS in 2026', description: 'Modern modules and interop.', hours: 4 },
    ],
  },
  {
    title: 'TypeScript Mastery', slug: 'typescript-mastery',
    description: 'From confident annotations to type-level programming — generics, conditional types and safe architecture.',
    longDescription: 'TypeScript is the lingua franca of serious frontend teams. This path takes you from the basics of typing variables to the patterns senior engineers use daily: generics with constraints, discriminated unions, mapped and conditional types, schema-first validation and end-to-end type safety across the stack.',
    icon: 'file-code-2', color: 'teal', level: 'intermediate', estimatedHours: 36, technologySlug: 'typescript',
    items: [
      { title: 'type vs interface in real codebases: extends, declaration merging and errors', description: 'Pick correctly and read errors fluently.', hours: 3 },
      { title: 'Generics without tears: your first <T> that earns its keep', description: 'Generics that pay for themselves.', hours: 4, milestone: true },
      { title: 'Utility types every engineer should know by heart', description: 'Partial, Pick, Omit, Record and friends.', hours: 4 },
      { title: 'Discriminated unions: the pattern that kills impossible states', description: 'Model state machines with unions.', hours: 5, milestone: true },
      { title: 'Mapped types: transforming shapes systematically', description: 'Derive types instead of redeclaring them.', hours: 5 },
      { title: 'Conditional types: T extends U ? X : Y in practice', description: 'Type-level branching.', hours: 5 },
      { title: 'Zod and schema-first typing: one source of truth for validation', description: 'Runtime validation and static types together.', hours: 4 },
      { title: 'End-to-end type safety: tRPC-style contracts without codegen', description: 'One type system across client and server.', hours: 6, milestone: true },
    ],
  },
  {
    title: 'Next.js App Router in Depth', slug: 'nextjs-app-router-in-depth',
    description: 'Server Components, actions, caching and streaming — the production mental model for the App Router.',
    longDescription: 'The App Router changed how React applications are architected. This path builds the complete production picture: the server/client boundary, Server Components and serialization, server actions, the four caching layers, streaming with Suspense, authentication patterns and the full request lifecycle.',
    icon: 'triangle', color: 'zinc', level: 'intermediate', estimatedHours: 40, technologySlug: 'nextjs',
    items: [
      { title: 'App Router structure: folders, files and conventions that matter', description: 'The conventions that drive everything.', hours: 4 },
      { title: 'Server Components in Next.js: where they run and what they cost', description: 'The RSC model, precisely.', hours: 5, milestone: true },
      { title: 'Server Actions: mutations without API routes', description: 'Progressive-enhancement mutations.', hours: 4 },
      { title: 'The caching layers of Next.js explained', description: 'Request memoization, Data Cache, Full Route Cache, Router Cache.', hours: 6, milestone: true },
      { title: 'Streaming with Suspense boundaries in real pages', description: 'Ship faster perceived loads.', hours: 4 },
      { title: 'Auth patterns: session cookies with middleware and layouts', description: 'Correct, layered route protection.', hours: 5 },
      { title: 'Image optimization with next/image in depth', description: 'LCP-worthy images.', hours: 4 },
      { title: 'The App Router request lifecycle, end to end', description: 'Everything, in order.', hours: 8, milestone: true },
    ],
  },
  {
    title: 'CSS Architecture & Design Systems', slug: 'css-architecture-design-systems',
    description: 'From cascade internals to tokens and container queries — CSS that scales across teams.',
    longDescription: 'CSS quality determines UI velocity at scale. This path builds the rigorous mental model — cascade, specificity, stacking contexts, formatting contexts — then layers the modern toolkit: Grid, container queries, custom properties as tokens, cascade layers and a dark-mode architecture that avoids duplication.',
    icon: 'paintbrush', color: 'rose', level: 'intermediate', estimatedHours: 30, technologySlug: 'css',
    items: [
      { title: 'How CSS actually resolves styles: the cascade explained', description: 'The origin story of every computed style.', hours: 4, milestone: true },
      { title: 'Flexbox in 30 focused minutes', description: 'The daily layout driver.', hours: 3 },
      { title: 'CSS Grid fundamentals: rows, columns and the fr unit', description: 'Two-dimensional layout done properly.', hours: 4 },
      { title: 'Stacking contexts and z-index: the complete mental model', description: 'Why z-index fails and how to fix it.', hours: 4 },
      { title: 'Custom properties: CSS variables as a design token layer', description: 'Tokens as the system foundation.', hours: 4, milestone: true },
      { title: 'Layered styles with @layer: taming specificity at scale', description: 'End the specificity wars.', hours: 4 },
      { title: 'Container queries: component-responsive design at last', description: 'Components that adapt anywhere.', hours: 3 },
      { title: 'Dark mode architecture with tokens and prefers-color-scheme', description: 'Dual themes without duplicated components.', hours: 4, milestone: true },
    ],
  },
  {
    title: 'Frontend Performance Engineering', slug: 'frontend-performance-engineering',
    description: 'Core Web Vitals, rendering internals and bundle strategy — make speed a measurable feature.',
    longDescription: 'Performance separates products users love from products they tolerate. This path covers the browser pipeline, each Core Web Vital with remediation playbooks, bundle and image strategy, font loading and real-user monitoring — with a CI-enforced performance budget to keep wins from regressing.',
    icon: 'gauge', color: 'amber', level: 'advanced', estimatedHours: 34, technologySlug: 'web-performance',
    items: [
      { title: 'How browsers render: from HTML to pixels', description: 'The pipeline everything else optimizes.', hours: 5, milestone: true },
      { title: 'Core Web Vitals in 2026: LCP, INP and CLS targets explained', description: 'The metrics that define fast.', hours: 4 },
      { title: 'LCP: finding and fixing your largest paint', description: 'The highest-visibility fix.', hours: 4 },
      { title: 'JavaScript bundle diet: analyzing what ships', description: 'Cut the bytes users wait on.', hours: 4 },
      { title: 'Image optimization: formats, sizes and CDNs', description: 'The biggest wins per byte.', hours: 4 },
      { title: 'Web fonts performance: subset, preload and swap strategies', description: 'Text that paints early and stable.', hours: 3 },
      { title: 'Long tasks and the 50ms rule', description: 'Keep input latency low.', hours: 4, milestone: true },
      { title: 'Performance budgets in CI: enforce them automatically', description: 'Make regressions impossible to merge.', hours: 4 },
    ],
  },
  {
    title: 'Frontend Interview Crash Course', slug: 'frontend-interview-crash-course',
    description: 'A focused two-week sprint over the questions that actually get asked — with practice sessions built in.',
    longDescription: 'When the interview is close, you need signal, not volume. This path sequences the highest-frequency frontend interview topics — closures, the event loop, rendering, hooks, CSS mechanics, system design — and pairs each with a practice session in the interview simulator so knowledge turns into recall under pressure.',
    icon: 'target', color: 'violet', level: 'intermediate', estimatedHours: 24,
    items: [
      { title: 'Closures explained with real-world examples', description: 'The most-asked question, mastered.', hours: 3 },
      { title: 'The event loop, microtasks and macrotasks visualized', description: 'Async questions live here.', hours: 3 },
      { title: 'Hoisting demystified: variables, functions and classes', description: 'Quick win, frequent question.', hours: 2 },
      { title: 'When does a component re-render? The complete answer', description: 'The React question behind the questions.', hours: 3, milestone: true },
      { title: 'Debounce and throttle: implementations and use cases', description: 'Write it live, correctly, from memory.', hours: 2 },
      { title: 'How CSS actually resolves styles: the cascade explained', description: 'CSS questions are senior filters.', hours: 3 },
      { title: 'Frontend system design: the interview framework', description: 'Design rounds start here.', hours: 5, milestone: true },
      { title: 'Design an autocomplete/typeahead', description: 'The most common design warm-up.', hours: 3 },
    ],
  },
  {
    title: 'Full-Stack Foundations with Node.js', slug: 'full-stack-foundations-nodejs',
    description: 'Own the whole feature: Node fundamentals, REST design, auth, databases and containers.',
    longDescription: 'Frontend engineers who understand the backend ship better features and ace full-stack interviews. This path covers the Node event loop, REST API design, session and token authentication, relational data modeling and Docker basics — everything needed to build and deploy a production feature end to end.',
    icon: 'hexagon', color: 'emerald', level: 'intermediate', estimatedHours: 38, technologySlug: 'nodejs', careerGoal: 'Full-Stack Developer',
    items: [
      { title: 'The Node.js event loop beyond the frontend version', description: 'Server-side async, precisely.', hours: 4, milestone: true },
      { title: 'REST resource modeling: nouns, verbs and relationships', description: 'APIs that age well.', hours: 4 },
      { title: 'Sessions vs JWTs: the trade-off everyone gets wrong', description: 'Auth architecture fundamentals.', hours: 5, milestone: true },
      { title: 'Relational modeling: normalization and when to denormalize', description: 'Data that stays correct.', hours: 5 },
      { title: 'Indexes: B-trees, composite and covering indexes', description: 'Make queries fast on purpose.', hours: 4 },
      { title: 'Docker mental model: images, containers and layers', description: 'Ship consistent environments.', hours: 4 },
      { title: 'Structured logging and observability for Node', description: 'Operate what you ship.', hours: 4 },
      { title: 'Deployment checklist: from localhost to production', description: 'The pre-launch discipline.', hours: 4, milestone: true },
    ],
  },
];

export interface SeedAchievement {
  key: string; title: string; description: string; icon: string;
  tier: 'bronze' | 'silver' | 'gold'; xpReward: number;
  category: 'learning' | 'interview' | 'streak' | 'community' | 'mastery';
}

export const seedAchievements: SeedAchievement[] = [
  { key: 'first-steps', title: 'First Steps', description: 'Read your first article', icon: 'footprints', tier: 'bronze', xpReward: 20, category: 'learning' },
  { key: 'bookworm-10', title: 'Bookworm', description: 'Read 10 articles', icon: 'book-open', tier: 'bronze', xpReward: 40, category: 'learning' },
  { key: 'librarian-50', title: 'Librarian', description: 'Read 50 articles', icon: 'library', tier: 'silver', xpReward: 120, category: 'learning' },
  { key: 'century-reader', title: 'Century Reader', description: 'Read 100 articles', icon: 'graduation-cap', tier: 'gold', xpReward: 300, category: 'learning' },
  { key: 'into-the-arena', title: 'Into the Arena', description: 'Complete your first interview session', icon: 'swords', tier: 'bronze', xpReward: 30, category: 'interview' },
  { key: 'seasoned-candidate', title: 'Seasoned Candidate', description: 'Complete 10 interview sessions', icon: 'briefcase', tier: 'silver', xpReward: 100, category: 'interview' },
  { key: 'sharp-mind', title: 'Sharp Mind', description: 'Score 80% or higher in an interview', icon: 'zap', tier: 'silver', xpReward: 150, category: 'interview' },
  { key: 'interview-ready', title: 'Interview Ready', description: 'Reach 85% interview readiness', icon: 'target', tier: 'gold', xpReward: 250, category: 'interview' },
  { key: 'on-fire', title: 'On Fire', description: 'Maintain a 7-day learning streak', icon: 'flame', tier: 'silver', xpReward: 100, category: 'streak' },
  { key: 'unstoppable', title: 'Unstoppable', description: 'Maintain a 30-day learning streak', icon: 'rocket', tier: 'gold', xpReward: 400, category: 'streak' },
  { key: 'century-club', title: 'Century Club', description: 'Answer 100 interview questions', icon: 'list-checks', tier: 'silver', xpReward: 150, category: 'interview' },
  { key: 'pathfinder', title: 'Pathfinder', description: 'Enroll in a learning path', icon: 'map', tier: 'bronze', xpReward: 30, category: 'learning' },
  { key: 'trailblazer', title: 'Trailblazer', description: 'Complete a learning path', icon: 'mountain', tier: 'gold', xpReward: 300, category: 'learning' },
  { key: 'note-taker', title: 'Note Taker', description: 'Create your first personal note', icon: 'pencil-line', tier: 'bronze', xpReward: 20, category: 'learning' },
  { key: 'curator', title: 'Curator', description: 'Bookmark 10 articles', icon: 'bookmark', tier: 'bronze', xpReward: 40, category: 'community' },
  { key: 'daily-challenger', title: 'Daily Challenger', description: 'Complete 5 daily challenges', icon: 'calendar-check', tier: 'silver', xpReward: 80, category: 'learning' },
];
