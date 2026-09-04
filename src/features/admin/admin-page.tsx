'use client';

// ============================================================
// Dev Prep — Admin CMS shell: role-gated area with sidebar nav
// for overview, articles (editor), questions, users, taxonomy
// and settings. Authorization is enforced server-side too.
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { Link, useRoute } from '@/router';
import { useSession } from '@/providers/app-providers';
import { whoAmIAction } from '@/server/actions/auth';
import { EmptyState } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FileText, ListChecks, Users, Shapes, Settings2, ArrowLeft, ShieldAlert,
} from 'lucide-react';
import { AdminOverview } from './admin-overview';
import { AdminArticles } from './admin-articles';
import { ArticleEditor } from './article-editor';
import { AdminQuestions } from './admin-questions';
import { AdminUsers } from './admin-users';
import { AdminTaxonomy } from './admin-taxonomy';
import { AdminSettings } from './admin-settings';

const NAV = [
  { seg: undefined, label: 'Overview', icon: LayoutDashboard },
  { seg: 'articles', label: 'Articles', icon: FileText },
  { seg: 'questions', label: 'Questions', icon: ListChecks },
  { seg: 'users', label: 'Users', icon: Users, minRole: 'ADMIN' },
  { seg: 'taxonomy', label: 'Taxonomy', icon: Shapes, minRole: 'ADMIN' },
  { seg: 'settings', label: 'Settings', icon: Settings2, minRole: 'ADMIN' },
];

export function AdminPage() {
  const route = useRoute();
  const section = route.segments[1];
  const { user } = useSession();
  const { data: fresh, isLoading } = useQuery({ queryKey: ['session'], queryFn: whoAmIAction });
  const me = user ?? fresh;

  if (isLoading && !me) {
    return <div className="mx-auto max-w-7xl px-4 py-10"><Skeleton className="h-96 rounded-2xl" /></div>;
  }

  const allowed = me && ['AUTHOR', 'EDITOR', 'ADMIN', 'SUPER_ADMIN'].includes(me.role);
  if (!allowed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <EmptyState
          icon="shield-alert" title="Admin area"
          description="You need an author, editor or admin role to access the CMS. Sign in with the admin demo account to explore it."
          action={<Button asChild><Link href="/login"><ShieldAlert className="h-4 w-4" /> Sign in</Link></Button>}
        />
      </div>
    );
  }

  const order: Record<string, number> = { USER: 0, AUTHOR: 1, EDITOR: 2, ADMIN: 3, SUPER_ADMIN: 4 };
  const editing = section === 'articles' && route.segments[2];

  return (
    <div className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* sidebar */}
        <aside className="lg:w-52 lg:shrink-0 no-print">
          <div className="flex items-center gap-2 px-2 pb-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to site
            </Link>
          </div>
          <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
            <p className="hidden px-3 pb-2 text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground/70 lg:block">Content Studio</p>
            {NAV.filter((n) => !n.minRole || order[me!.role] >= order[n.minRole as string]).map((n) => {
              const active = (section ?? undefined) === n.seg && !route.segments[2];
              return (
                <Link
                  key={n.label}
                  href={n.seg ? `/admin/${n.seg}` : '/admin'}
                  className={cn(
                    'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                    active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <n.icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* content */}
        <div className="min-w-0 flex-1">
          {editing ? (
            <ArticleEditor id={route.segments[2] === 'new' ? null : route.segments[2]} />
          ) : section === 'articles' ? <AdminArticles />
            : section === 'questions' ? <AdminQuestions />
            : section === 'users' ? <AdminUsers />
            : section === 'taxonomy' ? <AdminTaxonomy />
            : section === 'settings' ? <AdminSettings />
            : <AdminOverview />}
        </div>
      </div>
    </div>
  );
}
