import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function SlaTimer({ createdAt, status }: { createdAt: string; status: string }) {
  const [elapsedHrs, setElapsedHrs] = useState(0);

  useEffect(() => {
    if (status === "resolved" || status === "closed") return;
    
    const calculate = () => {
      const created = new Date(createdAt).getTime();
      const now = Date.now();
      setElapsedHrs((now - created) / (1000 * 60 * 60));
    };
    
    calculate();
    const interval = setInterval(calculate, 60000);
    return () => clearInterval(interval);
  }, [createdAt, status]);

  if (status === "resolved" || status === "closed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        Resolved
      </span>
    );
  }

  const isWarning = elapsedHrs >= 24 && elapsedHrs < 72;
  const isCritical = elapsedHrs >= 72;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm transition-colors",
      isCritical ? "bg-destructive/20 text-red-400 border border-destructive/30 animate-pulse" :
      isWarning ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
      "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
    )}>
      <Clock className="w-3.5 h-3.5" />
      {elapsedHrs < 1 ? "< 1h" : `${Math.floor(elapsedHrs)}h`} Elapsed
    </span>
  );
}
