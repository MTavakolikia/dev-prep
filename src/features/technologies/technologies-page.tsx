'use client';

import { useQuery } from '@tanstack/react-query';
import { Link } from '@/router';
import { listTechnologiesAction } from '@/server/actions/content';
import type { TechnologyDTO } from '@/types';
import { TechIcon, Breadcrumbs, ProgressBar, Skeleton } from '@/components/shared/primitives';

export function TechnologiesPage() {
  const { data: techs, isLoading } = useQuery({ queryKey: ['technologies'], queryFn: () => listTechnologiesAction() });

  const grouped = new Map<string, TechnologyDTO[]>();
  techs?.forEach((t) => {
    const key = t.categoryName;
    grouped.set(key, [...(grouped.get(key) ?? []), t]);
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Technologies' }]} />
      <div className="mt-4">
        <h1 className="text-2xl font-bold tracking-tight">Technologies</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Every technology has a structured track: articles by level, interview questions,
          learning paths and related topics. Frontend is the flagship — and the map keeps growing.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {[...grouped.entries()].map(([catName, list]) => (
            <section key={catName}>
              <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold tracking-tight">
                {catName}
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{list.length}</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {list.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/technologies/${t.slug}`}
                    className="group flex flex-col rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <TechIcon icon={t.icon} color={t.color} className="h-10 w-10" />
                      <div className="min-w-0">
                        <h3 className="truncate text-[14px] font-semibold transition-colors group-hover:text-primary">{t.name}</h3>
                        <p className="text-[11px] capitalize text-muted-foreground">{t.difficulty}</p>
                      </div>
                    </div>
                    <p className="df-line-clamp-2 mt-2.5 text-[12.5px] leading-relaxed text-muted-foreground">{t.description}</p>
                    <div className="mt-auto flex items-center gap-3 pt-3 text-[11px] text-muted-foreground">
                      <span className="tabular-nums">{t.articleCount} articles</span>
                      <span className="tabular-nums">{t.questionCount} questions</span>
                    </div>
                    <ProgressBar percent={t.popularity} color={t.color} className="mt-2" />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      <span className="hidden" />
    </div>
  );
}
