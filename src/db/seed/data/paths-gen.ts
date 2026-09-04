// ============================================================
// Dev Prep seed — deterministic learning-path composers
// Every generated item title comes from an actual SeedTopic, so
// seed.ts's title -> slug -> articleId lookup always resolves
// (reference integrity by construction).
// ============================================================
import { slugify } from '../generator';
import type { SeedTopic } from './topic-types';
import type { SeedPath } from './paths';
import type { SeedTechnology } from './taxonomy';
import { javascriptTopics } from './topics-js';
import { reactTopics } from './topics-react';
import { nextjsTopics } from './topics-next';
import { cssTopics } from './topics-css-html';
import { nodejsTopics, restApiTopics, authenticationTopics, databasesTopics, devopsTopics, mobileTopics, aiTopics, engineeringTopics } from './topics-other';
import { designPatternsTopics, frontendArchitectureTopics, frontendSystemDesignTopics } from './topics-frontend';

const hoursOf = (t: SeedTopic): number => Math.max(1, Math.round(t.min / 12));

function mkPath(
  title: string, description: string, longDescription: string,
  icon: string, color: string, level: string, items: SeedTopic[],
  technologySlug?: string, careerGoal?: string,
): SeedPath {
  const ordered = [...items].sort((a, b) => a.diff - b.diff);
  return {
    title, slug: slugify(title), description, longDescription,
    icon, color, level,
    estimatedHours: ordered.reduce((s, t) => s + hoursOf(t), 0),
    technologySlug, careerGoal,
    items: ordered.map((t, i) => ({ title: t.t, description: t.d, hours: hoursOf(t), milestone: i === ordered.length - 1 })),
  };
}

/**
 * Paths for technologies with curated topic banks:
 * Fundamentals + Interview Prep + Advanced (each only if it has
 * enough material to be worth a path).
 */
export function composeTechPaths(tech: SeedTechnology, topics: SeedTopic[]): SeedPath[] {
  const paths: SeedPath[] = [];
  const push = (p: SeedPath | null) => { if (p && p.items.length >= 3) paths.push(p); };

  const fundamentals = [...topics.filter((t) => t.diff === 0), ...topics.filter((t) => t.diff === 1 && !t.ir)].slice(0, 8);
  push(mkPath(
    `${tech.name} Fundamentals`,
    `Build a solid foundation in ${tech.name} — the concepts, vocabulary and habits everything else stands on.`,
    `This path sequences the foundational ${tech.name} material from the Dev Prep library into a deliberate order: core concepts first, production practices second. Every step links to a focused article, and the topics mirror what junior-to-mid ${tech.name} interviews expect you to explain without hesitation.`,
    tech.icon, tech.color, 'beginner', fundamentals, tech.slug,
  ));

  const interview = topics.filter((t) => t.ir).slice(0, 10);
  push(mkPath(
    `${tech.name} Interview Prep`,
    `The questions interviewers actually ask about ${tech.name}, sequenced from first principles to senior signals.`,
    `A focused ${tech.name} interview sprint. Each step pairs a high-frequency interview topic with the article that explains it precisely, ending with the advanced material that separates prepared candidates from rehearsed ones. Pair the path with practice sessions in the interview simulator for recall under pressure.`,
    tech.icon, tech.color, 'intermediate', interview, tech.slug,
  ));

  const advanced = topics.filter((t) => t.diff >= 2).slice(0, 8);
  push(mkPath(
    `${tech.name} for Production`,
    `Advanced ${tech.name} — performance, scale and the judgment calls senior engineers own.`,
    `The advanced leg of the ${tech.name} track: performance work, failure modes at scale and architectural judgment. These are the topics senior loops probe and code reviews argue about. Take it after the fundamentals, not instead of them.`,
    tech.icon, tech.color, 'advanced', advanced, tech.slug,
  ));

  return paths;
}

/**
 * One essentials path per synthesized technology (no curated bank),
 * so every technology page offers a guided sequence.
 */
export function composeEssentialsPath(tech: SeedTechnology, topics: SeedTopic[]): SeedPath[] {
  const items = topics.slice(0, 6);
  if (items.length < 3) return [];
  const path = mkPath(
    `${tech.name} Essentials`,
    `A guided tour through ${tech.name}: from first setup to production-grade habits.`,
    `The essential ${tech.name} sequence from the Dev Prep library: start with setup and the core mental model, then move through production structure, common mistakes and testing, and finish with performance and scale. Every step links to a focused article and its interview questions.`,
    tech.icon, tech.color, 'intermediate', items, tech.slug,
  );
  return [path];
}

