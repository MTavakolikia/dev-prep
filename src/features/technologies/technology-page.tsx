'use client';

// ============================================================
// Dev Prep — Technology page: overview, your progress, articles
// by level, interview questions, related technologies.
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { Link } from '@/router';
import { getTechnologyAction, listArticlesAction } from '@/server/actions/content';
import { listQuestionsAction } from '@/server/actions/interview';
import { listPathsAction } from '@/server/actions/learning';
import { TechIcon, DifficultyBadge, ProgressBar, Breadcrumbs, EmptyState, Skeleton } from '@/components/shared/primitives';
import { ArticleCard } from '@/components/shared/article-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { tokens } from '@/lib/design';

import { BookOpen, ListChecks, Link2, GraduationCap } from 'lucide-react';

export function TechnologyPage({ slug }: { slug: string }) {
  const { data: tech, isLoading, isError } = useQuery({
    queryKey: ['technology', slug],
    queryFn: () => getTechnologyAction(slug),
    retry: false,
  });
  const { data: articles } = useQuery({
    queryKey: ['tech-articles', slug],
    queryFn: () => listArticlesAction({ technology: slug, pageSize: 8, sort: 'popular' }),
    enabled: !!tech,
  });
  const { data: questions } = useQuery({
    queryKey: ['tech-questions', slug],
    queryFn: () => listQuestionsAction({ technology: slug }),
    enabled: !!tech,
  });
  const { data: paths } = useQuery({
    queryKey: ['paths'],
    queryFn: listPathsAction,
  });
  const techPaths = paths?.filter((p) => p.technology?.slug === slug) ?? [];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-4 h-10 w-72" />
        <Skeleton className="mt-3 h-5 w-full max-w-xl" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }
  if (isError || !tech) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <EmptyState icon="search-x" title="Technology not found" action={<Button asChild><Link href="/technologies">All technologies</Link></Button>} />
      </div>
    );
  }

  const t = tokens(tech.color);
  const related = tech.related.map((r) => ({ slug: r }));

  return (
    <div>
      {/* hero */}
      <section className="relative overflow-hidden border-b">
        <div className={cn('pointer-events-none absolute -top-24 right-0 h-56 w-[30rem] rounded-full opacity-[0.12] blur-3xl', t.solid)} />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Technologies', href: '/technologies' }, { label: tech.name }]} />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3.5">
                <TechIcon icon={tech.icon} color={tech.color} className="h-12 w-12" />
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{tech.name}</h1>
                  <p className="text-[12.5px] capitalize text-muted-foreground">{tech.categoryName} · {tech.difficulty} track</p>
                </div>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{tech.longDescription ?? tech.description}</p>
            </div>
            <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:w-auto">
              <div className="rounded-xl border bg-card p-4">
                <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground"><BookOpen className="h-3.5 w-3.5" /> Articles</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{tech.articleCount}</p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground"><ListChecks className="h-3.5 w-3.5" /> Questions</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{tech.questionCount}</p>
              </div>
              {tech.userProgress && (
                <div className="col-span-2 rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between text-[11.5px] font-medium text-muted-foreground">
                    <span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Your progress</span>
                    <span className="tabular-nums">{tech.userProgress.percent}%</span>
                  </div>
                  <ProgressBar percent={tech.userProgress.percent} color={tech.color} className="mt-2" />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">{tech.userProgress.completed} of {tech.userProgress.total} tracked articles completed</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* content */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Tabs defaultValue="articles">
          <TabsList className="h-10">
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="questions">Interview questions</TabsTrigger>
            {techPaths.length > 0 && <TabsTrigger value="paths">Learning paths</TabsTrigger>}
            <TabsTrigger value="related">Related</TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {articles?.articles.slice(0, 8).map((a, i) => <ArticleCard key={a.id} article={a} index={i} />)}
            </div>
            <Button variant="outline" className="mt-6" asChild>
              <Link href={`/articles?tech=${slug}`}>Browse all {tech.name} articles →</Link>
            </Button>
          </TabsContent>

          <TabsContent value="questions" className="mt-6">
            <div className="grid gap-3 md:grid-cols-2">
              {questions?.questions.slice(0, 8).map((q) => (
                <div key={q.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-bold uppercase">{q.seniority}</span>
                    <span>{q.category}</span>
                    <span className="ml-auto">{q.expectedMinutes} min</span>
                  </div>
                  <p className="mt-2 text-[13.5px] font-medium leading-snug">{q.question}</p>
                  <details className="group mt-2.5">
                    <summary className="cursor-pointer text-[12px] font-medium text-primary">Reveal answer</summary>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{q.shortAnswer}</p>
                  </details>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-6" asChild>
              <Link href="/questions">Open the question bank →</Link>
            </Button>
          </TabsContent>

          {techPaths.length > 0 && (
            <TabsContent value="paths" className="mt-6">
              <div className="grid gap-3 md:grid-cols-2">
                {techPaths.map((p) => (
                  <Link key={p.id} href={`/learning-paths/${p.slug}`} className="group rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <TechIcon icon={p.icon} color={p.color} className="h-9 w-9" />
                      <div>
                        <h3 className="text-[14px] font-semibold group-hover:text-primary">{p.title}</h3>
                        <p className="text-[11.5px] text-muted-foreground">{p.itemCount} steps · ~{p.estimatedHours}h</p>
                      </div>
                    </div>
                    {p.progress && p.progress.percent > 0 && (
                      <div className="mt-3">
                        <ProgressBar percent={p.progress.percent} color={p.color} />
                        <p className="mt-1 text-[11px] text-muted-foreground">{p.progress.percent}% complete</p>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </TabsContent>
          )}

          <TabsContent value="related" className="mt-6">
            <RelatedTechs slugs={related.map((r) => r.slug)} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function RelatedTechs({ slugs }: { slugs: string[] }) {
  const { data: techs } = useQuery({ queryKey: ['technologies'], queryFn: () => import('@/server/actions/content').then((m) => m.listTechnologiesAction()) });
  const related = techs?.filter((t) => slugs.includes(t.slug)) ?? [];
  if (related.length === 0) return <p className="text-sm text-muted-foreground">Related topics coming soon.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {related.map((t) => (
        <Link key={t.slug} href={`/technologies/${t.slug}`} className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md">
          <TechIcon icon={t.icon} color={t.color} className="h-9 w-9" />
          <div className="min-w-0">
            <h3 className="truncate text-[13.5px] font-semibold group-hover:text-primary">{t.name}</h3>
            <p className="text-[11px] text-muted-foreground">{t.articleCount} articles</p>
          </div>
          <Link2 className="ml-auto h-3.5 w-3.5 text-muted-foreground/50" />
        </Link>
      ))}
    </div>
  );
}

