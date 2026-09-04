'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, navigate, buildPath } from '@/router';
import { searchAction, getTrendingSearchesAction } from '@/server/actions/content';
import { ArticleCard, ArticleRow } from '@/components/shared/article-card';
import { TechIcon, EmptyState, Skeleton } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp, FileText, ListChecks, Layers, Route as RouteIcon } from 'lucide-react';

export function SearchPage() {
  const route = useRoute();
  const q = route.query.q ?? '';
  const tech = route.query.tech ?? '';
  const [input, setInput] = useState(q);
  const [lastExternal, setLastExternal] = useState(q);
  if (lastExternal !== q) {
    setLastExternal(q);
    setInput(q);
  }

  const { data: trending } = useQuery({ queryKey: ['trending-searches'], queryFn: getTrendingSearchesAction });
  const { data, isLoading } = useQuery({
    queryKey: ['search', q, tech],
    queryFn: () => searchAction(q, { technology: tech || undefined }),
    enabled: q.length > 0,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
        <Search className="h-6 w-6 text-primary" /> Search
      </h1>

      <form
        className="relative mt-6 max-w-2xl"
        onSubmit={(e) => { e.preventDefault(); navigate(buildPath('/search', { q: input || undefined, tech: tech || undefined })); }}
      >
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Search articles, questions, technologies, paths…"
          className="h-12 pl-10 text-[15px]"
          aria-label="Search query"
          autoFocus
        />
      </form>

      {!q ? (
        <div className="mt-10 max-w-2xl">
          <h2 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" /> Trending searches
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {trending?.map((t) => (
              <button
                key={t}
                onClick={() => navigate(`/search?q=${encodeURIComponent(t)}`)}
                className="rounded-full border bg-card px-3.5 py-1.5 text-[12.5px] transition-colors hover:border-primary/40 hover:text-primary"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      ) : isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}</div>
      ) : data && data.total > 0 ? (
        <div className="mt-8 space-y-10">
          {data.technologies.length > 0 && (
            <section>
              <h2 className="text-[15px] font-semibold">Technologies <span className="text-[12px] font-normal text-muted-foreground">({data.technologies.length})</span></h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {data.technologies.map((t) => (
                  <button key={t.slug} onClick={() => navigate(`/technologies/${t.slug}`)} className="flex items-center gap-2.5 rounded-xl border bg-card p-3 text-left transition-all hover:border-primary/30 hover:shadow-md">
                    <TechIcon icon={t.icon} color={t.color} className="h-8 w-8" />
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-semibold">{t.name}</p>
                      <p className="text-[10.5px] text-muted-foreground">{t.articleCount} articles</p>
                    </div>
                    <Layers className="ml-auto h-3 w-3 text-muted-foreground/40" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {data.articles.length > 0 && (
            <section>
              <h2 className="text-[15px] font-semibold">Articles <span className="text-[12px] font-normal text-muted-foreground">({data.articles.length})</span></h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.articles.map((a, i) => <ArticleCard key={a.id} article={a} index={i} />)}
              </div>
            </section>
          )}

          {data.questions.length > 0 && (
            <section>
              <h2 className="text-[15px] font-semibold">Interview questions <span className="text-[12px] font-normal text-muted-foreground">({data.questions.length})</span></h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {data.questions.map((q) => (
                  <div key={q.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <ListChecks className="h-3.5 w-3.5" /> {q.technology.name} · {q.seniority}
                    </div>
                    <p className="mt-2 text-[13.5px] font-medium leading-snug">{q.question}</p>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{q.shortAnswer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.paths.length > 0 && (
            <section>
              <h2 className="text-[15px] font-semibold">Learning paths <span className="text-[12px] font-normal text-muted-foreground">({data.paths.length})</span></h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {data.paths.map((p) => (
                  <button key={p.slug} onClick={() => navigate(`/learning-paths/${p.slug}`)} className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-md">
                    <RouteIcon className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-semibold">{p.title}</p>
                      <p className="df-line-clamp-1 text-[12px] text-muted-foreground">{p.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState icon="search-x" title={`No results for "${q}"`} description="Check spelling or try a broader term — the search index covers every article and question." />
        </div>
      )}
    </div>
  );
}

export { FileText };
