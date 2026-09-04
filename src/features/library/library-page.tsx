'use client';

// ============================================================
// Dev Prep — Personal library: bookmarked articles & questions,
// enrolled paths, personal notes.
// ============================================================
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@/router';
import { getLibraryAction, deleteNoteAction } from '@/server/actions/learning';
import { useSession } from '@/providers/app-providers';
import { ArticleCard, ArticleRow } from '@/components/shared/article-card';
import { EmptyState, Skeleton } from '@/components/shared/primitives';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Library, StickyNote, Trash2, Route as RouteIcon } from 'lucide-react';

export function LibraryPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['library'],
    queryFn: getLibraryAction,
    enabled: !!user,
  });

  const removeNote = useMutation({
    mutationFn: deleteNoteAction,
    onSuccess: () => {
      toast.success('Note deleted');
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <EmptyState
          icon="library" title="Your personal library"
          description="Save articles, bookmark tricky interview questions, take notes and enroll in paths — all in one place."
          action={<Button asChild><Link href="/login">Sign in</Link></Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-400 text-white shadow-md shadow-rose-500/25">
          <Library className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Library</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Everything you saved, in one place.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}</div>
      ) : (
        <Tabs defaultValue="articles" className="mt-8">
          <TabsList>
            <TabsTrigger value="articles">Articles ({data?.bookmarkedArticles.length ?? 0})</TabsTrigger>
            <TabsTrigger value="questions">Questions ({data?.bookmarkedQuestions.length ?? 0})</TabsTrigger>
            <TabsTrigger value="paths">Paths ({data?.enrolledPaths.length ?? 0})</TabsTrigger>
            <TabsTrigger value="notes">Notes ({data?.notes.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="mt-6">
            {data?.bookmarkedArticles.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.bookmarkedArticles.map((a, i) => <ArticleCard key={a.id} article={a} index={i} />)}
              </div>
            ) : (
              <EmptyState icon="bookmark" title="No saved articles yet" description="Hit Save on any article to build your reading queue."
                action={<Button asChild><Link href="/articles">Browse articles</Link></Button>} />
            )}
          </TabsContent>

          <TabsContent value="questions" className="mt-6">
            {data?.bookmarkedQuestions.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {data.bookmarkedQuestions.map((q) => (
                  <div key={q.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                      {q.technology.name}
                      <span className="rounded bg-muted px-1.5 py-0.5 font-bold uppercase">{q.seniority}</span>
                    </div>
                    <p className="mt-2 text-[13.5px] font-medium leading-snug">{q.question}</p>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{q.shortAnswer}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="list-checks" title="No saved questions" description="Bookmark questions from the bank to build your personal test bank."
                action={<Button asChild><Link href="/questions">Open question bank</Link></Button>} />
            )}
          </TabsContent>

          <TabsContent value="paths" className="mt-6">
            {data?.enrolledPaths.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {data.enrolledPaths.map((p) => (
                  <Link key={p.id} href={`/learning-paths/${p.slug}`} className="flex items-center gap-3.5 rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border bg-violet-500/10 text-violet-500"><RouteIcon className="h-4.5 w-4.5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">{p.title}</p>
                      <p className="text-[11.5px] text-muted-foreground">{p.progress?.completed ?? 0}/{p.itemCount} steps · {p.progress?.percent ?? 0}%</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon="route" title="No enrolled paths" description="Paths turn reading into a curriculum with checkpoints."
                action={<Button asChild><Link href="/learning-paths">Explore paths</Link></Button>} />
            )}
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            {data?.notes.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {data.notes.map((n) => (
                  <div key={n.id} className={`rounded-xl border p-4 ${n.color === 'amber' ? 'border-amber-500/30 bg-amber-500/[0.05]' : n.color === 'emerald' ? 'border-emerald-500/30 bg-emerald-500/[0.05]' : 'border-violet-500/30 bg-violet-500/[0.05]'}`}>
                    {n.highlightedText && (
                      <blockquote className="border-l-2 border-current/30 pl-3 text-[12.5px] italic text-muted-foreground">{n.highlightedText}</blockquote>
                    )}
                    <p className="mt-2 flex items-start gap-2 text-[13.5px] leading-relaxed">
                      <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" /> {n.body}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      {n.article && <Link href={`/articles/${n.article.slug}`} className="text-[12px] font-medium text-primary hover:underline">{n.article.title.slice(0, 44)}…</Link>}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeNote.mutate(n.id)} aria-label="Delete note">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="pencil-line" title="No notes yet" description="Add notes while reading — they stay attached to the article." />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
