'use client';

// ============================================================
// Dev Prep — Interview session: the interactive simulator.
// Question flow → reveal → self-grade → results with score,
// strong/weak areas and recommended learning. Immersive layout
// (header/footer hidden by the shell while a session runs).
// ============================================================
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, navigate, useRoute } from '@/router';
import { completeInterviewAction } from '@/server/actions/interview';
import { useInterviewStore } from '@/stores/ui';
import { TechIcon, ProgressBar } from '@/components/shared/primitives';
import { INTERVIEW_MODES, tokens } from '@/lib/design';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  X, Eye, CheckCircle2, AlertTriangle, SkipForward, ChevronRight, ChevronLeft,
  Timer, Trophy, TrendingUp, TrendingDown, BookOpen, RotateCcw, PartyPopper, Flag,
} from 'lucide-react';

export function InterviewSessionPage() {
  const route = useRoute();
  const attemptId = route.query.id ?? '';
  return <SessionRunner attemptId={attemptId} />;
}

function SessionRunner({ attemptId }: { attemptId: string }) {
  // session data is passed through the store at start time
  const store = useInterviewStore();
  const [exitConfirm, setExitConfirm] = useState(false);

  // If user landed here directly (no store state), bounce back to hub
  useEffect(() => {
    if (!store.attemptId || store.questions.length === 0) {
      navigate('/interview', { replace: true });
    }
  }, [store.attemptId, store.questions.length]);

  const complete = useMutation({
    mutationFn: () => completeInterviewAction({
      attemptId: store.attemptId!,
      results: store.questions.map((q) => ({
        questionId: q.id,
        result: store.answers[q.id]?.result ?? 'SKIPPED',
        secondsSpent: Math.floor((Date.now() - store.startedAt) / 1000) / Math.max(1, store.questions.length),
        confidence: store.answers[q.id]?.confidence ?? 3,
      })),
    }),
    onSuccess: (r) => {
      if (r.ok && r.attempt) {
        useInterviewStore.setState({ finished: true, attemptResult: r });
      } else toast.error('Could not save the session');
    },
  });

  // auto-submit once the session is finished and no result exists yet
  const { current, questions, answers, finished } = store;
  useEffect(() => {
    if (finished && questions.length > 0 && !store.attemptResult && !complete.isPending) {
      complete.mutate();
    }
  }, [finished, questions.length, store.attemptResult, complete]);

  if (!store.attemptId || questions.length === 0) return null;

  const mode = INTERVIEW_MODES[store.mode] ?? INTERVIEW_MODES.standard;
  const q = questions[current];
  const answered = Object.keys(answers).length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* session header */}
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4 sm:px-6">
          <TechIcon icon={store.questions[0]?.technologyIcon ?? 'code'} color={store.questions[0]?.technologyColor ?? 'violet'} className="h-8 w-8" />
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-semibold">{mode.label}</p>
            <p className="text-[11px] text-muted-foreground">{store.level} · {questions.length} questions</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[12.5px] font-medium tabular-nums text-muted-foreground">{Math.min(current + 1, questions.length)} / {questions.length}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExitConfirm(true)} aria-label="End session">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ProgressBar percent={(answered / questions.length) * 100} className="h-[3px] rounded-none" />
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 sm:px-6">
        {/* question card */}
        <div key={q?.id} className="animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center gap-2 text-[11.5px] font-medium text-muted-foreground">
            <span className="rounded bg-muted px-2 py-0.5 font-bold uppercase tracking-wide">{q?.seniority}</span>
            <span className="rounded bg-muted px-2 py-0.5">{q?.category}</span>
            <span className="ml-auto inline-flex items-center gap-1"><Timer className="h-3 w-3" /> ~{q?.expectedMinutes} min</span>
          </div>
          <h1 className="mt-4 text-balance text-xl font-bold leading-snug tracking-tight sm:text-2xl">{q?.question}</h1>

          {/* reveal */}
          <div className="mt-6">
            {store.revealed ? (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-5">
                <p className="text-[12px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Model answer</p>
                <p className="mt-2 text-[14px] leading-relaxed text-foreground/90">{q?.shortAnswer}</p>
                <details className="group mt-3">
                  <summary className="cursor-pointer text-[12.5px] font-medium text-primary">Detailed explanation</summary>
                  <div className="df-prose mt-2 text-[13.5px]" dangerouslySetInnerHTML={{ __html: q?.detailedAnswer ?? '' }} />
                </details>
              </div>
            ) : (
              <Button variant="outline" className="h-10 px-5" onClick={store.reveal}>
                <Eye className="h-4 w-4" /> Think first, then reveal the answer
              </Button>
            )}
          </div>

          {/* grading */}
          {store.revealed && (
            <div className="mt-6 rounded-xl border bg-card p-4">
              <p className="text-[12.5px] font-medium text-muted-foreground">How well did you know this?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button className="gap-1.5" onClick={() => { store.answer('KNOWN'); store.next(); }}>
                  <CheckCircle2 className="h-4 w-4" /> I knew it
                </Button>
                <Button variant="secondary" className="gap-1.5" onClick={() => { store.answer('DIFFICULT'); store.next(); }}>
                  <AlertTriangle className="h-4 w-4" /> Difficult — flag it
                </Button>
                <Button variant="ghost" className="gap-1.5 text-muted-foreground" onClick={() => { store.answer('SKIPPED'); store.next(); }}>
                  <SkipForward className="h-4 w-4" /> Skip
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* footer nav */}
        <div className="mt-auto flex items-center justify-between pt-10">
          <Button variant="ghost" size="sm" disabled={current === 0} onClick={store.prev}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <div className="flex gap-1.5">
            {questions.map((_, i) => {
              const a = answers[questions[i].id];
              return (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 w-4 rounded-full transition-colors',
                    a?.result === 'KNOWN' ? 'bg-emerald-500' : a?.result === 'DIFFICULT' ? 'bg-amber-500' : a?.result === 'SKIPPED' ? 'bg-zinc-400/50' : i === current ? 'bg-primary' : 'bg-muted',
                  )}
                />
              );
            })}
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={() => { if (current < questions.length - 1) { store.answer('SKIPPED'); store.next(); } else complete.mutate(); }}
          >
            {current < questions.length - 1 ? (<>Skip <ChevronRight className="h-4 w-4" /></>) : (<>Finish <Flag className="h-4 w-4" /></>)}
          </Button>
        </div>
      </main>

      {/* exit confirm */}
      {exitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-2xl">
            <h2 className="text-[15px] font-semibold">End this session?</h2>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              {answered} of {questions.length} answered. Progress up to this point is kept, the session is marked abandoned.
            </p>
            <div className="mt-5 flex gap-2">
              <Button
                variant="destructive" className="flex-1"
                onClick={async () => {
                  await completeInterviewAction({
                    attemptId: store.attemptId!,
                    results: store.questions.map((qq) => ({ questionId: qq.id, result: store.answers[qq.id]?.result ?? 'SKIPPED', secondsSpent: 0, confidence: 3 })),
                    abandon: true,
                  });
                  store.reset();
                  navigate('/interview');
                }}
              >
                End session
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setExitConfirm(false)}>Keep going</Button>
            </div>
          </div>
        </div>
      )}

      {/* results overlay */}
      {finished && <SessionResults />}
    </div>
  );
}

