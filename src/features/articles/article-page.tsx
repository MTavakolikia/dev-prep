'use client';

// ============================================================
// Dev Prep — Article page: reading progress, sticky TOC with
// scroll-spy, syntax-highlighted content, TL;DR + cheat sheet,
// like/bookmark/share, notes, test-yourself quiz, related
// interview questions, prev/next, related reading, comments.
// ============================================================
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, navigate } from '@/router';
import { getArticleAction, listCommentsAction, addCommentAction } from '@/server/actions/content';
import { toggleBookmarkAction, toggleLikeAction, trackReadAction, addNoteAction } from '@/server/actions/learning';
import { useSession } from '@/providers/app-providers';
import { ArticleContent, extractToc } from './code-block';
import { Avatar, DifficultyBadge, EmptyState, Skeleton, Breadcrumbs } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Bookmark, BookmarkCheck, Heart, Share2, Clock, Eye, ChevronRight, ChevronLeft,
  ListTree, StickyNote, Plus, CheckCircle2, Send, ThumbsUp, MessageSquare, Zap, Sparkles,
} from 'lucide-react';

export function ArticlePage({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { data: article, isLoading, isError } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => getArticleAction(slug),
    retry: false,
  });

  const toc = useMemo(() => (article ? extractToc(article.content) : []), [article]);

  // ----- reading progress -----
  const [progress, setProgress] = useState(0);
  const [tracked, setTracked] = useState(false);
  const [lastSlug, setLastSlug] = useState(slug);
  if (lastSlug !== slug) {
    setLastSlug(slug);
    setProgress(0);
    setTracked(false);
  }

  useEffect(() => {
    if (!article || tracked) return;
    const onScroll = () => {
      const el = document.getElementById('df-article-body');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight + rect.top;
      const passed = Math.max(0, -rect.top);
      const pct = Math.min(100, Math.round((passed / Math.max(1, total)) * 100));
      setProgress(pct);
      if (pct >= 85) {
        setTracked(true);
        trackReadAction(article.id, pct).then(() => queryClient.invalidateQueries({ queryKey: ['dashboard'] }));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [article, tracked, queryClient]);

  // ----- mutations -----
  const bookmark = useMutation({
    mutationFn: () => toggleBookmarkAction(article!.id),
    onSuccess: (r) => {
      if (!r.ok && r.error) return toast.error(r.error);
      toast.success(r.bookmarked ? 'Saved to your library' : 'Removed from library');
      queryClient.invalidateQueries({ queryKey: ['article', slug] });
    },
  });
  const like = useMutation({
    mutationFn: () => toggleLikeAction(article!.id),
    onSuccess: (r) => {
      if (!r.ok && r.error) return toast.error(r.error);
      queryClient.invalidateQueries({ queryKey: ['article', slug] });
    },
  });
  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/articles/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch { toast.error('Could not copy the link'); }
  };

  if (isLoading) return <ArticleSkeleton />;
  if (isError || !article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <EmptyState
          icon="file-question"
          title="Article not found"
          description="It may be unpublished or the link is wrong."
          action={<Button asChild><Link href="/articles">Browse articles</Link></Button>}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* reading progress bar */}
      <div className="fixed inset-x-0 top-[60px] z-30 h-[3px] bg-transparent no-print">
        <div className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      <article className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Articles', href: '/articles' },
          ...(article.technology ? [{ label: article.technology.name, href: `/technologies/${article.technology.slug}` }] : []),
          { label: article.title.length > 42 ? `${article.title.slice(0, 42)}…` : article.title },
        ]} />

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
          {/* ---------------- main column ---------------- */}
          <div className="mx-auto w-full max-w-3xl lg:mx-0">
            <header>
              <div className="flex flex-wrap items-center gap-2">
                {article.technology && (
                  <Link href={`/technologies/${article.technology.slug}`} className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-card px-2 py-1 text-[12px] font-medium transition-colors hover:border-primary/40">
                    {article.technology.name}
                  </Link>
                )}
                <DifficultyBadge difficulty={article.difficulty} />
                {article.interviewRelevant && (
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">Interview relevant</span>
                )}
              </div>
              <h1 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-tight sm:text-[2.4rem]">
                {article.title}
              </h1>
              <p className="mt-3 text-[15.5px] leading-relaxed text-muted-foreground">{article.excerpt}</p>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
                <Link href={`/profile/${article.author.id}`} className="flex items-center gap-2">
                  <Avatar name={article.author.name} color={article.author.avatarColor} size="sm" />
                  <span className="font-medium text-foreground">{article.author.name}</span>
                </Link>
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {article.readingTime} min read</span>
                <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {article.views.toLocaleString()} views</span>
                {article.publishedAt && <span>{new Date(article.publishedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
              </div>

              {/* actions */}
              <div className="mt-5 flex items-center gap-2 no-print">
                <Button
                  variant={article.bookmarked ? 'default' : 'outline'}
                  size="sm" className="h-8.5 gap-1.5"
                  onClick={() => user ? bookmark.mutate() : toast.error('Sign in to save articles')}
                >
                  {article.bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                  {article.bookmarked ? 'Saved' : 'Save'}
                </Button>
                <Button
                  variant="outline" size="sm" className="h-8.5 gap-1.5"
                  onClick={() => user ? like.mutate() : toast.error('Sign in to like articles')}
                >
                  <Heart className={cn('h-3.5 w-3.5', article.liked && 'fill-rose-500 text-rose-500')} />
                  {article.likeCount ?? 0}
                </Button>
                <Button variant="outline" size="sm" className="h-8.5 gap-1.5" onClick={share}>
                  <Share2 className="h-3.5 w-3.5" /> Share
                </Button>
              </div>
            </header>

            {/* TL;DR */}
            {article.tldr && article.tldr.length > 0 && (
              <aside className="mt-7 rounded-xl border border-primary/25 bg-primary/[0.045] p-5">
                <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-primary">
                  <Zap className="h-3.5 w-3.5" /> TL;DR
                </h2>
                <ul className="mt-3 space-y-1.5">
                  {article.tldr.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13.5px] leading-relaxed">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" /> {t}
                    </li>
                  ))}
                </ul>
              </aside>
            )}

            {/* content */}
            <div id="df-article-body" className="mt-4">
              <ArticleContent html={article.content} />
            </div>

            {/* cheat sheet */}
            {article.cheatSheet && (
              <aside className="mt-10 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.045] p-5 print:break-inside-avoid">
                <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <StickyNote className="h-4 w-4" /> {article.cheatSheet.title ?? 'Interview cheat sheet'}
                </h2>
                <ul className="mt-3 space-y-1.5">
                  {article.cheatSheet.points.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13.5px] leading-relaxed">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" /> {p}
                    </li>
                  ))}
                </ul>
              </aside>
            )}

            {/* tags */}
            {article.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {article.tags.map((t) => (
                  <Link key={t} href={buildSearch(t)} className="rounded-full border bg-muted/50 px-3 py-1 text-[12px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                    #{t}
                  </Link>
                ))}
              </div>
            )}

            <Separator className="my-9" />

            {/* Test yourself */}
            {article.relatedQuestions.length > 0 && (
              <TestYourself questions={article.relatedQuestions} />
            )}

            {/* notes */}
            <NotesSection articleId={article.id} />

            {/* comments */}
            <CommentsSection articleId={article.id} />

            {/* prev / next */}
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {article.prev ? (
                <Link href={`/articles/${article.prev.slug}`} className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary/40">
                  <span className="flex items-center gap-1 text-[11.5px] font-medium text-muted-foreground"><ChevronLeft className="h-3.5 w-3.5" /> Previous</span>
                  <p className="df-line-clamp-2 mt-1.5 text-[13.5px] font-medium leading-snug group-hover:text-primary">{article.prev.title}</p>
                </Link>
              ) : <span />}
              {article.next ? (
                <Link href={`/articles/${article.next.slug}`} className="group rounded-xl border bg-card p-4 text-right transition-colors hover:border-primary/40">
                  <span className="flex items-center justify-end gap-1 text-[11.5px] font-medium text-muted-foreground">Next <ChevronRight className="h-3.5 w-3.5" /></span>
                  <p className="df-line-clamp-2 mt-1.5 text-[13.5px] font-medium leading-snug group-hover:text-primary">{article.next.title}</p>
                </Link>
              ) : <span />}
            </div>
          </div>

          {/* ---------------- sticky sidebar ---------------- */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-6">
              {toc.length > 0 && (
                <nav aria-label="Table of contents" className="rounded-xl border bg-card p-4 no-print">
                  <h2 className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                    <ListTree className="h-3.5 w-3.5" /> On this page
                  </h2>
                  <Toc items={toc} />
                </nav>
              )}
              {article.relatedQuestions.length > 0 && (
                <div className="rounded-xl border bg-card p-4 no-print">
                  <h2 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Interview questions</h2>
                  <div className="mt-3 space-y-3">
                    {article.relatedQuestions.slice(0, 3).map((q) => (
                      <Link key={q.id} href="/questions" className="group block text-[12.5px] leading-snug text-muted-foreground transition-colors hover:text-foreground">
                        <span className="mr-1 text-primary">Q:</span>{q.question.length > 90 ? `${q.question.slice(0, 90)}…` : q.question}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {article.technology && (
                <div className="rounded-xl border bg-card p-4 no-print">
                  <h2 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Deep dive</h2>
                  <Link href={`/technologies/${article.technology.slug}`} className="mt-2 block text-[13.5px] font-medium text-primary hover:underline">
                    All {article.technology.name} articles →
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* related */}
        {article.relatedArticles.length > 0 && (
          <section className="mt-14 border-t pt-10">
            <h2 className="text-lg font-semibold tracking-tight">Continue reading</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {article.relatedArticles.map((a) => (
                <Link key={a.id} href={`/articles/${a.slug}`} className="group rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                  <p className="text-[11px] font-medium text-muted-foreground">{a.technology?.name}</p>
                  <h3 className="df-line-clamp-2 mt-1.5 text-[13.5px] font-semibold leading-snug group-hover:text-primary">{a.title}</h3>
                  <p className="mt-2 text-[11px] text-muted-foreground">{a.readingTime} min · {a.difficulty}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}

function buildSearch(tag: string) {
  return `/search?q=${encodeURIComponent(tag)}`;
}

// ---------------- TOC with scroll spy ----------------
function Toc({ items }: { items: { id: string; text: string; level: 2 | 3 }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-80px 0px -70% 0px' },
    );
    items.forEach((i) => { const el = document.getElementById(i.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [items]);

  return (
    <ul className="mt-3 space-y-1 border-l">
      {items.map((i) => (
        <li key={i.id}>
          <a
            href={`#${i.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(i.id)?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={cn(
              'block border-l-2 py-1 pr-2 text-[12.5px] leading-snug transition-colors',
              i.level === 3 ? 'pl-6' : 'pl-3.5',
              active === i.id ? 'border-primary font-medium text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {i.text}
          </a>
        </li>
      ))}
    </ul>
  );
}

// ---------------- Test yourself ----------------
function TestYourself({ questions }: { questions: { id: string; question: string; shortAnswer: string; seniority: string }[] }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [self, setSelf] = useState<Record<string, 'known' | 'difficult'>>({});
  return (
    <section className="rounded-xl border border-primary/25 bg-primary/[0.03] p-5">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
        <Sparkles className="h-4 w-4 text-primary" />
        Test yourself
        <span className="text-[12px] font-normal text-muted-foreground">— from the interview bank</span>
      </h2>
      <div className="mt-4 space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13.5px] font-medium leading-snug">{q.question}</p>
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">{q.seniority}</span>
            </div>
            {revealed[q.id] ? (
              <p className="mt-2.5 rounded-lg bg-muted/60 px-3 py-2.5 text-[13px] leading-relaxed text-muted-foreground">{q.shortAnswer}</p>
            ) : (
              <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs text-primary" onClick={() => setRevealed((r) => ({ ...r, [q.id]: true }))}>
                Reveal answer
              </Button>
            )}
            <div className="mt-2.5 flex gap-2">
              <Button
                size="sm" variant={self[q.id] === 'known' ? 'default' : 'outline'} className="h-7 text-xs"
                onClick={() => setSelf((s) => ({ ...s, [q.id]: 'known' }))}
              >
                <ThumbsUp className="h-3 w-3" /> I knew this
              </Button>
              <Button
                size="sm" variant={self[q.id] === 'difficult' ? 'secondary' : 'outline'} className="h-7 text-xs"
                onClick={() => setSelf((s) => ({ ...s, [q.id]: 'difficult' }))}
              >
                Still difficult
              </Button>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-muted-foreground">
        Want structured practice? <Link href="/interview" className="font-medium text-primary hover:underline">Start an interview session →</Link>
      </p>
    </section>
  );
}

// ---------------- Notes ----------------
function NotesSection({ articleId }: { articleId: string }) {
  const { user } = useSession();
  const [body, setBody] = useState('');
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<{ id: string; body: string }[]>([]);
  const add = useMutation({
    mutationFn: () => addNoteAction(articleId, body),
    onSuccess: (r) => {
      if (r.ok) {
        setSaved((s) => [...s, { id: `local-${Date.now()}`, body }]);
        setBody(''); setOpen(false);
        toast.success('Note saved to your library');
      } else toast.error(r.error ?? 'Could not save note');
    },
  });
  if (!user) return null;
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight"><StickyNote className="h-4 w-4 text-amber-500" /> Your notes</h2>
        {!open && (
          <Button variant="outline" size="sm" className="h-8" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add note
          </Button>
        )}
      </div>
      {open && (
        <div className="mt-3 rounded-xl border bg-card p-4">
          <Textarea
            value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="What do you want to remember from this article?"
            rows={3} autoFocus
          />
          <div className="mt-2.5 flex gap-2">
            <Button size="sm" onClick={() => add.mutate()} disabled={!body.trim() || add.isPending}>Save note</Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}
      {saved.length > 0 && (
        <ul className="mt-3 space-y-2">
          {saved.map((n) => (
            <li key={n.id} className="rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-[13px]">{n.body}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------- Comments ----------------
function CommentsSection({ articleId }: { articleId: string }) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', articleId],
    queryFn: () => listCommentsAction(articleId),
  });
  const post = useMutation({
    mutationFn: () => addCommentAction(articleId, body),
    onSuccess: (r) => {
      if (r.ok) {
        setBody('');
        queryClient.invalidateQueries({ queryKey: ['comments', articleId] });
        toast.success('Comment posted');
      } else toast.error(r.error ?? 'Could not post comment');
    },
  });
  const count = comments?.reduce((s, c) => s + 1 + c.replies.length, 0) ?? 0;

  return (
    <section className="mt-10">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
        <MessageSquare className="h-4 w-4" /> Discussion <span className="text-[13px] font-normal text-muted-foreground">({count})</span>
      </h2>
      {user ? (
        <form className="mt-4" onSubmit={(e) => { e.preventDefault(); post.mutate(); }}>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share what you learned, or ask a question…" rows={3} />
          <div className="mt-2 flex justify-end">
            <Button size="sm" type="submit" disabled={body.trim().length < 3 || post.isPending}>
              <Send className="h-3.5 w-3.5" /> Post comment
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed px-4 py-3 text-[13px] text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link> to join the discussion.
        </p>
      )}
      <div className="mt-5 space-y-5">
        {isLoading ? (
          <Skeleton className="h-20 w-full rounded-xl" />
        ) : comments && comments.length > 0 ? (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar name={c.author.name} color="violet" size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold">{c.author.name}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-foreground/90">{c.body}</p>
                {c.replies.length > 0 && (
                  <div className="mt-3 space-y-3 border-l-2 pl-4">
                    {c.replies.map((r) => (
                      <div key={r.id} className="flex gap-2.5">
                        <Avatar name={r.author.name} color={r.author.avatarColor} size="xs" />
                        <div>
                          <p className="text-[12.5px] font-semibold">{r.author.name}</p>
                          <p className="mt-0.5 text-[13px] leading-relaxed text-foreground/85">{r.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-[13px] text-muted-foreground">Be the first to comment.</p>
        )}
      </div>
    </section>
  );
}

// ---------------- skeleton ----------------
function ArticleSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="mt-4 h-9 w-4/5" />
      <Skeleton className="mt-3 h-5 w-full" />
      <Skeleton className="mt-2 h-5 w-2/3" />
      <div className="mt-8 space-y-3">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className={cn('h-4', i % 3 === 2 ? 'w-2/3' : 'w-full')} />)}
      </div>
      <Skeleton className="mt-8 h-48 w-full rounded-xl" />
      <div className="mt-8 space-y-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
      </div>
    </div>
  );
}
