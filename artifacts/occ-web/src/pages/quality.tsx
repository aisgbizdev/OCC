import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { ShieldCheck, Plus, X, AlertTriangle, CheckCircle2, MinusCircle, ChevronDown, ChevronUp, Calendar, User, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

type ScoreLevel = "POOR" | "AVERAGE" | "PERFECT";

interface ErrorType {
  id: number;
  name: string;
  category: string;
  objectiveGroup: string | null;
  description: string | null;
}

interface QualityRecord {
  id: number;
  userId: number;
  userName: string;
  errorTypeId: number;
  errorTypeName: string;
  errorTypeCategory: string;
  objectiveGroup: string | null;
  occurredDate: string;
  errorCount: number;
  score: ScoreLevel;
  notes: string | null;
  recordedBy: number;
  createdAt: string;
}

interface SummaryItem {
  userId: number;
  userName: string;
  ptName: string | null;
  totalErrors: number;
  recordCount: number;
  score: ScoreLevel;
}

interface SummaryResponse {
  dateFrom: string;
  dateTo: string;
  summary: SummaryItem[];
}

function scoreBadge(score: ScoreLevel) {
  if (score === "PERFECT") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
      <CheckCircle2 className="w-3 h-3" /> PERFECT
    </span>
  );
  if (score === "AVERAGE") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
      <MinusCircle className="w-3 h-3" /> AVERAGE
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
      <AlertTriangle className="w-3 h-3" /> POOR
    </span>
  );
}

function categoryBadge(category: string) {
  const map: Record<string, string> = {
    DEALER: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    SPV:    "bg-purple-500/20 text-purple-400 border-purple-500/30",
    ALL:    "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${map[category] ?? map.ALL}`}>
      {category}
    </span>
  );
}

