import { useState, useEffect } from "react";
import {
  useListUsers, useListPts, useListShifts, useCreateUser, useUpdateUser, useDeleteUser,
  type UserWithRelations, type Pt, type Shift,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import {
  Users, Building, Shield, CheckCircle2, XCircle, Plus, X,
  Crown, Eye, Star, TrendingUp, Settings, Loader2, Pencil, UserX, UserCheck, KeyRound, Trash2, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Role {
  id: number;
  name: string;
  description?: string | null;
  activeStatus: boolean;
}

const ROLE_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  "Superadmin":    { color: "text-amber-400",   bg: "bg-amber-500/10",   icon: <Shield className="w-3.5 h-3.5" /> },
  "Owner":         { color: "text-violet-400",  bg: "bg-violet-500/10",  icon: <Crown className="w-3.5 h-3.5" /> },
  "Direksi":       { color: "text-blue-400",    bg: "bg-blue-500/10",    icon: <Eye className="w-3.5 h-3.5" /> },
  "Chief Dealing":   { color: "text-emerald-400", bg: "bg-emerald-500/10", icon: <Star className="w-3.5 h-3.5" /> },
  "Co-SPV Dealing":  { color: "text-yellow-400",  bg: "bg-yellow-500/10",  icon: <Users className="w-3.5 h-3.5" /> },
  "SPV Dealing":     { color: "text-orange-400",  bg: "bg-orange-500/10",  icon: <Star className="w-3.5 h-3.5" /> },
  "Dealer":          { color: "text-cyan-400",    bg: "bg-cyan-500/10",    icon: <TrendingUp className="w-3.5 h-3.5" /> },
  "Admin System":    { color: "text-rose-400",    bg: "bg-rose-500/10",    icon: <Settings className="w-3.5 h-3.5" /> },
};

const DEFAULT_ROLE_CFG = { color: "text-primary", bg: "bg-primary/10", icon: <Users className="w-3.5 h-3.5" /> };

interface UserForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  roleId: number;
  ptId: string;
  shiftId: string;
  positionTitle: string;
}

interface EditForm {
  name: string;
  roleId: number;
  ptId: string;
  shiftId: string;
  positionTitle: string;
  activeStatus: boolean;
}

const EMPTY_FORM: UserForm = {
  name: "", email: "", password: "", confirmPassword: "",
  roleId: 0, ptId: "", shiftId: "", positionTitle: "",
};

function useListRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/roles")
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then((data: Role[]) => setRoles(data))
      .catch(() => setRoles([]))
      .finally(() => setIsLoading(false));
  }, []);

  return { data: roles, isLoading };
}