// ---------------- career roadmaps (cross-technology) ----------------
export function composeCareerPaths(): SeedPath[] {
  const byDiff = (arr: SeedTopic[], diffs: number[]) => arr.filter((t) => diffs.includes(t.diff));

  return [
    mkPath(
      'Frontend Developer Roadmap',
      'The complete route into frontend: JavaScript, React, CSS and Next.js in a deliberate order.',
      'This roadmap assembles the frontend canon into one journey: the JavaScript core first, then React component thinking, the CSS layout system, and finally Next.js production patterns. Built from the highest-signal articles across those tracks, it ends with a milestone that ties the pieces together into the mental model frontend interviews expect.',
      'layout-template', 'violet', 'beginner',
      [
        ...byDiff(javascriptTopics, [0]).slice(0, 4),
        ...byDiff(reactTopics, [0, 1]).slice(0, 5),
        ...byDiff(cssTopics, [0]).slice(0, 3),
        ...byDiff(nextjsTopics, [0, 1]).slice(0, 3),
      ],
      undefined, 'Frontend Developer',
    ),
    mkPath(
      'Full-Stack JavaScript Roadmap',
      'Own the whole feature: Node, REST design, authentication and databases.',
      'Frontend engineers who understand the backend ship better features and interview better for full-stack roles. This roadmap walks the server side in dependency order: the Node runtime, REST resource design, authentication architecture and database fundamentals — each step an article from the corresponding track, sequenced so concepts build on each other.',
      'server', 'emerald', 'intermediate',
      [
        ...byDiff(nodejsTopics, [0, 1]).slice(0, 4),
        ...byDiff(restApiTopics, [0, 1]).slice(0, 3),
        ...byDiff(authenticationTopics, [0, 1]).slice(0, 3),
        ...byDiff(databasesTopics, [0, 1]).slice(0, 3),
      ],
      undefined, 'Full-Stack Developer',
    ),
    mkPath(
      'DevOps Engineer Roadmap',
      'From containers to pipelines to cloud: the infrastructure path in order.',
      'Infrastructure is a discipline of small, reviewable steps — this roadmap mirrors that. It starts with the Docker mental model, moves through CI/CD pipeline design, adds Kubernetes orchestration and closes with cloud architecture judgment. Each step is a focused article from the DevOps track, ordered so every concept has the context it needs.',
      'container', 'amber', 'intermediate',
      [
        ...byDiff(devopsTopics.slice(0, 10), [0, 1]).slice(0, 4),
        ...byDiff(devopsTopics.slice(20, 30), [0, 1]).slice(0, 3),
        ...byDiff(devopsTopics.slice(10, 20), [1, 2]).slice(0, 3),
        ...byDiff(devopsTopics.slice(48, 58), [1, 2]).slice(0, 3),
      ],
      undefined, 'DevOps Engineer',
    ),
    mkPath(
      'AI Engineer Roadmap',
      'Ship AI features for real: LLMs, RAG, agents and prompt engineering.',
      'The applied-AI path for product engineers: understand what LLMs actually do, ground them in your data with RAG, orchestrate them into agents and write prompts like an interface designer. Every step is a focused article from the AI track, ordered from model fundamentals to production integration patterns.',
      'brain-circuit', 'cyan', 'intermediate',
      [
        ...byDiff(aiTopics.slice(0, 10), [0, 1]).slice(0, 4),
        ...byDiff(aiTopics.slice(26, 34), [0, 1]).slice(0, 3),
        ...byDiff(aiTopics.slice(10, 18), [1, 2]).slice(0, 3),
        ...byDiff(aiTopics.slice(18, 26), [1, 2]).slice(0, 2),
      ],
      undefined, 'AI Engineer',
    ),
    mkPath(
      'Mobile Developer Roadmap',
      'Cross-platform mobile with React knowledge you already have: React Native and Flutter.',
      'The fastest route from web to mobile: React Native transfers your React model to iOS and Android, and Flutter shows the alternative compilation model. This roadmap sequences the mobile track’s core articles — architecture, navigation, lists and platform channels — with React state articles as reinforcement.',
      'smartphone', 'rose', 'intermediate',
      [
        ...byDiff(mobileTopics.slice(0, 16), [0, 1]).slice(0, 5),
        ...byDiff(mobileTopics.slice(16, 26), [0, 1]).slice(0, 3),
        ...byDiff(reactTopics, [1]).slice(0, 3),
      ],
      undefined, 'Mobile Developer',
    ),
    mkPath(
      'Senior Engineer Roadmap',
      'The staff-track skills: system design, architecture and pattern fluency.',
      'Senior conversations are trade-off conversations — this roadmap trains exactly that. It assembles the highest-level material across system design, frontend system design, architecture and design patterns into one advanced sequence, ending with the interview framework used in staff loops. Take it after you are fluent in a stack; it teaches judgment, not syntax.',
      'git-branch', 'orange', 'advanced',
      [
        ...byDiff(engineeringTopics.slice(0, 15), [1, 2]).slice(0, 4),
        ...byDiff(frontendSystemDesignTopics, [1, 2]).slice(0, 4),
        ...byDiff(frontendArchitectureTopics, [1, 2]).slice(0, 3),
        ...byDiff(designPatternsTopics, [1, 2]).slice(0, 3),
      ],
      undefined, 'Senior / Staff Engineer',
    ),
  ];
}
