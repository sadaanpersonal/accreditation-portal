"use client";
import { FileText, Clock, CheckCircle, XCircle, Users, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { RoleTag } from "@/components/ui/RoleTag";
import { PipelineMini } from "@/components/ui/PipelineMini";
import { REQUESTS, ADMIN_EXTRA_REQUESTS, type PipelineState } from "@/data/requests";

const all = [...REQUESTS, ...ADMIN_EXTRA_REQUESTS];

function pipelineVariant(p: PipelineState): "approved" | "pending" | "rejected" | "review" {
  if (p.currentStage === 5 && !p.rejected) return "approved";
  if (p.rejected) return "rejected";
  if (p.infoRequested) return "review";
  return "pending";
}

const stats = [
  { label: "Total Requests", value: all.length, icon: FileText, color: "var(--gold)" },
  { label: "Pending Review", value: all.filter(r => r.pipeline.currentStage <= 4 && !r.pipeline.rejected && !r.pipeline.infoRequested).length, icon: Clock, color: "#F59E0B" },
  { label: "Approved", value: all.filter(r => r.pipeline.currentStage === 5 && !r.pipeline.rejected).length, icon: CheckCircle, color: "#22C55E" },
  { label: "Rejected", value: all.filter(r => r.pipeline.rejected).length, icon: XCircle, color: "#F87171" },
  { label: "Requestors", value: 4, icon: Users, color: "#818CF8" },
];

const pending = all.filter(r => !r.pipeline.rejected && r.pipeline.currentStage <= 4);

export default function AdminDashboard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        <GlassCard>
          <CardHeader>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>Pending Review ({pending.length})</h2>
            <Link href="/admin/requests" style={{ fontSize: 12, color: "var(--gold)", display: "flex", alignItems: "center", gap: 4 }}>
              All requests <ArrowRight size={13} />
            </Link>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
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
                {pending.slice(0, 6).map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.fullName}</div>
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
                    <td>
                      <Link href={`/admin/requests/${r.id}`} className="btn btn-primary btn-sm">Review</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </GlassCard>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <GlassCard>
            <CardHeader><h2 style={{ fontSize: 15, fontWeight: 700 }}>Needs Action</h2></CardHeader>
            <CardBody style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {all.filter(r => r.pipeline.infoRequested).slice(0, 3).map(r => (
                <Link key={r.id} href={`/admin/requests/${r.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertCircle size={14} color="#F59E0B" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{r.fullName}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Awaiting requestor response</div>
                    </div>
                  </div>
                </Link>
              ))}
              {all.filter(r => r.pipeline.infoRequested).length === 0 && (
                <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "8px 0" }}>No items need action</p>
              )}
            </CardBody>
          </GlassCard>

          <GlassCard>
            <CardHeader><h2 style={{ fontSize: 15, fontWeight: 700 }}>By Event</h2></CardHeader>
            <CardBody style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Array.from(new Set(all.map(r => r.eventName))).map(ev => {
                const count = all.filter(r => r.eventName === ev).length;
                return (
                  <div key={ev} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "var(--text-primary)" }}>{ev}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>{count}</span>
                  </div>
                );
              })}
            </CardBody>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
