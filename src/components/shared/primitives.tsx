'use client';

// ============================================================
// Dev Prep — shared primitives: covers, icons, badges,
// stat cards, empty states, section headings.
// ============================================================
import { dynamicIconImport } from '@/components/shared/dynamic-icon';
import { Link } from '@/router';
import { DIFFICULTY_STYLES, tokens } from '@/lib/design';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function TechIcon({ icon, color, className }: { icon: string; color: string; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-md border', tokens(color).bg, tokens(color).border, className ?? 'h-9 w-9')}>
      {dynamicIconImport(icon, cn('h-[18px] w-[18px]', tokens(color).text))}
    </span>
  );
}

const COVERS: Record<string, string> = {
  violet: 'from-violet-600/80 via-violet-500/40 to-transparent',
  emerald: 'from-emerald-600/80 via-emerald-500/40 to-transparent',
  amber: 'from-amber-500/80 via-amber-400/40 to-transparent',
  rose: 'from-rose-600/80 via-rose-500/40 to-transparent',
  cyan: 'from-cyan-600/80 via-cyan-500/40 to-transparent',
  orange: 'from-orange-600/80 via-orange-500/40 to-transparent',
  teal: 'from-teal-600/80 via-teal-500/40 to-transparent',
  fuchsia: 'from-fuchsia-600/80 via-fuchsia-500/40 to-transparent',
  lime: 'from-lime-600/80 via-lime-500/40 to-transparent',
  sky: 'from-sky-600/80 via-sky-500/40 to-transparent',
};

export function ArticleCover({ style, icon, className, large }: { style: string; icon?: string | null; className?: string; large?: boolean }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-muted via-card to-card', className)}>
      <div className={cn('absolute inset-0 bg-gradient-to-tl', COVERS[style] ?? COVERS.violet, 'opacity-70')} />
      <div className="df-grid-bg absolute inset-0 opacity-60" />
      {icon ? (
        <div className="absolute inset-0 flex items-center justify-center">
          {dynamicIconImport(icon, cn('text-white/90 drop-shadow-lg', large ? 'h-14 w-14' : 'h-9 w-9'))}
        </div>
      ) : null}
    </div>
  );
}

export function DifficultyBadge({ difficulty, className }: { difficulty: string; className?: string }) {
  const s = DIFFICULTY_STYLES[difficulty] ?? DIFFICULTY_STYLES.beginner;
  return (
    <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide uppercase', s.className, className)}>
      {s.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/25',
    IN_REVIEW: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    SCHEDULED: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25',
    PUBLISHED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    ARCHIVED: 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/25',
  };
  const labels: Record<string, string> = { DRAFT: 'Draft', IN_REVIEW: 'In Review', SCHEDULED: 'Scheduled', PUBLISHED: 'Published', ARCHIVED: 'Archived' };
  return <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide', styles[status] ?? styles.DRAFT)}>{labels[status] ?? status}</span>;
}

export function Avatar({ name, color, size = 'md', className }: { name: string; color: string; size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { xs: 'h-5 w-5 text-[9px]', sm: 'h-6.5 w-6.5 text-[10px]', md: 'h-8 w-8 text-xs', lg: 'h-12 w-12 text-base' };
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', tokens(color).solid, sizes[size], className)}>
      {initials}
    </span>
  );
}

export function StatCard({ label, value, sub, icon, accent = 'violet' }: { label: string; value: ReactNode; sub?: string; icon?: string; accent?: string }) {
  const t = tokens(accent);
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
      <div className={cn('absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-[0.07] blur-xl transition-opacity group-hover:opacity-20', t.solid)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-[26px] font-semibold leading-none tracking-tight tabular-nums">{value}</p>
          {sub ? <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p> : null}
        </div>
        {icon ? (
          <span className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', t.bg, t.border)}>
            {dynamicIconImport(icon, cn('h-4 w-4', t.text))}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon = 'inbox', title, description, action }: { icon?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 px-6 py-14 text-center">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        {dynamicIconImport(icon, 'h-5 w-5 text-muted-foreground')}
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-4 w-full animate-pulse rounded bg-muted" />
      <div className="mt-1.5 h-4 w-2/3 animate-pulse rounded bg-muted" />
    </div>
  );
}

export { Skeleton } from '@/components/ui/skeleton';

export function TagPill({ tag, onClick }: { tag: string; onClick?: () => void }) {
  return <Badge variant="secondary" className="cursor-pointer font-normal hover:bg-accent" onClick={onClick}>{tag}</Badge>;
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-border">/</span>}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-foreground">{item.label}</Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function ProgressBar({ percent, color = 'violet', className }: { percent: number; color?: string; className?: string }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className={cn('h-full rounded-full bg-gradient-to-r transition-[width] duration-500', tokens(color).gradient)}
        style={{ width: `${Math.max(2, Math.min(100, percent))}%` }}
      />
    </div>
  );
}
