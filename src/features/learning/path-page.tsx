'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@/router';
import { getPathAction, togglePathEnrollmentAction, togglePathItemAction } from '@/server/actions/learning';
import { useSession } from '@/providers/app-providers';
import { TechIcon, ProgressBar, Breadcrumbs, EmptyState, Skeleton } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CheckCircle2, Circle, Clock, Flag, ArrowLeft, Milestone } from 'lucide-react';

export function PathPage({ slug }: { slug: string }) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { data: path, isLoading, isError } = useQuery({
    queryKey: ['path', slug],
    queryFn: () => getPathAction(slug),
    retry: false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['path', slug] });
    queryClient.invalidateQueries({ queryKey: ['paths'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const enroll = useMutation({
    mutationFn: () => togglePathEnrollmentAction(path!.id),
    onSuccess: (r) => { if (r.ok) { toast.success(r.enrolled ? 'Enrolled' : 'Left the path'); invalidate(); } else toast.error(r.error ?? 'Failed'); },
  });
  const toggleItem = useMutation({
    mutationFn: (itemId: string) => togglePathItemAction(itemId),
    onSuccess: (r) => {
      if (!r.ok && r.error) return toast.error(r.error);
      if (r.pathCompleted) toast.success('Path completed — legendary. +300 XP');
      invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Skeleton className="h-6 w-40" /><Skeleton className="mt-4 h-10 w-96" />
        <div className="mt-8 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      </div>
    );
  }
  if (isError || !path) {
    return <div className="mx-auto max-w-3xl px-4 py-24"><EmptyState icon="route-off" title="Path not found" action={<Button asChild><Link href="/learning-paths">All paths</Link></Button>} /></div>;
  }

  const enrolled = !!path.enrollment;
  const canCheck = user && enrolled;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Learning paths', href: '/learning-paths' }, { label: path.title }]} />

      <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-start gap-4">
          <TechIcon icon={path.icon} color={path.color} className="h-13 w-13" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-[1.7rem]">{path.title}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[12.5px] text-muted-foreground">
              <span>{path.itemCount} steps</span><span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />~{path.estimatedHours} hours</span>
              <span className="capitalize">{path.level}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={enrolled ? 'secondary' : 'default'}
            onClick={() => (user ? enroll.mutate() : toast.error('Sign in to enroll'))}
            disabled={enroll.isPending}
          >
            {enrolled ? 'Enrolled' : 'Enroll in this path'}
          </Button>
        </div>
      </div>

      <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">{path.longDescription ?? path.description}</p>

      {path.progress && enrolled && (
        <div className="mt-6 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium">Your progress</span>
            <span className="font-bold tabular-nums">{path.progress.percent}%</span>
          </div>
          <ProgressBar percent={path.progress.percent} color={path.color} className="mt-2 h-2" />
        </div>
      )}

      <ol className="mt-8 space-y-2.5">
        {path.items?.map((item, i) => (
          <li key={item.id}>
            <div className={cn(
              'group relative flex items-start gap-3.5 rounded-xl border bg-card p-4 transition-colors',
              item.completed && 'border-emerald-500/25 bg-emerald-500/[0.03]',
            )}>
              {/* connector */}
              {i < path.items!.length - 1 && <span aria-hidden className="absolute top-[52px] left-[27px] h-[calc(100%-28px)] w-px bg-border" />}
              <button
                className="relative z-10 mt-0.5 shrink-0 rounded-full transition-transform hover:scale-110 disabled:cursor-not-allowed"
                onClick={() => (canCheck ? toggleItem.mutate(item.id) : toast.error(user ? 'Enroll first to track progress' : 'Sign in to track progress'))}
                aria-label={item.completed ? 'Mark step incomplete' : 'Mark step complete'}
                disabled={!canCheck}
              >
                {item.completed
                  ? <CheckCircle2 className="h-6 w-6 fill-emerald-500/20 text-emerald-500" />
                  : <Circle className={cn('h-6 w-6 text-muted-foreground/50', canCheck && 'text-muted-foreground hover:text-primary')} />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-muted-foreground/70">{String(i + 1).padStart(2, '0')}</span>
                  {item.milestone && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      <Flag className="h-2.5 w-2.5" /> Checkpoint
                    </span>
                  )}
                </div>
                {item.article ? (
                  <Link href={`/articles/${item.article.slug}`} className={cn('mt-1 block text-[14.5px] font-semibold leading-snug hover:text-primary', item.completed && 'text-muted-foreground line-through decoration-emerald-500/40')}>
                    {item.title}
                  </Link>
                ) : (
                  <h3 className={cn('mt-1 text-[14.5px] font-semibold leading-snug', item.completed && 'text-muted-foreground')}>{item.title}</h3>
                )}
                {item.description && <p className="mt-1 text-[12.5px] text-muted-foreground">{item.description}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  {item.article && <span>{item.article.readingTime} min read</span>}
                  {item.technology && (
                    <Link href={`/technologies/${item.technology.slug}`} className="inline-flex items-center gap-1 hover:text-foreground">
                      <Milestone className="h-3 w-3" /> {item.technology.name}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <Button variant="ghost" className="mt-8" asChild>
        <Link href="/learning-paths"><ArrowLeft className="h-4 w-4" /> All paths</Link>
      </Button>
    </div>
  );
}
