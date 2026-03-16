import { useCheckInactivity } from "@workspace/api-client-react";
import { AlertTriangle, Clock, Users } from "lucide-react";

export default function SystemSettings() {
  const { data: inactivity } = useCheckInactivity();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System & Audits</h1>
        <p className="text-muted-foreground mt-1">Platform monitoring and configurations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5"/> Dealer Inactivity Report</h2>
          
          <div className="flex gap-4 mb-6">
            <div className="bg-background border rounded-xl p-4 flex-1">
              <p className="text-sm text-muted-foreground mb-1">Warning Threshold</p>
              <p className="text-2xl font-mono font-bold text-amber-500">{inactivity?.warningThresholdHours}h</p>
            </div>
            <div className="bg-background border rounded-xl p-4 flex-1">
              <p className="text-sm text-muted-foreground mb-1">Critical Threshold</p>
              <p className="text-2xl font-mono font-bold text-destructive">{inactivity?.criticalThresholdHours}h</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Flagged Dealers ({inactivity?.inactiveCount})</h3>
            {inactivity?.dealers?.map(d => (
              <div key={d.userId} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${d.severity === 'critical' ? 'bg-destructive/20 text-destructive' : 'bg-amber-500/20 text-amber-500'}`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{d.userName}</p>
                    <p className="text-xs text-muted-foreground">Last active: {d.lastActivity ? new Date(d.lastActivity).toLocaleString() : 'Never'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-bold ${d.severity === 'critical' ? 'text-destructive' : 'text-amber-500'}`}>
                    {d.hoursInactive}h
                  </p>
                </div>
              </div>
            ))}
            {inactivity?.inactiveCount === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">All dealers are active within thresholds.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
