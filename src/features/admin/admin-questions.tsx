'use client';

// ============================================================
// Dev Prep — CMS: questions / users / taxonomy / settings managers
// ============================================================
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminListQuestionsAction, adminDeleteQuestionAction, adminListUsersAction, adminSetUserRoleAction, adminListTaxonomyAction, adminUpsertTechnologyAction, adminGetSettingsAction } from '@/server/actions/admin';
import { Avatar, TechIcon } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { SENIORITY_LABELS } from '@/lib/design';
import { SENIORITIES, ROLE_LABELS } from '@/types';
import type { Role } from '@/types';
import { toast } from 'sonner';
import { Search, Trash2, ChevronLeft, ChevronRight, Plus, ShieldCheck } from 'lucide-react';

// ---------------- Questions manager ----------------
export function AdminQuestions() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [queryStr, setQueryStr] = useState('');
  const [seniority, setSeniority] = useState('all');
  const { data: taxonomy } = useQuery({ queryKey: ['admin-taxonomy'], queryFn: adminListTaxonomyAction });
  const { data, isLoading } = useQuery({
    queryKey: ['admin-questions', { page, queryStr, seniority }],
    queryFn: () => adminListQuestionsAction({ page, search: queryStr, seniority: seniority === 'all' ? undefined : seniority }),
  });

  const del = useMutation({
    mutationFn: adminDeleteQuestionAction,
    onSuccess: () => { toast.success('Question deleted'); queryClient.invalidateQueries({ queryKey: ['admin-questions'] }); },
  });

  const totalPages = data ? Math.ceil(data.total / 12) : 0;

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">Interview questions</h1>
      <p className="mt-0.5 text-[13px] text-muted-foreground">{data?.total ?? '…'} questions in the bank</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <form className="relative" onSubmit={(e) => { e.preventDefault(); setPage(1); setQueryStr(search); }}>
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions…" className="h-9 w-60 pl-8" />
        </form>
        <Select value={seniority} onValueChange={(v) => { setSeniority(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Seniority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {SENIORITIES.map((s) => <SelectItem key={s} value={s}>{SENIORITY_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 space-y-2.5">
        {isLoading ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          : data?.questions.map((q) => (
            <div key={q.id} className="flex items-start gap-3 rounded-xl border bg-card p-4">
              <TechIcon icon="list-checks" color={q.technology.color} className="h-8 w-8" />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium leading-snug">{q.question}</p>
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  {q.technology.name} · {SENIORITY_LABELS[q.seniority] ?? q.seniority} · {q.category.toLowerCase()} · {q.expectedMinutes} min
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => del.mutate(q.id)} aria-label="Delete question">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-[12.5px] text-muted-foreground tabular-nums">{page} / {totalPages}</span>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}

