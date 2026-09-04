'use client';

// ============================================================
// Dev Prep — CMS: questions / users / taxonomy / settings managers
// ============================================================
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminListQuestionsAction, adminDeleteQuestionAction, adminListUsersAction, adminSetUserRoleAction, adminListTaxonomyAction, adminUpsertTechnologyAction, adminGetSettingsAction } from '@/server/actions/admin';
import { Avatar, TechIcon } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { SENIORITY_LABELS } from '@/lib/design';
import { SENIORITIES, ROLE_LABELS } from '@/types';
import type { Role } from '@/types';
import { toast } from 'sonner';
import { Search, Trash2, ChevronLeft, ChevronRight, Plus, ShieldCheck } from 'lucide-react';

// ---------------- Settings ----------------
export function AdminSettings() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: adminGetSettingsAction });
  if (isLoading || !data) return <Skeleton className="h-96 rounded-2xl" />;

  const rows = [
    { label: 'Site name', value: data.siteName },
    { label: 'Tagline', value: data.siteDescription },
    { label: 'AI provider', value: `${data.aiProvider} (abstraction layer: zai → openai → anthropic → none)` },
    { label: 'Storage driver', value: `${data.storageDriver} (swap to s3/supabase via STORAGE_DRIVER)` },
    { label: 'Admin email (env)', value: data.adminEmail },
    { label: 'Version', value: `v${data.version}` },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">Settings</h1>
      <p className="mt-0.5 text-[13px] text-muted-foreground">Runtime configuration resolved from validated environment variables.</p>
      <div className="mt-6 max-w-xl divide-y rounded-xl border bg-card">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 px-4 py-3">
            <p className="text-[13px] font-medium">{r.label}</p>
            <p className="max-w-[60%] text-right font-mono text-[12px] text-muted-foreground">{r.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex max-w-xl items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          Secrets never live in code: admin credentials come from <span className="font-mono">ADMIN_EMAIL</span> / <span className="font-mono">ADMIN_PASSWORD</span> environment variables,
          validated at boot. See <span className="font-mono">.env.example</span> for the full documented surface.
        </p>
      </div>
    </div>
  );
}
