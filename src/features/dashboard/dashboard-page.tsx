'use client';

// ============================================================
// Dev Prep — Developer dashboard: XP/level, streak, skill
// graph bars, activity chart (Recharts), readiness, recommendations,
// achievements, enrolled paths, notifications feed.
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, navigate } from '@/router';
import { getDashboardAction, completeDailyChallengeLearningAction, markNotificationsReadAction } from '@/server/actions/learning';
import { useSession } from '@/providers/app-providers';
import { TechIcon, StatCard, ProgressBar, EmptyState, SectionHeading } from '@/components/shared/primitives';
import { dynamicIconImport } from '@/components/shared/dynamic-icon';
import { levelProgress } from '@/lib/design';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/shared/primitives';
import { AreaChart, Area, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Flame, Target, Zap, CalendarCheck, CheckCircle2, Lock, TrendingUp, Sparkles, Bell,
} from 'lucide-react';

export function DashboardPage() {
  const { user, isLoading: sessionLoading } = useSession();
  const queryClient = useQueryClient();
  const { data: dash, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardAction,
    enabled: !!user,
  });

  const daily = useMutation({
    mutationFn: completeDailyChallengeLearningAction,
    onSuccess: () => {
      toast.success('Daily challenge completed · +30 XP');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
  const markRead = useMutation({
    mutationFn: markNotificationsReadAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (sessionLoading) return <DashboardSkeleton />;
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <EmptyState
          icon="lock" title="Your dashboard awaits"
          description="Sign in to track progress, keep streaks alive and build your skill graph. Try the demo account — credentials are prefilled on the sign-in page."
          action={<Button asChild><Link href="/login">Sign in</Link></Button>}
        />
      </div>
    );
  }
  if (isLoading || !dash) return <DashboardSkeleton />;

  const lp = levelProgress(user.xp);
  const maxActivity = Math.max(1, ...dash.activityByDay.map((d) => d.xp));
  const chartData = dash.activityByDay.slice(-14).map((d) => ({
    ...d, label: new Date(d.day + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} color={user.avatarColor} size="lg" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user.name.split(' ')[0]}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[12.5px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <Zap className="h-3.5 w-3.5 text-amber-500" /> Level {lp.level} · {user.xp.toLocaleString()} XP
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="inline-flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-orange-500" /> {user.streakCount}-day streak
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="inline-flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Readiness {dash.stats.readiness}%</span>
            </div>
            <ProgressBar percent={lp.percent} className="mt-2.5 w-56" />
            <p className="mt-1 text-[11px] text-muted-foreground">{lp.current} / {lp.needed} XP to level {lp.level + 1}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => daily.mutate()} disabled={dash.daily?.challengeCompleted || daily.isPending}>
            {dash.daily?.challengeCompleted ? <><CheckCircle2 className="h-4 w-4" /> Challenge done today</> : <><CalendarCheck className="h-4 w-4" /> Daily challenge</>}
          </Button>
          <Button variant="outline" onClick={() => navigate('/interview')}>
            <Target className="h-4 w-4" /> Practice
          </Button>
        </div>
      </div>

      {/* stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Articles completed" value={dash.stats.completedArticles} sub={`${dash.stats.articlesRead} in progress`} icon="book-open" accent="violet" />
        <StatCard label="Questions answered" value={dash.stats.questionsAnswered} sub={`${dash.stats.attempts} interview sessions`} icon="list-checks" accent="cyan" />
        <StatCard label="Avg interview score" value={`${dash.stats.avgScore}%`} sub={`Readiness ${dash.stats.readiness}%`} icon="target" accent={dash.stats.avgScore >= 70 ? 'emerald' : 'amber'} />
        <StatCard label="Library" value={dash.stats.bookmarks} sub={`${dash.stats.notes} personal notes`} icon="bookmark" accent="rose" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* left column */}
        <div className="space-y-8">
          {/* skill graph */}
          <section className="rounded-2xl border bg-card p-6">
            <SectionHeading
              title="Developer skill graph"
              subtitle="Computed from completed articles and graded interview answers."
            />
            <div className="space-y-4">
              {dash.skillGraph.map((s, i) => (
                <motion.div key={s.slug} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="mb-1.5 flex items-center gap-2.5">
                    <TechIcon icon={s.icon} color={s.color} className="h-7 w-7" />
                    <Link href={`/technologies/${s.slug}`} className="text-[13.5px] font-medium hover:text-primary">{s.name}</Link>
                    <span className="ml-auto text-[12.5px] font-semibold tabular-nums">{s.percent}%</span>
                  </div>
                  <div className="flex gap-[2px]">
                    {[...Array(10)].map((_, b) => (
                      <div
                        key={b}
                        className={cn('h-3 flex-1 rounded-[3px] transition-colors', b * 10 < s.percent ? s.color === 'zinc' ? 'bg-zinc-500' : 'bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'bg-muted')}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
            {dash.skillGraph.length > 0 && (
              <p className="mt-4 text-[12px] text-muted-foreground">
                <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
                Next skill: push <span className="font-medium text-foreground">{[...dash.skillGraph].sort((a, b) => a.percent - b.percent)[0].name}</span> past 50% — recommended articles below.
              </p>
            )}
          </section>

          {/* activity chart */}
          <section className="rounded-2xl border bg-card p-6">
            <SectionHeading title="Learning activity" subtitle="XP earned and questions answered over the last 14 days." />
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.55 0.22 292)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="oklch(0.55 0.22 292)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.01 270 / 0.15)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'oklch(0.55 0.01 270)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: 'oklch(0.55 0.01 270)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid oklch(0.3 0.01 270)', background: 'oklch(0.2 0.01 275)', fontSize: 12, color: 'oklch(0.93 0.006 270)' }}
                    labelStyle={{ color: 'oklch(0.65 0.012 270)' }}
                  />
                  <Area type="monotone" dataKey="xp" stroke="oklch(0.62 0.21 292)" strokeWidth={2} fill="url(#xpGrad)" name="XP" />
                  <Area type="monotone" dataKey="questions" stroke="oklch(0.68 0.13 180)" strokeWidth={1.5} fill="transparent" name="Questions" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-[11px] text-muted-foreground">Peak day: {maxActivity} XP — consistency beats intensity.</p>
          </section>

          {/* recommendations */}
          <section className="rounded-2xl border bg-card p-6">
            <SectionHeading title="Recommended for you" subtitle={dash.recommendations.reason} />
            <div className="grid gap-3 sm:grid-cols-3">
              {dash.recommendations.articles.map((a) => (
                <Link key={a.id} href={`/articles/${a.slug}`} className="group rounded-xl border bg-background/50 p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">{a.technology?.name}</p>
                  <h3 className="df-line-clamp-2 mt-1.5 text-[13px] font-semibold leading-snug group-hover:text-primary">{a.title}</h3>
                  <p className="mt-2 text-[10.5px] text-muted-foreground">{a.readingTime} min · {a.difficulty}</p>
                </Link>
              ))}
              {dash.recommendations.articles.length === 0 && <p className="text-[13px] text-muted-foreground">Mark difficult topics in interviews to unlock recommendations.</p>}
            </div>
          </section>
        </div>

        {/* right column */}
        <div className="space-y-8">
          {/* achievements */}
          <section className="rounded-2xl border bg-card p-6">
            <SectionHeading title="Achievements" subtitle={`${dash.achievements.filter((a) => a.earned).length} of ${dash.achievements.length} unlocked`} />
            <div className="grid grid-cols-4 gap-2.5">
              {dash.achievements.map((a) => (
                <div
                  key={a.key}
                  title={a.earned ? `${a.title} — ${a.description}` : `${a.title} — locked: ${a.description}`}
                  className={cn(
                    'flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border p-1.5 text-center transition-all',
                    a.earned ? 'border-amber-500/30 bg-amber-500/[0.06]' : 'border-border bg-muted/40 opacity-50 grayscale',
                  )}
                >
                  {a.earned ? dynamicIconImport(a.icon, 'h-4.5 w-4.5 text-amber-500') : <Lock className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-[8.5px] leading-tight font-medium">{a.title.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </section>

          {/* enrolled paths */}
          {dash.enrolledPaths.length > 0 && (
            <section className="rounded-2xl border bg-card p-6">
              <SectionHeading title="Your paths" />
              <div className="space-y-3.5">
                {dash.enrolledPaths.map((p) => (
                  <Link key={p.id} href={`/learning-paths/${p.slug}`} className="group block">
                    <div className="flex items-center gap-2.5">
                      <TechIcon icon={p.icon} color={p.color} className="h-8 w-8" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium group-hover:text-primary">{p.title}</p>
                        <ProgressBar percent={p.progress?.percent ?? 0} color={p.color} className="mt-1.5" />
                      </div>
                      <span className="text-[11.5px] font-semibold tabular-nums text-muted-foreground">{p.progress?.percent ?? 0}%</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* recent attempts */}
          {dash.recentAttempts.length > 0 && (
            <section className="rounded-2xl border bg-card p-6">
              <SectionHeading title="Recent interviews" action={<Link href="/interview" className="text-[12.5px] font-medium text-primary hover:underline">All →</Link>} />
              <div className="space-y-2.5">
                {dash.recentAttempts.slice(0, 4).map((a) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-[12px] font-bold tabular-nums',
                      a.score >= 80 ? 'bg-emerald-500/10 text-emerald-500' : a.score >= 60 ? 'bg-amber-500/10 text-amber-500' : a.score > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-muted text-muted-foreground')}>
                      {a.score > 0 ? a.score : '—'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium">{a.technology?.name ?? 'Mixed'} · {a.mode}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* recent activity */}
          <section className="rounded-2xl border bg-card p-6">
            <SectionHeading title="Activity feed" />
            <ul className="space-y-2.5">
              {dash.recentActivity.slice(0, 8).map((a) => (
                <li key={a.id} className="flex items-start gap-2.5 text-[12.5px]">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                    {dynamicIconImport(a.type === 'INTERVIEW_ATTEMPT' ? 'swords' : a.type === 'ACHIEVEMENT' ? 'award' : 'book-open', 'h-3 w-3 text-muted-foreground')}
                  </span>
                  <div className="min-w-0">
                    <p className="leading-snug">{a.title ?? a.type}</p>
                    <p className="text-[10.5px] text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{a.xp > 0 && ` · +${a.xp} XP`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* notifications */}
          <section className="rounded-2xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight"><Bell className="h-4 w-4" /> Notifications</h2>
              {dash.notifications.some((n) => !n.read) && (
                <button className="text-[12px] font-medium text-primary hover:underline" onClick={() => markRead.mutate()}>Mark read</button>
              )}
            </div>
            <ul className="space-y-2.5">
              {dash.notifications.slice(0, 5).map((n) => (
                <li key={n.id}>
                  <Link href={n.link ?? '#/dashboard'} className={cn('block rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50', !n.read && 'bg-primary/[0.04]')}>
                    <p className="text-[12.5px] font-medium leading-snug">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-[11.5px] text-muted-foreground">{n.body}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-4"><Skeleton className="h-12 w-12 rounded-full" /><div><Skeleton className="h-6 w-56" /><Skeleton className="mt-2 h-4 w-72" /></div></div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}
