'use client';

// ============================================================
// Dev Prep — AI Assistant side panel (⌘⇧I)
// Provider abstraction on the server: z-ai SDK with heuristic
// fallback. Context-aware: passes the article you are reading.
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUiStore } from '@/stores/ui';
import { useSession } from '@/providers/app-providers';
import { chatWithAiAction } from '@/server/actions/ai';
import { useRoute } from '@/router';
import { cn } from '@/lib/utils';
import { SendHorizontal, Sparkles, Bot, User as UserIcon, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Message { role: 'user' | 'assistant'; content: string }

const STARTERS = [
  'Explain React Server Components simply',
  'Give me a senior React interview question',
  'Create a path to become a senior frontend dev',
  'Quiz me about JavaScript closures',
];

export function AiPanel() {
  const { aiOpen, setAiOpen } = useUiStore();
  const { user } = useSession();
  const route = useRoute();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // context: are we reading an article?
  const articleSlug = route.segments[0] === 'articles' ? route.segments[1] : null;
  const techSlug = route.segments[0] === 'technologies' ? route.segments[1] : null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || pending) return;
    if (!user) {
      toast.error('Sign in to use the AI assistant');
      return;
    }
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: message }]);
    setPending(true);
    const result = await chatWithAiAction({
      conversationId,
      message,
      articleTitle: articleSlug?.replace(/-/g, ' ') ?? null,
      technologyName: techSlug?.replace(/-/g, ' ') ?? null,
    });
    setPending(false);
    if (result.ok && result.reply) {
      setConversationId(result.conversationId ?? null);
      setMessages((m) => [...m, { role: 'assistant', content: result.reply! }]);
    } else {
      toast.error(result.error ?? 'The assistant is unavailable right now');
    }
  };

  const reset = () => { setMessages([]); setConversationId(null); setInput(''); };

  // Render minimal markdown (bold + lists + paragraphs)
  const renderContent = (content: string) => (
    <div className="space-y-2 text-[13px] leading-relaxed">
      {content.split('\n').map((line, i) => {
        if (!line.trim()) return null;
        const html = line
          .replace(/&/g, '&amp;').replace(/</g, '&lt;')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>');
        const bullet = /^[-\d]+[.)]?\s+/.test(line);
        return <p key={i} className={cn(bullet && 'pl-3 -indent-3')} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </div>
  );

  return (
    <Sheet open={aiOpen} onOpenChange={setAiOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-[15px]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            Dev Prep Assistant
          </SheetTitle>
          <SheetDescription className="text-xs">
            Interview coach &amp; study partner{articleSlug ? ' · reading context attached' : ''}
          </SheetDescription>
        </SheetHeader>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-[13px] font-medium">Ask anything about frontend development</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  I know what you are reading and can explain concepts, quiz you, generate
                  interview questions, or build a learning plan.
                </p>
              </div>
              <div className="space-y-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-left text-[13px] transition-colors hover:border-primary/40 hover:bg-accent/50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={cn('flex gap-2.5', m.role === 'user' && 'justify-end')}>
                  {m.role === 'assistant' && (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
                      <Bot className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <div className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5',
                    m.role === 'user' ? 'bg-primary text-primary-foreground' : 'border bg-card',
                  )}>
                    {renderContent(m.content)}
                  </div>
                  {m.role === 'user' && (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                      <UserIcon className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              ))}
              {pending && (
                <div className="flex gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
                    <Bot className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex items-center gap-1 rounded-2xl border bg-card px-4 py-3">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t p-4">
          {messages.length > 0 && (
            <div className="mb-2.5 flex justify-end">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={reset}>
                <RotateCcw className="h-3 w-3" /> New conversation
              </Button>
            </div>
          )}
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex items-end gap-2"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={user ? 'Ask about an article, request a quiz…' : 'Sign in to chat'}
              rows={1}
              className="max-h-32 min-h-10 resize-none"
              disabled={!user}
            />
            <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={!input.trim() || pending}>
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
