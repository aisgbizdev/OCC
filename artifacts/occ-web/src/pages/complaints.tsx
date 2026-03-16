import { useListComplaints } from "@workspace/api-client-react";
import { format } from "date-fns";
import { AlertTriangle, MessageCircle } from "lucide-react";
import { SlaTimer } from "@/components/sla-timer";

export default function Complaints() {
  const { data: complaints } = useListComplaints();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Complaints & SLAs</h1>
        <p className="text-muted-foreground mt-1">Monitor operational issues and resolution times.</p>
      </div>

      <div className="space-y-4">
        {complaints?.map(comp => (
          <div key={comp.id} className="bg-card border rounded-2xl p-5 shadow-sm hover:border-primary/50 transition-colors flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-bold text-lg truncate">{comp.title}</h3>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-muted text-muted-foreground">
                  {comp.complaintType}
                </span>
                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md ${
                  comp.severity === 'high' ? 'bg-destructive/20 text-destructive' : 'bg-amber-500/20 text-amber-500'
                }`}>
                  {comp.severity}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">{comp.chronology}</p>
              <div className="text-xs text-muted-foreground mt-2 flex items-center gap-3">
                <span>By {comp.creatorName}</span>
                <span>•</span>
                <span>{format(new Date(comp.createdAt), "MMM d, yyyy HH:mm")}</span>
                <span>•</span>
                <span className="capitalize text-foreground font-medium">Status: {comp.status.replace("_", " ")}</span>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t sm:border-t-0 pt-4 sm:pt-0">
              <SlaTimer createdAt={comp.createdAt} status={comp.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