function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("occ_token");
  return fetch(`${BASE}/api${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });
}

export default function Quality() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<"summary" | "records" | "log">("summary");
  const [errorTypes, setErrorTypes] = useState<ErrorType[]>([]);
  const [records, setRecords] = useState<QualityRecord[]>([]);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [users, setUsers] = useState<{ id: number; name: string; roleName: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadedErrorTypes, setLoadedErrorTypes] = useState(false);
  const [loadedRecords, setLoadedRecords] = useState(false);
  const [loadedSummary, setLoadedSummary] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formUserId, setFormUserId] = useState("");
  const [formErrorTypeId, setFormErrorTypeId] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formCount, setFormCount] = useState("1");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [filterScore, setFilterScore] = useState<string>("");
  const [filterUser, setFilterUser] = useState<string>("");
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null);

  const roleName = user?.roleName ?? "";
  const canLog = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Admin System"].includes(roleName);

  async function loadErrorTypes() {
    if (loadedErrorTypes) return;
    try {
      const r = await apiFetch("/quality/error-types");
      if (r.ok) {
        setErrorTypes(await r.json());
        setLoadedErrorTypes(true);
      }
    } catch { /* silent */ }
  }

  async function loadUsers() {
    if (users.length) return;
    try {
      const r = await apiFetch("/users?limit=100");
      if (r.ok) {
        const data = await r.json();
        setUsers((data.users ?? data).map((u: { id: number; name: string; roleName: string }) => ({ id: u.id, name: u.name, roleName: u.roleName })));
      }
    } catch { /* silent */ }
  }

  async function loadRecords() {
    setLoading(true);
    try {
      let url = "/quality/records?limit=100";
      if (filterUser) url += `&userId=${filterUser}`;
      if (filterScore) url += `&score=${filterScore}`;
      const r = await apiFetch(url);
      if (r.ok) {
        setRecords(await r.json());
        setLoadedRecords(true);
      }
    } catch { /* silent */ }
    setLoading(false);
  }

  async function loadSummary() {
    setLoading(true);
    try {
      const r = await apiFetch("/quality/summary");
      if (r.ok) {
        setSummary(await r.json());
        setLoadedSummary(true);
      }
    } catch { /* silent */ }
    setLoading(false);
  }

  async function handleTabChange(t: "summary" | "records" | "log") {
    setTab(t);
    if (t === "summary" && !loadedSummary) loadSummary();
    if (t === "records" && !loadedRecords) { await loadErrorTypes(); loadRecords(); }
    if (t === "log") { await loadErrorTypes(); await loadUsers(); }
  }

  // Load summary on first render
  useState(() => { loadSummary(); });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formUserId || !formErrorTypeId || !formDate) {
      toast({ title: "Lengkapi semua field", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      const r = await apiFetch("/quality/records", {
        method: "POST",
        body: JSON.stringify({
          userId: Number(formUserId),
          errorTypeId: Number(formErrorTypeId),
          occurredDate: formDate,
          errorCount: Number(formCount) || 0,
          notes: formNotes || undefined,
        }),
      });
      if (r.ok) {
        toast({ title: "Kesalahan berhasil dicatat" });
        setShowForm(false);
        setFormUserId(""); setFormErrorTypeId(""); setFormCount("1"); setFormNotes("");
        setLoadedRecords(false); setLoadedSummary(false);
        setSummary(null); setRecords([]);
        loadSummary();
      } else {
        const err = await r.json();
        toast({ title: err.error ?? "Gagal mencatat", variant: "destructive" });
      }
    } catch {
      toast({ title: "Gagal terhubung ke server", variant: "destructive" });
    }
    setSubmitting(false);
  }

  const filteredRecords = useMemo(() => {
    return records.filter(r =>
      (!filterUser || String(r.userId) === filterUser) &&
      (!filterScore || r.score === filterScore)
    );
  }, [records, filterUser, filterScore]);

  const groupedByObjective = useMemo(() => {
    const map: Record<string, ErrorType[]> = {};
    for (const et of errorTypes) {
      const g = et.objectiveGroup ?? "Lainnya";
      if (!map[g]) map[g] = [];
      map[g].push(et);
    }
    return map;
  }, [errorTypes]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Quality Control</h1>
            <p className="text-sm text-muted-foreground">Pencatatan & tracking kesalahan kerja operasional</p>
          </div>
        </div>
        {canLog && (
          <button
            onClick={() => { setShowForm(true); handleTabChange("log"); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Catat Kesalahan
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1 w-fit">
        {(["summary", "records", "log"] as const).map(t => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? "bg-card border border-border shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t === "summary" ? "Summary" : t === "records" ? "Riwayat" : "Jenis Kesalahan"}
          </button>
        ))}
      </div>

      {/* Summary Tab */}
      {tab === "summary" && (
        <div className="space-y-4">
          {loading && !summary && (
            <div className="flex justify-center py-12 text-muted-foreground text-sm">Memuat data...</div>
          )}
          {summary && (
            <>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Periode: {new Date(summary.dateFrom).toLocaleDateString("id-ID", { day:"numeric",month:"long",year:"numeric" })}
                {" — "}{new Date(summary.dateTo).toLocaleDateString("id-ID", { day:"numeric",month:"long",year:"numeric" })}
              </div>

              {/* Score overview cards */}
              {summary.summary.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {(["PERFECT","AVERAGE","POOR"] as ScoreLevel[]).map(s => {
                    const count = summary.summary.filter(x => x.score === s).length;
                    const colors: Record<ScoreLevel,string> = {
                      PERFECT: "border-green-500/30 bg-green-500/5",
                      AVERAGE: "border-yellow-500/30 bg-yellow-500/5",
                      POOR:    "border-red-500/30 bg-red-500/5",
                    };
                    return (
                      <div key={s} className={`rounded-xl border p-4 ${colors[s]}`}>
                        <div className="mb-1">{scoreBadge(s)}</div>
                        <div className="text-2xl font-bold mt-2">{count}</div>
                        <div className="text-xs text-muted-foreground">personil</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {summary.summary.length === 0 ? (
                <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground text-sm">
                  Belum ada data kesalahan untuk periode ini.
                </div>
              ) : (
                <div className="rounded-xl border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nama</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">PT</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Total Kesalahan</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Records</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Skor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.summary.map((item, idx) => (
                        <tr key={item.userId} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                          <td className="px-4 py-3 font-medium">{item.userName}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">{item.ptName ?? "—"}</td>
                          <td className="px-4 py-3 text-center font-bold">{item.totalErrors}</td>
                          <td className="px-4 py-3 text-center text-muted-foreground">{item.recordCount}</td>
                          <td className="px-4 py-3 text-center">{scoreBadge(item.score)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Records Tab */}
      {tab === "records" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select
              value={filterScore}
              onChange={e => { setFilterScore(e.target.value); setLoadedRecords(false); }}
              className="px-3 py-2 rounded-lg border bg-background text-sm min-w-[140px]"
            >
              <option value="">Semua skor</option>
              <option value="PERFECT">PERFECT</option>
              <option value="AVERAGE">AVERAGE</option>
              <option value="POOR">POOR</option>
            </select>
            <button
              onClick={() => { setLoadedRecords(false); loadRecords(); }}
              className="px-3 py-2 rounded-lg border bg-background text-sm hover:bg-muted transition-colors"
            >
              Muat Ulang
            </button>
          </div>

          {loading && <div className="text-center py-12 text-muted-foreground text-sm">Memuat riwayat...</div>}

          {!loading && loadedRecords && filteredRecords.length === 0 && (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground text-sm">
              Belum ada riwayat kesalahan yang tercatat.
            </div>
          )}

          {!loading && filteredRecords.length > 0 && (
            <div className="space-y-2">
              {filteredRecords.map(rec => (
                <div key={rec.id} className="rounded-xl border bg-card overflow-hidden">
                  <button
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
                    onClick={() => setExpandedRecord(expandedRecord === rec.id ? null : rec.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{rec.userName}</span>
                        {categoryBadge(rec.errorTypeCategory)}
                        {scoreBadge(rec.score)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">{rec.errorTypeName}</div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">{new Date(rec.occurredDate).toLocaleDateString("id-ID")}</div>
                    {expandedRecord === rec.id ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>
                  {expandedRecord === rec.id && (
                    <div className="px-4 pb-4 pt-1 border-t bg-muted/10 space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-muted-foreground">Jumlah kesalahan:</span> <strong>{rec.errorCount}</strong></div>
                        <div><span className="text-muted-foreground">Tanggal:</span> {new Date(rec.occurredDate).toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}</div>
                        {rec.objectiveGroup && <div className="col-span-2"><span className="text-muted-foreground">Objective:</span> {rec.objectiveGroup}</div>}
                        {rec.notes && <div className="col-span-2"><span className="text-muted-foreground">Catatan:</span> {rec.notes}</div>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Types Tab */}
      {tab === "log" && !showForm && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Daftar jenis kesalahan dari referensi KPI Operasional:</p>
          {Object.entries(groupedByObjective).map(([group, types]) => (
            <div key={group} className="rounded-xl border overflow-hidden">
              <div className="px-4 py-2 bg-muted/40 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group}
              </div>
              <div className="divide-y">
                {types.map(et => (
                  <div key={et.id} className="px-4 py-3 flex items-start gap-3">
                    <div className="pt-0.5">{categoryBadge(et.category)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{et.name}</div>
                      {et.description && <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{et.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {errorTypes.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">Memuat jenis kesalahan...</div>
          )}
        </div>
      )}

      {/* Form: Catat Kesalahan */}
      {showForm && canLog && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h2 className="font-bold">Catat Kesalahan</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* User */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5"><User className="w-4 h-4" />Anggota Tim <span className="text-destructive">*</span></label>
                <select
                  value={formUserId}
                  onChange={e => setFormUserId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Pilih anggota tim...</option>
                  {users
                    .filter(u => ["SPV Dealing", "Dealer"].includes(u.roleName))
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.roleName})</option>
                    ))
                  }
                </select>
              </div>

              {/* Error Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5"><FileText className="w-4 h-4" />Jenis Kesalahan <span className="text-destructive">*</span></label>
                <select
                  value={formErrorTypeId}
                  onChange={e => setFormErrorTypeId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Pilih jenis kesalahan...</option>
                  {Object.entries(groupedByObjective).map(([group, types]) => (
                    <optgroup key={group} label={group}>
                      {types.map(et => (
                        <option key={et.id} value={et.id}>{et.name} [{et.category}]</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Date & Count */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5"><Calendar className="w-4 h-4" />Tanggal <span className="text-destructive">*</span></label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    required
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Jumlah Kesalahan</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={formCount}
                    onChange={e => setFormCount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-[10px] text-muted-foreground">0=PERFECT · 1-3=AVERAGE · &gt;3=POOR</p>
                </div>
              </div>

              {/* Score preview */}
              {formCount !== "" && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Skor:</span>
                  {scoreBadge(Number(formCount) === 0 ? "PERFECT" : Number(formCount) <= 3 ? "AVERAGE" : "POOR")}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Catatan (opsional)</label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  rows={3}
                  placeholder="Deskripsi singkat kejadian..."
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
