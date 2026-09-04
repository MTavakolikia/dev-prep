'use client';

// ============================================================
// Dev Prep — top navigation: brand, primary nav, search trigger,
// notifications, theme toggle, user menu, mobile sheet.
// ============================================================
import { useState, useSyncExternalStore } from 'react';
import { Link, useIsActive } from '@/router';
import { useSession } from '@/providers/app-providers';
import { useUiStore } from '@/stores/ui';
import { Avatar } from '@/components/shared/primitives';
import { dynamicIconImport } from '@/components/shared/dynamic-icon';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listNotificationsAction, markNotificationsReadAction } from '@/server/actions/learning';
import { logoutAction } from '@/server/actions/auth';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  Search, Command, Bell, Sun, Moon, Menu, ChevronDown, LogOut, LayoutDashboard,
  Settings2, Library, Sparkles, LogIn, UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

const NAV = [
  { href: '/articles', label: 'Articles' },
  { href: '/technologies', label: 'Technologies' },
  { href: '/interview', label: 'Interview' },
  { href: '/learning-paths', label: 'Paths' },
  { href: '/cheatsheets', label: 'Cheatsheets' },
];

function NavLink({ href, label }: { href: string; label: string }) {
  const active = useIsActive(href);
  return (
    <Link
      href={href}
      className={cn(
        'relative rounded-md px-3 py-1.5 text-[13.5px] font-medium transition-colors',
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
      {active && <span className="absolute inset-x-3 -bottom-[13px] h-[2px] rounded-full bg-primary" />}
    </Link>
  );
}

const subscribeNoopHeader = () => () => {};

export function Header() {
  const { user } = useSession();
  const mobileNavMounted = useSyncExternalStore(subscribeNoopHeader, () => true, () => false);
  const openCommand = useUiStore((s) => s.openCommand);
  const toggleAi = useUiStore((s) => s.toggleAi);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[60px] max-w-7xl items-center gap-2 px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-ring">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-violet-400 text-white shadow-sm shadow-violet-600/30">
            <Sparkles className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="text-[15px] font-bold tracking-tight">Dev Prep</span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="ml-6 hidden items-center gap-0.5 lg:flex">
          {NAV.map((n) => <NavLink key={n.href} {...n} />)}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Search trigger */}
          <button
            onClick={openCommand}
            className="hidden h-9 items-center gap-2 rounded-lg border bg-muted/50 px-3 text-[13px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:flex"
            aria-label="Search (press /)"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search…</span>
            <kbd className="ml-4 hidden items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] text-muted-foreground md:flex">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>
          <Button variant="ghost" size="icon" className="sm:hidden" onClick={openCommand} aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>

          {/* AI */}
          <Button variant="ghost" size="icon" onClick={toggleAi} aria-label="AI assistant (Ctrl+Shift+I)" className="hidden sm:inline-flex">
            {dynamicIconImport('bot-message-square', 'h-4 w-4')}
          </Button>

          <NotificationsBell />
          <ThemeToggle />

          {/* User */}
          {user ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" className="hidden sm:inline-flex" asChild>
                <Link href="/register">Get started</Link>
              </Button>
              <Button variant="outline" size="icon" className="sm:hidden" asChild>
                <Link href="/login" aria-label="Sign in"><LogIn className="h-4 w-4" /></Link>
              </Button>
            </div>
          )}

          {/* Mobile nav (client-only: Radix ids differ across SSR) */}
          {mobileNavMounted && (
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex items-center gap-2.5 border-b px-5 py-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-violet-400 text-white">
                  <Sparkles className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <span className="font-bold tracking-tight">Dev Prep</span>
              </div>
              <nav aria-label="Mobile" className="flex flex-col gap-0.5 p-3">
                {NAV.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {n.label}
                  </Link>
                ))}
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">Dashboard</Link>
                <Link href="/library" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">My Library</Link>
              </nav>
            </SheetContent>
          </Sheet>
          )}
        </div>
      </div>
    </header>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // hydration-safe "mounted" flag: server snapshot = false
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const isDark = mounted && resolvedTheme === 'dark';
  return (
    <Button
      variant="ghost" size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

const subscribeNoop = () => () => {};

function NotificationsBell() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: listNotificationsAction,
    enabled: !!user,
    refetchInterval: 60_000,
  });
  const markRead = useMutation({
    mutationFn: markNotificationsReadAction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  if (!user) return null;
  const unread = data?.unread ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}>
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button onClick={() => markRead.mutate()} className="text-xs font-medium text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {data?.items?.length ? (
            <div className="divide-y">
              {data.items.map((n) => (
                <Link key={n.id} href={n.link ?? '#/dashboard'} className={cn('block px-4 py-3 transition-colors hover:bg-accent/50', !n.read && 'bg-primary/[0.04]')}>
                  <div className="flex items-start gap-2.5">
                    <span className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full', n.type === 'achievement' ? 'bg-amber-500/15 text-amber-500' : n.type === 'interview' ? 'bg-cyan-500/15 text-cyan-500' : 'bg-violet-500/15 text-violet-500')}>
                      {dynamicIconImport(n.type === 'achievement' ? 'award' : n.type === 'interview' ? 'swords' : 'sparkles', 'h-3 w-3')}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium leading-snug">{n.title}</p>
                      {n.body && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.body}</p>}
                      <p className="mt-1 text-[10.5px] text-muted-foreground/70">{new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">You are all caught up.</p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function UserMenu() {
  const { user, refresh } = useSession();
  const queryClient = useQueryClient();
  const setAiOpen = useUiStore((s) => s.setAiOpen);
  const logout = useMutation({
    mutationFn: logoutAction,
    onSuccess: async () => {
      queryClient.clear();
      await refresh();
      toast.success('Signed out');
      window.location.hash = '#/';
    },
  });
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-full outline-2 outline-ring focus-visible:outline" aria-label="User menu">
          <Avatar name={user.name} color={user.avatarColor} size="sm" />
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-[11px] font-medium text-primary">Level {user.level} · {user.xp.toLocaleString()} XP · {user.role}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/dashboard"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href={`/profile/${user.id}`}><UserRound className="h-4 w-4" /> My profile</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/library"><Library className="h-4 w-4" /> My Library</Link></DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAiOpen(true)}><Sparkles className="h-4 w-4" /> AI Assistant</DropdownMenuItem>
        {['ADMIN', 'SUPER_ADMIN', 'EDITOR', 'AUTHOR'].includes(user.role) && (
          <DropdownMenuItem asChild><Link href="/admin"><Settings2 className="h-4 w-4" /> CMS Admin</Link></DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout.mutate()}><LogOut className="h-4 w-4" /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

