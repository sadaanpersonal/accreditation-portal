"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ClipboardCheck, Loader, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { RoleTag } from "@/components/ui/RoleTag";
import { PipelineMini } from "@/components/ui/PipelineMini";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { Select } from "@/components/ui/Select";
import { pipelineApi, type QueueItemDto } from "@/lib/api";

const STAGE_LABELS: Record<number, string> = {
  1: "FA Owner", 2: "Zone Owner", 3: "Media Owner", 4: "MOI Clearance",
};
const STAGE_COLORS: Record<number, string> = {
  1: "#60A5FA", 2: "#A78BFA", 3: "#F472B6", 4: "#C9A84C",
};

export default function AdminReviewQueuePage() {
  const [items,        setItems]        = useState<QueueItemDto[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");
  const [stageFilter,  setStageFilter]  = useState("all");
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalCount,   setTotalCount]   = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params: Record<string, string | number> = { pageNumber: page, pageSize: 25 };
    if (search) params.searchTerm = search;
    const res = await pipelineApi.queue(params);
    setLoading(false);
    if (res.success && res.data) {
      const filtered = stageFilter === "all"
        ? res.data.items
        : res.data.items.filter(i => i.stage === Number(stageFilter));
      setItems(filtered);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
    } else {
      setError(res.message ?? "Failed to load queue.");
    }
  }, [page, search, stageFilter]);

  useEffect(() => { load(); }, [load]);

  // Stage breakdown
  const stageCounts = [1, 2, 3, 4].map(s => ({
    stage: s,
    count: items.filter(i => i.stage === s).length,
  })).filter(s => s.count > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Review Queue</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0" }}>
            Requests awaiting your stage review
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh"><RefreshCw size={14} /></button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 20, padding: "4px 12px" }}>
            <ClipboardCheck size={13} style={{ color: "var(--gold)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>{totalCount} pending</span>
          </div>
        </div>
      </div>

      {/* Stage breakdown chips */}
      {stageCounts.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {stageCounts.map(({ stage, count }) => (
            <div key={stage} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: `${STAGE_COLORS[stage]}12`, border: `1px solid ${STAGE_COLORS[stage]}30`, fontSize: 12, color: STAGE_COLORS[stage], fontWeight: 600 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: STAGE_COLORS[stage] }} />
              Stage {stage} · {STAGE_LABELS[stage]} · {count}
            </div>
          ))}
        </div>
      )}

      <GlassCard>
        <CardHeader>
          <div style={{ display: "flex", gap: 10, flex: 1, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 200px" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input className="form-control" style={{ paddingLeft: 32, margin: 0 }} placeholder="Search applicant or event…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select
              options={[
                { value: "all", label: "All Stages" },
                { value: "1", label: "Stage 1 — FA Owner" },
                { value: "2", label: "Stage 2 — Zone Owner" },
                { value: "3", label: "Stage 3 — Media Owner" },
                { value: "4", label: "Stage 4 — MOI" },
              ]}
              value={stageFilter}
              onChange={v => { setStageFilter(v); setPage(1); }}
              ariaLabel="Filter by stage"
              width={200}
            />
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{loading ? "…" : `${items.length} results`}</span>
        </CardHeader>

        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 24px", color: "var(--text-muted)", gap: 10 }}>
              <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading queue…
            </div>
          ) : error ? (
            <div style={{ padding: "24px", color: "#F87171", textAlign: "center" }}>
              {error}
              <button className="btn btn-secondary btn-sm" onClick={load} style={{ display: "block", margin: "12px auto 0" }}>Retry</button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>ID</th>
                  <th>Role</th>
                  <th>Event</th>
                  <th>Current Stage</th>
                  <th>Pipeline</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(r => {
                  const sc = STAGE_COLORS[r.stage] ?? "#C9A84C";
                  return (
                    <tr key={r.requestId}>
                      <td><div style={{ fontWeight: 500 }}>{r.applicantName}</div></td>
                      <td style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>{r.accreditationId}</td>
                      <td><RoleTag role={r.role} /></td>
                      <td style={{ fontSize: 12 }}>{r.eventName}</td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12, background: `${sc}12`, border: `1px solid ${sc}30`, color: sc }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: sc }} />
                          {STAGE_LABELS[r.stage] ?? `Stage ${r.stage}`}
                        </span>
                      </td>
                      <td>
                        <PipelineMini currentStage={r.stage} rejected={false} hasMoi showLabel labelBelow />
                      </td>
                      <td style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—"}
                      </td>
                      <td>
                        <Link href={`/admin/requests/${r.requestId}`} className="btn btn-primary btn-sm">Review</Link>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Queue is clear</div>
                      <div style={{ fontSize: 12 }}>No requests awaiting your review</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardBody>
      </GlassCard>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ fontSize: 12, color: "var(--text-muted)", alignSelf: "center" }}>Page {page} of {totalPages}</span>
          <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
