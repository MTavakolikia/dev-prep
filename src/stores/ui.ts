'use client';

import { create } from 'zustand';

// ---------------- UI store: palette, nav, panels ----------------
interface UiState {
  commandOpen: boolean;
  mobileNavOpen: boolean;
  aiOpen: boolean;
  authOpen: boolean;
  openCommand: () => void;
  closeCommand: () => void;
  toggleCommand: () => void;
  setMobileNav: (v: boolean) => void;
  toggleAi: () => void;
  setAiOpen: (v: boolean) => void;
  setAuthOpen: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  commandOpen: false,
  mobileNavOpen: false,
  aiOpen: false,
  authOpen: false,
  openCommand: () => set({ commandOpen: true }),
  closeCommand: () => set({ commandOpen: false }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
  setMobileNav: (v) => set({ mobileNavOpen: v }),
  toggleAi: () => set((s) => ({ aiOpen: !s.aiOpen })),
  setAiOpen: (v) => set({ aiOpen: v }),
  setAuthOpen: (v) => set({ authOpen: v }),
}));

// ---------------- Interview session store (client runtime) ----------------
export interface InterviewQuestionState {
  id: string;
  result: 'KNOWN' | 'DIFFICULT' | 'SKIPPED' | null;
  secondsSpent: number;
  confidence: number;
}

interface InterviewState {
  attemptId: string | null;
  mode: string;
  level: string;
  technologySlug: string | null;
  startedAt: number;
  questions: { id: string; question: string; shortAnswer: string; detailedAnswer: string; topic: string; category: string; seniority: string; expectedMinutes: number; technologyName: string; technologyIcon: string; technologyColor: string }[];
  current: number;
  answers: Record<string, InterviewQuestionState>;
  revealed: boolean;
  finished: boolean;
  attemptResult: { ok: boolean; score?: number; attempt?: { id: string; score: number; knownCount: number; difficultCount: number; skippedCount: number; totalQuestions: number; durationSeconds: number; strongTopics: string[]; weakTopics: string[] }; unlocked?: { key: string; title: string; description: string; xpReward: number }[] } | null;
  startSession: (payload: { attemptId: string; mode: string; level: string; technologySlug: string | null; questions: InterviewState['questions'] }) => void;
  reveal: () => void;
  answer: (result: 'KNOWN' | 'DIFFICULT' | 'SKIPPED') => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  attemptId: null,
  mode: 'quick',
  level: 'MID',
  technologySlug: null,
  startedAt: 0,
  questions: [],
  current: 0,
  answers: {},
  revealed: false,
  finished: false,
  attemptResult: null,
  startSession: ({ attemptId, mode, level, technologySlug, questions }) =>
    set({ attemptId, mode, level, technologySlug, questions, current: 0, answers: {}, revealed: false, finished: false, attemptResult: null, startedAt: Date.now() }),
  reveal: () => set({ revealed: true }),
  answer: (result) => {
    const { questions, current, answers } = get();
    const q = questions[current];
    if (!q) return;
    set({ answers: { ...answers, [q.id]: { id: q.id, result, secondsSpent: 0, confidence: result === 'KNOWN' ? 4 : result === 'DIFFICULT' ? 2 : 3 } } });
  },
  next: () => {
    const { current, questions } = get();
    set({ current: Math.min(current + 1, questions.length), revealed: false });
    if (current + 1 >= questions.length) set({ finished: true });
  },
  prev: () => {
    const { current } = get();
    set({ current: Math.max(current - 1, 0), revealed: false });
  },
  reset: () => set({ attemptId: null, questions: [], current: 0, answers: {}, revealed: false, finished: false, startedAt: 0 }),
}));
