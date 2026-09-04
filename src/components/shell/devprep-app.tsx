'use client';

// ============================================================
// Dev Prep — application shell: router outlet, header, footer,
// command palette, AI assistant, auth gate. The entire SPA
// composition lives here (single exposed route in sandbox).
// ============================================================
import { useEffect, useSyncExternalStore } from 'react';
import { Providers, useSession } from '@/providers/app-providers';
import { useRouterContext, RouterProvider, useRoute } from '@/router';
import { Header } from '@/components/shell/header';
import { Footer } from '@/components/shell/footer';
import { CommandPalette } from '@/components/shell/command-palette';
import { AiPanel } from '@/components/shell/ai-panel';
import { useUiStore } from '@/stores/ui';

import { HomePage } from '@/features/home/home-page';
import { ArticlesPage } from '@/features/articles/articles-page';
import { ArticlePage } from '@/features/articles/article-page';
import { TechnologiesPage } from '@/features/technologies/technologies-page';
import { TechnologyPage } from '@/features/technologies/technology-page';
import { InterviewPage } from '@/features/interview/interview-page';
import { InterviewSessionPage } from '@/features/interview/interview-session';
import { QuestionsPage } from '@/features/interview/questions-page';
import { PathsPage } from '@/features/learning/paths-page';
import { PathPage } from '@/features/learning/path-page';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { LibraryPage } from '@/features/library/library-page';
import { CheatSheetsPage } from '@/features/cheatsheets/cheatsheets-page';
import { SearchPage } from '@/features/search/search-page';
import { AuthPage } from '@/features/auth/auth-page';
import { AdminPage } from '@/features/admin/admin-page';
import { NotFoundPage } from '@/features/not-found';

function Outlet() {
  const route = useRoute();
  switch (route.segments[0]) {
    case undefined: return <HomePage />;
    case 'articles': return route.segments[1] ? <ArticlePage slug={route.segments[1]} /> : <ArticlesPage />;
    case 'technologies': return route.segments[1] ? <TechnologyPage slug={route.segments[1]} /> : <TechnologiesPage />;
    case 'interview': return route.segments[1] === 'session' ? <InterviewSessionPage /> : <InterviewPage />;
    case 'questions': return <QuestionsPage />;
    case 'learning-paths': return route.segments[1] ? <PathPage slug={route.segments[1]} /> : <PathsPage />;
    case 'dashboard': return <DashboardPage />;
    case 'library': return <LibraryPage />;
    case 'cheatsheets': return <CheatSheetsPage />;
    case 'search': return <SearchPage />;
    case 'login': case 'register': return <AuthPage mode={route.segments[0]} />;
    case 'admin': return <AdminPage />;
    default: return <NotFoundPage />;
  }
}

function Chrome() {
  const route = useRoute();
  const openCommand = useUiStore((s) => s.openCommand);
  const isImmersive = route.segments[0] === 'interview' && route.segments[1] === 'session';
  // overlay components (Radix dialogs) are client-only to avoid SSR id mismatches
  const overlaysMounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCommand();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i' && e.shiftKey) {
        e.preventDefault();
        useUiStore.getState().toggleAi();
      }
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        openCommand();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openCommand]);

  return (
    <div className="flex min-h-screen flex-col">
      {!isImmersive && <Header />}
      <main className={isImmersive ? 'flex-1' : 'flex-1'}>
        <Outlet />
      </main>
      {!isImmersive && <Footer />}
      {overlaysMounted && <CommandPalette />}
      {overlaysMounted && <AiPanel />}
    </div>
  );
}

const subscribeNoop = () => () => { };

export function DevPrepApp() {
  return (
    <Providers>
      <Chrome />
    </Providers>
  );
}

export { useSession };
