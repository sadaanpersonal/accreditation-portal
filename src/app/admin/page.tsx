"use client";
import { useEffect, useState, useCallback } from "react";
import { FileText, Clock, CheckCircle, XCircle, Users, AlertCircle, ArrowRight, Loader, RefreshCw } from "lucide-react";
import Link from "next/link";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { RoleTag } from "@/components/ui/RoleTag";
import { PipelineMini } from "@/components/ui/PipelineMini";
import { requestsApi, type RequestDto } from "@/lib/api";

function statusVariant(r: RequestDto): "approved" | "pending" | "rejected" | "review" {
  if (r.status === "Approved") return "approved";
  if (r.isRejected || r.status === "Rejected") return "rejected";
  if (r.isInfoRequested || r.status === "InfoRequested") return "review";
  return "pending";
}

interface DashStats {
  total:       number;
  pending:     number;
  approved:    number;
  rejected:    number;
  infoItems:   RequestDto[];
}

export default function AdminDashboard() {
  const [recent,   setRecent]   = useState<RequestDto[]>([]);
  const [stats,    setStats]    = useState<DashStats | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const [recentRes, submittedRes, underReviewRes, approvedRes, rejectedRes, infoRes] = await Promise.all([
      requestsApi.list({ pageSize: 6,  pageNumber: 1 }),
      requestsApi.list({ pageSize: 1,  status: "Submitted" }),
      requestsApi.list({ pageSize: 1,  status: "UnderReview" }),
      requestsApi.list({ pageSize: 1,  status: "Approved" }),
      requestsApi.list({ pageSize: 1,  status: "Rejected" }),
      requestsApi.list({ pageSize: 3,  status: "InfoRequested" }),
    ]);

    setLoading(false);

    if (!recentRes.success) { setError(recentRes.message ?? "Failed to load."); return; }

    setRecent(recentRes.data?.items ?? []);
    setStats({
      total:     recentRes.data?.totalCount ?? 0,
      pending:   (submittedRes.data?.totalCount ?? 0) + (underReviewRes.data?.totalCount ?? 0),
      approved:  approvedRes.data?.totalCount ?? 0,
      rejected:  rejectedRes.data?.totalCount ?? 0,
      infoItems: infoRes.data?.items ?? [],
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  // Build "By Event" summary from loaded items
  const eventCounts = recent.reduce<Record<string, number>>((acc, r) => {
    acc[r.eventName] = (acc[r.eventName] ?? 0) + 1;
    return acc;
  }, {});

  const statCards = stats ? [
    { label: "Total Requests", value: stats.total,    icon: FileText,     color: "var(--gold)" },
    { label: "Pending Review", value: stats.pending,  icon: Clock,        color: "#F59E0B" },
    { label: "Approved",       value: stats.approved, icon: CheckCircle,  color: "#22C55E" },
    { label: "Rejected",       value: stats.rejected, icon: XCircle,      color: "#F87171" },
    { label: "Requestors",     value: "—",            icon: Users,        color: "#818CF8" },
  ] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div />
        <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh" disabled={loading}>
          <RefreshCw size={13} style={loading ? { animation: "spin 1s linear infinite" } : undefined} />
        </button>
      </div>

      {/* Stat chips */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
        {loading && !stats ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-card" style={{ padding: "16px 18px", opacity: 0.4 }}>
              <div style={{ height: 12, background: "var(--surface-3)", borderRadius: 4, marginBottom: 10 }} />
              <div style={{ height: 28, background: "var(--surface-3)", borderRadius: 4, width: "60%" }} />
            </div>
          ))
        ) : (
          statCards.map(s => (
            <div key={s.label} className="glass-card" style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</span>
                <div style={{ padding: 6, borderRadius: "var(--radius-sm)", background: `${s.color}18` }}>
                  <s.icon size={16} style={{ color: s.color }} />
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            </div>
          ))
        )}
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "var(--radius)", color: "#F87171", fontSize: 13 }}>
          {error} <button className="btn btn-secondary btn-sm" onClick={load} style={{ marginLeft: 8 }}>Retry</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        {/* Recent requests table */}
        <GlassCard>
          <CardHeader>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>
              Recent Requests {stats ? `(${stats.total})` : ""}
            </h2>
            <Link href="/admin/requests" style={{ fontSize: 12, color: "var(--gold)", display: "flex", alignItems: "center", gap: 4 }}>
              All requests <ArrowRight size={13} />
            </Link>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px 24px", color: "var(--text-muted)", gap: 10 }}>
                <Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Loading…
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Role</th>
                    <th>Event</th>
                    <th>Pipeline</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{r.fullName}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.nationality}</div>
                      </td>
                      <td><RoleTag role={r.role} /></td>
                      <td style={{ fontSize: 12 }}>{r.eventName}</td>
                      <td>
                        <PipelineMini
                          currentStage={r.currentStage}
                          rejected={r.isRejected}
                          rejectedAt={r.isRejected ? r.currentStage : undefined}
                          hasMoi
                          showLabel
                        />
                      </td>
                      <td><Badge variant={statusVariant(r)} /></td>
                      <td>
                        <Link href={`/admin/requests/${r.id}`} className="btn btn-primary btn-sm">Review</Link>
                      </td>
                    </tr>
                  ))}
                  {recent.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                        No requests yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </CardBody>
        </GlassCard>

        {/* Side panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <GlassCard>
            <CardHeader><h2 style={{ fontSize: 15, fontWeight: 700 }}>Needs Action</h2></CardHeader>
            <CardBody style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {loading ? (
                <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "8px 0" }}>Loading…</div>
              ) : stats && stats.infoItems.length > 0 ? (
                stats.infoItems.map(r => (
                  <Link key={r.id} href={`/admin/requests/${r.id}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      padding: "10px 12px", borderRadius: "var(--radius-sm)",
                      background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <AlertCircle size={14} color="#F59E0B" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{r.fullName}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Awaiting requestor response</div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "8px 0" }}>
                  No items need action
                </p>
              )}
            </CardBody>
          </GlassCard>

          <GlassCard>
            <CardHeader><h2 style={{ fontSize: 15, fontWeight: 700 }}>By Event</h2></CardHeader>
            <CardBody style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {loading ? (
                <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>Loading…</div>
              ) : Object.keys(eventCounts).length > 0 ? (
                Object.entries(eventCounts).map(([ev, count]) => (
                  <div key={ev} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "var(--text-primary)" }}>{ev}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>{count}</span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>No data</p>
              )}
            </CardBody>
          </GlassCard>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
