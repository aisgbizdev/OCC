import { useState, useEffect } from "react";
import { Plus, Trash2, Save, AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListActivityTypes, useListUsers } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import type { UserWithRelations } from "@workspace/api-client-react";

type ActivityTypeItem = {
  id: number;
  name: string;
  category?: string | null;
  weightPoints: string;
  activeStatus: boolean;
};

type RowItem = {
  activityTypeId: string;
  quantity: number;
  note: string;
  targetUserId: string;
};

type DuplicateWarning = {
  index: number;
  activityTypeId: number;
  minutesAgo: number;
  message: string;
};

const SPV_AND_ABOVE = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Admin System", "Superadmin"];
const CHIEF_AND_ABOVE = ["Owner", "Direksi", "Chief Dealing", "Admin System", "Superadmin"];

export function BatchActivityForm({ onSuccess, presetActivityTypeId }: { onSuccess: () => void; presetActivityTypeId?: number }) {
  const { data: allTypes } = useListActivityTypes();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();

  const isSPVOrAbove = SPV_AND_ABOVE.includes(user?.roleName ?? "");
  const isChiefOrAbove = CHIEF_AND_ABOVE.includes(user?.roleName ?? "");
  const myPtId = user?.ptId;

  const { data: teamUsersRaw = [] } = useListUsers({ ptId: myPtId ?? undefined });
  const teamUsers = isSPVOrAbove
    ? (teamUsersRaw as UserWithRelations[]).filter(u =>
        ["SPV Dealing", "Dealer"].includes(u.roleName ?? "")
      )
    : [];

  const [roleTypes, setRoleTypes] = useState<ActivityTypeItem[]>([]);
  const [roleTypesLoading, setRoleTypesLoading] = useState(true);

  useEffect(() => {
    async function fetchRoleTypes() {
      try {
        const res = await fetch("/api/activity-types/for-role");
        if (res.ok) {
          const data = await res.json();
          setRoleTypes(data);
        } else {
          setRoleTypes((allTypes ?? []) as ActivityTypeItem[]);
        }
      } catch {
        setRoleTypes((allTypes ?? []) as ActivityTypeItem[]);
      } finally {
        setRoleTypesLoading(false);
      }
    }
    fetchRoleTypes();
  }, [allTypes]);

  const displayTypes = isChiefOrAbove
    ? ((allTypes ?? []) as ActivityTypeItem[]).filter(t => t.activeStatus)
    : roleTypes.filter(t => t.activeStatus);

  const [rows, setRows] = useState<RowItem[]>([{
    activityTypeId: presetActivityTypeId ? String(presetActivityTypeId) : "",
    quantity: 1,
    note: "",
    targetUserId: "",
  }]);
  const [isPending, setIsPending] = useState(false);
  const [duplicateWarnings, setDuplicateWarnings] = useState<DuplicateWarning[] | null>(null);

  useEffect(() => {
    if (presetActivityTypeId && rows.length === 1 && rows[0].activityTypeId === "") {
      setRows([{ activityTypeId: String(presetActivityTypeId), quantity: 1, note: "", targetUserId: "" }]);
    }
  }, [presetActivityTypeId]);

  const handleAdd = () => setRows([...rows, { activityTypeId: "", quantity: 1, note: "", targetUserId: "" }]);
  const handleRemove = (index: number) => setRows(rows.filter((_, i) => i !== index));

  const handleChange = (index: number, field: keyof RowItem, value: string | number) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    if (field === "activityTypeId") {
      newRows[index].targetUserId = "";
    }
    setRows(newRows);
  };

  function isErrorType(activityTypeId: string): boolean {
    if (!activityTypeId) return false;
    const found = (allTypes ?? []).find(t => String(t.id) === activityTypeId);
    return (found as { category?: string | null } | undefined)?.category === "Error";
  }

  async function submitBatch(confirmDuplicates: boolean) {
    const validRows = rows.filter(r => r.activityTypeId && r.quantity > 0).map(r => ({
      activityTypeId: Number(r.activityTypeId),
      quantity: Number(r.quantity),
      note: r.note || undefined,
      ...(r.targetUserId ? { targetUserId: Number(r.targetUserId) } : {}),
    }));

    if (validRows.length === 0) {
      toast({ title: "Error", description: "Tambahkan minimal satu aktivitas", variant: "destructive" });
      return;
    }

    setIsPending(true);
    try {
      const res = await fetch("/api/activity-logs/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: validRows, confirmDuplicates }),
      });

      const data = await res.json();

      if (res.ok && data.recentDuplicates) {
        setDuplicateWarnings(data.recentDuplicates as DuplicateWarning[]);
        return;
      }

      if (!res.ok) {
        const msg = data?.error ?? "Terjadi kesalahan";
        toast({ title: "Gagal", description: msg, variant: "destructive" });
        return;
      }

      toast({ title: "Berhasil", description: `${validRows.length} aktivitas dicatat` });
      qc.invalidateQueries({ queryKey: ["/api/activity-logs"] });
      qc.invalidateQueries({ queryKey: ["/api/kpi/scores"] });
      qc.invalidateQueries({ queryKey: ["/api/activity-types/checklist"] });
      setDuplicateWarnings(null);
      onSuccess();
    } catch {
      toast({ title: "Gagal menghubungi server", variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateWarnings(null);
    submitBatch(false);
  };

  const handleConfirmDuplicates = () => {
    submitBatch(true);
  };

  const handleCancelDuplicates = () => {
    setDuplicateWarnings(null);
  };

  if (duplicateWarnings && duplicateWarnings.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-amber-700 dark:text-amber-400">Aktivitas baru-baru ini sudah dicatat</p>
            <ul className="mt-2 space-y-1">
              {duplicateWarnings.map((w) => (
                <li key={w.index} className="text-sm text-amber-600 dark:text-amber-300">• {w.message}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Apakah kamu ingin melanjutkan dan menyimpan semua aktivitas?</p>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={handleCancelDuplicates} className="flex-1">
            Batalkan
          </Button>
          <Button onClick={handleConfirmDuplicates} disabled={isPending} className="flex-1">
            {isPending ? "Menyimpan..." : "Ya, Lanjutkan"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        {rows.map((row, i) => {
          const isError = isErrorType(row.activityTypeId);
          return (
            <div key={i} className={`flex gap-2 items-start p-3 rounded-xl border ${isError ? "bg-red-500/5 border-red-500/20" : "bg-muted/50"}`}>
              <div className="flex-1 space-y-2">
                <select
                  className="w-full h-10 px-3 rounded-md bg-background border text-sm"
                  value={row.activityTypeId}
                  onChange={(e) => handleChange(i, "activityTypeId", e.target.value)}
                  required
                  disabled={roleTypesLoading}
                >
                  <option value="" disabled>
                    {roleTypesLoading ? "Memuat..." : "Pilih Tipe Aktivitas..."}
                  </option>
                  {displayTypes.map(t => {
                    const isErrType = t.category === "Error";
                    return (
                      <option key={t.id} value={t.id}>
                        {isErrType ? "⚠ " : ""}{t.name} {isErrType ? "(Error)" : `(+${t.weightPoints} poin)`}
                      </option>
                    );
                  })}
                </select>

                {isError && isSPVOrAbove && (
                  <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <select
                      className="flex-1 bg-transparent text-sm outline-none"
                      value={row.targetUserId}
                      onChange={(e) => handleChange(i, "targetUserId", e.target.value)}
                      required
                    >
                      <option value="">Pilih anggota yang terkena error...</option>
                      {teamUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.roleName})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    type="number" min="1" placeholder="Qty"
                    value={row.quantity} onChange={e => handleChange(i, "quantity", e.target.value)}
                    className="w-24 bg-background" required
                  />
                  <Input
                    type="text" placeholder={isError ? "Deskripsi kesalahan (wajib)..." : "Catatan (opsional)..."}
                    value={row.note} onChange={e => handleChange(i, "note", e.target.value)}
                    className="flex-1 bg-background"
                    required={isError}
                  />
                </div>
              </div>
              {rows.length > 1 && (
                <Button type="button" size="icon" variant="ghost" className="text-destructive mt-1" onClick={() => handleRemove(i)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <Button type="button" variant="outline" onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Tambah Baris
        </Button>
        <Button type="submit" disabled={isPending} className="gap-2 px-8">
          <Save className="w-4 h-4" /> {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
