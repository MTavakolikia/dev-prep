'use client';

// ============================================================
// Dev Prep — CMS: questions / users / taxonomy / settings managers
// ============================================================
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminListUsersAction, adminSetUserRoleAction, adminCreateUserAction,
  adminUpdateUserAction, adminDeleteUserAction, adminRestoreUserAction, adminResetUserPasswordAction,
} from '@/server/actions/admin';
import { useSession } from '@/providers/app-providers';
import { navigate } from '@/router';
import { Avatar } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ALL_ROLES, ROLE_LABELS } from '@/types';
import type { Role, UserDTO } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Search, Trash2, ChevronLeft, ChevronRight, Plus, MoreHorizontal, Pencil, KeyRound, RotateCcw, UserRound } from 'lucide-react';

const PAGE_SIZE = 12;

// ---------------- Users manager ----------------
export function AdminUsers() {
  const queryClient = useQueryClient();
  const { user: me } = useSession();
  const isSuper = me?.role === 'SUPER_ADMIN';

  const [search, setSearch] = useState('');
  const [queryStr, setQueryStr] = useState('');
  const [role, setRole] = useState('all');
  const [page, setPage] = useState(1);
  const [showRemoved, setShowRemoved] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UserDTO | null>(null);
  const [resetTarget, setResetTarget] = useState<UserDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserDTO | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { page, queryStr, role, showRemoved }],
    queryFn: () => adminListUsersAction({ page, search: queryStr, role: role === 'all' ? undefined : role, showRemoved }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] });

  const setRoleMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminSetUserRoleAction(id, role),
    onSuccess: (r) => { if (r.ok) { toast.success('Role updated'); invalidate(); } else toast.error(r.error ?? 'Failed'); },
  });
  const createMut = useMutation({
    mutationFn: (input: { name: string; email: string; password: string; role: string; headline: string }) => adminCreateUserAction(input),
    onSuccess: (r) => { if (r.ok) { toast.success('User created'); setCreateOpen(false); invalidate(); } else toast.error(r.error ?? 'Failed'); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...input }: { id: string; name: string; email: string; role: string; headline: string; bio: string }) => adminUpdateUserAction(id, input),
    onSuccess: (r) => { if (r.ok) { toast.success('User updated'); setEditing(null); invalidate(); } else toast.error(r.error ?? 'Failed'); },
  });
  const removeMut = useMutation({
    mutationFn: adminDeleteUserAction,
    onSuccess: (r) => { if (r.ok) { toast.success('User removed'); setDeleteTarget(null); invalidate(); } else toast.error(r.error ?? 'Failed'); },
  });
  const restoreMut = useMutation({
    mutationFn: adminRestoreUserAction,
    onSuccess: (r) => { if (r.ok) { toast.success('User restored'); invalidate(); } else toast.error(r.error ?? 'Failed'); },
  });
  const resetMut = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => adminResetUserPasswordAction(id, password),
    onSuccess: (r) => { if (r.ok) { toast.success('Password reset'); setResetTarget(null); } else toast.error(r.error ?? 'Failed'); },
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">Users & roles</h1>
      <p className="mt-0.5 text-[13px] text-muted-foreground">
        {data?.total ?? '...'} users · RBAC: USER → AUTHOR → EDITOR → ADMIN → SUPER_ADMIN
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <form className="relative" onSubmit={(e) => { e.preventDefault(); setPage(1); setQueryStr(search); }}>
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="h-9 w-60 pl-8" />
        </form>
        <Select value={role} onValueChange={(v) => { setRole(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={() => { setShowRemoved((v) => !v); setPage(1); }}
          className={cn(
            'h-9 rounded-lg border px-3 text-[12.5px] font-medium transition-colors',
            showRemoved ? 'border-primary/40 bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          Show removed
        </button>
        <div className="flex-1" />
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New user</Button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">User</th>
              <th className="px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
              <th className="hidden px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Level</th>
              <th className="hidden px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Joined</th>
              <th className="w-12 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? [...Array(6)].map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><Skeleton className="h-8 w-full" /></td></tr>)
              : data?.users.map((u) => {
                const removed = !!u.deletedAt;
                const isSelf = me?.id === u.id;
                const canModify = isSuper || u.role !== 'SUPER_ADMIN';
                return (
                  <tr key={u.id} className={cn('hover:bg-accent/40', removed && 'opacity-60')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} color={u.avatarColor} size="sm" />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate text-[13px] font-medium">
                            {u.name}
                            {removed && <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">Removed</Badge>}
                            {isSelf && <Badge variant="outline" className="px-1.5 py-0 text-[10px]">You</Badge>}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Select value={u.role} disabled={removed || isSelf} onValueChange={(v) => setRoleMut.mutate({ id: u.id, role: v })}>
                        <SelectTrigger className="h-8 w-[130px] text-[12px]" aria-label={`Role for ${u.name}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ALL_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="hidden px-4 py-3 text-[12.5px] text-muted-foreground tabular-nums sm:table-cell">Lv {u.level} · {u.xp.toLocaleString()} XP</td>
                    <td className="hidden px-4 py-3 text-[12.5px] text-muted-foreground md:table-cell">{new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</td>
                    <td className="px-2 py-3">
                      <UserRowActions
                        user={u}
                        canModify={canModify}
                        onEdit={() => setEditing(u)}
                        onReset={() => setResetTarget(u)}
                        onRemove={() => setDeleteTarget(u)}
                        onRestore={() => restoreMut.mutate(u.id)}
                      />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        {data && data.users.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No users match the filters.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-[12.5px] text-muted-foreground tabular-nums">Page {page} / {totalPages}</span>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        roleOptions={isSuper ? ALL_ROLES : ALL_ROLES.filter((r) => r !== 'SUPER_ADMIN')}
        pending={createMut.isPending}
        onCreate={(input) => createMut.mutate(input)}
      />
      <EditUserDialog
        key={`edit:${editing?.id ?? 'closed'}`}
        user={editing}
        isSelf={!!editing && me?.id === editing.id}
        roleOptions={isSuper ? ALL_ROLES : ALL_ROLES.filter((r) => r !== 'SUPER_ADMIN')}
        pending={updateMut.isPending}
        onClose={() => setEditing(null)}
        onUpdate={(id, input) => updateMut.mutate({ id, ...input })}
      />
      <ResetPasswordDialog
        key={`reset:${resetTarget?.id ?? 'closed'}`}
        user={resetTarget}
        pending={resetMut.isPending}
        onClose={() => setResetTarget(null)}
        onReset={(id, password) => resetMut.mutate({ id, password })}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Their account will be deactivated: they get signed out and disappear from the site,
              but their content (articles, comments, progress) is kept. You can restore them later
              via “Show removed”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) removeMut.mutate(deleteTarget.id); }}>
              Remove user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UserRowActions({ user, canModify, onEdit, onReset, onRemove, onRestore }: {
  user: UserDTO; canModify: boolean;
  onEdit: () => void; onReset: () => void; onRemove: () => void; onRestore: () => void;
}) {
  const [open, setOpen] = useState(false);
  const removed = !!user.deletedAt;
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen((v) => !v)} aria-label={`Actions for ${user.name}`}>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-44 rounded-lg border bg-popover p-1 shadow-xl">
            {removed ? (
              <RowAction icon={<RotateCcw className="h-3.5 w-3.5" />} label="Restore user" onClick={() => { setOpen(false); onRestore(); }} />
            ) : (
              <>
                <RowAction icon={<UserRound className="h-3.5 w-3.5" />} label="View profile" onClick={() => { setOpen(false); navigate(`/profile/${user.id}`); }} />
                {canModify && <RowAction icon={<Pencil className="h-3.5 w-3.5" />} label="Edit" onClick={() => { setOpen(false); onEdit(); }} />}
                {canModify && <RowAction icon={<KeyRound className="h-3.5 w-3.5" />} label="Reset password" onClick={() => { setOpen(false); onReset(); }} />}
                <div className={cn('h-px bg-border', canModify && 'my-1')} />
                <RowAction icon={<Trash2 className="h-3.5 w-3.5" />} label="Remove user" danger onClick={() => { setOpen(false); onRemove(); }} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function RowAction({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] hover:bg-accent', danger && 'text-destructive hover:bg-destructive/10')} onClick={onClick}>
      {icon} {label}
    </button>
  );
}

const EMPTY_CREATE = { name: '', email: '', password: '', role: 'USER', headline: '' };

function CreateUserDialog({ open, onOpenChange, roleOptions, pending, onCreate }: {
  open: boolean; onOpenChange: (v: boolean) => void; roleOptions: Role[]; pending: boolean;
  onCreate: (input: typeof EMPTY_CREATE) => void;
}) {
  const [form, setForm] = useState(EMPTY_CREATE);
  const setField = (k: keyof typeof EMPTY_CREATE, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setDialogOpen = (v: boolean) => { if (v) setForm(EMPTY_CREATE); onOpenChange(v); };
  const valid = form.name.trim() && form.email.trim() && form.password.length >= 8;
  return (
    <Dialog open={open} onOpenChange={setDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New user</DialogTitle>
          <DialogDescription>Create an account — the user can sign in right away.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Full name" /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="user@example.com" /></div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input type="password" value={form.password} onChange={(e) => setField('password', e.target.value)} placeholder="••••••••" />
            <p className="text-[11px] text-muted-foreground">At least 8 characters.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setField('role', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{roleOptions.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Headline (optional)</Label><Input value={form.headline} onChange={(e) => setField('headline', e.target.value)} placeholder="Staff engineer, ex-…" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => onCreate(form)} disabled={!valid || pending}>Create user</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ user, isSelf, roleOptions, pending, onClose, onUpdate }: {
  user: UserDTO | null; isSelf: boolean; roleOptions: Role[]; pending: boolean;
  onClose: () => void;
  onUpdate: (id: string, input: { name: string; email: string; role: string; headline: string; bio: string }) => void;
}) {
  const [form, setForm] = useState(() => ({
    name: user?.name ?? '', email: user?.email ?? '', role: user?.role ?? 'USER',
    headline: user?.headline ?? '', bio: user?.bio ?? '',
  }));
  const setField = (k: 'name' | 'email' | 'role' | 'headline' | 'bio', v: string) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name.trim() && form.email.trim();
  return (
    <Dialog open={!!user} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {user?.name}</DialogTitle>
          <DialogDescription>Update profile details and access level.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setField('name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.role} disabled={isSelf} onValueChange={(v) => setField('role', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isSelf && <p className="text-[11px] text-muted-foreground">You cannot change your own role.</p>}
          </div>
          <div className="space-y-1.5"><Label>Headline</Label><Input value={form.headline} onChange={(e) => setField('headline', e.target.value)} placeholder="Shown on the profile" /></div>
          <div className="space-y-1.5"><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => setField('bio', e.target.value)} rows={3} placeholder="Short biography" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (user) onUpdate(user.id, form); }} disabled={!valid || pending}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ user, pending, onClose, onReset }: {
  user: UserDTO | null; pending: boolean;
  onClose: () => void; onReset: (id: string, password: string) => void;
}) {
  const [password, setPassword] = useState('');
  return (
    <Dialog open={!!user} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password for {user?.name}</DialogTitle>
          <DialogDescription>The user can sign in with the new password immediately.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>New password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          <p className="text-[11px] text-muted-foreground">At least 8 characters.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (user) onReset(user.id, password); }} disabled={password.length < 8 || pending}>Reset password</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
