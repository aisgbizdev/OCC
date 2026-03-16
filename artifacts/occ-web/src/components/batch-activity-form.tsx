import { useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListActivityTypes, useCreateBatchActivityLogs } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function BatchActivityForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: types } = useListActivityTypes();
  const createBatch = useCreateBatchActivityLogs();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [rows, setRows] = useState([{ activityTypeId: "", quantity: 1, note: "" }]);

  const handleAdd = () => setRows([...rows, { activityTypeId: "", quantity: 1, note: "" }]);
  const handleRemove = (index: number) => setRows(rows.filter((_, i) => i !== index));

  const handleChange = (index: number, field: string, value: string | number) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = rows.filter(r => r.activityTypeId && r.quantity > 0).map(r => ({
      activityTypeId: Number(r.activityTypeId),
      quantity: Number(r.quantity),
      note: r.note || undefined
    }));

    if (validRows.length === 0) {
      toast({ title: "Error", description: "Add at least one valid activity", variant: "destructive" });
      return;
    }

    createBatch.mutate({ data: { items: validRows } }, {
      onSuccess: () => {
        toast({ title: "Success", description: `Logged ${validRows.length} activities` });
        qc.invalidateQueries({ queryKey: ["/api/activity-logs"] });
        qc.invalidateQueries({ queryKey: ["/api/kpi/scores"] });
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2 items-start bg-muted/50 p-3 rounded-xl border">
            <div className="flex-1 space-y-2">
              <select 
                className="w-full h-10 px-3 rounded-md bg-background border text-sm"
                value={row.activityTypeId}
                onChange={(e) => handleChange(i, "activityTypeId", e.target.value)}
                required
              >
                <option value="" disabled>Select Activity Type...</option>
                {types?.filter(t => t.activeStatus).map(t => (
                  <option key={t.id} value={t.id}>{t.name} (Pts: {t.weightPoints})</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Input 
                  type="number" min="1" placeholder="Qty" 
                  value={row.quantity} onChange={e => handleChange(i, "quantity", e.target.value)}
                  className="w-24 bg-background" required
                />
                <Input 
                  type="text" placeholder="Optional notes..." 
                  value={row.note} onChange={e => handleChange(i, "note", e.target.value)}
                  className="flex-1 bg-background"
                />
              </div>
            </div>
            {rows.length > 1 && (
              <Button type="button" size="icon" variant="ghost" className="text-destructive mt-1" onClick={() => handleRemove(i)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center pt-4 border-t">
        <Button type="button" variant="outline" onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Add Row
        </Button>
        <Button type="submit" disabled={createBatch.isPending} className="gap-2 px-8">
          <Save className="w-4 h-4" /> {createBatch.isPending ? "Saving..." : "Submit Batch"}
        </Button>
      </div>
    </form>
  );
}
