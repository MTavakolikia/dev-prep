'use client';

import { Link } from '@/router';
import { ArticleCover, DifficultyBadge, Avatar } from '@/components/shared/primitives';
import { cn } from '@/lib/utils';
import { Eye, Bookmark, Flame, Clock, ListChecks } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ArticleDTO } from '@/types';

export function ArticleCard({ article, index = 0, compact }: { article: ArticleDTO; index?: number; compact?: boolean }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4), ease: [0.21, 0.47, 0.32, 0.98] }}
      className="h-full"
    >
      <Link
        href={`/articles/${article.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
      >
        {!compact && (
          <ArticleCover style={article.coverStyle} icon={article.technology?.icon} className="h-32 rounded-b-none border-0 border-b" />
        )}
        <div className="flex min-h-0 flex-1 flex-col p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
            {article.technology && (
              <span className="inline-flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${article.technology.color === 'zinc' ? 'bg-zinc-400' : `bg-${article.technology.color}-500`}`} />
                {article.technology.name}
              </span>
            )}
            <span className="opacity-40">·</span>
            <span>{article.readingTime} min read</span>
            {article.interviewRelevant && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
                <ListChecks className="h-3 w-3" /> Interview
              </span>
            )}
          </div>
          <h3 className="df-line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
            {article.title}
          </h3>
          <p className="df-line-clamp-2 mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{article.excerpt}</p>
          <div className="mt-auto flex items-center gap-2 pt-3.5">
            <Avatar name={article.author.name} color={article.author.avatarColor} size="xs" />
            <span className="truncate text-xs text-muted-foreground">{article.author.name}</span>
            <span className="ml-auto flex items-center gap-2.5 text-[11px] text-muted-foreground">
              <DifficultyBadge difficulty={article.difficulty} />
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Eye className="h-3 w-3" /> {formatViews(article.views)}
              </span>
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function ArticleRow({ article, rank, index = 0 }: { article: ArticleDTO; rank?: number; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.06, 0.35) }}
    >
      <Link
        href={`/articles/${article.slug}`}
        className="group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50"
      >
        {rank !== undefined && (
          <span className={cn('mt-0.5 w-5 shrink-0 text-right font-mono text-sm font-semibold tabular-nums', rank <= 3 ? 'text-primary' : 'text-muted-foreground/60')}>
            {rank}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="df-line-clamp-2 text-[13.5px] font-medium leading-snug transition-colors group-hover:text-primary">
            {article.title}
          </h4>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>{article.technology?.name ?? article.category?.name}</span>
            <span className="opacity-40">·</span>
            <span className="inline-flex items-center gap-0.5"><Eye className="h-3 w-3" />{formatViews(article.views)}</span>
            {article.interviewRelevant && (
              <><span className="opacity-40">·</span><span className="inline-flex items-center gap-0.5 text-primary"><Flame className="h-3 w-3" /> Interview</span></>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function BookmarkIndicator({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <Bookmark className="h-3 w-3" /> {count}
    </span>
  );
}

export function ReadTime({ minutes }: { minutes: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <Clock className="h-3 w-3" /> {minutes} min
    </span>
  );
}

function formatViews(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return String(v);
}
