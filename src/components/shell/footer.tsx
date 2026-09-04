'use client';

import { Link } from '@/router';
import { Sparkles } from 'lucide-react';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Learn',
    links: [
      { label: 'All articles', href: '/articles' },
      { label: 'Technologies', href: '/technologies' },
      { label: 'Learning paths', href: '/learning-paths' },
      { label: 'Cheat sheets', href: '/cheatsheets' },
    ],
  },
  {
    title: 'Practice',
    links: [
      { label: 'Interview simulator', href: '/interview' },
      { label: 'Question bank', href: '/questions' },
      { label: 'Daily challenge', href: '/interview' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'My library', href: '/library' },
      { label: 'Search', href: '/search' },
      { label: 'Sign in', href: '/login' },
      { label: 'Create account', href: '/register' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-violet-400 text-white">
                <Sparkles className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <span className="text-[15px] font-bold tracking-tight">Dev Prep</span>
            </Link>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              The Developer Operating System. Learn modern frontend, practice interviews,
              and track your growth — one focused session at a time.
            </p>
            <p className="mt-4 text-[11px] text-muted-foreground/70">
              1,150+ articles · 970+ interview questions · Built with Next.js 16
            </p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-[13px] font-semibold">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-[12px] text-muted-foreground">
          <p>© {new Date().getFullYear()} Dev Prep. Crafted for developers who ship.</p>
          <p className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            All systems operational
          </p>
        </div>
      </div>
    </footer>
  );
}
