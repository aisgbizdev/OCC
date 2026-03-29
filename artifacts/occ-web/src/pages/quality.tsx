import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { ShieldCheck, Plus, X, AlertTriangle, CheckCircle2, MinusCircle, ChevronDown, ChevronUp, Calendar, User, FileText, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useListQualityErrorTypes,
  useListQualityRecords,
  useGetQualitySummary,
  useCreateQualityRecord,
  useListUsers,
  useListPts,
  useListShifts,
  type QualityRecordWithRelations,
  type QualitySummaryResponse,
  type QualityErrorType,
  type UserWithRelations,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type ScoreLevel = "POOR" | "AVERAGE" | "PERFECT";

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

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getMonthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function Quality() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"summary" | "records" | "types">("summary");
  const [showForm, setShowForm] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [filterDateFrom, setFilterDateFrom] = useState(getMonthStart());
  const [filterDateTo, setFilterDateTo] = useState(getTodayString());
  const [filterPtId, setFilterPtId] = useState("");
  const [filterShiftId, setFilterShiftId] = useState("");
  const [filterUserId, setFilterUserId] = useState("");
  const [filterScore, setFilterScore] = useState("");

  // ── Form state ────────────────────────────────────────────────────────────
  const [formUserId, setFormUserId] = useState("");
  const [formErrorTypeId, setFormErrorTypeId] = useState("");
  const [formDate, setFormDate] = useState(getTodayString());
  const [formCount, setFormCount] = useState("1");
  const [formNotes, setFormNotes] = useState("");

  const roleName = user?.roleName ?? "";
  const myPtId   = (user as { ptId?: number })?.ptId;
  const isSPV    = roleName === "SPV Dealing";
  const isManagement = ["Owner", "Direksi", "Chief Dealing", "Admin System", "Superadmin"].includes(roleName);
  const canLog   = isSPV || isManagement;

  // ── Master data ───────────────────────────────────────────────────────────
  const { data: pts = [] }    = useListPts();
  const { data: shifts = [] } = useListShifts();
  const { data: errorTypes = [] } = useListQualityErrorTypes({ query: { enabled: tab === "types" || showForm } });

  // Fetch users: SPV gets only their PT's users; management can see all
  const { data: usersRaw = [] } = useListUsers(
    isSPV && myPtId ? { ptId: myPtId } : {},
    { query: { enabled: showForm || tab === "records" } }
  );
  const teamUsers = (usersRaw as UserWithRelations[]).filter(u =>
    ["SPV Dealing", "Dealer"].includes(u.roleName ?? "")
  );

  // ── Summary query ─────────────────────────────────────────────────────────
  const summaryParams = useMemo(() => ({
    dateFrom: filterDateFrom,
    dateTo: filterDateTo,
    ...(filterPtId && !isSPV ? { ptId: Number(filterPtId) } : {}),
    ...(filterShiftId ? { shiftId: Number(filterShiftId) } : {}),
  }), [filterDateFrom, filterDateTo, filterPtId, filterShiftId, isSPV]);

  const { data: summaryData, isLoading: summaryLoading, refetch: refetchSummary } = useGetQualitySummary(
    summaryParams,
    { query: { enabled: tab === "summary", queryKey: ["quality-summary", summaryParams] } }
  );

  // ── Records query ─────────────────────────────────────────────────────────
  const recordsParams = useMemo(() => ({
    dateFrom: filterDateFrom,
    dateTo: filterDateTo,
    ...(filterPtId && !isSPV ? { ptId: Number(filterPtId) } : {}),
    ...(filterShiftId ? { shiftId: Number(filterShiftId) } : {}),
    ...(filterUserId ? { userId: Number(filterUserId) } : {}),
    ...(filterScore ? { score: filterScore as ScoreLevel } : {}),
    limit: 200,
  }), [filterDateFrom, filterDateTo, filterPtId, filterShiftId, filterUserId, filterScore, isSPV]);

  const { data: records = [], isLoading: recordsLoading, refetch: refetchRecords } = useListQualityRecords(
    recordsParams,
    { query: { enabled: tab === "records", queryKey: ["quality-records", recordsParams] } }
  );

  // ── Create mutation ───────────────────────────────────────────────────────
  const { mutate: createRecord, isPending: submitting } = useCreateQualityRecord({
    mutation: {
      onSuccess: () => {
        toast({ title: "Kesalahan berhasil dicatat" });
        setShowForm(false);
        setFormUserId(""); setFormErrorTypeId(""); setFormCount("1"); setFormNotes("");
        queryClient.invalidateQueries({ queryKey: ["quality-summary"] });
        queryClient.invalidateQueries({ queryKey: ["quality-records"] });
      },
      onError: (err: { response?: { data?: { error?: string } } }) => {
        toast({ title: err?.response?.data?.error ?? "Gagal mencatat", variant: "destructive" });
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formUserId || !formErrorTypeId || !formDate) {
      toast({ title: "Lengkapi semua field wajib", variant: "destructive" }); return;
    }
    createRecord({
      userId: Number(formUserId),
      errorTypeId: Number(formErrorTypeId),
      occurredDate: formDate,
      errorCount: Number(formCount) || 0,
      notes: formNotes || undefined,
    });
  }

  const groupedByObjective = useMemo(() => {
    const map: Record<string, QualityErrorType[]> = {};
    for (const et of errorTypes) {
      const g = (et as { objectiveGroup?: string }).objectiveGroup ?? "Lainnya";
      if (!map[g]) map[g] = [];
      map[g].push(et);
    }
    return map;
  }, [errorTypes]);

  function previewScore(count: string): ScoreLevel {
    const n = Number(count);
    if (n === 0) return "PERFECT";
    if (n <= 3)  return "AVERAGE";
    return "POOR";
  }

  // ── Filter controls (shared between tabs) ─────────────────────────────────
  const FilterBar = () => (
    <div className="flex flex-wrap gap-2 items-end">
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Dari</label>
        <input
          type="date"
          value={filterDateFrom}
          onChange={e => setFilterDateFrom(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-36"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sampai</label>
        <input
          type="date"
          value={filterDateTo}
          onChange={e => setFilterDateTo(e.target.value)}
          max={getTodayString()}
          className="px-2.5 py-1.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-36"
        />
      </div>
      {!isSPV && pts.length > 0 && (
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">PT</label>
          <select
            value={filterPtId}
            onChange={e => setFilterPtId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border bg-background text-sm w-32"
          >
            <option value="">Semua PT</option>
            {(pts as { id: number; code?: string; name: string }[]).map((pt) => (
              <option key={pt.id} value={pt.id}>{pt.code ?? pt.name}</option>
            ))}
          </select>
        </div>
      )}
      {shifts.length > 0 && (
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Shift</label>
          <select
            value={filterShiftId}
            onChange={e => setFilterShiftId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border bg-background text-sm w-28"
          >
            <option value="">Semua shift</option>
            {(shifts as { id: number; name: string }[]).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}
      {tab === "records" && (
        <>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Skor</label>
            <select
              value={filterScore}
              onChange={e => setFilterScore(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border bg-background text-sm w-32"
            >
              <option value="">Semua skor</option>
              <option value="PERFECT">PERFECT</option>
              <option value="AVERAGE">AVERAGE</option>
              <option value="POOR">POOR</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Anggota</label>
            <select
              value={filterUserId}
              onChange={e => setFilterUserId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border bg-background text-sm w-36"
            >
              <option value="">Semua anggota</option>
              {teamUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </>
      )}
      <button
        onClick={() => { if (tab === "summary") refetchSummary(); if (tab === "records") refetchRecords(); }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background text-sm hover:bg-muted transition-colors self-end"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Muat
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
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
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Catat Kesalahan
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1 w-fit">
        {(["summary", "records", "types"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-card border border-border shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t === "summary" ? "Summary" : t === "records" ? "Riwayat" : "Jenis Kesalahan"}
          </button>
        ))}
      </div>

      {/* Filter bar (summary + records only) */}
      {(tab === "summary" || tab === "records") && <FilterBar />}

      {/* Summary Tab */}
      {tab === "summary" && (
        <div className="space-y-4">
          {summaryLoading && (
            <div className="flex justify-center py-12 text-muted-foreground text-sm">Memuat data...</div>
          )}
          {summaryData && (
            <>
              {/* Score overview cards */}
              <div className="grid grid-cols-3 gap-3">
                {(["PERFECT","AVERAGE","POOR"] as ScoreLevel[]).map(s => {
                  const count = (summaryData as QualitySummaryResponse).summary.filter(x => (x as { score: ScoreLevel }).score === s).length;
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

              {summaryData.summary.length === 0 ? (
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
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Shift</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Kesalahan</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Records</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Skor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(summaryData as QualitySummaryResponse).summary.map((item, idx) => {
                        const si = item as typeof item & { userName?: string; ptName?: string; shiftName?: string; score: ScoreLevel };
                        return (
                          <tr key={si.userId} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                            <td className="px-4 py-3 font-medium">{si.userName ?? "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">{si.ptName ?? "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">{si.shiftName ?? "—"}</td>
                            <td className="px-4 py-3 text-center font-bold">{si.totalErrors}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{si.recordCount}</td>
                            <td className="px-4 py-3 text-center">{scoreBadge(si.score)}</td>
                          </tr>
                        );
                      })}
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
          {recordsLoading && <div className="text-center py-12 text-muted-foreground text-sm">Memuat riwayat...</div>}

          {!recordsLoading && (records as QualityRecordWithRelations[]).length === 0 && (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground text-sm">
              Belum ada riwayat kesalahan yang tercatat untuk periode dan filter ini.
            </div>
          )}

          {!recordsLoading && (records as QualityRecordWithRelations[]).length > 0 && (
            <div className="space-y-2">
              {(records as QualityRecordWithRelations[]).map(rec => {
                const r = rec as QualityRecordWithRelations & {
                  userName?: string; errorTypeCategory?: string; errorTypeName?: string;
                  occurredDate: string; objectiveGroup?: string; notes?: string;
                  score: ScoreLevel; errorCount: number;
                };
                return (
                  <div key={r.id} className="rounded-xl border bg-card overflow-hidden">
                    <button
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
                      onClick={() => setExpandedRecord(expandedRecord === r.id ? null : r.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{r.userName ?? "—"}</span>
                          {r.errorTypeCategory && categoryBadge(r.errorTypeCategory)}
                          {scoreBadge(r.score)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">{r.errorTypeName ?? "—"}</div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">{new Date(r.occurredDate).toLocaleDateString("id-ID")}</div>
                      {expandedRecord === r.id ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </button>
                    {expandedRecord === r.id && (
                      <div className="px-4 pb-4 pt-1 border-t bg-muted/10 space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div><span className="text-muted-foreground">Jumlah kesalahan:</span> <strong>{r.errorCount}</strong></div>
                          <div><span className="text-muted-foreground">Tanggal:</span> {new Date(r.occurredDate).toLocaleDateString("id-ID", { weekday:"long",day:"numeric",month:"long",year:"numeric" })}</div>
                          {r.objectiveGroup && <div className="col-span-2"><span className="text-muted-foreground">Objective:</span> {r.objectiveGroup}</div>}
                          {r.notes && <div className="col-span-2"><span className="text-muted-foreground">Catatan:</span> {r.notes}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Error Types Tab */}
      {tab === "types" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Referensi jenis kesalahan dari KPI Operasional:</p>
          {Object.entries(groupedByObjective).map(([group, types]) => (
            <div key={group} className="rounded-xl border overflow-hidden">
              <div className="px-4 py-2 bg-muted/40 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group}
              </div>
              <div className="divide-y">
                {types.map(et => {
                    const e = et as QualityErrorType & { category: string; description?: string };
                    return (
                      <div key={e.id} className="px-4 py-3 flex items-start gap-3">
                        <div className="pt-0.5">{categoryBadge(e.category)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{e.name}</div>
                          {e.description && (
                            <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{e.description}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
              {/* Anggota Tim - scoped to current PT for SPV */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <User className="w-4 h-4" />Anggota Tim <span className="text-destructive">*</span>
                </label>
                <select
                  value={formUserId}
                  onChange={e => setFormUserId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Pilih anggota tim...</option>
                  {teamUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.roleName})</option>
                  ))}
                </select>
                {isSPV && <p className="text-[10px] text-muted-foreground">Hanya menampilkan anggota tim PT Anda.</p>}
              </div>

              {/* Jenis Kesalahan */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />Jenis Kesalahan <span className="text-destructive">*</span>
                </label>
                <select
                  value={formErrorTypeId}
                  onChange={e => setFormErrorTypeId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Pilih jenis kesalahan...</option>
                  {Object.entries(groupedByObjective).map(([group, types]) => (
                    <optgroup key={group} label={group}>
                      {types.map(et => {
                          const e = et as QualityErrorType & { category: string };
                          return <option key={e.id} value={e.id}>{e.name} [{e.category}]</option>;
                        })}
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
                    max={getTodayString()}
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
                  <p className="text-[10px] text-muted-foreground">0=PERFECT · 1–3=AVERAGE · &gt;3=POOR</p>
                </div>
              </div>

              {/* Score preview */}
              {formCount !== "" && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Skor:</span>
                  {scoreBadge(previewScore(formCount))}
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
