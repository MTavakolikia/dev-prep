'use client';

// ============================================================
// Dev Prep — Interview hub: readiness score, practice modes,
// weak areas, recent attempts, daily challenge.
// ============================================================
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, navigate } from '@/router';
import { getInterviewHubAction, startInterviewAction, completeDailyChallengeAction } from '@/server/actions/interview';
import { listTechnologiesAction } from '@/server/actions/content';
import { useSession } from '@/providers/app-providers';
import { useInterviewStore } from '@/stores/ui';
import { TechIcon, StatCard, SectionHeading, ProgressBar, Breadcrumbs } from '@/components/shared/primitives';
import { AuthGateDialog, GuestHint } from '@/components/shared/auth-gate';
import { dynamicIconImport } from '@/components/shared/dynamic-icon';
import { INTERVIEW_MODES, tokens } from '@/lib/design';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { SENIORITIES } from '@/types';
import { Swords, Zap, Target, History, Flame, CalendarCheck, Clock, TrendingUp, AlertTriangle, Lock } from 'lucide-react';

export function InterviewPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { data: hub, isLoading } = useQuery({ queryKey: ['interview-hub'], queryFn: () => getInterviewHubAction() });
  const { data: techs } = useQuery({ queryKey: ['technologies'], queryFn: () => listTechnologiesAction() });
  const [tech, setTech] = useState<string>('react');
  const [level, setLevel] = useState<string>('SENIOR');
  // guest gate — which account-gated action the guest just tried
  const [gate, setGate] = useState<string | null>(null);

  const start = useMutation({
    mutationFn: (mode: string) => startInterviewAction({ mode, technology: mode === 'random' ? null : tech, level }),
    onSuccess: (r, mode) => {
      if (!r.ok || !r.attemptId || !r.questions) return toast.error(r.error ?? 'Could not start session');
      useInterviewStore.getState().startSession({
        attemptId: r.attemptId, mode, level, technologySlug: mode === 'random' ? null : tech,
        questions: r.questions.map((q) => ({
          id: q.id, question: q.question, shortAnswer: q.shortAnswer, detailedAnswer: q.detailedAnswer,
          topic: q.topic, category: q.category, seniority: q.seniority, expectedMinutes: q.expectedMinutes,
          technologyName: q.technologyName, technologyIcon: q.technologyIcon, technologyColor: q.technologyColor,
        })),
      });
      navigate(`/interview/session?id=${r.attemptId}`);
    },
  });

  const daily = useMutation({
    mutationFn: completeDailyChallengeAction,
    onSuccess: (r) => {
      if (r.ok) {
        toast.success('Daily challenge completed · +30 XP');
        queryClient.invalidateQueries({ queryKey: ['interview-hub'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    },
  });

  const questionTechs = (techs ?? []).filter((t) => t.questionCount > 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Interview' }]} />

      {/* header + readiness */}
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
            <Swords className="h-6 w-6 text-primary" /> Interview preparation
          </h1>
          <p className="mt-1.5 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
            Practice with {hub?.dailyQuestion ? 'today\'s question' : 'real interview questions'}, simulate full loops,
            and let the engine surface your weak areas with targeted reading.
          </p>
        </div>

        {/* readiness card */}
        {!user && !isLoading ? (
          <div className="rounded-2xl border border-dashed bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground"><Target className="h-3.5 w-3.5" /> INTERVIEW READINESS</p>
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              Your readiness score, session history and weak areas appear here once you start practicing on an account.
            </p>
            <Button size="sm" className="mt-4 w-full gap-2" onClick={() => setGate('track your interview progress')}>
              <Lock className="h-3.5 w-3.5" /> Sign in to track progress
            </Button>
          </div>
        ) : (
        <div className="rounded-2xl border bg-gradient-to-br from-primary/[0.06] to-card p-5">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground"><Target className="h-3.5 w-3.5" /> INTERVIEW READINESS</p>
          </div>
          {isLoading ? <Skeleton className="mt-3 h-12 w-28" /> : (
            <>
              <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight">{hub?.readiness ?? 0}<span className="text-xl text-muted-foreground">%</span></p>
              <ProgressBar percent={hub?.readiness ?? 0} color={(hub?.readiness ?? 0) >= 70 ? 'emerald' : (hub?.readiness ?? 0) >= 40 ? 'amber' : 'rose'} className="mt-3" />
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/60 px-2 py-2">
                  <p className="text-[10.5px] text-muted-foreground">Sessions</p>
                  <p className="text-sm font-bold tabular-nums">{hub?.stats.attempts ?? 0}</p>
                </div>
                <div className="rounded-lg bg-muted/60 px-2 py-2">
                  <p className="text-[10.5px] text-muted-foreground">Avg score</p>
                  <p className="text-sm font-bold tabular-nums">{hub?.stats.avgScore ?? 0}%</p>
                </div>
                <div className="rounded-lg bg-muted/60 px-2 py-2">
                  <p className="text-[10.5px] text-muted-foreground">Answered</p>
                  <p className="text-sm font-bold tabular-nums">{hub?.stats.answered ?? 0}</p>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Based on session scores, question volume and learning consistency.
              </p>
            </>
          )}
        </div>
        )}
      </div>

      {/* config */}
      <div className="mt-8 flex flex-wrap items-center gap-2.5 rounded-xl border bg-card p-3">
        <span className="pl-1 text-[12.5px] font-medium text-muted-foreground">Configure:</span>
        <Select value={tech} onValueChange={setTech}>
          <SelectTrigger className="h-9 w-[170px]" aria-label="Technology"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-72">
            {questionTechs.map((t) => (
              <SelectItem key={t.slug} value={t.slug}>{t.name} ({t.questionCount})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="h-9 w-[130px]" aria-label="Seniority"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SENIORITIES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="ml-auto hidden items-center gap-1.5 text-[12px] text-muted-foreground sm:flex">
          <Lock className="h-3 w-3" /> Questions are graded on reveal — honest self-assessment feeds your graph
        </span>
      </div>

      {/* guest hint */}
      {!user && (
        <div className="mt-6">
          <GuestHint>
            You're browsing as a guest — the full question bank is open. <span className="text-foreground">Create a free account to run tracked sessions</span> and build your readiness score.
          </GuestHint>
        </div>
      )}

      {/* modes */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(INTERVIEW_MODES).map(([key, mode]) => (
          <button
            key={key}
            onClick={() => {
              if (!user) return setGate('start an interview session');
              start.mutate(key);
            }}
            disabled={start.isPending}
            className="group flex flex-col items-start rounded-xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg disabled:opacity-60"
          >
            <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg border', tokens(mode.accent).bg, tokens(mode.accent).border)}>
              {dynamicIconImport(mode.icon, cn('h-4.5 w-4.5', tokens(mode.accent).text))}
            </span>
            <span className="mt-3 text-[14.5px] font-semibold group-hover:text-primary">{mode.label}</span>
            <span className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{mode.description}</span>
            <span className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-muted-foreground">
              <Clock className="h-3 w-3" /> {mode.questions} questions
              <span className="ml-auto font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">Start →</span>
            </span>
          </button>
        ))}
      </div>

      {/* weak areas */}
      {user && (hub?.weakTopics?.length ?? 0) > 0 && (
        <section className="mt-12">
          <SectionHeading title="Your weak areas" subtitle="Flagged as difficult during sessions — repair these first." />
          <div className="flex flex-wrap gap-2">
            {hub!.weakTopics.map((w) => (
              <Link
                key={w.topic}
                href={`/search?q=${encodeURIComponent(w.topic)}`}
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/[0.07] px-3.5 py-1.5 text-[12.5px] font-medium transition-colors hover:border-amber-500/60"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                {w.topic}
                <span className="text-muted-foreground">· recommended reading →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* daily challenge + recent attempts */}
      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        <section>
          <SectionHeading title="Daily challenge" />
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-lime-500/30 bg-lime-500/10">
                <CalendarCheck className="h-4 w-4 text-lime-500" />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold">{hub?.dailyQuestion ? 'Question of the day' : 'Check back tomorrow'}</p>
                <p className="text-[11.5px] text-muted-foreground">Complete for +30 XP and streak progress</p>
              </div>
            </div>
            {hub?.dailyQuestion && (
              <>
                <p className="mt-4 rounded-lg bg-muted/60 p-3.5 text-[13px] font-medium leading-relaxed">{hub.dailyQuestion.question}</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" disabled={daily.isPending} onClick={() => user ? daily.mutate() : setGate('complete the daily challenge')}>
                    <Zap className="h-3.5 w-3.5" /> Mark complete
                  </Button>
                  <Button size="sm" variant="outline" asChild><Link href="/questions">Practice more</Link></Button>
                </div>
              </>
            )}
          </div>
        </section>

        <section>
          <SectionHeading title="Recent attempts" action={<Link href="/questions" className="text-[13px] font-medium text-primary hover:underline">Question bank →</Link>} />
          {isLoading ? <Skeleton className="h-40 rounded-xl" /> : hub && hub.attempts.length > 0 ? (
            <div className="space-y-2.5">
              {hub.attempts.map((a) => (
                <div key={a.id} className="flex items-center gap-3.5 rounded-xl border bg-card p-3.5">
                  <span className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-sm font-bold tabular-nums',
                    a.score >= 80 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                      : a.score >= 60 ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                      : a.score > 0 ? 'border-rose-500/30 bg-rose-500/10 text-rose-500'
                      : 'border-border bg-muted/50 text-muted-foreground',
                  )}>
                    {a.score > 0 ? `${a.score}` : '—'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">
                      {a.technology?.name ?? 'Mixed technologies'} · {INTERVIEW_MODES[a.mode]?.label ?? a.mode}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                      {a.level} · {new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      {a.weakTopics.length > 0 && ` · weak: ${a.weakTopics.slice(0, 2).join(', ')}`}
                    </p>
                  </div>
                  {a.status === 'COMPLETED' ? (
                    <History className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  ) : (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">abandoned</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <Swords className="mx-auto h-5 w-5 text-muted-foreground" />
              <p className="mt-2.5 text-[13.5px] font-medium">{user ? 'No attempts yet' : 'Your attempt history lives here'}</p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                {user ? 'Start with a Quick Practice — it takes 5 minutes.' : 'Sign in to run sessions and keep every score, so the engine can map your weak areas.'}
              </p>
              <Button size="sm" className="mt-4" onClick={() => { if (!user) return setGate('start an interview session'); start.mutate('quick'); }}>
                {user ? <><Zap className="h-3.5 w-3.5" /> Quick Practice</> : <><Lock className="h-3.5 w-3.5" /> Sign in to start</>}
              </Button>
            </div>
          )}
        </section>
      </div>

      <AuthGateDialog
        open={gate !== null}
        onOpenChange={(o) => { if (!o) setGate(null); }}
        feature={gate ?? 'track your progress'}
      />
    </div>
  );
}
