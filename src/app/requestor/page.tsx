"use client";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { RoleTag } from "@/components/ui/RoleTag";
import { PipelineMini } from "@/components/ui/PipelineMini";
import { REQUESTS, type PipelineState } from "@/data/requests";

function pipelineVariant(p: PipelineState): "approved" | "pending" | "rejected" | "review" {
  if (p.currentStage === 5 && !p.rejected) return "approved";
  if (p.rejected) return "rejected";
  if (p.infoRequested) return "review";
  return "pending";
}

const stats = [
  { label: "Total Requests", value: 12, icon: FileText, color: "var(--gold)" },
  { label: "Pending", value: 5, icon: Clock, color: "#F59E0B" },
  { label: "Approved", value: 6, icon: CheckCircle, color: "#22C55E" },
  { label: "Rejected", value: 1, icon: XCircle, color: "#F87171" },
];

const recent = REQUESTS.slice(0, 4);

export default function RequestorDashboard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        {stats.map(s => (
          <div key={s.label} className="glass-card" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</span>
              <div style={{ padding: 6, borderRadius: "var(--radius-sm)", background: `${s.color}18` }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
        <GlassCard>
          <CardHeader>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>Recent Requests</h2>
            <Link href="/requestor/requests" style={{ fontSize: 12, color: "var(--gold)", display: "flex", alignItems: "center", gap: 4 }}>
              View all <ArrowRight size={13} />
            </Link>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Event</th>
                  <th>Pipeline</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(r => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/requestor/requests/${r.id}`} style={{ fontWeight: 500, color: "var(--text-primary)", textDecoration: "none" }}>
                        {r.fullName}
                      </Link>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.nationality}</div>
                    </td>
                    <td><RoleTag role={r.role} /></td>
                    <td style={{ fontSize: 12 }}>{r.eventName}</td>
                    <td>
                      <PipelineMini
                        currentStage={r.pipeline.currentStage}
                        rejected={r.pipeline.rejected}
                        rejectedAt={r.pipeline.rejected ? r.pipeline.currentStage : undefined}
                        hasMoi
                      />
                    </td>
                    <td><Badge variant={pipelineVariant(r.pipeline)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </GlassCard>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <GlassCard>
            <CardHeader><h2 style={{ fontSize: 15, fontWeight: 700 }}>Quick Actions</h2></CardHeader>
            <CardBody style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/requestor/requests/new" className="btn btn-primary" style={{ textAlign: "center" }}>
                + New Request
              </Link>
              <Link href="/requestor/bulk-upload" className="btn btn-secondary" style={{ textAlign: "center" }}>
                Bulk Upload CSV
              </Link>
              <Link href="/requestor/events" className="btn btn-secondary" style={{ textAlign: "center" }}>
                Browse Events
              </Link>
            </CardBody>
          </GlassCard>

          <GlassCard>
            <CardHeader><h2 style={{ fontSize: 15, fontWeight: 700 }}>Needs Attention</h2></CardHeader>
            <CardBody style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {REQUESTS.filter(r => r.pipeline.infoRequested).map(r => (
                <Link key={r.id} href={`/requestor/requests/${r.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertCircle size={14} color="#F59E0B" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{r.fullName}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Info requested</div>
                    </div>
                  </div>
                </Link>
              ))}
              {REQUESTS.filter(r => r.pipeline.infoRequested).length === 0 && (
                <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "8px 0" }}>No items need attention</p>
              )}
            </CardBody>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
