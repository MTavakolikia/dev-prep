'use client';

// ============================================================
// Dev Prep — CMS analytics overview: Recharts dashboards with
// time-range filter, growth charts, top content, taxonomy mix.
// ============================================================
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, navigate } from '@/router';
import { getAdminOverviewAction } from '@/server/actions/admin';
import { StatCard, ProgressBar } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { tokens } from '@/lib/design';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Users, FileText, ListChecks, Swords, TrendingUp, Plus, Activity, MessageSquare,
} from 'lucide-react';

const RANGES = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
] as const;

export function AdminOverview() {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-overview', range],
    queryFn: () => getAdminOverviewAction(range),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const chartData = data.viewsByDay.map((d) => ({ ...d, label: new Date(d.day + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }));
  const pieColors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#f43f5e', '#10b981', '#ec4899'];

  return (
    <div>
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Content overview</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Real-time platform health across content, users and interviews.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={cn('rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors', range === r.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => navigate('/admin/articles/new')}>
            <Plus className="h-4 w-4" /> New article
          </Button>
        </div>
      </div>

      {/* totals */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={data.totals.users.toLocaleString()} sub={`${data.totals.activeUsers} active this period`} icon="users" accent="violet" />
        <StatCard label="Total views" value={data.totals.views.toLocaleString()} sub="all-time article views" icon="eye" accent="cyan" />
        <StatCard label="Articles" value={data.totals.articles.toLocaleString()} sub={`${data.totals.published} published · ${data.totals.drafts} drafts`} icon="file-text" accent="emerald" />
        <StatCard label="Interview sessions" value={data.totals.attempts.toLocaleString()} sub={`avg score ${data.totals.avgScore}%`} icon="swords" accent="amber" />
        <StatCard label="Question bank" value={data.totals.questions.toLocaleString()} sub="with model answers" icon="list-checks" accent="rose" />
        <StatCard label="Bookmarks" value={data.totals.bookmarks.toLocaleString()} sub="saved by readers" icon="bookmark" accent="fuchsia" />
        <StatCard label="Comments" value={data.totals.comments.toLocaleString()} sub="community discussion" icon="message-square" accent="teal" />
        <StatCard label="Engagement" value={`${Math.round((data.totals.bookmarks / Math.max(1, data.totals.views)) * 1000) / 10}%`} sub="bookmark-to-view ratio" icon="trending-up" accent="orange" />
      </div>

      {/* traffic chart */}
      <section className="mt-6 rounded-2xl border bg-card p-5">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold">
          <Activity className="h-4 w-4 text-primary" /> Traffic
          <span className="ml-auto flex items-center gap-3 text-[11px] font-normal text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-500" /> Page views</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-500" /> Article views</span>
          </span>
        </h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="av" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.01 270 / 0.14)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'oklch(0.55 0.01 270)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={28} />
              <YAxis tick={{ fontSize: 10, fill: 'oklch(0.55 0.01 270)' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip contentStyle={{ borderRadius: 10, border: '1px solid oklch(0.3 0.01 270)', background: 'oklch(0.2 0.01 275)', fontSize: 12, color: 'oklch(0.93 0.006 270)' }} labelStyle={{ color: 'oklch(0.65 0.012 270)' }} />
              <Area type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={2} fill="url(#pv)" name="Page views" />
              <Area type="monotone" dataKey="articles" stroke="#06b6d4" strokeWidth={2} fill="url(#av)" name="Article views" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* top articles */}
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold"><FileText className="h-4 w-4 text-primary" /> Top performing articles</h2>
          <div className="mt-4 space-y-3">
            {data.topArticles.map((a, i) => (
              <div key={a.id} className="flex items-center gap-3">
                <span className="w-5 text-center font-mono text-[12px] font-bold text-muted-foreground/60">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <Link href={`/articles/${a.slug}`} className="df-line-clamp-1 text-[13px] font-medium hover:text-primary">{a.title}</Link>
                  <ProgressBar percent={(a.views / Math.max(1, data.topArticles[0].views)) * 100} className="mt-1.5 h-1" />
                </div>
                <span className="shrink-0 text-[11.5px] font-semibold tabular-nums text-muted-foreground">{a.views.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>

        {/* tech popularity */}
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold"><TrendingUp className="h-4 w-4 text-primary" /> Articles per technology</h2>
          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.techPopularity} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.01 270 / 0.14)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9.5, fill: 'oklch(0.55 0.01 270)' }} tickLine={false} axisLine={false} interval={0} angle={-28} textAnchor="end" height={54} />
                <YAxis tick={{ fontSize: 10, fill: 'oklch(0.55 0.01 270)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip contentStyle={{ borderRadius: 10, border: '1px solid oklch(0.3 0.01 270)', background: 'oklch(0.2 0.01 275)', fontSize: 12, color: 'oklch(0.93 0.006 270)' }} labelStyle={{ color: 'oklch(0.65 0.012 270)' }} />
                <Bar dataKey="articles" radius={[5, 5, 0, 0]}>
                  {data.techPopularity.map((t, i) => (
                    <Cell key={i} fill={['#8b5cf6', '#06b6d4', '#f59e0b', '#f43f5e', '#10b981', '#ec4899', '#f97316', '#14b8a6'][i % 8]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* status mix */}
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-[14px] font-semibold">Content status mix</h2>
          <div className="mt-2 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.statusBreakdown} dataKey="count" nameKey="status" innerRadius={54} outerRadius={84} paddingAngle={3} strokeWidth={0}>
                  {data.statusBreakdown.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
                <ChartTooltip contentStyle={{ borderRadius: 10, border: '1px solid oklch(0.3 0.01 270)', background: 'oklch(0.2 0.01 275)', fontSize: 12, color: 'oklch(0.93 0.006 270)' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* signups + interview modes */}
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold"><Users className="h-4 w-4 text-primary" /> New signups</h2>
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.signups} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.01 270 / 0.14)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 9.5, fill: 'oklch(0.55 0.01 270)' }} tickLine={false} axisLine={false} tickFormatter={(d: string) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} minTickGap={40} />
                <YAxis tick={{ fontSize: 10, fill: 'oklch(0.55 0.01 270)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip contentStyle={{ borderRadius: 10, border: '1px solid oklch(0.3 0.01 270)', background: 'oklch(0.2 0.01 275)', fontSize: 12, color: 'oklch(0.93 0.006 270)' }} labelStyle={{ color: 'oklch(0.65 0.012 270)' }} />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Signups" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1.5">
            {data.interviewStats.map((s) => (
              <div key={s.mode} className="flex items-center gap-2 text-[12.5px]">
                <Swords className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="capitalize">{s.mode}</span>
                <span className="ml-auto tabular-nums text-muted-foreground">{s.count} sessions · avg {s.avgScore}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* recent activity */}
      <section className="mt-6 rounded-2xl border bg-card p-5">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold"><Activity className="h-4 w-4 text-primary" /> Recent platform activity</h2>
        <ul className="mt-4 divide-y">
          {data.recentActivity.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-2.5 text-[13px]">
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-muted-foreground">{a.type.replace('_', ' ')}</span>
              <span className="min-w-0 flex-1 truncate">{a.title}</span>
              <span className="shrink-0 text-[12px] text-muted-foreground">{a.user}</span>
              <span className="hidden shrink-0 text-[11px] text-muted-foreground/70 sm:block">{new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
