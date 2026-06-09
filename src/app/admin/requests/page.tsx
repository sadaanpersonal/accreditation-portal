"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Filter, Loader, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { RoleTag } from "@/components/ui/RoleTag";
import { PipelineMini } from "@/components/ui/PipelineMini";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { requestsApi, type RequestDto } from "@/lib/api";

type Variant = "approved" | "pending" | "rejected" | "review";

function statusVariant(r: RequestDto): Variant {
  if (r.status === "Approved") return "approved";
  if (r.status === "Rejected" || r.isRejected) return "rejected";
  if (r.isInfoRequested) return "review";
  return "pending";
}

export default function AdminRequestsPage() {
  const [rows,         setRows]         = useState<RequestDto[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter,  setEventFilter]  = useState("all");
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalCount,   setTotalCount]   = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params: Record<string, string | number> = { pageNumber: page, pageSize: 25 };
    if (search) params.searchTerm = search;
    if (statusFilter !== "all") params.status = statusFilter;
    if (eventFilter !== "all") params.eventName = eventFilter;
    const res = await requestsApi.list(params);
    setLoading(false);
    if (res.success && res.data) {
      setRows(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
    } else {
      setError(res.message ?? "Failed to load requests.");
    }
  }, [page, search, statusFilter, eventFilter]);

  useEffect(() => { load(); }, [load]);

  const events = Array.from(new Set(rows.map(r => r.eventName))).filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>All Accreditation Requests</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh"><RefreshCw size={14} /></button>
          <Link href="/admin/requests/new" className="btn btn-primary btn-sm">+ New Request</Link>
        </div>
      </div>

      <GlassCard>
        <CardHeader>
          <div style={{ display: "flex", gap: 10, flex: 1, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 200px" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input className="form-control" style={{ paddingLeft: 32, margin: 0 }} placeholder="Search name, ID, event…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Filter size={14} style={{ color: "var(--text-muted)" }} />
              <select className="form-control" style={{ margin: 0, width: "auto" }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="all">All Status</option>
                <option value="Submitted">Submitted</option>
                <option value="UnderReview">Under Review</option>
                <option value="InfoRequested">Info Requested</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              {events.length > 0 && (
                <select className="form-control" style={{ margin: 0, width: "auto" }} value={eventFilter} onChange={e => { setEventFilter(e.target.value); setPage(1); }}>
                  <option value="all">All Events</option>
                  {events.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                </select>
              )}
            </div>
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{loading ? "…" : `${totalCount} total`}</span>
        </CardHeader>

        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 24px", color: "var(--text-muted)", gap: 10 }}>
              <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading…
            </div>
          ) : error ? (
            <div style={{ padding: "24px", color: "#F87171", textAlign: "center" }}>{error}</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>ID</th>
                  <th>Role</th>
                  <th>Event</th>
                  <th>Pipeline</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.fullName}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.nationality} · {r.passportNumber}</div>
                    </td>
                    <td style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>{r.accreditationId || "—"}</td>
                    <td><RoleTag role={r.role} /></td>
                    <td style={{ fontSize: 12 }}>{r.eventName}</td>
                    <td>
                      <PipelineMini
                        currentStage={r.currentStage}
                        rejected={r.isRejected}
                        rejectedAt={r.isRejected ? r.currentStage : undefined}
                        hasMoi
                      />
                    </td>
                    <td><Badge variant={statusVariant(r)} /></td>
                    <td style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <Link href={`/admin/requests/${r.id}`} className="btn btn-primary btn-sm">Review</Link>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No requests found</td></tr>
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
