'use client';

// ============================================================
// Dev Prep — Cheat sheets: printable, visual quick references
// generated from the interview-relevant article corpus.
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { Link } from '@/router';
import { getCheatSheetsAction, getCheatSheetAction } from '@/server/actions/content';
import { useRoute, navigate } from '@/router';
import { TechIcon, Breadcrumbs, EmptyState, Skeleton } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Printer, FileText, ScrollText, Check } from 'lucide-react';

export function CheatSheetsPage() {
  const route = useRoute();
  const active = route.query.tech;
  const { data: sheets, isLoading } = useQuery({ queryKey: ['cheatsheets'], queryFn: getCheatSheetsAction });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Cheat sheets' }]} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-400 text-white shadow-md shadow-teal-500/25">
            <ScrollText className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cheat sheets</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Dense, printable recall sheets — distilled from the interview-grade corpus.</p>
          </div>
        </div>
        {active && (
          <Button variant="outline" onClick={() => window.print()} className="no-print">
            <Printer className="h-4 w-4" /> Print this sheet
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : !active ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {sheets?.map((s) => (
            <button
              key={s.slug}
              onClick={() => navigate(`/cheatsheets?tech=${s.slug}`)}
              className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
            >
              <TechIcon icon={s.icon} color={s.color} className="h-11 w-11" />
              <span className="text-[13.5px] font-semibold group-hover:text-primary">{s.name}</span>
              <span className="text-[11px] text-muted-foreground">{s.articleCount} source articles</span>
            </button>
          ))}
        </div>
      ) : (
        <CheatSheet slug={active} />
      )}
    </div>
  );
}

function CheatSheet({ slug }: { slug: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['cheatsheet', slug],
    queryFn: () => getCheatSheetAction(slug),
  });

  if (isLoading) {
    return <div className="mt-8 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;
  }
  if (isError || !data) {
    return <div className="mt-8"><EmptyState icon="file-question" title="Sheet not found" action={<Button asChild><Link href="/cheatsheets">All sheets</Link></Button>} /></div>;
  }

  return (
    <div className="mt-8">
      <div className="mb-5 flex items-center gap-3 no-print">
        <TechIcon icon={data.icon} color={data.color} className="h-10 w-10" />
        <div>
          <h2 className="text-lg font-bold">{data.name} Cheat Sheet</h2>
          <p className="text-[12.5px] text-muted-foreground">{data.sections.length} sections · compiled from interview-relevant articles</p>
        </div>
      </div>
      <div className="columns-1 gap-4 md:columns-2 xl:columns-3 print:columns-2">
        {data.sections.map((s) => (
          <section key={s.articleSlug} className="print-sheet mb-4 break-inside-avoid rounded-xl border bg-card p-4">
            <h3 className="flex items-start gap-2 text-[13px] font-bold leading-snug">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              {s.title}
            </h3>
            <ul className="mt-2.5 space-y-1.5">
              {s.points.map((p, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[12px] leading-relaxed text-muted-foreground">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                  {p}
                </li>
              ))}
            </ul>
            <Link href={`/articles/${s.articleSlug}`} className={cn('mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary no-print hover:underline')}>
              <FileText className="h-3 w-3" /> Full article →
            </Link>
          </section>
        ))}
      </div>
    </div>
  );
}
