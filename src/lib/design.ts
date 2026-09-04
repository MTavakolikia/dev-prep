// ============================================================
// Dev Prep — design system data: tech colors, difficulty
// styles, cover gradients, level math. Client-safe.
// ============================================================

export interface ColorTokens {
  bg: string; bgSoft: string; text: string; border: string; solid: string; ring: string;
  gradient: string; glow: string;
}

const PALETTES: Record<string, ColorTokens> = {
  violet:  { bg: 'bg-violet-500/10',  bgSoft: 'bg-violet-500/5',  text: 'text-violet-500 dark:text-violet-400',  border: 'border-violet-500/25',  solid: 'bg-violet-600',  ring: 'ring-violet-500/30',  gradient: 'from-violet-600 to-violet-400',  glow: 'shadow-violet-500/20' },
  emerald: { bg: 'bg-emerald-500/10', bgSoft: 'bg-emerald-500/5', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/25', solid: 'bg-emerald-600', ring: 'ring-emerald-500/30', gradient: 'from-emerald-600 to-emerald-400', glow: 'shadow-emerald-500/20' },
  amber:   { bg: 'bg-amber-500/10',   bgSoft: 'bg-amber-500/5',   text: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-500/25',   solid: 'bg-amber-500',   ring: 'ring-amber-500/30',   gradient: 'from-amber-500 to-amber-300',   glow: 'shadow-amber-500/20' },
  rose:    { bg: 'bg-rose-500/10',    bgSoft: 'bg-rose-500/5',    text: 'text-rose-500 dark:text-rose-400',     border: 'border-rose-500/25',    solid: 'bg-rose-600',    ring: 'ring-rose-500/30',    gradient: 'from-rose-600 to-rose-400',    glow: 'shadow-rose-500/20' },
  cyan:    { bg: 'bg-cyan-500/10',    bgSoft: 'bg-cyan-500/5',    text: 'text-cyan-600 dark:text-cyan-400',     border: 'border-cyan-500/25',    solid: 'bg-cyan-600',    ring: 'ring-cyan-500/30',    gradient: 'from-cyan-600 to-cyan-400',    glow: 'shadow-cyan-500/20' },
  orange:  { bg: 'bg-orange-500/10',  bgSoft: 'bg-orange-500/5',  text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/25',  solid: 'bg-orange-600',  ring: 'ring-orange-500/30',  gradient: 'from-orange-600 to-orange-400',  glow: 'shadow-orange-500/20' },
  teal:    { bg: 'bg-teal-500/10',    bgSoft: 'bg-teal-500/5',    text: 'text-teal-600 dark:text-teal-400',     border: 'border-teal-500/25',    solid: 'bg-teal-600',    ring: 'ring-teal-500/30',    gradient: 'from-teal-600 to-teal-400',    glow: 'shadow-teal-500/20' },
  fuchsia: { bg: 'bg-fuchsia-500/10', bgSoft: 'bg-fuchsia-500/5', text: 'text-fuchsia-500 dark:text-fuchsia-400', border: 'border-fuchsia-500/25', solid: 'bg-fuchsia-600', ring: 'ring-fuchsia-500/30', gradient: 'from-fuchsia-600 to-fuchsia-400', glow: 'shadow-fuchsia-500/20' },
  lime:    { bg: 'bg-lime-500/10',    bgSoft: 'bg-lime-500/5',    text: 'text-lime-600 dark:text-lime-400',     border: 'border-lime-500/25',    solid: 'bg-lime-600',    ring: 'ring-lime-500/30',    gradient: 'from-lime-600 to-lime-400',    glow: 'shadow-lime-500/20' },
  sky:     { bg: 'bg-sky-500/10',     bgSoft: 'bg-sky-500/5',     text: 'text-sky-600 dark:text-sky-400',       border: 'border-sky-500/25',     solid: 'bg-sky-600',     ring: 'ring-sky-500/30',     gradient: 'from-sky-600 to-sky-400',     glow: 'shadow-sky-500/20' },
  red:     { bg: 'bg-red-500/10',     bgSoft: 'bg-red-500/5',     text: 'text-red-500 dark:text-red-400',       border: 'border-red-500/25',     solid: 'bg-red-600',     ring: 'ring-red-500/30',     gradient: 'from-red-600 to-red-400',     glow: 'shadow-red-500/20' },
  zinc:    { bg: 'bg-zinc-500/10',    bgSoft: 'bg-zinc-500/5',    text: 'text-zinc-600 dark:text-zinc-400',     border: 'border-zinc-500/25',    solid: 'bg-zinc-700',    ring: 'ring-zinc-500/30',    gradient: 'from-zinc-700 to-zinc-500',    glow: 'shadow-zinc-500/20' },
};

export function tokens(color: string): ColorTokens {
  return PALETTES[color] ?? PALETTES.violet;
}

export const DIFFICULTY_STYLES: Record<string, { label: string; className: string; short: string }> = {
  beginner:     { label: 'Beginner',     short: 'Beg', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' },
  intermediate: { label: 'Intermediate', short: 'Int', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25' },
  advanced:     { label: 'Advanced',     short: 'Adv', className: 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/25' },
  expert:       { label: 'Expert',       short: 'Exp', className: 'bg-fuchsia-500/10 text-fuchsia-500 dark:text-fuchsia-400 border-fuchsia-500/25' },
  easy:         { label: 'Easy',         short: 'Easy', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' },
  medium:       { label: 'Medium',       short: 'Med', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25' },
  hard:         { label: 'Hard',         short: 'Hard', className: 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/25' },
};

export const SENIORITY_LABELS: Record<string, string> = {
  JUNIOR: 'Junior', MID: 'Mid-Level', SENIOR: 'Senior', STAFF: 'Staff',
};

export const QUESTION_CATEGORY_LABELS: Record<string, string> = {
  CONCEPTUAL: 'Conceptual', CODING: 'Coding', DEBUGGING: 'Debugging', ARCHITECTURE: 'Architecture',
  SYSTEM_DESIGN: 'System Design', BEHAVIORAL: 'Behavioral', PERFORMANCE: 'Performance',
  SECURITY: 'Security', PRACTICAL: 'Practical',
};

export const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/25',
  IN_REVIEW: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
  SCHEDULED: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25',
  PUBLISHED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
  ARCHIVED: 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/25',
};

// ---------------- XP & levels ----------------
/** XP required to reach a level: level L costs 100 * L^1.35 cumulative-ish */
export function levelFromXp(xp: number): number {
  let level = 1;
  let need = 100;
  let total = 0;
  while (xp >= total + need && level < 50) {
    total += need;
    level += 1;
    need = Math.floor(100 * Math.pow(level, 1.35));
  }
  return level;
}

export function levelProgress(xp: number): { level: number; current: number; needed: number; percent: number } {
  const level = levelFromXp(xp);
  let total = 0;
  for (let l = 1; l < level; l++) total += Math.floor(100 * Math.pow(l, 1.35));
  const needed = Math.floor(100 * Math.pow(level, 1.35));
  const current = xp - total;
  return { level, current, needed, percent: Math.min(100, Math.round((current / needed) * 100)) };
}

export const XP_RULES = {
  READ_ARTICLE: 5,
  COMPLETE_ARTICLE: 15,
  INTERVIEW_ANSWER: 2,
  INTERVIEW_COMPLETE: 25,
  PATH_ITEM: 20,
  DAILY_CHALLENGE: 30,
  NOTE: 5,
  BOOKMARK: 2,
} as const;

export const INTERVIEW_MODES: Record<string, { label: string; description: string; questions: number | null; icon: string; accent: string }> = {
  quick:    { label: 'Quick Practice',      description: '5 questions — a focused warm-up between tasks.', questions: 5,  icon: 'zap',      accent: 'amber' },
  standard: { label: 'Standard Interview',  description: '15 questions — a realistic screening round.',    questions: 15, icon: 'briefcase', accent: 'cyan' },
  full:     { label: 'Full Interview',      description: '30 questions — the complete loop experience.',   questions: 30, icon: 'layers',   accent: 'violet' },
  random:   { label: 'Random Interview',    description: 'Mixed technologies — test your breadth.',        questions: 12, icon: 'shuffle',  accent: 'emerald' },
  senior:   { label: 'Senior Frontend',     description: 'Advanced questions across rendering, performance and architecture.', questions: 18, icon: 'trending-up', accent: 'rose' },
  staff:    { label: 'Staff Frontend',      description: 'Architecture and system design at staff level.', questions: 15, icon: 'pen-tool', accent: 'fuchsia' },
  daily:    { label: 'Daily Challenge',     description: 'Today\'s curated question — keep the streak alive.', questions: 3, icon: 'calendar-check', accent: 'lime' },
};
