import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Activity, BarChart2, CheckSquare, AlertTriangle,
  Repeat, MessageSquare, MessageCircle, Megaphone, Bell,
  Users, Settings, Search, ArrowRight, Command, X,
  Plus, ClipboardList, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  href?: string;
  icon: React.ElementType;
  keywords: string[];
  adminOnly?: boolean;
  group: string;
  action?: "log-activity" | "new-task" | "new-complaint";
}

const COMMAND_ITEMS: CommandItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: ["home", "beranda", "dashboard"], group: "Navigasi" },
  { id: "activity", label: "Log Aktivitas", href: "/activity-logs", icon: Activity, keywords: ["aktivitas", "log", "kegiatan", "activity"], group: "Navigasi" },
  { id: "kpi", label: "KPI & Ranking", href: "/kpi", icon: BarChart2, keywords: ["kpi", "skor", "ranking", "poin", "score"], group: "Navigasi" },
  { id: "tasks", label: "Tugas", href: "/tasks", icon: CheckSquare, keywords: ["task", "tugas", "pekerjaan", "todo"], group: "Navigasi" },
  { id: "complaints", label: "Komplain", href: "/complaints", icon: AlertTriangle, keywords: ["komplain", "keluhan", "complaint"], group: "Navigasi" },
  { id: "handover", label: "Handover Shift", href: "/handover", icon: Repeat, keywords: ["handover", "pergantian", "shift", "serah"], group: "Navigasi" },
  { id: "messages", label: "Pesan Internal", href: "/messages", icon: MessageSquare, keywords: ["pesan", "message", "dm", "direct"], group: "Komunikasi" },
  { id: "chats", label: "Chat Grup", href: "/chats", icon: MessageCircle, keywords: ["chat", "grup", "obrolan", "group"], group: "Komunikasi" },
  { id: "announcements", label: "Pengumuman", href: "/announcements", icon: Megaphone, keywords: ["pengumuman", "announcement", "info", "berita"], group: "Komunikasi" },
  { id: "notifications", label: "Notifikasi", href: "/notifications", icon: Bell, keywords: ["notifikasi", "notification", "alert", "pemberitahuan"], group: "Komunikasi" },
  { id: "users", label: "Master Data Users", href: "/users", icon: Users, keywords: ["users", "pengguna", "akun", "user", "master"], group: "Admin", adminOnly: true },
  { id: "system", label: "System Settings", href: "/system", icon: Settings, keywords: ["system", "settings", "konfigurasi", "pengaturan"], group: "Admin", adminOnly: true },
  { id: "action-log", label: "Log Aktivitas Baru", description: "Tambah entri log aktivitas", icon: Activity, keywords: ["log", "aktivitas", "tambah", "catat", "input"], group: "Quick Action", action: "log-activity" },
  { id: "action-task", label: "Buat Tugas Baru", description: "Assign tugas baru ke anggota", icon: ClipboardList, keywords: ["tugas", "buat", "task", "tambah", "assign", "baru"], group: "Quick Action", action: "new-task" },
  { id: "action-complaint", label: "Lapor Komplain", description: "Catat komplain pelanggan", icon: Plus, keywords: ["komplain", "lapor", "keluhan", "complaint", "tambah"], group: "Quick Action", action: "new-complaint" },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onLogActivity?: () => void;
  onNewTask?: () => void;
  onNewComplaint?: () => void;
}

export function CommandPalette({ open, onClose, isAdmin, onLogActivity, onNewTask, onNewComplaint }: CommandPaletteProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const items = COMMAND_ITEMS.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.keywords.some(k => k.includes(q)) ||
      item.group.toLowerCase().includes(q) ||
      (item.description ?? "").toLowerCase().includes(q)
    );
  });

  const groupedItems = items.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const flatItems = Object.values(groupedItems).flat();

  const handleSelect = useCallback((item: CommandItem) => {
    onClose();
    if (item.action === "log-activity") {
      setTimeout(() => onLogActivity?.(), 100);
    } else if (item.action === "new-task") {
      setLocation("/tasks");
      setTimeout(() => onNewTask?.(), 300);
    } else if (item.action === "new-complaint") {
      setLocation("/complaints");
      setTimeout(() => onNewComplaint?.(), 300);
    } else if (item.href) {
      setLocation(item.href);
    }
  }, [setLocation, onClose, onLogActivity, onNewTask, onNewComplaint]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, flatItems.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (flatItems[selectedIndex]) handleSelect(flatItems[selectedIndex]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, flatItems, selectedIndex, handleSelect, onClose]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!open) return null;

  let flatIndex = 0;
  const groups = Object.entries(groupedItems);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari menu, halaman, atau fitur..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoComplete="off"
          />
          <div className="flex items-center gap-1 shrink-0">
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono text-muted-foreground">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {groups.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Tidak ada hasil untuk "{query}"</p>
          )}

          {groups.map(([group, groupItems]) => (
            <div key={group}>
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                {group === "Quick Action" && <Zap className="w-3 h-3 text-amber-500" />}
                {group}
              </p>
              {groupItems.map((item) => {
                const idx = flatIndex++;
                const isSelected = selectedIndex === idx;
                const isAction = !!item.action;
                return (
                  <button
                    key={item.id}
                    data-index={idx}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left",
                      isSelected
                        ? isAction ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 shrink-0",
                      isSelected
                        ? isAction ? "text-amber-500" : "text-primary"
                        : isAction ? "text-amber-500/70" : "text-muted-foreground"
                    )} />
                    <span className="flex-1">
                      <span className="font-medium">{item.label}</span>
                      {item.description && (
                        <span className="ml-2 text-xs text-muted-foreground">{item.description}</span>
                      )}
                    </span>
                    {isAction && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-mono border",
                        isSelected ? "bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400" : "bg-muted border-border text-muted-foreground"
                      )}>
                        aksi
                      </span>
                    )}
                    <ArrowRight className={cn("w-3.5 h-3.5 transition-opacity", isSelected ? "opacity-70" : "opacity-0")} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-border flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border border-border bg-muted font-mono">↑↓</kbd> Navigasi</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border border-border bg-muted font-mono">↵</kbd> Pilih</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border border-border bg-muted font-mono">Esc</kbd> Tutup</span>
        </div>
      </div>
    </div>
  );
}
