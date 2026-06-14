"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Filter, Loader, RefreshCw, Check, X, CheckSquare, Square, Ban } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { RoleTag } from "@/components/ui/RoleTag";
import { PipelineMini } from "@/components/ui/PipelineMini";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { ExportButton } from "@/components/ui/ExportButton";
import { useAuth, Permissions } from "@/contexts/AuthContext";
import { requestsApi, pipelineApi, type RequestDto } from "@/lib/api";

type Variant = "approved" | "pending" | "rejected" | "review";

const STAGE_NAMES = ["FA Owner", "Zone Owner", "Media Owner", "MOI"];

function statusVariant(r: RequestDto): Variant {
  if (r.status === "Approved") return "approved";
  if (r.status === "Rejected" || r.isRejected) return "rejected";
  if (r.isInfoRequested) return "review";
  return "pending";
}

function stageName(r: RequestDto): string {
  if (r.isRejected) return "Rejected";
  if (r.currentStage > 4) return "Approved";
  return STAGE_NAMES[r.currentStage - 1] ?? `Stage ${r.currentStage}`;
}

/** A request is "open" (actionable in the pipeline) when not yet approved/rejected. */
function isOpen(r: RequestDto): boolean {
  return !r.isRejected && r.status !== "Approved" && r.currentStage <= 4;
}

export default function AdminRequestsPage() {
  const { hasPermission } = useAuth();
  const canReview = hasPermission(Permissions.RequestsReview);

  const [rows,         setRows]         = useState<RequestDto[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter,  setEventFilter]  = useState("all");
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalCount,   setTotalCount]   = useState(0);

  // Bulk selection
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [bulkBusy,   setBulkBusy]   = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

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
      setSelected(new Set());
    } else {
      setError(res.message ?? "Failed to load requests.");
    }
  }, [page, search, statusFilter, eventFilter]);

  useEffect(() => { load(); }, [load]);

  const events = Array.from(new Set(rows.map(r => r.eventName))).filter(Boolean);
  const openRows = rows.filter(isOpen);
  const allOpenSelected = openRows.length > 0 && openRows.every(r => selected.has(r.id));

  function toggleRow(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allOpenSelected ? new Set() : new Set(openRows.map(r => r.id)));
  }

  // Export: pull the full filtered set (not just the current page).
  const fetchExport = useCallback(async () => {
    const params: Record<string, string | number> = { pageNumber: 1, pageSize: 1000 };
    if (search) params.searchTerm = search;
    if (statusFilter !== "all") params.status = statusFilter;
    if (eventFilter !== "all") params.eventName = eventFilter;
    const res = await requestsApi.list(params);
    const items = res.success && res.data ? res.data.items : [];
    return {
      headers: ["Accreditation ID", "First Name", "Last Name", "Nationality", "Passport", "Role", "Event", "Stage", "Status", "Email", "Phone", "Submitted"],
      rows: items.map(r => [
        r.accreditationId || "", r.firstName, r.lastName, r.nationality, r.passportNumber,
        r.role, r.eventName, stageName(r), r.status, r.email ?? "", r.phone ?? "",
        r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "",
      ]),
    };
  }, [search, statusFilter, eventFilter]);

  async function runBulk(decision: "Approved" | "Rejected", notes?: string) {
    const ids = openRows.filter(r => selected.has(r.id)).map(r => r.id);
    if (ids.length === 0) return;
    setBulkBusy(true);
    let ok = 0, fail = 0;
    for (const id of ids) {
      const res = await pipelineApi.review({ requestId: id, decision, notes });
      res.success ? ok++ : fail++;
    }
    setBulkBusy(false);
    setRejectOpen(false);
    setRejectReason("");
    toast[fail === 0 ? "success" : "warning"](
      `${decision === "Approved" ? "Approved" : "Rejected"} ${ok} request${ok !== 1 ? "s" : ""}${fail ? ` · ${fail} failed` : ""}.`
    );
    load();
  }

  const selectedOpenCount = openRows.filter(r => selected.has(r.id)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>All Accreditation Requests</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh"><RefreshCw size={14} /></button>
          <ExportButton filename="accreditation-requests" title="Accreditation Requests" fetchData={fetchExport} disabled={loading || totalCount === 0} />
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
              <Select
                options={[
                  { value: "all", label: "All Status" },
                  { value: "Submitted", label: "Submitted" },
                  { value: "UnderReview", label: "Under Review" },
                  { value: "InfoRequested", label: "Info Requested" },
                  { value: "Approved", label: "Approved" },
                  { value: "Rejected", label: "Rejected" },
                ]}
                value={statusFilter}
                onChange={v => { setStatusFilter(v); setPage(1); }}
                ariaLabel="Filter by status"
                width={170}
              />
              {events.length > 0 && (
                <Select
                  options={[
                    { value: "all", label: "All Events" },
                    ...events.map(ev => ({ value: ev, label: ev })),
                  ]}
                  value={eventFilter}
                  onChange={v => { setEventFilter(v); setPage(1); }}
                  ariaLabel="Filter by event"
                  width={200}
                  isSearchable
                />
              )}
            </div>
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{loading ? "…" : `${totalCount} total`}</span>
        </CardHeader>

        {/* Bulk action bar */}
        {canReview && selectedOpenCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "rgba(201,168,76,0.08)", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{selectedOpenCount} selected</span>
            <div style={{ flex: 1 }} />
            <button className="btn btn-success btn-sm" disabled={bulkBusy} onClick={() => runBulk("Approved")} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {bulkBusy ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={14} />} Approve stage
            </button>
            <button className="btn btn-danger btn-sm" disabled={bulkBusy} onClick={() => setRejectOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Ban size={14} /> Reject
            </button>
            <button className="btn btn-secondary btn-sm" disabled={bulkBusy} onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        )}

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
                  {canReview && (
                    <th style={{ width: 36 }}>
                      <button onClick={toggleAll} title="Select all open" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                        {allOpenSelected ? <CheckSquare size={16} color="var(--gold)" /> : <Square size={16} />}
                      </button>
                    </th>
                  )}
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
                {rows.map(r => {
                  const open = isOpen(r);
                  const checked = selected.has(r.id);
                  return (
                    <tr key={r.id} style={checked ? { background: "rgba(201,168,76,0.06)" } : undefined}>
                      {canReview && (
                        <td>
                          {open ? (
                            <button onClick={() => toggleRow(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                              {checked ? <CheckSquare size={16} color="var(--gold)" /> : <Square size={16} />}
                            </button>
                          ) : <span style={{ display: "inline-block", width: 16 }} />}
                        </td>
                      )}
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
                          showLabel
                          labelBelow
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
                  );
                })}
                {rows.length === 0 && (
                  <tr><td colSpan={canReview ? 9 : 8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No requests found</td></tr>
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

      {/* Bulk reject modal */}
      <Modal open={rejectOpen} onClose={() => { if (!bulkBusy) setRejectOpen(false); }} title={`Reject ${selectedOpenCount} request${selectedOpenCount !== 1 ? "s" : ""}`}>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
          This rejects all selected requests at their current stage. Provide a reason (optional):
        </p>
        <textarea className="form-control" style={{ minHeight: 80, resize: "vertical" }} placeholder="Rejection reason…" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
        <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={() => setRejectOpen(false)} disabled={bulkBusy}>Cancel</button>
          <button className="btn btn-danger" onClick={() => runBulk("Rejected", rejectReason.trim() || undefined)} disabled={bulkBusy} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {bulkBusy ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Ban size={14} />} Confirm Reject
          </button>
        </div>
      </Modal>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
