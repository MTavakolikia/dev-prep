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

// ---------------- Taxonomy manager ----------------
export function AdminTaxonomy() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-taxonomy'], queryFn: adminListTaxonomyAction });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', categoryId: '', description: '' });

  const upsert = useMutation({
    mutationFn: () => adminUpsertTechnologyAction({
      name: form.name, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
      categoryId: form.categoryId, description: form.description,
    }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success('Technology added — the platform supports new domains instantly');
        queryClient.invalidateQueries({ queryKey: ['admin-taxonomy'] });
        queryClient.invalidateQueries({ queryKey: ['technologies'] });
        setOpen(false);
        setForm({ name: '', slug: '', categoryId: '', description: '' });
      } else toast.error(r.error ?? 'Failed');
    },
  });

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Taxonomy</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Categories, technologies and tags that structure the content graph.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add technology</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New technology</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Vue" /></div>
              <div className="space-y-1.5"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="vue (auto from name)" /></div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
                  <SelectContent>
                    {data?.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="One-line description" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => upsert.mutate()} disabled={!form.name || !form.categoryId || upsert.isPending}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">Categories</h2>
          <div className="mt-3 space-y-2">
            {data?.categories.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border px-3.5 py-2.5">
                <TechIcon icon={c.icon} color={c.color} className="h-8 w-8" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">{c.technologyCount} technologies · {c.articleCount} articles</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">Technologies</h2>
          <div className="mt-3 grid max-h-96 gap-2 overflow-y-auto pr-1">
            {data?.technologies.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border px-3.5 py-2">
                <TechIcon icon={t.icon} color={t.color} className="h-7 w-7" />
                <p className="text-[12.5px] font-medium">{t.name}</p>
                <p className="ml-auto text-[11px] text-muted-foreground tabular-nums">{t.articleCount}a · {t.questionCount}q</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border bg-card p-5">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground">Tags</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {data?.tags.slice(0, 40).map((t) => (
            <span key={t.id} className="rounded-full border bg-muted/40 px-2.5 py-1 text-[11.5px] text-muted-foreground">
              {t.name} <span className="font-semibold">{t.usage}</span>
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