// ---------------- results ----------------
interface AttemptResult {
  ok: boolean; score?: number;
  attempt?: { id: string; score: number; knownCount: number; difficultCount: number; skippedCount: number; totalQuestions: number; durationSeconds: number; strongTopics: string[]; weakTopics: string[] };
  unlocked?: { key: string; title: string; description: string; xpReward: number }[];
}

function SessionResults() {
  const store = useInterviewStore();
  const result = store.attemptResult;
  if (!result?.attempt) return null;
  const a = result.attempt;
  const grade = a.score >= 85 ? 'excellent' : a.score >= 70 ? 'good' : a.score >= 50 ? 'fair' : 'needs-work';

  const recommendedArticles = a.weakTopics.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-4 backdrop-blur sm:p-8">
      <div className="mx-auto max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-500">
        <div className="rounded-2xl border bg-card p-8 text-center shadow-xl">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-600/30">
            <Trophy className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Interview score</h1>
          <p className={cn(
            'mt-3 text-6xl font-bold tabular-nums tracking-tight',
            a.score >= 70 ? 'text-emerald-500' : a.score >= 50 ? 'text-amber-500' : 'text-rose-500',
          )}>
            {a.score}<span className="text-3xl">%</span>
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {a.knownCount} known · {a.difficultCount} difficult · {a.skippedCount} skipped · {Math.round(a.durationSeconds / 60)} min
          </p>
          <ProgressBar percent={a.score} color={a.score >= 70 ? 'emerald' : a.score >= 50 ? 'amber' : 'rose'} className="mx-auto mt-5 max-w-xs" />

          {result.unlocked && result.unlocked.length > 0 && (
            <div className="mx-auto mt-5 max-w-sm rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-3.5 text-left">
              {result.unlocked.map((u) => (
                <p key={u.key} className="flex items-center gap-2 text-[13px] font-medium">
                  <PartyPopper className="h-4 w-4 shrink-0 text-amber-500" />
                  Achievement unlocked: {u.title} <span className="text-muted-foreground">+{u.xpReward} XP</span>
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" /> Strong areas
            </h2>
            <ul className="mt-3 space-y-1.5">
              {a.strongTopics.slice(0, 5).map((t) => <li key={t} className="flex items-center gap-2 text-[13px]"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {t}</li>)}
              {a.strongTopics.length === 0 && <li className="text-[13px] text-muted-foreground">Complete more questions to find strengths.</li>}
            </ul>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-rose-500">
              <TrendingDown className="h-4 w-4" /> Weak areas
            </h2>
            <ul className="mt-3 space-y-1.5">
              {a.weakTopics.slice(0, 5).map((t) => <li key={t} className="flex items-center gap-2 text-[13px]"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> {t}</li>)}
              {a.weakTopics.length === 0 && <li className="text-[13px] text-muted-foreground">Nothing flagged — nice.</li>}
            </ul>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-primary/25 bg-primary/[0.04] p-5">
          <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-primary">
            <BookOpen className="h-4 w-4" /> Recommended learning
          </h2>
          {recommendedArticles.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {recommendedArticles.map((t) => (
                <li key={t}>
                  <Link href={`/search?q=${encodeURIComponent(t)}`} className="text-[13.5px] font-medium text-primary hover:underline">
                    Study: {t} →
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[13px] text-muted-foreground">
              {grade === 'excellent' ? 'Out of targets for now — keep the streak alive with the daily challenge.' : 'Flag difficult topics during sessions to unlock targeted recommendations.'}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Button onClick={() => { store.reset(); navigate('/interview'); }}>
            <RotateCcw className="h-4 w-4" /> Back to interview hub
          </Button>
          <Button variant="outline" onClick={() => { store.reset(); navigate('/dashboard'); }}>
            View dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

