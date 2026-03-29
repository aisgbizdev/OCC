import { useState } from "react";
import { Plus, Trash2, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListActivityTypes, useCreateBatchActivityLogs, useListUsers } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import type { UserWithRelations } from "@workspace/api-client-react";

type RowItem = {
  activityTypeId: string;
  quantity: number;
  note: string;
  targetUserId: string;
};

const SPV_AND_ABOVE = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Admin System", "Superadmin"];

export function BatchActivityForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: types } = useListActivityTypes();
  const createBatch = useCreateBatchActivityLogs();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();

  const isSPVOrAbove = SPV_AND_ABOVE.includes(user?.roleName ?? "");
  const myPtId = user?.ptId;

  const { data: teamUsersRaw = [] } = useListUsers({ ptId: myPtId ?? undefined });
  const teamUsers = isSPVOrAbove
    ? (teamUsersRaw as UserWithRelations[]).filter(u =>
        ["SPV Dealing", "Dealer"].includes(u.roleName ?? "")
      )
    : [];

  const [rows, setRows] = useState<RowItem[]>([{ activityTypeId: "", quantity: 1, note: "", targetUserId: "" }]);

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
    const found = (types ?? []).find(t => String(t.id) === activityTypeId);
    return (found as { category?: string | null } | undefined)?.category === "Error";
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    createBatch.mutate({ data: { items: validRows } }, {
      onSuccess: () => {
        toast({ title: "Berhasil", description: `${validRows.length} aktivitas dicatat` });
        qc.invalidateQueries({ queryKey: ["/api/activity-logs"] });
        qc.invalidateQueries({ queryKey: ["/api/kpi/scores"] });
        onSuccess();
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        toast({ title: "Gagal", description: msg ?? "Terjadi kesalahan", variant: "destructive" });
      },
    });
  };

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
                >
                  <option value="" disabled>Pilih Tipe Aktivitas...</option>
                  {(types ?? []).filter(t => t.activeStatus).map(t => {
                    const tc = t as typeof t & { category?: string | null };
                    const isErrType = tc.category === "Error";
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
        <Button type="submit" disabled={createBatch.isPending} className="gap-2 px-8">
          <Save className="w-4 h-4" /> {createBatch.isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
