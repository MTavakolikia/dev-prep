'use client';

// ============================================================
// Dev Prep — Homepage: hero, live platform stats, trending
// technologies, featured + trending + latest articles,
// interview prep, learning paths, popular questions, newsletter.
// ============================================================
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@/router';
import { getHomeAction, listTechnologiesAction } from '@/server/actions/content';
import { listPathsAction } from '@/server/actions/learning';
import { ArticleCard, ArticleRow } from '@/components/shared/article-card';
import { TechIcon, SectionHeading, SkeletonCard } from '@/components/shared/primitives';
import { dynamicIconImport } from '@/components/shared/dynamic-icon';
import { tokens } from '@/lib/design';
import { cn } from '@/lib/utils';
import { useSession } from '@/providers/app-providers';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowRight, Swords, Route, ListChecks, Sparkles, Flame, Zap,
  Target, TrendingUp, CheckCircle2, Mail,
} from 'lucide-react';

type HomeData = Awaited<ReturnType<typeof getHomeAction>>;
type TechList = Awaited<ReturnType<typeof listTechnologiesAction>>;
type PathList = Awaited<ReturnType<typeof listPathsAction>>;

export function HomePage() {
  const { data, isLoading } = useQuery({ queryKey: ['home'], queryFn: getHomeAction });
  const { data: techs, isLoading: techsLoading } = useQuery({ queryKey: ['technologies'], queryFn: () => listTechnologiesAction() });
  const { data: paths, isLoading: pathsLoading } = useQuery({ queryKey: ['paths'], queryFn: listPathsAction });

  return (
    <div>
      <Hero stats={data?.stats} />
      <TrendingTechs techs={techs?.slice(0, 8) ?? []} loading={techsLoading} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <FeaturedSection data={data} loading={isLoading} />
        <InterviewSection picks={data?.interviewPicks ?? []} loading={isLoading} />
        <PathsSection paths={paths?.slice(0, 3) ?? []} loading={pathsLoading} />
        <LatestSection data={data} loading={isLoading} />
        <QuestionsSection picks={data?.interviewPicks?.slice(3, 6) ?? []} />
        <WhySection />
        <NewsletterSection />
      </div>
    </div>
  );
}

