import { useState } from "react";
import { useCheckInactivity, useListSystemSettings, useUpdateSystemSetting, useListAuditLogs, type CheckInactivity200, type SystemSetting } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Clock, Settings, History, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface InactiveDealer {
  userId: number;
  userName: string;
  hoursInactive: number;
  lastActivity: string | null;
  severity: string;
}

function parseInactivity(data: CheckInactivity200 | undefined) {
  if (!data) return { warningThresholdHours: 0, criticalThresholdHours: 0, inactiveCount: 0, dealers: [] as InactiveDealer[] };
  return {
    warningThresholdHours: typeof data["warningThresholdHours"] === "number" ? data["warningThresholdHours"] : 0,
    criticalThresholdHours: typeof data["criticalThresholdHours"] === "number" ? data["criticalThresholdHours"] : 0,
    inactiveCount: typeof data["inactiveCount"] === "number" ? data["inactiveCount"] : 0,
    dealers: Array.isArray(data["dealers"]) ? (data["dealers"] as InactiveDealer[]) : [],
  };
}

const SETTING_LABELS: Record<string, { label: string; unit: string; description: string }> = {
  daily_target_points:          { label: "Target Poin Harian",         unit: "poin",    description: "Target KPI poin per dealer per hari" },
  inactivity_warning_hours:     { label: "Batas Warning Inaktivitas",   unit: "jam",     description: "Jam tanpa aktivitas sebelum peringatan" },
  inactivity_critical_hours:    { label: "Batas Kritis Inaktivitas",    unit: "jam",     description: "Jam tanpa aktivitas sebelum alert kritis" },
  activity_edit_window_minutes: { label: "Jendela Edit Aktivitas",      unit: "menit",   description: "Berapa menit aktivitas bisa diedit setelah dibuat" },
  complaint_sla_warning_hours:  { label: "SLA Warning Komplain",        unit: "jam",     description: "Jam sebelum komplain masuk peringatan SLA" },
  complaint_sla_critical_hours: { label: "SLA Kritis Komplain",         unit: "jam",     description: "Jam sebelum komplain masuk kritis SLA" },
};

