'use client';

// ============================================================
// Dev Prep — Question bank: filterable, bookmarkable list of
// interview questions with reveal-answer cards.
// ============================================================
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, navigate, buildPath } from '@/router';
import { listQuestionsAction, toggleQuestionBookmarkAction } from '@/server/actions/interview';
import { listTechnologiesAction } from '@/server/actions/content';
import { useSession } from '@/providers/app-providers';
import { TechIcon, Breadcrumbs, EmptyState } from '@/components/shared/primitives';
import { AuthGateDialog, GuestHint } from '@/components/shared/auth-gate';
import { QUESTION_CATEGORY_LABELS, SENIORITY_LABELS } from '@/lib/design';
import { SENIORITIES } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Search, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, ListChecks } from 'lucide-react';

const CATEGORIES = Object.keys(QUESTION_CATEGORY_LABELS);

export function QuestionsPage() {
  const route = useRoute();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const technology = route.query.tech ?? '';
  const seniority = route.query.seniority ?? '';
  const category = route.query.category ?? '';
  const search = route.query.q ?? '';
  const bookmarked = route.query.saved === '1';
  const page = parseInt(route.query.page ?? '1', 10) || 1;

  const [input, setInput] = useState(search);
  const [lastExternal, setLastExternal] = useState(search);
  // guest gate — bookmarking requires an account
  const [gateOpen, setGateOpen] = useState(false);
  const requireAccount = () => {
    if (user) return true;
    setGateOpen(true);
    return false;
  };
  if (lastExternal !== search) {
    setLastExternal(search);
    setInput(search);
  }

  const setParams = (updates: Record<string, string | undefined>) => {
    navigate(buildPath('/questions', {
      tech: technology || undefined, seniority: seniority || undefined,
      category: category || undefined, q: search || undefined, saved: bookmarked ? '1' : undefined,
      page: page > 1 ? String(page) : undefined, ...updates,
    }));
  };

  const { data: techs } = useQuery({ queryKey: ['technologies'], queryFn: () => listTechnologiesAction() });
  const { data, isLoading } = useQuery({
    queryKey: ['questions', { technology, seniority, category, search, bookmarked, page }],
    queryFn: () => listQuestionsAction({ technology, seniority, category, search, bookmarked, page }),
  });

  const bookmark = useMutation({
    mutationFn: (id: string) => toggleQuestionBookmarkAction(id),
    onSuccess: (r) => {
      if (!r.ok && r.error) return toast.error(r.error);
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['interview-hub'] });
      toast.success(r.bookmarked ? 'Saved to library' : 'Removed from library');
    },
  });

  const totalPages = data ? Math.ceil(data.total / 12) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Interview', href: '/interview' }, { label: 'Question bank' }]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
            <ListChecks className="h-6 w-6 text-primary" /> Question bank
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? 'Loading…' : `${data?.total ?? 0} questions`} with model answers, seniority and expected time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={(e) => { e.preventDefault(); setParams({ q: input || undefined }); }}>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search questions…" className="h-9 w-44 pl-8 sm:w-56" aria-label="Search questions" />
            </div>
          </form>
          <Select value={technology || 'all'} onValueChange={(v) => setParams({ tech: v === 'all' ? undefined : v })}>
            <SelectTrigger className="h-9 w-[140px]" aria-label="Technology"><SelectValue placeholder="Tech" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All tech</SelectItem>
              {techs?.filter((t) => t.questionCount > 0).map((t) => <SelectItem key={t.slug} value={t.slug}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={seniority || 'all'} onValueChange={(v) => setParams({ seniority: v === 'all' ? undefined : v })}>
            <SelectTrigger className="h-9 w-[120px]" aria-label="Seniority"><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              {SENIORITIES.map((s) => <SelectItem key={s} value={s}>{SENIORITY_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={category || 'all'} onValueChange={(v) => setParams({ category: v === 'all' ? undefined : v })}>
            <SelectTrigger className="h-9 w-[140px]" aria-label="Category"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{QUESTION_CATEGORY_LABELS[c]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            variant={bookmarked ? 'default' : 'outline'} size="sm" className="h-9"
            onClick={() => {
              if (bookmarked) return setParams({ saved: undefined });
              if (!requireAccount()) return;
              setParams({ saved: '1' });
            }}
          >
            <Bookmark className="h-3.5 w-3.5" /> Saved
          </Button>
        </div>
      </div>

      {/* guest notice: browsing is open, tracking needs an account */}
      {!user && (
        <div className="mt-5">
          <GuestHint>
            You're browsing as a guest — every question and model answer is open. <span className="text-foreground">Sign in to save questions and run tracked interview sessions.</span>
          </GuestHint>
        </div>
      )}

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {isLoading
          ? [...Array(8)].map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)
          : data?.questions.map((q) => (
            <div key={q.id} className="flex flex-col rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                <TechIcon icon={q.technology.icon} color={q.technology.color} className="h-5.5 w-5.5" />
                <span>{q.technology.name}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-bold uppercase tracking-wide">{SENIORITY_LABELS[q.seniority] ?? q.seniority}</span>
                <span className="rounded bg-muted px-1.5 py-0.5">{QUESTION_CATEGORY_LABELS[q.category] ?? q.category}</span>
                <button
                  className={cn('ml-auto rounded-md p-1 transition-colors hover:bg-accent', q.bookmarked && 'text-primary')}
                  onClick={() => { if (requireAccount()) bookmark.mutate(q.id); }}
                  aria-label={q.bookmarked ? 'Remove bookmark' : 'Bookmark question — sign in required'}
                >
                  {q.bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2.5 text-[13.5px] font-medium leading-snug">{q.question}</p>
              <details className="group mt-auto pt-3">
                <summary className="cursor-pointer list-none text-[12.5px] font-medium text-primary hover:underline">
                  Show model answer
                </summary>
                <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2.5 text-[12.5px] leading-relaxed text-muted-foreground">{q.shortAnswer}</p>
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-[12px] font-medium text-muted-foreground hover:text-foreground">Detailed explanation</summary>
                  <div className="df-prose mt-2 text-[13px]" dangerouslySetInnerHTML={{ __html: q.detailedAnswer }} />
                </details>
              </details>
            </div>
          ))}
      </div>

      {data && data.questions.length === 0 && (
        <EmptyState icon="search-x" title="No questions match these filters" description="Try widening the seniority or technology." />
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setParams({ page: String(page - 1) })} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="px-3 text-sm text-muted-foreground tabular-nums">Page {page} of {totalPages}</span>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setParams({ page: String(page + 1) })} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}

      <AuthGateDialog
        open={gateOpen}
        onOpenChange={setGateOpen}
        feature="save questions and track your progress"
        perk="saved questions, session scores, weak-area detection and your readiness score"
      />
    </div>
  );
}