export default function MasterData() {
  const { user: me } = useAuth();
  const { data: pts } = useListPts();
  const { data: shifts } = useListShifts();
  const { data: roles, isLoading: rolesLoading } = useListRoles();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const qc = useQueryClient();
  const { toast } = useToast();

  const isDireksi = me?.roleName === "Direksi";

  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");
  const [ptFilter, setPtFilter] = useState<string>("");

  useEffect(() => {
    if (isDireksi && me?.ptId) {
      setPtFilter(String(me.ptId));
    }
  }, [isDireksi, me?.ptId]);

  const activeStatusParam = activeTab === "active" ? true : false;
  const listParams = {
    activeStatus: activeStatusParam,
    ...(ptFilter ? { ptId: Number(ptFilter) } : {}),
  };
  const { data: users, isLoading } = useListUsers(listParams);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<UserForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<UserForm>>({});

  const [editingUser, setEditingUser] = useState<UserWithRelations | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "", roleId: 0, ptId: "", shiftId: "", positionTitle: "", activeStatus: true,
  });
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserWithRelations | null>(null);
  const [hardDeleting, setHardDeleting] = useState(false);
  const [resetTarget, setResetTarget] = useState<UserWithRelations | null>(null);
  const [resetNewPw, setResetNewPw] = useState("");
  const [resetConfirmPw, setResetConfirmPw] = useState("");
  const [resettingPw, setResettingPw] = useState(false);

  const isSuperAdmin = me?.roleName === "Superadmin";
  const isAdminSystem = me?.roleName === "Admin System";
  const isOwner = me?.roleName === "Owner";
  const isChiefDealing = me?.roleName === "Chief Dealing";

  const canAddUser = isSuperAdmin || isAdminSystem || isOwner;
  const canEditUser = isSuperAdmin || isAdminSystem || isOwner || isChiefDealing;
  const canDeactivate = isSuperAdmin || isAdminSystem;
  const canHardDelete = isSuperAdmin || isOwner;
  const canEditRolePt = isSuperAdmin || isOwner || isChiefDealing;
  const canResetPassword = isSuperAdmin || isAdminSystem || isOwner;

  const defaultRoleId = roles.length > 0 ? (roles.find(r => r.name === "Dealer")?.id ?? roles[0]?.id ?? 0) : 0;

  const roleCfg = (roleName: string | null | undefined) => ROLE_CONFIG[roleName ?? ""] ?? DEFAULT_ROLE_CFG;

  const f = (k: keyof UserForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [k]: e.target.value }));
    setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<UserForm> = {};
    if (!form.name.trim()) errs.name = "Nama wajib diisi";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = "Email tidak valid";
    if (!form.password || form.password.length < 6) errs.password = "Password minimal 6 karakter";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Password tidak cocok";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const roleId = form.roleId || defaultRoleId;
    if (!roleId) {
      toast({ title: "Gagal", description: "Daftar role belum tersedia, coba refresh halaman", variant: "destructive" });
      return;
    }
    createUser.mutate({
      data: {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        roleId: Number(roleId),
        ptId: form.ptId ? Number(form.ptId) : undefined,
        shiftId: form.shiftId ? Number(form.shiftId) : undefined,
        positionTitle: form.positionTitle.trim() || undefined,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Pengguna berhasil ditambahkan" });
        qc.invalidateQueries({ queryKey: ["/api/users"] });
        setShowForm(false);
        setForm(EMPTY_FORM);
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Gagal menambahkan pengguna";
        toast({ title: "Gagal", description: msg, variant: "destructive" });
      }
    });
  };

  const openEdit = (u: UserWithRelations) => {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      roleId: u.roleId ?? 0,
      ptId: u.ptId ? String(u.ptId) : "",
      shiftId: u.shiftId ? String(u.shiftId) : "",
      positionTitle: u.positionTitle ?? "",
      activeStatus: u.activeStatus ?? true,
    });
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const payload: Record<string, unknown> = {
      name: editForm.name.trim(),
      shiftId: editForm.shiftId ? Number(editForm.shiftId) : undefined,
      positionTitle: editForm.positionTitle.trim() || undefined,
    };
    if (canEditRolePt) {
      payload.roleId = Number(editForm.roleId);
      payload.ptId = editForm.ptId ? Number(editForm.ptId) : undefined;
    }
    if (canDeactivate) {
      payload.activeStatus = editForm.activeStatus;
    }
    updateUser.mutate({
      id: editingUser.id,
      data: payload as Parameters<typeof updateUser.mutate>[0]["data"],
    }, {
      onSuccess: () => {
        toast({ title: "Pengguna berhasil diperbarui" });
        qc.invalidateQueries({ queryKey: ["/api/users"] });
        setEditingUser(null);
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Gagal memperbarui pengguna";
        toast({ title: "Gagal", description: msg, variant: "destructive" });
      }
    });
  };

  const handleDeactivate = (u: UserWithRelations) => {
    setDeactivatingId(u.id);
    const newStatus = !u.activeStatus;
    updateUser.mutate({ id: u.id, data: { activeStatus: newStatus } }, {
      onSuccess: () => {
        toast({ title: newStatus ? `${u.name} telah diaktifkan kembali` : `${u.name} telah dinonaktifkan` });
        qc.invalidateQueries({ queryKey: ["/api/users"] });
        setDeactivatingId(null);
      },
      onError: () => {
        toast({ title: newStatus ? "Gagal mengaktifkan pengguna" : "Gagal menonaktifkan pengguna", variant: "destructive" });
        setDeactivatingId(null);
      }
    });
  };

  const handleHardDelete = async () => {
    if (!deleteTarget) return;
    setHardDeleting(true);
    const token = localStorage.getItem("occ_token");
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: "Gagal menghapus", description: body.error ?? "Terjadi kesalahan", variant: "destructive" });
      } else {
        toast({ title: `${deleteTarget.name} berhasil dihapus permanen` });
        qc.invalidateQueries({ queryKey: ["/api/users"] });
        setDeleteTarget(null);
      }
    } catch {
      toast({ title: "Gagal menghapus pengguna", variant: "destructive" });
    } finally {
      setHardDeleting(false);
    }
  };

  const closeAddForm = () => { setShowForm(false); setForm(EMPTY_FORM); setErrors({}); };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    if (!resetNewPw || resetNewPw.length < 6) {
      toast({ title: "Password minimal 6 karakter", variant: "destructive" }); return;
    }
    if (resetNewPw !== resetConfirmPw) {
      toast({ title: "Konfirmasi password tidak cocok", variant: "destructive" }); return;
    }
    setResettingPw(true);
    try {
      const res = await fetch(`/api/users/${resetTarget.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetNewPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mereset password");
      toast({ title: `Password ${resetTarget.name} berhasil direset` });
      setResetTarget(null);
      setResetNewPw("");
      setResetConfirmPw("");
    } catch (err: unknown) {
      toast({ title: (err as Error).message, variant: "destructive" });
    } finally {
      setResettingPw(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Data</h1>
          <p className="text-muted-foreground mt-1">Kelola pengguna, PT, dan role sistem OCC.</p>
        </div>
        {canAddUser && !showForm && (
          <Button onClick={() => { setShowForm(true); setForm({ ...EMPTY_FORM, roleId: defaultRoleId }); }} className="gap-2">
            <Plus className="w-4 h-4" /> Tambah User
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              <h2 className="font-bold">Tambah Pengguna Baru</h2>
            </div>
            <button onClick={closeAddForm}
              className="text-muted-foreground hover:text-foreground transition-colors rounded-full p-1 hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nama Lengkap <span className="text-red-500">*</span></label>
                <Input value={form.name} onChange={f("name")} placeholder="Contoh: Andi Santoso" className={errors.name ? "border-red-500" : ""} />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
                <Input type="email" value={form.email} onChange={f("email")} placeholder="andi@occ.id" className={errors.email ? "border-red-500" : ""} />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Password <span className="text-red-500">*</span></label>
                <Input type="password" value={form.password} onChange={f("password")} placeholder="Min. 6 karakter" className={errors.password ? "border-red-500" : ""} />
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Konfirmasi Password <span className="text-red-500">*</span></label>
                <Input type="password" value={form.confirmPassword} onChange={f("confirmPassword")} placeholder="Ulangi password" className={errors.confirmPassword ? "border-red-500" : ""} />
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Jabatan / Role <span className="text-red-500">*</span></label>
                <select
                  value={form.roleId || defaultRoleId}
                  onChange={e => setForm(p => ({ ...p, roleId: Number(e.target.value) }))}
                  disabled={rolesLoading}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {rolesLoading ? (
                    <option>Memuat role...</option>
                  ) : (
                    roles.filter(r => isSuperAdmin || r.name !== "Superadmin").map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))
                  )}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  PT
                  <span className="ml-2 text-xs font-normal text-muted-foreground">Kosongkan untuk user lintas-PT / korporat</span>
                </label>
                <select
                  value={form.ptId}
                  onChange={e => setForm(p => ({ ...p, ptId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">— Pilih PT (opsional) —</option>
                  {(pts as Pt[] | undefined)?.map(pt => (
                    <option key={pt.id} value={pt.id}>{pt.name} ({pt.code})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Shift</label>
                <select
                  value={form.shiftId}
                  onChange={e => setForm(p => ({ ...p, shiftId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">— Pilih Shift (opsional) —</option>
                  {(shifts as Shift[] | undefined)?.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Jabatan Teknis</label>
                <Input value={form.positionTitle} onChange={f("positionTitle")} placeholder="Contoh: Dealer Senior" />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button type="button" variant="outline" onClick={closeAddForm}>Batal</Button>
              <Button type="submit" disabled={createUser.isPending} className="gap-2">
                {createUser.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : <><Plus className="w-4 h-4" />Tambah Pengguna</>}
              </Button>
            </div>
          </form>
        </div>
      )}

      {editingUser && (
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-primary" />
              <h2 className="font-bold">Edit Pengguna: {editingUser.name}</h2>
            </div>
            <button onClick={() => setEditingUser(null)}
              className="text-muted-foreground hover:text-foreground transition-colors rounded-full p-1 hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleEditSave} className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nama Lengkap <span className="text-red-500">*</span></label>
                <Input
                  value={editForm.name}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Jabatan / Role <span className="text-red-500">*</span></label>
                <select
                  value={editForm.roleId}
                  onChange={e => setEditForm(p => ({ ...p, roleId: Number(e.target.value) }))}
                  disabled={!canEditRolePt || rolesLoading}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rolesLoading ? (
                    <option>Memuat role...</option>
                  ) : (
                    roles.filter(r => isSuperAdmin || r.name !== "Superadmin").map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))
                  )}
                </select>
                {!canEditRolePt && <p className="text-xs text-muted-foreground">Hanya Owner, Chief Dealing, atau Superadmin yang dapat mengubah role</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  PT
                  <span className="ml-2 text-xs font-normal text-muted-foreground">Kosongkan untuk user lintas-PT / korporat</span>
                </label>
                <select
                  value={editForm.ptId}
                  onChange={e => setEditForm(p => ({ ...p, ptId: e.target.value }))}
                  disabled={!canEditRolePt}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">— Tanpa PT (lintas-PT / korporat) —</option>
                  {(pts as Pt[] | undefined)?.map(pt => (
                    <option key={pt.id} value={pt.id}>{pt.name} ({pt.code})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Shift</label>
                <select
                  value={editForm.shiftId}
                  onChange={e => setEditForm(p => ({ ...p, shiftId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">— Tanpa Shift —</option>
                  {(shifts as Shift[] | undefined)?.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Jabatan Teknis</label>
                <Input
                  value={editForm.positionTitle}
                  onChange={e => setEditForm(p => ({ ...p, positionTitle: e.target.value }))}
                  placeholder="Contoh: Dealer Senior"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Status Aktif</label>
                <select
                  value={editForm.activeStatus ? "true" : "false"}
                  onChange={e => setEditForm(p => ({ ...p, activeStatus: e.target.value === "true" }))}
                  disabled={!canDeactivate}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
                {!canDeactivate && <p className="text-xs text-muted-foreground">Hanya Superadmin atau Admin System yang dapat mengubah status aktif</p>}
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Batal</Button>
              <Button type="submit" disabled={updateUser.isPending} className="gap-2">
                {updateUser.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : <><Pencil className="w-4 h-4" />Simpan Perubahan</>}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Total Pengguna</p>
            <p className="text-2xl font-black">{users?.length ?? 0}</p>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500"><Building className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Total PT</p>
            <p className="text-2xl font-black">{pts?.length ?? 0}</p>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500"><Shield className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Total Role</p>
            <p className="text-2xl font-black">{roles.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">Daftar Pengguna</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={ptFilter}
                onChange={e => setPtFilter(e.target.value)}
                disabled={isDireksi}
                className="h-9 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">Semua PT</option>
                {(pts as Pt[] | undefined)?.map(pt => (
                  <option key={pt.id} value={pt.id}>{pt.name}</option>
                ))}
              </select>
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  onClick={() => setActiveTab("active")}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === "active" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
                >
                  Aktif
                </button>
                <button
                  onClick={() => setActiveTab("inactive")}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === "inactive" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
                >
                  Nonaktif
                </button>
              </div>
              <span className="text-xs text-muted-foreground">{users?.length ?? 0} pengguna</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Jabatan</th>
                <th className="px-6 py-4">PT</th>
                <th className="px-6 py-4">Shift</th>
                <th className="px-6 py-4 text-center">Status</th>
                {(canEditUser || canDeactivate || canHardDelete) && <th className="px-6 py-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={(canEditUser || canDeactivate || canHardDelete) ? 7 : 6} className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></td></tr>
              ) : (users as UserWithRelations[] | undefined)?.map((u: UserWithRelations) => {
                const rc = roleCfg(u.roleName);
                const isDeactivating = deactivatingId === u.id;
                return (
                  <tr key={u.id} className={`hover:bg-muted/20 transition-colors ${!u.activeStatus ? "opacity-60" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${rc.bg} flex items-center justify-center font-bold text-xs border ${rc.color.replace("text-", "border-").replace("400", "400/40")}`}>
                          <span className={rc.color}>{u.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          {u.positionTitle && <p className="text-xs text-muted-foreground">{u.positionTitle}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${rc.bg} ${rc.color} text-xs font-semibold`}>
                        {rc.icon}
                        {u.roleName ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">{u.ptName ?? "Head Quarters"}</td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">{u.shiftName ?? "—"}</td>
                    <td className="px-6 py-4 text-center">
                      {u.activeStatus
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        : <XCircle className="w-4 h-4 text-muted-foreground mx-auto" />}
                    </td>
                    {(canEditUser || canDeactivate || canHardDelete) && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {canEditUser && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(u)}
                              className="h-8 gap-1.5 text-xs"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </Button>
                          )}
                          {canDeactivate && (
                            <Button
                              size="sm"
                              variant={u.activeStatus ? "outline" : "outline"}
                              onClick={() => handleDeactivate(u)}
                              disabled={isDeactivating}
                              className={`h-8 gap-1.5 text-xs ${u.activeStatus ? "text-amber-600 border-amber-400/40 hover:bg-amber-50 hover:text-amber-700" : "text-emerald-600 border-emerald-400/40 hover:bg-emerald-50 hover:text-emerald-700"}`}
                            >
                              {isDeactivating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : u.activeStatus ? (
                                <><UserX className="w-3.5 h-3.5" /> Nonaktifkan</>
                              ) : (
                                <><UserCheck className="w-3.5 h-3.5" /> Aktifkan</>
                              )}
                            </Button>
                          )}
                          {canResetPassword && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setResetTarget(u); setResetNewPw(""); setResetConfirmPw(""); }}
                              className="h-8 gap-1.5 text-xs text-amber-600 border-amber-400/40 hover:bg-amber-50 hover:text-amber-700"
                            >
                              <KeyRound className="w-3.5 h-3.5" /> Reset PW
                            </Button>
                          )}
                          {canHardDelete && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeleteTarget(u)}
                              className="h-8 gap-1.5 text-xs text-red-600 border-red-400/40 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {!isLoading && !users?.length && (
                <tr><td colSpan={(canEditUser || canDeactivate || canHardDelete) ? 7 : 6} className="text-center py-8 text-muted-foreground">
                  {activeTab === "inactive" ? "Tidak ada pengguna nonaktif" : "Belum ada data pengguna"}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-500" /> Daftar PT
          </h2>
          <div className="space-y-2">
            {(pts as Pt[] | undefined)?.map((pt: Pt) => (
              <div key={pt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                <div>
                  <p className="font-medium text-sm">{pt.name}</p>
                  <p className="text-xs text-muted-foreground">Kode: {pt.code}</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">#{pt.id}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" /> Daftar Role & Jabatan
          </h2>
          <div className="space-y-2">
            {rolesLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : roles.map(role => {
              const rc = roleCfg(role.name);
              return (
                <div key={role.id} className={`flex items-center gap-3 p-3 rounded-lg border ${rc.bg}`}>
                  <div className={`${rc.color}`}>{rc.icon}</div>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${rc.color}`}>{role.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Reset Password Modal ── */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setResetTarget(null)}>
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-base">Reset Password</h2>
              </div>
              <button onClick={() => setResetTarget(null)} className="p-1 rounded-md hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Atur ulang password untuk <span className="font-semibold text-foreground">{resetTarget.name}</span> ({resetTarget.roleName})
            </p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Password Baru <span className="text-red-500">*</span></label>
                <Input
                  type="password"
                  value={resetNewPw}
                  onChange={e => setResetNewPw(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  autoFocus
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Konfirmasi Password <span className="text-red-500">*</span></label>
                <Input
                  type="password"
                  value={resetConfirmPw}
                  onChange={e => setResetConfirmPw(e.target.value)}
                  placeholder="Ulangi password baru"
                  autoComplete="new-password"
                />
                {resetConfirmPw && resetNewPw !== resetConfirmPw && (
                  <p className="text-xs text-destructive">Password tidak cocok</p>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setResetTarget(null)} className="flex-1">
                  Batal
                </Button>
                <Button type="submit" disabled={resettingPw} className="flex-1 gap-1.5">
                  {resettingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  {resettingPw ? "Menyimpan..." : "Reset Password"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Hard Delete Confirm Dialog ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => !hardDeleting && setDeleteTarget(null)}>
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="font-bold text-base">Hapus Pengguna Permanen</h2>
                <p className="text-xs text-muted-foreground">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4 text-sm">
              <p>Anda yakin ingin menghapus permanen akun:</p>
              <p className="font-bold mt-1">{deleteTarget.name}</p>
              <p className="text-muted-foreground text-xs">{deleteTarget.email} · {deleteTarget.roleName}</p>
            </div>
            <p className="text-xs text-muted-foreground">Jika pengguna ini memiliki data terkait (log aktivitas, task, dll), hapus permanen akan gagal. Gunakan <span className="font-medium">Nonaktifkan</span> sebagai alternatif.</p>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={hardDeleting} className="flex-1">
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleHardDelete}
                disabled={hardDeleting}
                className="flex-1 gap-1.5"
              >
                {hardDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {hardDeleting ? "Menghapus..." : "Hapus Permanen"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
