// ============================================================
// Dev Prep seed — topic types & helpers
// ============================================================

export interface SeedTopic {
  /** Title */
  t: string;
  /** One-line learning outcome (also used as excerpt seed & question seed) */
  d: string;
  /** 0=beginner 1=intermediate 2=advanced 3=expert */
  diff: 0 | 1 | 2 | 3;
  /** estimated reading minutes */
  min: number;
  /** interview relevant */
  ir: boolean;
  /** comma separated tags */
  tags: string;
}

export const T = (
  t: string, d: string, diff: 0 | 1 | 2 | 3, min: number, ir: boolean = false, tags: string = ''
): SeedTopic => ({ t, d, diff, min, ir, tags });
