'use client';

// ============================================================
// Dev Prep — CMS article management: TanStack Table with
// sorting, filtering, pagination, bulk actions + row actions
// (edit, duplicate, status, soft delete).
// ============================================================
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, navigate } from '@/router';
import { adminListArticlesAction, adminSetArticleStatusAction, adminDuplicateArticleAction, adminSoftDeleteArticleAction, adminListTaxonomyAction } from '@/server/actions/admin';
import { StatusBadge, DifficultyBadge } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ARTICLE_STATUSES, type ArticleStatus } from '@/types';
import { STATUS_STYLES } from '@/lib/design';
import { cn } from '@/lib/utils';
import {
  createColumnHelper, flexRender, getCoreRowModel, useReactTable, getSortedRowModel, type SortingState,
} from '@tanstack/react-table';
import { Plus, Search, Eye, Copy, Trash2, MoreHorizontal, ChevronLeft, ChevronRight, ArrowUpDown, ExternalLink } from 'lucide-react';

export function AdminArticles() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [queryStr, setQueryStr] = useState('');

  const { data: taxonomy } = useQuery({ queryKey: ['admin-taxonomy'], queryFn: adminListTaxonomyAction });
  const { data, isLoading } = useQuery({
    queryKey: ['admin-articles', { page, query: queryStr, status: statusFilter, sort: sorting[0]?.id, dir: sorting[0]?.desc }],
    queryFn: () => adminListArticlesAction({ page, search: queryStr, status: statusFilter === 'all' ? undefined : statusFilter, sort: sorting[0]?.id }),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminSetArticleStatusAction(id, status),
    onSuccess: (r) => {
      if (r.ok) { toast.success('Status updated'); queryClient.invalidateQueries({ queryKey: ['admin-articles'] }); }
      else toast.error(r.error ?? 'Failed');
    },
  });
  const duplicate = useMutation({
    mutationFn: (id: string) => adminDuplicateArticleAction(id),
    onSuccess: (r) => {
      if (r.ok && r.newId) {
        toast.success('Duplicated as draft');
        queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
        navigate(`/admin/articles/${r.newId}`);
      } else toast.error(r.error ?? 'Failed');
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminSoftDeleteArticleAction(id),
    onSuccess: (r) => {
      if (r.ok) { toast.success('Moved to archive (soft delete)'); queryClient.invalidateQueries({ queryKey: ['admin-articles'] }); }
      else toast.error(r.error ?? 'Failed');
    },
  });

  const rows = data?.articles ?? [];
  const columnHelper = createColumnHelper<(typeof rows)[number]>();
  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      header: () => <Checkbox aria-label="Select all" onCheckedChange={(v) => setSelected(v ? new Set(rows.map((r) => r.id)) : new Set())} />,
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select ${row.original.title}`}
          checked={selected.has(row.original.id)}
          onCheckedChange={(v) => {
            const next = new Set(selected);
            if (v) next.add(row.original.id); else next.delete(row.original.id);
            setSelected(next);
          }}
        />
      ),
    }),
    columnHelper.accessor('title', {
      header: 'Article',
      cell: ({ row }) => (
        <div className="min-w-0 max-w-[380px]">
          <Link href={`/admin/articles/${row.original.id}`} className="df-line-clamp-1 text-[13.5px] font-medium hover:text-primary">{row.original.title}</Link>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {row.original.technology?.name} · {row.original.author.name}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    }),
    columnHelper.accessor('difficulty', {
      header: 'Level',
      cell: ({ row }) => <DifficultyBadge difficulty={row.original.difficulty} />,
    }),
    columnHelper.accessor('views', {
      header: 'Views',
      cell: ({ row }) => <span className="tabular-nums text-[13px]">{row.original.views.toLocaleString()}</span>,
    }),
    columnHelper.accessor('updatedAt', {
      header: 'Updated',
      cell: ({ row }) => <span className="text-[12.5px] text-muted-foreground">{new Date(row.original.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Dropdown id={row.original.id} slug={row.original.slug} onDuplicate={() => duplicate.mutate(row.original.id)} onDelete={() => remove.mutate(row.original.id)} onStatus={(s) => setStatus.mutate({ id: row.original.id, status: s })} />
      ),
    }),
  ], [selected, rows, duplicate, remove, setStatus]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    manualPagination: true,
    state: { sorting },
  });

  const totalPages = data ? Math.ceil(data.total / 12) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Articles</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{data?.total ?? '…'} articles · revisions and approval workflow included</p>
        </div>
        <Button onClick={() => navigate('/admin/articles/new')}>
          <Plus className="h-4 w-4" /> New article
        </Button>
      </div>

      {/* filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <form
          className="relative"
          onSubmit={(e) => { e.preventDefault(); setPage(1); setQueryStr(search); }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title…" className="h-9 w-56 pl-8" />
        </form>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ARTICLE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        {selected.size > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-[12.5px]">
            {selected.size} selected
            <Button size="sm" variant="outline" className="h-7 text-[11.5px]"
              onClick={() => { selected.forEach((id) => setStatus.mutate({ id, status: 'PUBLISHED' })); setSelected(new Set()); }}>
              Publish
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[11.5px]"
              onClick={() => { selected.forEach((id) => setStatus.mutate({ id, status: 'ARCHIVED' })); setSelected(new Set()); }}>
              Archive
            </Button>
          </div>
        )}
      </div>

      {/* table */}
      <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b bg-muted/40">
              {table.getHeaderGroups()[0]?.headers.map((h) => (
                <th key={h.id} className="px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {h.isPlaceholder ? null : h.column.getCanSort() ? (
                    <button className="flex items-center gap-1 hover:text-foreground" onClick={h.column.getToggleSortingHandler()}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-9 w-full" /></td></tr>
              ))
            ) : table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-accent/40">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data && rows.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No articles match the filters.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-[12.5px] text-muted-foreground tabular-nums">Page {page} / {totalPages}</span>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}

function Dropdown({ id, slug, onDuplicate, onDelete, onStatus }: {
  id: string; slug: string; onDuplicate: () => void; onDelete: () => void; onStatus: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen((v) => !v)} aria-label="Row actions">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-44 rounded-lg border bg-popover p-1 shadow-xl">
            <RowAction icon={<ExternalLink className="h-3.5 w-3.5" />} label="View on site" onClick={() => { setOpen(false); navigate(`/articles/${slug}`); }} />
            <RowAction icon={<Eye className="h-3.5 w-3.5" />} label="Edit in CMS" onClick={() => { setOpen(false); navigate(`/admin/articles/${id}`); }} />
            <RowAction icon={<Copy className="h-3.5 w-3.5" />} label="Duplicate" onClick={() => { setOpen(false); onDuplicate(); }} />
            <div className="my-1 h-px bg-border" />
            {ARTICLE_STATUSES.map((s) => (
              <button key={s} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] hover:bg-accent" onClick={() => { setOpen(false); onStatus(s); }}>
                <span className={cn('h-2 w-2 rounded-full border', STATUS_STYLES[s as ArticleStatus].split(' ')[0], STATUS_STYLES[s as ArticleStatus].split(' ')[1])} />
                Set {s.replace('_', ' ').toLowerCase()}
              </button>
            ))}
            <div className="my-1 h-px bg-border" />
            <RowAction icon={<Trash2 className="h-3.5 w-3.5" />} label="Archive" danger onClick={() => { setOpen(false); onDelete(); }} />
          </div>
        </>
      )}
    </div>
  );
}

function RowAction({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] hover:bg-accent', danger && 'text-destructive hover:bg-destructive/10')} onClick={onClick}>
      {icon} {label}
    </button>
  );
}
