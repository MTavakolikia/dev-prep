'use client';

// ============================================================
// Dev Prep — Auth: sign in / create account. Demo credentials
// surfaced for the sandbox preview; admin creds come from env.
// ============================================================
import { useState } from 'react';
import { Link, navigate, useRoute } from '@/router';
import { loginAction, registerAction } from '@/server/actions/auth';
import { useSession } from '@/providers/app-providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Sparkles, Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowRight, Github } from 'lucide-react';

export function AuthPage({ mode }: { mode: string }) {
  const isLogin = mode === 'login';
  const { refresh } = useSession();
  const route = useRoute();
  // same-app redirect target after success (guarded against open redirects)
  const nextParam = route.query.next;
  const next = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = isLogin
      ? await loginAction({ email, password })
      : await registerAction({ name, email, password });
    setPending(false);
    if (result.ok && result.user) {
      await refresh();
      toast.success(isLogin ? `Welcome back, ${result.user.name.split(' ')[0]}` : 'Account created — welcome to Dev Prep');
      navigate(next ?? (result.user.role === 'USER' ? '/dashboard' : '/admin'));
    } else {
      setError(result.error ?? 'Something went wrong');
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-60px)] items-center justify-center overflow-hidden px-4 py-12">
      <div className="df-grid-bg df-hero-fade absolute inset-0" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border bg-card p-7 shadow-xl shadow-black/[0.03] sm:p-8">
          <div className="text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 text-white shadow-lg shadow-violet-600/30">
              <Sparkles className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <h1 className="mt-4 text-xl font-bold tracking-tight">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              {isLogin ? 'Continue your streak and pick up where you left off.' : 'Start tracking progress in under a minute.'}
            </p>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" className="h-10 pl-9" required minLength={2} />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-10 pl-9" required autoComplete="email" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {isLogin && <span className="text-[11.5px] text-muted-foreground">min 8 characters</span>}
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password" type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="h-10 pr-10 pl-9" required autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-[12.5px] font-medium text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="h-10 w-full gap-2 text-[14px]" disabled={pending}>
              {pending ? 'One moment…' : <>{isLogin ? 'Sign in' : 'Create account'} <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <div className="mt-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Button variant="outline" className="h-10" onClick={() => toast.info('GitHub OAuth is wired in the architecture — configure GITHUB_CLIENT_ID in .env to enable.')}>
              <Github className="h-4 w-4" /> GitHub
            </Button>
            <Button variant="outline" className="h-10" onClick={() => toast.info('Google OAuth is wired in the architecture — configure GOOGLE_CLIENT_ID in .env to enable.')}>
              <Mail className="h-4 w-4" /> Google
            </Button>
          </div>

          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            {isLogin ? (
              <>New here? <Link href={next ? `/register?next=${encodeURIComponent(next)}` : '/register'} className="font-medium text-primary hover:underline">Create an account</Link></>
            ) : (
              <>Already have an account? <Link href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'} className="font-medium text-primary hover:underline">Sign in</Link></>
            )}
          </p>
          {next && (
            <p className="mt-1 text-center text-[11.5px] text-muted-foreground/80">
              You'll return to <span className="font-medium text-foreground">{next.split('?')[0]}</span> after signing in.
            </p>
          )}
        </div>

        {/* demo credentials */}
        <div className="mt-4 rounded-xl border border-primary/25 bg-primary/[0.04] p-4 text-[12.5px]">
          <p className="font-semibold text-primary">Sandbox demo accounts</p>
          <div className="mt-2 space-y-1 font-mono text-[12px] text-muted-foreground">
            <button className="block w-full rounded px-1 py-0.5 text-left hover:bg-accent/50" onClick={() => { setEmail('alex@devprep.dev'); setPassword('Demo-2026!'); }}>
              reader → alex@devprep.dev / Demo-2026!
            </button>
            <button className="block w-full rounded px-1 py-0.5 text-left hover:bg-accent/50" onClick={() => { setEmail('admin@devprep.dev'); setPassword('Forge-Admin-2026!'); }}>
              admin  → admin@devprep.dev / Forge-Admin-2026!
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground/70">Click to autofill · admin credentials come from environment variables in production.</p>
        </div>
      </div>
    </div>
  );
}
