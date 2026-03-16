import { useCheckInactivity } from "@workspace/api-client-react";
import { AlertTriangle, Clock } from "lucide-react";

interface InactiveDealer {
  userId: number;
  userName: string;
  hoursInactive: number;
  lastActivity: string | null;
  severity: string;
}

interface InactivityReport {
  warningThresholdHours?: number;
  criticalThresholdHours?: number;
  inactiveCount?: number;
  dealers?: InactiveDealer[];
}

export default function SystemSettings() {
  const { data: rawInactivity } = useCheckInactivity();
  const inactivity = rawInactivity as InactivityReport | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sistem & Audit</h1>
        <p className="text-muted-foreground mt-1">Monitoring platform dan konfigurasi.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5"/> Laporan Inaktivitas Dealer</h2>

          <div className="flex gap-4 mb-6">
            <div className="bg-background border rounded-xl p-4 flex-1">
              <p className="text-sm text-muted-foreground mb-1">Ambang Peringatan</p>
              <p className="text-2xl font-mono font-bold text-amber-500">{inactivity?.warningThresholdHours ?? "-"}j</p>
            </div>
            <div className="bg-background border rounded-xl p-4 flex-1">
              <p className="text-sm text-muted-foreground mb-1">Ambang Kritis</p>
              <p className="text-2xl font-mono font-bold text-destructive">{inactivity?.criticalThresholdHours ?? "-"}j</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Dealer Bermasalah ({inactivity?.inactiveCount ?? 0})</h3>
            {inactivity?.dealers?.map((d) => (
              <div key={d.userId} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${d.severity === 'critical' ? 'bg-destructive/20 text-destructive' : 'bg-amber-500/20 text-amber-500'}`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{d.userName}</p>
                    <p className="text-xs text-muted-foreground">Terakhir aktif: {d.lastActivity ? new Date(d.lastActivity).toLocaleString('id-ID') : 'Belum pernah'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-bold ${d.severity === 'critical' ? 'text-destructive' : 'text-amber-500'}`}>
                    {d.hoursInactive}j
                  </p>
                </div>
              </div>
            ))}
            {(inactivity?.inactiveCount ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">Semua dealer aktif dalam batas waktu.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
