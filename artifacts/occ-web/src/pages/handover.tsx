import { useListHandoverLogs } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Repeat } from "lucide-react";

export default function Handover() {
  const { data: logs } = useListHandoverLogs();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shift Handover</h1>
          <p className="text-muted-foreground mt-1">Review operational shift transitions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {logs?.map(log => (
          <div key={log.id} className="bg-card border rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Handover from {log.creatorName}</h3>
                  <p className="text-sm text-muted-foreground">{log.fromShiftName} → {log.toShiftName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-medium">{format(new Date(log.createdAt), "MMM d, yyyy")}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "HH:mm")}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Summary</h4>
                <p className="text-sm">{log.summary || "-"}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Notes</h4>
                <p className="text-sm">{log.notes || "-"}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Pending Activities</h4>
                <p className="text-sm font-mono bg-muted p-2 rounded-md">{log.pendingActivities || "None"}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Pending Tasks</h4>
                <p className="text-sm font-mono bg-muted p-2 rounded-md">{log.pendingTasks || "None"}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
