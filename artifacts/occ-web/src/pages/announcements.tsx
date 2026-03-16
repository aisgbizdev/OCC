import { useListAnnouncements } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Megaphone } from "lucide-react";

export default function Announcements() {
  const { data: announcements } = useListAnnouncements();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground mt-1">Official communications and notices.</p>
      </div>

      <div className="space-y-4">
        {announcements?.map(ann => (
          <div key={ann.id} className="bg-card border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
            {ann.priority === 'high' && (
              <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
            )}
            
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${ann.priority === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg">{ann.title}</h3>
                  <span className="text-xs text-muted-foreground font-mono">{format(new Date(ann.createdAt), "MMM d, HH:mm")}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                <div className="mt-4 flex items-center gap-3 text-xs font-medium">
                  <span className="bg-muted px-2 py-1 rounded-md text-foreground">By {ann.creatorName}</span>
                  {ann.targetScope && (
                    <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md">
                      Scope: {ann.targetScope.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
