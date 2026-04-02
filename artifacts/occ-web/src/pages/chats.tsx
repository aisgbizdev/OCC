import { useState, useRef, useEffect } from "react";
import {
  useListChats,
  useListChatMessages,
  useSendChatMessage,
  useCreateChat,
  useListUsers,
  type ChatMessage,
  type UserWithRelations,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { Hash, ArrowLeft, Send, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveModal } from "@/components/responsive-modal";
import { canCreate, canCreateGroupChat } from "@/lib/access-control";

export default function Chats() {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  if (selectedChatId) return <ChatRoom chatId={selectedChatId} onBack={() => setSelectedChatId(null)} />;
  return <ChatList onSelect={setSelectedChatId} />;
}

function ChatList({ onSelect }: { onSelect: (id: number) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: chats } = useListChats();
  const { data: users } = useListUsers();
  const createChat = useCreateChat();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    chatType: "personal",
    name: "",
    memberIds: [] as number[],
  });

  const canCreateChat = canCreate("chat", user);
  const canCreateGroup = canCreateGroupChat(user);

  const visibleUsers = (users as UserWithRelations[] | undefined)?.filter(
    (u) => u.activeStatus && u.id !== user?.id,
  ) ?? [];

  const toggleMember = (userId: number, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      memberIds: checked ? [...prev.memberIds, userId] : prev.memberIds.filter((id) => id !== userId),
    }));
  };

  const submitCreateChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateChat) {
      toast({ title: "Anda tidak memiliki akses", variant: "destructive" });
      return;
    }
    if (form.chatType === "group" && !canCreateGroup) {
      toast({ title: "Anda tidak memiliki akses membuat group chat", variant: "destructive" });
      return;
    }
    if (form.memberIds.length === 0) {
      toast({ title: "Pilih minimal 1 anggota", variant: "destructive" });
      return;
    }

    createChat.mutate(
      {
        data: {
          chatType: form.chatType,
          name: form.name || undefined,
          memberIds: form.memberIds,
        },
      },
      {
        onSuccess: (chat) => {
          toast({ title: "Chat room berhasil dibuat" });
          qc.invalidateQueries({ queryKey: ["/api/chats"] });
          setCreateOpen(false);
          setForm({ chatType: "personal", name: "", memberIds: [] });
          if (chat?.id) onSelect(chat.id);
        },
        onError: () => toast({ title: "Gagal membuat chat room", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chat Rooms</h1>
          <p className="text-muted-foreground mt-1">Komunikasi internal tim operasional.</p>
        </div>
        {canCreateChat && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Chat Baru
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chats?.map(chat => (
          <button key={chat.id} onClick={() => onSelect(chat.id)} className="bg-card border rounded-2xl p-5 shadow-sm hover:bg-muted/10 transition-colors cursor-pointer group text-left w-full">
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
              <span>{chat.members?.length ?? 0} members</span>
              <span>{chat.createdAt ? format(new Date(chat.createdAt), "MMM d, yyyy") : ""}</span>
            </div>
          </button>
        ))}
        {chats?.length === 0 && (
          <div className="col-span-3 text-center py-12 text-muted-foreground">Belum ada chat room yang tersedia.</div>
        )}
      </div>

      <ResponsiveModal
        open={createOpen && canCreateChat}
        onOpenChange={setCreateOpen}
        title="Buat Chat Room"
        description="Buat personal chat atau group chat untuk koordinasi tim."
      >
        <form onSubmit={submitCreateChat} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipe Chat</label>
            <select
              className="w-full h-10 px-3 rounded-md bg-background border text-sm"
              value={form.chatType}
              onChange={(e) => setForm((p) => ({ ...p, chatType: e.target.value, memberIds: [] }))}
            >
              <option value="personal">Personal</option>
              {canCreateGroup && <option value="group">Group</option>}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Room (opsional)</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={form.chatType === "group" ? "Contoh: Shift Pagi SGB" : "Opsional"}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {form.chatType === "group" ? "Pilih Anggota Group" : "Pilih User"}
            </label>
            <div className="max-h-56 overflow-y-auto border rounded-lg p-3 space-y-2 bg-background">
              {visibleUsers.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.memberIds.includes(u.id)}
                    onChange={(e) => toggleMember(u.id, e.target.checked)}
                  />
                  <span>{u.name} ({u.roleName ?? "-"})</span>
                </label>
              ))}
              {visibleUsers.length === 0 && (
                <p className="text-sm text-muted-foreground">Tidak ada user lain yang bisa dipilih.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={createChat.isPending || !canCreateChat} className="px-8">
              {createChat.isPending ? "Membuat..." : "Buat Chat"}
            </Button>
          </div>
        </form>
      </ResponsiveModal>
    </div>
  );
}

function ChatRoom({ chatId, onBack }: { chatId: number; onBack: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: messages } = useListChatMessages(chatId, { query: { queryKey: ["chat-messages", chatId], refetchInterval: 5000 } });
  const sendMessage = useSendChatMessage();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage.mutate({ id: chatId, data: { message: text.trim() } }, {
      onSuccess: () => {
        setText("");
        qc.invalidateQueries({ queryKey: ["chat-messages", chatId] });
      },
      onError: () => toast({ title: "Error", description: "Failed to send message", variant: "destructive" })
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      <div className="flex items-center gap-3 pb-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Hash className="w-4 h-4" />
          </div>
          <h2 className="font-bold">Chat Room</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages?.map((msg: ChatMessage) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isMe ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
                {!isMe && <p className="text-xs font-bold mb-1 opacity-70">{msg.senderName}</p>}
                <p className="text-sm">{msg.message}</p>
                <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                  {msg.createdAt ? format(new Date(msg.createdAt), "HH:mm") : ""}
                </p>
              </div>
            </div>
          );
        })}
        {messages?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">Belum ada pesan. Mulai percakapan!</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 pt-4 border-t">
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." className="flex-1" autoFocus />
        <Button type="submit" size="icon" disabled={!text.trim() || sendMessage.isPending}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
