'use client';

import { Link } from '@/router';
import { Button } from '@/components/ui/button';
import { FileQuestion, Compass } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-28 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border bg-card">
        <FileQuestion className="h-7 w-7 text-muted-foreground" />
      </span>
      <p className="mt-6 font-mono text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">404 — route not found</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">This page wandered off the graph</h1>
      <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-muted-foreground">
        The link may be outdated. The library, question bank and paths are all one keystroke away.
      </p>
      <div className="mt-7 flex gap-2.5">
        <Button asChild><Link href="/"><Compass className="h-4 w-4" /> Back home</Link></Button>
        <Button variant="outline" asChild><Link href="/articles">Browse articles</Link></Button>
      </div>
    </div>
  );
}
