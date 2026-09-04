'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@/router';
import { listPathsAction, togglePathEnrollmentAction } from '@/server/actions/learning';
import { useSession } from '@/providers/app-providers';
import { TechIcon, ProgressBar, Breadcrumbs, Skeleton } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Route, Target, Clock, Users, BookMarked } from 'lucide-react';

export function PathsPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { data: paths, isLoading } = useQuery({ queryKey: ['paths'], queryFn: listPathsAction });

  const enroll = useMutation({
    mutationFn: togglePathEnrollmentAction,
    onSuccess: (r) => {
      if (!r.ok && r.error) return toast.error(r.error);
      toast.success(r.enrolled ? 'Enrolled — the path is now in your dashboard' : 'Enrollment removed');
      queryClient.invalidateQueries({ queryKey: ['paths'] });
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Learning paths' }]} />
      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 text-white shadow-md shadow-violet-600/25">
          <Route className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Learning paths</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Career-oriented tracks with progress tracking and interview checkpoints.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}</div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {paths?.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.35 }}>
              <div className="flex h-full flex-col rounded-xl border bg-card p-5 transition-shadow hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <TechIcon icon={p.icon} color={p.color} className="h-11 w-11" />
                    <div>
                      <Link href={`/learning-paths/${p.slug}`} className="text-[16px] font-semibold leading-snug hover:text-primary">{p.title}</Link>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><BookMarked className="h-3 w-3" />{p.itemCount} steps</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />~{p.estimatedHours}h</span>
                        <span className="capitalize">{p.level}</span>
                      </p>
                    </div>
                  </div>
                  {p.enrollment && <span className="rounded-md bg-primary/10 px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide text-primary">Enrolled</span>}
                </div>

                <p className="df-line-clamp-2 mt-3 text-[13.5px] leading-relaxed text-muted-foreground">{p.description}</p>

                {p.careerGoal && (
                  <p className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full border border-primary/25 bg-primary/[0.05] px-3 py-1 text-[11.5px] font-medium text-primary">
                    <Target className="h-3 w-3" /> Career goal: {p.careerGoal}
                  </p>
                )}

                {p.progress && p.enrollment && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
                      <span>{p.progress.completed} / {p.itemCount} steps</span>
                      <span className="font-semibold tabular-nums">{p.progress.percent}%</span>
                    </div>
                    <ProgressBar percent={p.progress.percent} color={p.color} className="mt-1.5" />
                  </div>
                )}

                <div className="mt-auto flex items-center gap-2 pt-4">
                  <Button size="sm" asChild>
                    <Link href={`/learning-paths/${p.slug}`}>{p.enrollment ? 'Continue path' : 'View path'}</Link>
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    disabled={enroll.isPending}
                    onClick={() => (user ? enroll.mutate(p.id) : toast.error('Sign in to enroll'))}
                  >
                    {p.enrollment ? 'Leave' : 'Enroll'}
                  </Button>
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Users className="h-3 w-3" /> {p.enrolledCount} enrolled
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
