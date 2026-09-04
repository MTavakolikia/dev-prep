'use client';

// ============================================================
// Dev Prep — Articles index: URL-driven filters (technology,
// difficulty, sort, search) with pagination.
// ============================================================
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, navigate, buildPath } from '@/router';
import { listArticlesAction } from '@/server/actions/content';
import { listTechnologiesAction } from '@/server/actions/content';
import { ArticleCard } from '@/components/shared/article-card';
import { EmptyState, Breadcrumbs } from '@/components/shared/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DIFFICULTIES } from '@/types';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

const SORTS = [
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most read' },
  { value: 'discussed', label: 'Most discussed' },
  { value: 'bookmarked', label: 'Most bookmarked' },
];

export function ArticlesPage() {
  const route = useRoute();
  const params = route.query;

  const technology = params.tech ?? '';
  const difficulty = params.level ?? '';
  const sort = (params.sort ?? 'trending') as string;
  const search = params.q ?? '';
  const interviewOnly = params.interview === '1';
  const page = parseInt(params.page ?? '1', 10) || 1;

  const [searchInput, setSearchInput] = useState(search);
  const [lastExternalSearch, setLastExternalSearch] = useState(search);
  if (lastExternalSearch !== search) {
    setLastExternalSearch(search);
    setSearchInput(search);
  }

  const setParams = (updates: Record<string, string | undefined>, resetPage = true) => {
    navigate(buildPath('/articles', {
      tech: technology || undefined, level: difficulty || undefined,
      sort: sort !== 'trending' ? sort : undefined, q: search || undefined,
      interview: interviewOnly ? '1' : undefined,
      page: !resetPage && page > 1 ? String(page) : undefined,
      ...updates,
    }));
  };

  const { data: techs } = useQuery({ queryKey: ['technologies'], queryFn: () => listTechnologiesAction() });
  const { data, isLoading } = useQuery({
    queryKey: ['articles', { technology, difficulty, sort, search, interviewOnly, page }],
    queryFn: () => listArticlesAction({ technology, difficulty, sort: sort as 'trending', search, interviewOnly, page, pageSize: 12 }),
  });

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;
  const activeTech = useMemo(() => techs?.find((t) => t.slug === technology), [techs, technology]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Articles' }]} />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {activeTech ? `${activeTech.name} articles` : 'All articles'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? 'Loading…' : `${data?.total ?? 0} published articles`}
            {interviewOnly && ' · interview-relevant only'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form
            className="relative"
            onSubmit={(e) => { e.preventDefault(); setParams({ q: searchInput || undefined }); }}
          >
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search articles…"
              className="h-9 w-44 pl-8 sm:w-56"
              aria-label="Search articles"
            />
          </form>
          <Select value={difficulty || 'all'} onValueChange={(v) => setParams({ level: v === 'all' ? undefined : v })}>
            <SelectTrigger className="h-9 w-[130px]" aria-label="Difficulty filter"><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              {DIFFICULTIES.map((d) => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={technology || 'all'} onValueChange={(v) => setParams({ tech: v === 'all' ? undefined : v })}>
            <SelectTrigger className="h-9 w-[150px]" aria-label="Technology filter"><SelectValue placeholder="Technology" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All technologies</SelectItem>
              {techs?.map((t) => <SelectItem key={t.slug} value={t.slug}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setParams({ sort: v === 'trending' ? undefined : v })}>
            <SelectTrigger className="h-9 w-[150px]" aria-label="Sort order"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            variant={interviewOnly ? 'default' : 'outline'}
            size="sm"
            className="h-9"
            onClick={() => setParams({ interview: interviewOnly ? undefined : '1' })}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Interview prep
          </Button>
        </div>
      </div>

      {/* results */}
      <div className="mt-8">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="rounded-xl border bg-card">
                <Skeleton className="h-32 w-full rounded-b-none" />
                <div className="space-y-2.5 p-4">
                  <Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : data && data.articles.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.articles.map((a, i) => <ArticleCard key={a.id} article={a} index={i} />)}
            </div>
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setParams({ page: String(page - 1) }, false)} aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm text-muted-foreground tabular-nums">Page {page} of {totalPages}</span>
                <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setParams({ page: String(page + 1) }, false)} aria-label="Next page">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon="search"
            title="No articles match these filters"
            description="Try a different technology, level or search term — the library is deep."
            action={<Button variant="outline" onClick={() => navigate('/articles')}>Clear filters</Button>}
          />
        )}
      </div>
    </div>
  );
}

