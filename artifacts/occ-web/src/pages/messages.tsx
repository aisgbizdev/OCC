import { useListMessages, useAcknowledgeMessage } from "@workspace/api-client-react";
import { format } from "date-fns";
import { MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Messages() {
  const { data: messages } = useListMessages();
  const ackMsg = useAcknowledgeMessage();
  const qc = useQueryClient();
  const { toast } = useToast();

  const handleAck = (id: number) => {
    ackMsg.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Acknowledged", description: "Message marked as read" });
        qc.invalidateQueries({ queryKey: ["/api/messages"] });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Official Messages</h1>
        <p className="text-muted-foreground mt-1">Direct communications requiring acknowledgment.</p>
      </div>

      <div className="space-y-4">
        {messages?.map(msg => (
          <div key={msg.id} className={`bg-card border rounded-2xl p-6 shadow-sm transition-all ${msg.requireAck && !msg.acknowledged ? 'border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]' : ''}`}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-muted text-muted-foreground">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{msg.subject}</h3>
                  <span className="text-xs text-muted-foreground font-mono">{format(new Date(msg.createdAt), "MMM d, HH:mm")}</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed bg-background p-4 rounded-xl border">{msg.content}</p>
                
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">From: {msg.senderName}</span>
                  
                  {msg.requireAck && (
                    msg.acknowledged ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                        <CheckCircle2 className="w-4 h-4" /> Acknowledged
                      </span>
                    ) : (
                      <Button size="sm" onClick={() => handleAck(msg.id)} disabled={ackMsg.isPending}>
                        Acknowledge Receipt
                      </Button>
                    )
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
