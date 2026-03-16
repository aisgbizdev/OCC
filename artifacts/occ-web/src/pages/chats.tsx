import { useListChats } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Hash } from "lucide-react";

export default function Chats() {
  const { data: chats } = useListChats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chat Rooms</h1>
        <p className="text-muted-foreground mt-1">Internal team communications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chats?.map(chat => (
          <div key={chat.id} className="bg-card border rounded-2xl p-5 shadow-sm hover:bg-muted/10 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Hash className="w-5 h-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold truncate">{chat.name || "General Channel"}</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{chat.chatType}</p>
              </div>
            </div>
            {chat.lastMessage && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2 bg-background p-2 rounded-lg border">{chat.lastMessage}</p>
            )}
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>{chat.members?.length || 0} members</span>
              <span>{format(new Date(chat.createdAt), "MMM d, yyyy")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