// ---------------- Hero ----------------
function Hero({ stats }: { stats?: HomeData['stats'] }) {
  const { user } = useSession();
  return (
    <section className="relative overflow-hidden border-b">
      <div className="df-grid-bg df-hero-fade absolute inset-0" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pb-24 sm:pt-24">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-[12.5px] font-medium text-muted-foreground shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {stats ? `${stats.articles.toLocaleString()} articles · ${stats.questions.toLocaleString()} interview questions` : 'Loading live numbers…'}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}
          className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl sm:leading-[1.08]"
        >
          Master Modern <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-400 bg-clip-text text-transparent">Frontend Development</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16 }}
          className="mx-auto mt-5 max-w-xl text-balance text-[15px] leading-relaxed text-muted-foreground sm:text-base"
        >
          Learn. Practice. Prepare. Become the developer companies want to hire —
          with articles, interview simulations, learning paths and a skill graph that tracks your growth.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.24 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Button size="lg" className="h-11 px-6 text-[14px] shadow-lg shadow-primary/25" asChild>
            <Link href="/learning-paths">
              <Route className="h-4 w-4" /> Start Learning
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-11 px-6 text-[14px] border-border bg-card/60" asChild>
            <Link href="/interview">
              <Swords className="h-4 w-4" /> Practice Interview
            </Link>
          </Button>
        </motion.div>

        {user && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-5 text-[13px] text-muted-foreground">
            Welcome back, <span className="font-medium text-foreground">{user.name.split(' ')[0]}</span> — Level {user.level}, {user.streakCount}-day streak. <Link href="/dashboard" className="text-primary hover:underline">Open dashboard →</Link>
          </motion.p>
        )}

        <motion.dl
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.34 }}
          className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {[
            { icon: 'book-open', label: 'Articles', value: stats?.articles },
            { icon: 'list-checks', label: 'Questions', value: stats?.questions },
            { icon: 'layers', label: 'Technologies', value: stats?.technologies },
            { icon: 'users', label: 'Learners', value: stats?.learners },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-card/70 px-4 py-4 backdrop-blur">
              <dt className="flex items-center justify-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                {dynamicIconImport(s.icon, 'h-3.5 w-3.5')} {s.label}
              </dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums tracking-tight">
                {s.value !== undefined ? s.value.toLocaleString() : <Skeleton className="mx-auto h-7 w-14" />}
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}

// ---------------- Trending technologies ----------------
function TrendingTechs({ techs, loading }: { techs: TechList; loading: boolean }) {
  if (loading) {
    return (
      <div className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex gap-3 overflow-hidden">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-[84px] w-40 shrink-0 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }
  return (
    <section className="border-b">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <Flame className="h-4 w-4 text-amber-500" /> Trending technologies
          </h2>
          <Link href="/technologies" className="text-[13px] font-medium text-primary hover:underline">All technologies →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {techs.map((t, i) => (
            <motion.div key={t.slug} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.3 }}>
              <Link
                href={`/technologies/${t.slug}`}
                className="group flex h-full flex-col items-start gap-2.5 rounded-xl border bg-card p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <TechIcon icon={t.icon} color={t.color} className="h-9 w-9" />
                <div className="w-full">
                  <p className="truncate text-[13px] font-semibold">{t.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">{t.articleCount} articles</p>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div className={cn('h-full rounded-full bg-gradient-to-r transition-all', tokens(t.color).gradient)} style={{ width: `${t.popularity}%` }} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- Featured + trending + latest ----------------
function FeaturedSection({ data, loading }: { data: HomeData | undefined; loading: boolean }) {
  return (
    <section className="py-14">
      <SectionHeading
        title="Trending this week"
        subtitle="The most-read articles across the platform right now."
        action={<Link href="/articles?sort=trending" className="text-[13px] font-medium text-primary hover:underline">Browse all →</Link>}
      />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.trending.slice(0, 6).map((a, i) => <ArticleCard key={a.id} article={a} index={i} />)}
        </div>
      )}
    </section>
  );
}

// ---------------- Interview prep ----------------
function InterviewSection({ picks, loading }: { picks: HomeData['interviewPicks']; loading: boolean }) {
  return (
    <section className="grid gap-6 rounded-2xl border bg-gradient-to-br from-card to-primary/[0.03] p-6 sm:p-8 lg:grid-cols-[1fr_1.2fr]">
      <div className="flex flex-col items-start">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[12px] font-semibold text-primary">
          <Swords className="h-3.5 w-3.5" /> Interview Preparation
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Walk into your interview already knowing the answers.</h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
          Simulate real interviews at every level — from quick practice to full staff loops.
          The engine tracks your weak topics, computes your readiness score and tells you exactly what to study next.
        </p>
        <ul className="mt-5 space-y-2.5 text-[13.5px]">
          {['Six practice modes from 5 to 30 questions', 'Per-topic strength and weakness tracking', 'Interview readiness score with breakdown', 'Bookmark tricky questions to your library'].map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {f}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button asChild>
            <Link href="/interview"><Zap className="h-4 w-4" /> Start a session</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/questions"><ListChecks className="h-4 w-4" /> Browse the bank</Link>
          </Button>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-3">
        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
        ) : (
          <div className="divide-y">
            {picks.slice(0, 3).map((q) => (
              <Link key={q.id} href="/questions" className="group block px-2.5 py-3.5">
                <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                  <TechIcon icon={q.technology.icon} color={q.technology.color} className="h-5 w-5" />
                  {q.technology.name}
                  <span className="rounded bg-muted px-1.5 py-0.5 font-semibold uppercase tracking-wide">{q.seniority}</span>
                </div>
                <p className="mt-1.5 text-[13.5px] font-medium leading-snug transition-colors group-hover:text-primary">{q.question}</p>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-2 rounded-lg bg-muted/60 px-3 py-2.5 text-[12px] text-muted-foreground">
          <TrendingUp className="mr-1.5 inline h-3.5 w-3.5" />
          Every answer feeds your skill graph and readiness score.
        </div>
      </div>
    </section>
  );
}

// ---------------- Paths ----------------
function PathsSection({ paths, loading }: { paths: PathList; loading: boolean }) {
  return (
    <section className="py-14">
      <SectionHeading
        title="Curated learning paths"
        subtitle="Structured tracks that end with interview readiness — not just reading lists."
        action={<Link href="/learning-paths" className="text-[13px] font-medium text-primary hover:underline">All paths →</Link>}
      />
      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {paths.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.35 }}>
              <Link
                href={`/learning-paths/${p.slug}`}
                className="group flex h-full flex-col rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <TechIcon icon={p.icon} color={p.color} className="h-10 w-10" />
                  <div>
                    <h3 className="text-[15px] font-semibold leading-snug transition-colors group-hover:text-primary">{p.title}</h3>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">{p.itemCount} steps · ~{p.estimatedHours}h · {p.level}</p>
                  </div>
                </div>
                <p className="df-line-clamp-2 mt-3 text-[13px] leading-relaxed text-muted-foreground">{p.description}</p>
                <div className="mt-4 flex items-center gap-2 text-[12px] font-medium text-primary">
                  <Target className="h-3.5 w-3.5" />
                  {p.careerGoal ?? 'Level up your skills'}
                  <ArrowRight className="ml-auto h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------- Latest ----------------
function LatestSection({ data, loading }: { data: HomeData | undefined; loading: boolean }) {
  return (
    <section className="grid gap-8 py-14 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <SectionHeading title="Latest articles" subtitle="Fresh from the editors." action={<Link href="/articles?sort=newest" className="text-[13px] font-medium text-primary hover:underline">View all →</Link>} />
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {data?.latest.slice(0, 4).map((a, i) => <ArticleCard key={a.id} article={a} index={i} />)}
          </div>
        )}
      </div>
      <div>
        <SectionHeading title="Most read" />
        <div className="rounded-xl border bg-card p-2.5">
          {loading
            ? <div className="space-y-1">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            : data?.trending.slice(0, 6).map((a, i) => <ArticleRow key={a.id} article={a} rank={i + 1} index={i} />)}
        </div>
      </div>
    </section>
  );
}

// ---------------- Popular questions ----------------
function QuestionsSection({ picks }: { picks: HomeData['interviewPicks'] }) {
  if (picks.length === 0) return null;
  return (
    <section className="py-6">
      <SectionHeading title="Questions developers are practicing" subtitle="Real interview questions from the bank." action={<Link href="/questions" className="text-[13px] font-medium text-primary hover:underline">Open question bank →</Link>} />
      <div className="grid gap-3 md:grid-cols-3">
        {picks.map((q) => (
          <Link key={q.id} href="/questions" className="group rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
            <div className="flex items-center gap-2">
              <TechIcon icon={q.technology.icon} color={q.technology.color} className="h-6 w-6" />
              <span className="text-[11.5px] font-semibold text-muted-foreground">{q.technology.name}</span>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{q.seniority}</span>
            </div>
            <p className="df-line-clamp-3 mt-2.5 text-[13.5px] font-medium leading-snug transition-colors group-hover:text-primary">{q.question}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------------- Why ----------------
function WhySection() {
  const items = [
    { icon: 'book-open', title: 'Learn with intent', text: 'Every article ships with a TL;DR, code examples, common mistakes and an interview perspective — written by engineers who ship.' },
    { icon: 'swords', title: 'Practice under pressure', text: 'Interview simulations mirror real loops with scoring, timing and per-topic feedback, so recall becomes automatic.' },
    { icon: 'target', title: 'Grow visibly', text: 'A skill graph, XP, streaks and readiness scoring turn scattered studying into measurable progress.' },
  ];
  return (
    <section className="py-14">
      <div className="rounded-2xl border bg-card p-6 sm:p-10">
        <h2 className="text-center text-2xl font-bold tracking-tight">Why developers come back every day</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-[14px] text-muted-foreground">
          Learning, practice and career progression in one system — not three disconnected tools.
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {items.map((it) => (
            <div key={it.title} className="text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                {dynamicIconImport(it.icon, 'h-5 w-5 text-primary')}
              </span>
              <h3 className="mt-4 text-[15px] font-semibold">{it.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{it.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- Newsletter ----------------
function NewsletterSection() {
  const [email, setEmail] = useState('');
  return (
    <section className="pb-16">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-8 text-center sm:p-12">
        <div className="df-grid-bg absolute inset-0 opacity-40" />
        <div className="relative">
          <Mail className="mx-auto h-6 w-6 text-primary" />
          <h2 className="mt-3 text-xl font-bold tracking-tight">Your Frontend Daily</h2>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] text-muted-foreground">
            One concept, one interview question and one coding challenge — every morning.
            No noise, unsubscribe anytime.
          </p>
          <form
            className="mx-auto mt-6 flex max-w-sm gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.includes('@')) return toast.error('Enter a valid email');
              toast.success('Subscribed! Your first digest arrives tomorrow.');
              setEmail('');
            }}
          >
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
              className="h-10 flex-1 rounded-lg border bg-background px-3.5 text-sm outline-none ring-ring transition-shadow focus:ring-2"
            />
            <Button type="submit" className="h-10">Subscribe</Button>
          </form>
          <p className="mt-3 text-[11px] text-muted-foreground/70">
            <Sparkles className="mr-1 inline h-3 w-3" />AI-curated summaries of what changed across your technologies.
          </p>
        </div>
      </div>
    </section>
  );
}

