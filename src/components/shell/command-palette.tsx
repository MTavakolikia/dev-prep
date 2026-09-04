'use client';

// ============================================================
// Dev Prep — Command palette (⌘K / Ctrl+K / /)
// Actions + live search across articles, questions, techs, paths.
// ============================================================
import { useState } from 'react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@/components/ui/command';
import { useUiStore } from '@/stores/ui';
import { navigate } from '@/router';
import { useSession } from '@/providers/app-providers';
import { searchSuggestAction } from '@/server/actions/content';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Search, FileText, ListChecks, Layers, Route, Moon, Sun, LayoutDashboard, Swords,
  Sparkles, TrendingUp, Library, PenTool, LogIn, UserPlus, Settings2,
} from 'lucide-react';
import { useTheme } from 'next-themes';

export function CommandPalette() {
  const { commandOpen, closeCommand, toggleAi, setAiOpen } = useUiStore();
  const { user } = useSession();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState('');

  const { data: suggestions } = useQuery({
    queryKey: ['palette-suggest', query],
    queryFn: () => searchSuggestAction(query),
    enabled: commandOpen,
    staleTime: 10_000,
  });

  const go = (path: string) => { closeCommand(); navigate(path); };
  const run = (fn: () => void) => { closeCommand(); fn(); };

  return (
    <CommandDialog
      open={commandOpen}
      onOpenChange={(open) => { if (!open) { closeCommand(); setQuery(''); } }}
      className="max-w-xl"
    >
      <CommandInput placeholder="Search articles, questions, technologies…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {suggestions?.articles?.length ? (
          <CommandGroup heading="Articles">
            {suggestions.articles.map((a) => (
              <CommandItem key={a.slug} value={`article-${a.slug}`} onSelect={() => go(`/articles/${a.slug}`)}>
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{a.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {suggestions?.questions?.length ? (
          <CommandGroup heading="Interview questions">
            {suggestions.questions.map((q) => (
              <CommandItem key={q.id} value={`question-${q.id}`} onSelect={() => go(`/questions?q=${encodeURIComponent(q.question.slice(0, 40))}`)}>
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{q.question}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {suggestions?.recent?.length ? (
          <CommandGroup heading="Trending & recent">
            {suggestions.recent.map((r) => (
              <CommandItem key={r} value={`recent-${r}`} onSelect={() => go(`/search?q=${encodeURIComponent(r)}`)}>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span>{r}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        <CommandSeparator />
        <CommandGroup heading="Go to">
          <CommandItem onSelect={() => go('/articles')}><Search className="h-4 w-4" /> Browse all articles</CommandItem>
          <CommandItem onSelect={() => go('/technologies')}><Layers className="h-4 w-4" /> Technologies</CommandItem>
          <CommandItem onSelect={() => go('/interview')}><Swords className="h-4 w-4" /> Interview preparation</CommandItem>
          <CommandItem onSelect={() => go('/questions')}><ListChecks className="h-4 w-4" /> Question bank</CommandItem>
          <CommandItem onSelect={() => go('/learning-paths')}><Route className="h-4 w-4" /> Learning paths</CommandItem>
          <CommandItem onSelect={() => go('/library')}><Library className="h-4 w-4" /> My library</CommandItem>
          <CommandItem onSelect={() => go('/dashboard')}><LayoutDashboard className="h-4 w-4" /> Dashboard</CommandItem>
          {['ADMIN', 'SUPER_ADMIN', 'EDITOR', 'AUTHOR'].includes(user?.role ?? '') && (
            <CommandItem onSelect={() => go('/admin')}><Settings2 className="h-4 w-4" /> CMS Admin</CommandItem>
          )}
        </CommandGroup>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(() => setAiOpen(true))}>
            <Sparkles className="h-4 w-4" /> Ask the AI assistant
            <CommandShortcut>⌘⇧I</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('/interview')}><Swords className="h-4 w-4" /> Start an interview session</CommandItem>
          <CommandItem
            onSelect={() => { closeCommand(); setTheme(theme === 'dark' ? 'light' : 'dark'); toast.success(theme === 'dark' ? 'Light mode' : 'Dark mode'); }}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Toggle theme
          </CommandItem>
          {!user && (
            <>
              <CommandItem onSelect={() => go('/login')}><LogIn className="h-4 w-4" /> Sign in</CommandItem>
              <CommandItem onSelect={() => go('/register')}><UserPlus className="h-4 w-4" /> Create account</CommandItem>
            </>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

