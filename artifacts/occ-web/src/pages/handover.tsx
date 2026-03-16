import { useState } from "react";
import { useListHandoverLogs, useCreateHandoverLog, useListShifts, useListTasks, useListComplaints } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Repeat, Plus, CheckCircle2, AlertTriangle, ClipboardList, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/responsive-modal";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Handover() {
  const { data: logs } = useListHandoverLogs();
  const [createOpen, setCreateOpen] = useState(false);
  const { toast } = useToast();

  const handleCopy = (log: any) => {
    const text = `SHIFT HANDOVER REPORT
From: ${log.fromShiftName} → ${log.toShiftName}
By: ${log.creatorName}
Date: ${format(new Date(log.createdAt), "yyyy-MM-dd HH:mm")}

SUMMARY: ${log.summary || "-"}
PENDING ACTIVITIES: ${log.pendingActivities || "None"}
PENDING TASKS: ${log.pendingTasks || "None"}
PENDING COMPLAINTS: ${log.pendingComplaints || "None"}
NOTES: ${log.notes || "-"}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Handover report copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shift Handover</h1>
          <p className="text-muted-foreground mt-1">Structured shift transition reports.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Handover
        </Button>
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
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleCopy(log)} title="Copy report">
                  <Copy className="w-4 h-4" />
                </Button>
                <div className="text-right">
                  <p className="font-mono text-sm font-medium">{format(new Date(log.createdAt), "MMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "HH:mm")}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5"/> Summary</h4>
                <p className="text-sm bg-muted/30 p-3 rounded-lg border">{log.summary || "-"}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Notes</h4>
                <p className="text-sm bg-muted/30 p-3 rounded-lg border">{log.notes || "-"}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/> Pending Tasks</h4>
                <p className="text-sm font-mono bg-amber-500/5 p-3 rounded-lg border border-amber-500/20">{log.pendingTasks || "None"}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-destructive mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/> Pending Complaints</h4>
                <p className="text-sm font-mono bg-destructive/5 p-3 rounded-lg border border-destructive/20">{log.pendingComplaints || "None"}</p>
              </div>
            </div>
          </div>
        ))}
        {logs?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No handover logs yet.</div>
        )}
      </div>

      <ResponsiveModal open={createOpen} onOpenChange={setCreateOpen} title="Shift Handover Checklist" description="Complete all sections before submitting.">
        <HandoverChecklistForm onSuccess={() => setCreateOpen(false)} />
      </ResponsiveModal>
    </div>
  );
}

function HandoverChecklistForm({ onSuccess }: { onSuccess: () => void }) {
  const createHandover = useCreateHandoverLog();
  const { data: shifts } = useListShifts();
  const { data: tasks } = useListTasks({ status: "in_progress" });
  const { data: complaints } = useListComplaints({ status: "open" });
  const { toast } = useToast();
  const qc = useQueryClient();

  const [fromShiftId, setFromShiftId] = useState("");
  const [toShiftId, setToShiftId] = useState("");
  const [checks, setChecks] = useState({
    reviewedComplaints: false,
    reviewedTasks: false,
    systemStatus: false,
    activitiesLogged: false,
  });
  const [systemStatusNote, setSystemStatusNote] = useState("All systems operational");
  const [notes, setNotes] = useState("");

  const pendingTaskNames = tasks?.map(t => `• ${t.title} (${t.assigneeName})`).join("\n") || "None";
  const openComplaintNames = complaints?.map(c => `• ${c.title} [${c.severity}]`).join("\n") || "None";

  const allChecked = checks.reviewedComplaints && checks.reviewedTasks && checks.systemStatus && checks.activitiesLogged;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allChecked) {
      toast({ title: "Incomplete", description: "Please complete all checklist items", variant: "destructive" });
      return;
    }
    createHandover.mutate({ data: {
      fromShiftId: Number(fromShiftId),
      toShiftId: Number(toShiftId),
      summary: `Checklist completed. System: ${systemStatusNote}. ${tasks?.length || 0} task(s) in progress, ${complaints?.length || 0} complaint(s) open.`,
      pendingActivities: checks.activitiesLogged ? "All activities for this shift have been logged" : "Some activities may not be logged yet",
      pendingTasks: pendingTaskNames,
      pendingComplaints: openComplaintNames,
      notes: notes || undefined,
    }}, {
      onSuccess: () => {
        toast({ title: "Handover Submitted", description: "Shift handover report filed successfully" });
        qc.invalidateQueries({ queryKey: ["/api/handover"] });
        onSuccess();
      },
      onError: () => toast({ title: "Error", description: "Failed to submit handover", variant: "destructive" })
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">From Shift *</label>
          <select className="w-full h-10 px-3 rounded-md bg-background border text-sm" value={fromShiftId} onChange={e => setFromShiftId(e.target.value)} required>
            <option value="" disabled>Select...</option>
            {shifts?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">To Shift *</label>
          <select className="w-full h-10 px-3 rounded-md bg-background border text-sm" value={toShiftId} onChange={e => setToShiftId(e.target.value)} required>
            <option value="" disabled>Select...</option>
            {shifts?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Handover Checklist</h3>

        <ChecklistItem
          checked={checks.reviewedComplaints}
          onChange={v => setChecks({...checks, reviewedComplaints: v})}
          label="Reviewed Pending Complaints"
          detail={`${complaints?.length || 0} open complaint(s)`}
          color="text-destructive"
        />

        <ChecklistItem
          checked={checks.reviewedTasks}
          onChange={v => setChecks({...checks, reviewedTasks: v})}
          label="Reviewed Unfinished Tasks"
          detail={`${tasks?.length || 0} in-progress task(s)`}
          color="text-amber-500"
        />

        <ChecklistItem
          checked={checks.systemStatus}
          onChange={v => setChecks({...checks, systemStatus: v})}
          label="Verified System Status"
          color="text-emerald-500"
        >
          <select className="w-full h-9 px-3 mt-2 rounded-md bg-background border text-sm" value={systemStatusNote} onChange={e => setSystemStatusNote(e.target.value)}>
            <option value="All systems operational">All systems operational</option>
            <option value="Minor issues reported">Minor issues reported</option>
            <option value="System degraded">System degraded</option>
            <option value="Critical outage">Critical outage</option>
          </select>
        </ChecklistItem>

        <ChecklistItem
          checked={checks.activitiesLogged}
          onChange={v => setChecks({...checks, activitiesLogged: v})}
          label="All Activities Logged"
          color="text-blue-400"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Special Notes</label>
        <textarea className="w-full min-h-[80px] px-3 py-2 rounded-md bg-background border text-sm resize-none" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any important information for the next shift..." />
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <span className="text-xs text-muted-foreground">{allChecked ? "✅ All items checked" : "⚠️ Complete all items"}</span>
        <Button type="submit" disabled={createHandover.isPending || !allChecked} className="px-8">
          {createHandover.isPending ? "Submitting..." : "Submit Handover"}
        </Button>
      </div>
    </form>
  );
}

function ChecklistItem({ checked, onChange, label, detail, color, children }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; detail?: string; color: string; children?: React.ReactNode;
}) {
  return (
    <div className={`p-3 rounded-xl border transition-colors ${checked ? 'bg-muted/30 border-border' : 'bg-background border-dashed border-muted-foreground/30'}`}>
      <label className="flex items-start gap-3 cursor-pointer">
        <button type="button" onClick={() => onChange(!checked)} className="mt-0.5 shrink-0">
          {checked ? <CheckCircle2 className={`w-5 h-5 ${color}`} /> : <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/40" />}
        </button>
        <div className="flex-1">
          <span className={`text-sm font-medium ${checked ? '' : 'text-muted-foreground'}`}>{label}</span>
          {detail && <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>}
          {children}
        </div>
      </label>
    </div>
  );
}