function SettingRow({ setting, canEdit }: { setting: SystemSetting; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(setting.settingValue ?? "");
  const updateSetting = useUpdateSystemSetting();
  const qc = useQueryClient();
  const { toast } = useToast();
  const meta = SETTING_LABELS[setting.settingKey ?? ""];

  const handleSave = () => {
    updateSetting.mutate({ key: setting.settingKey ?? "", data: { settingValue: val } }, {
      onSuccess: () => {
        toast({ title: "Pengaturan disimpan" });
        qc.invalidateQueries({ queryKey: ["listSystemSettings"] });
        setEditing(false);
      },
      onError: () => toast({ title: "Gagal menyimpan", variant: "destructive" })
    });
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border bg-background hover:bg-muted/30 transition-colors gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{meta?.label ?? setting.settingKey}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{meta?.description ?? setting.description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {editing ? (
          <>
            <Input
              type="number"
              value={val}
              onChange={e => setVal(e.target.value)}
              className="w-24 h-8 text-sm text-center"
              autoFocus
            />
            <span className="text-xs text-muted-foreground">{meta?.unit}</span>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500 hover:text-emerald-400" onClick={handleSave} disabled={updateSetting.isPending}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(false); setVal(setting.settingValue ?? ""); }}>
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <div className="text-right">
              <span className="font-mono font-bold text-lg text-primary">{setting.settingValue}</span>
              <span className="text-xs text-muted-foreground ml-1">{meta?.unit}</span>
            </div>
            {canEdit && (
              <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:opacity-100" onClick={() => setEditing(true)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SystemPage() {
  const { user } = useAuth();
  const { data: inactivityRaw } = useCheckInactivity();
  const { data: settings } = useListSystemSettings();
  const { data: auditRaw } = useListAuditLogs();
  const inactivity = parseInactivity(inactivityRaw);

  const canEdit = ["Superadmin", "Admin System", "Owner"].includes(user?.roleName ?? "");
  const auditLogs = (Array.isArray(auditRaw) ? auditRaw : []).slice(0, 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sistem & Audit</h1>
        <p className="text-muted-foreground mt-1">Monitoring platform, konfigurasi, dan riwayat aktivitas sistem.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" /> Inaktivitas Dealer
          </h2>

          <div className="flex gap-4">
            <div className="bg-background border rounded-xl p-4 flex-1">
              <p className="text-xs text-muted-foreground mb-1">Ambang Peringatan</p>
              <p className="text-2xl font-mono font-bold text-amber-500">{inactivity.warningThresholdHours}j</p>
            </div>
            <div className="bg-background border rounded-xl p-4 flex-1">
              <p className="text-xs text-muted-foreground mb-1">Ambang Kritis</p>
              <p className="text-2xl font-mono font-bold text-destructive">{inactivity.criticalThresholdHours}j</p>
            </div>
            <div className="bg-background border rounded-xl p-4 flex-1">
              <p className="text-xs text-muted-foreground mb-1">Bermasalah</p>
              <p className="text-2xl font-mono font-bold">{inactivity.inactiveCount}</p>
            </div>
          </div>

          <div className="space-y-2">
            {inactivity.dealers.map(d => (
              <div key={d.userId} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${d.severity === 'critical' ? 'bg-destructive/20 text-destructive' : 'bg-amber-500/20 text-amber-500'}`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{d.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.lastActivity ? format(new Date(d.lastActivity), "d MMM HH:mm") : "Belum pernah aktif"}
                    </p>
                  </div>
                </div>
                <span className={`font-mono font-bold text-sm ${d.severity === 'critical' ? 'text-destructive' : 'text-amber-500'}`}>
                  {d.hoursInactive}j
                </span>
              </div>
            ))}
            {inactivity.inactiveCount === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">✅ Semua dealer aktif dalam batas waktu.</p>
            )}
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> Konfigurasi Sistem
            {canEdit && <span className="text-xs font-normal text-muted-foreground ml-1">(klik ✏️ untuk edit)</span>}
          </h2>
          <div className="space-y-2 group">
            {(settings as SystemSetting[] | undefined)?.map(s => (
              <SettingRow key={s.settingKey} setting={s} canEdit={canEdit} />
            ))}
            {!settings?.length && (
              <p className="text-sm text-muted-foreground text-center py-4">Memuat pengaturan...</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-muted-foreground" /> Riwayat Audit (20 terakhir)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase text-muted-foreground border-b">
              <tr>
                <th className="pb-3 pr-6">Waktu</th>
                <th className="pb-3 pr-6">Pengguna</th>
                <th className="pb-3 pr-6">Aksi</th>
                <th className="pb-3 pr-6">Modul</th>
                <th className="pb-3">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(auditLogs as { id: number; createdAt?: string; userName?: string; actionType?: string; module?: string; entityId?: string }[]).map(log => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 pr-6 font-mono text-xs text-muted-foreground">
                    {log.createdAt ? format(new Date(log.createdAt), "d MMM HH:mm") : "-"}
                  </td>
                  <td className="py-3 pr-6 font-medium text-sm">{log.userName ?? "—"}</td>
                  <td className="py-3 pr-6">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      log.actionType === "create" ? "bg-emerald-500/10 text-emerald-400" :
                      log.actionType === "delete" ? "bg-destructive/10 text-destructive" :
                      log.actionType === "update" ? "bg-blue-500/10 text-blue-400" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {log.actionType}
                    </span>
                  </td>
                  <td className="py-3 pr-6 text-sm capitalize text-muted-foreground">{log.module}</td>
                  <td className="py-3 text-xs text-muted-foreground font-mono">#{log.entityId}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Belum ada riwayat audit.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
