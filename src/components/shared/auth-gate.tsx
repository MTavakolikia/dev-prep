'use client';

// ============================================================
// Dev Prep — AuthGateDialog: shown when a guest tries an action
// that requires an account (start a session, bookmark, daily
// challenge). Browsing stays open; progress tracking is the
// reason to sign in. Carries ?next= so login returns the user
// to where they were.
// ============================================================
import { Link, navigate, useRoute } from '@/router';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, Eye } from 'lucide-react';

export interface AuthGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What the guest tried to do, e.g. "start an interview session" */
  feature: string;
  /** Optional extra line about what an account unlocks */
  perk?: string;
}

export function AuthGateDialog({ open, onOpenChange, feature, perk }: AuthGateDialogProps) {
  const route = useRoute();
  // open-redirect guard: only same-app absolute paths
  const next = route.raw.startsWith('/') && !route.raw.startsWith('//') ? route.raw : '/interview';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LogIn className="h-5 w-5" />
          </span>
          <DialogTitle className="text-center text-lg">Sign in to {feature}</DialogTitle>
          <DialogDescription className="text-center text-[13px] leading-relaxed">
            You can browse every question and model answer for free — but an account is required
            to track your progress{perk ? `: ${perk}` : ' — scores, weak areas, readiness and streaks'}.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-1 grid gap-2">
          <Button className="h-10 gap-2" onClick={() => navigate(`/login?next=${encodeURIComponent(next)}`)}>
            <LogIn className="h-4 w-4" /> Sign in
          </Button>
          <Button variant="outline" className="h-10 gap-2" onClick={() => navigate(`/register?next=${encodeURIComponent(next)}`)}>
            <UserPlus className="h-4 w-4" /> Create free account
          </Button>
          <Button variant="ghost" className="h-9 gap-2 text-muted-foreground" onClick={() => onOpenChange(false)}>
            <Eye className="h-4 w-4" /> Keep browsing questions
          </Button>
        </div>

        <p className="text-center text-[11.5px] text-muted-foreground">
          Takes under a minute · your session scores, skill graph and readiness start updating right away.
        </p>
      </DialogContent>
    </Dialog>
  );
}

/** Small dismissible-free strip for guest-facing pages. */
export function GuestHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-primary/20 bg-primary/[0.045] px-4 py-2.5 text-[12.5px] text-muted-foreground">
      <LogIn className="h-3.5 w-3.5 shrink-0 text-primary" />
      {children}
      <Link href="/login" className="ml-auto font-semibold text-primary hover:underline">Sign in →</Link>
    </div>
  );
}
