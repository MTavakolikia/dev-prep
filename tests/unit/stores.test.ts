// ============================================================
// Dev Prep — Zustand stores: UI shell state + interview session
// state machine
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useUiStore, useInterviewStore } from '@/stores/ui';

const question = (id: string) => ({
  id, question: `Q ${id}?`, shortAnswer: 'short', detailedAnswer: '<p>detailed</p>',
  topic: 'Hooks', category: 'CONCEPTUAL', seniority: 'MID', expectedMinutes: 5,
  technologyName: 'React', technologyIcon: 'atom', technologyColor: 'cyan',
});

beforeEach(() => {
  useUiStore.getState().closeCommand();
  useUiStore.getState().setMobileNav(false);
  useUiStore.getState().setAiOpen(false);
  useUiStore.getState().setAuthOpen(false);
  useInterviewStore.getState().reset();
});

describe('useUiStore', () => {
  it('opens, closes and toggles the command palette', () => {
    const s = useUiStore.getState();
    s.openCommand();
    expect(useUiStore.getState().commandOpen).toBe(true);
    act(() => useUiStore.getState().toggleCommand());
    expect(useUiStore.getState().commandOpen).toBe(false);
    act(() => useUiStore.getState().toggleCommand());
    expect(useUiStore.getState().commandOpen).toBe(true);
    useUiStore.getState().closeCommand();
    expect(useUiStore.getState().commandOpen).toBe(false);
  });

  it('tracks mobile nav, AI panel and auth dialog independently', () => {
    const s = useUiStore.getState();
    s.setMobileNav(true);
    s.setAiOpen(true);
    s.setAuthOpen(true);
    const state = useUiStore.getState();
    expect(state.mobileNavOpen).toBe(true);
    expect(state.aiOpen).toBe(true);
    expect(state.authOpen).toBe(true);
    expect(state.commandOpen).toBe(false);
  });
});

describe('useInterviewStore — session state machine', () => {
  it('starts a clean session', () => {
    act(() => useInterviewStore.getState().startSession({
      attemptId: 'att1', mode: 'standard', level: 'SENIOR', technologySlug: 'react',
      questions: [question('q1'), question('q2'), question('q3')],
    }));
    const s = useInterviewStore.getState();
    expect(s.attemptId).toBe('att1');
    expect(s.mode).toBe('standard');
    expect(s.level).toBe('SENIOR');
    expect(s.current).toBe(0);
    expect(s.questions).toHaveLength(3);
    expect(s.revealed).toBe(false);
    expect(s.finished).toBe(false);
    expect(s.startedAt).toBeGreaterThan(0);
  });

  it('records answers for the current question with confidence mapping', () => {
    const s = useInterviewStore.getState();
    s.startSession({ attemptId: 'a', mode: 'quick', level: 'MID', technologySlug: null, questions: [question('q1')] });
    act(() => useInterviewStore.getState().reveal());
    expect(useInterviewStore.getState().revealed).toBe(true);

    act(() => useInterviewStore.getState().answer('KNOWN'));
    expect(useInterviewStore.getState().answers.q1).toMatchObject({ result: 'KNOWN', confidence: 4 });

    act(() => useInterviewStore.getState().answer('DIFFICULT'));
    expect(useInterviewStore.getState().answers.q1).toMatchObject({ result: 'DIFFICULT', confidence: 2 });

    act(() => useInterviewStore.getState().answer('SKIPPED'));
    expect(useInterviewStore.getState().answers.q1).toMatchObject({ result: 'SKIPPED', confidence: 3 });
  });

  it('advances and resets reveal state on next()', () => {
    const s = useInterviewStore.getState();
    s.startSession({ attemptId: 'a', mode: 'quick', level: 'MID', technologySlug: null, questions: [question('q1'), question('q2')] });
    useInterviewStore.getState().reveal();
    act(() => useInterviewStore.getState().next());
    const after = useInterviewStore.getState();
    expect(after.current).toBe(1);
    expect(after.revealed).toBe(false);
  });

  it('marks the session finished after the last question', () => {
    useInterviewStore.getState().startSession({ attemptId: 'a', mode: 'quick', level: 'MID', technologySlug: null, questions: [question('q1')] });
    act(() => useInterviewStore.getState().next());
    expect(useInterviewStore.getState().finished).toBe(true);
  });

  it('clamps navigation at both ends', () => {
    useInterviewStore.getState().startSession({ attemptId: 'a', mode: 'quick', level: 'MID', technologySlug: null, questions: [question('q1'), question('q2')] });
    act(() => useInterviewStore.getState().prev());
    expect(useInterviewStore.getState().current).toBe(0); // cannot go below 0
    act(() => useInterviewStore.getState().next());
    act(() => useInterviewStore.getState().next());
    expect(useInterviewStore.getState().current).toBe(2); // == length (finished view)
    act(() => useInterviewStore.getState().next());
    expect(useInterviewStore.getState().current).toBe(2); // cannot overflow
  });

  it('ignores answers when there is no current question', () => {
    // fresh store: questions=[] → answer() is a no-op
    act(() => useInterviewStore.getState().answer('KNOWN'));
    expect(useInterviewStore.getState().answers).toEqual({});
  });

  it('reset() clears the runtime but keeps defaults', () => {
    useInterviewStore.getState().startSession({ attemptId: 'a', mode: 'full', level: 'STAFF', technologySlug: 'react', questions: [question('q1')] });
    useInterviewStore.getState().answer('KNOWN');
    act(() => useInterviewStore.getState().reset());
    const s = useInterviewStore.getState();
    expect(s.attemptId).toBeNull();
    expect(s.questions).toHaveLength(0);
    expect(s.answers).toEqual({});
    expect(s.finished).toBe(false);
    expect(s.startedAt).toBe(0);
  });
});
