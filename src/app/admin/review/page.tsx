"use client";
import { useState } from "react";
import { Search, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { RoleTag } from "@/components/ui/RoleTag";
import { PipelineMini } from "@/components/ui/PipelineMini";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { REQUESTS, ADMIN_EXTRA_REQUESTS, type PipelineState } from "@/data/requests";

const all = [...REQUESTS, ...ADMIN_EXTRA_REQUESTS];

// Review queue = active requests awaiting admin action (not approved, not rejected)
const reviewQueue = all.filter(r =>
  !r.pipeline.rejected && r.pipeline.currentStage < 5
);

function pipelineVariant(p: PipelineState): "approved" | "pending" | "rejected" | "review" {
  if (p.currentStage === 5 && !p.rejected) return "approved";
  if (p.rejected) return "rejected";
  if (p.infoRequested) return "review";
  return "pending";
}

const STAGE_LABELS = ["", "FA Owner", "Zone Owner", "Media Owner", "MOI Clearance"];

export default function AdminReviewQueuePage() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  const filtered = reviewQueue.filter(r => {
    const matchSearch = !search || r.fullName.toLowerCase().includes(search.toLowerCase()) || r.eventName.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || r.pipeline.currentStage === Number(stageFilter);
    return matchSearch && matchStage;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Review Queue</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0" }}>
            Requests awaiting your action
          </p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)",
          borderRadius: 20, padding: "4px 12px",
        }}>
          <ClipboardCheck size={13} style={{ color: "var(--gold)" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>{reviewQueue.length} pending</span>
        </div>
      </div>

      {/* Stage breakdown chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[1, 2, 3, 4].map(stage => {
          const count = reviewQueue.filter(r => r.pipeline.currentStage === stage).length;
          if (count === 0) return null;
          const colors = ["", "#60A5FA", "#A78BFA", "#F472B6", "#C9A84C"];
          return (
            <div key={stage} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 20,
              background: `${colors[stage]}12`, border: `1px solid ${colors[stage]}30`,
              fontSize: 12, color: colors[stage], fontWeight: 600,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: colors[stage] }} />
              Stage {stage} · {STAGE_LABELS[stage]} · {count}
            </div>
          );
        })}
      </div>

      <GlassCard>
        <CardHeader>
          <div style={{ display: "flex", gap: 10, flex: 1, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 200px" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                className="form-control"
                style={{ paddingLeft: 32, margin: 0 }}
                placeholder="Search applicant or event…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="form-control" style={{ margin: 0, width: "auto" }} value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
              <option value="all">All Stages</option>
              <option value="1">Stage 1 — FA Owner</option>
              <option value="2">Stage 2 — Zone Owner</option>
              <option value="3">Stage 3 — Media Owner</option>
              <option value="4">Stage 4 — MOI</option>
            </select>
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{filtered.length} results</span>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Role</th>
                <th>Event</th>
                <th>Current Stage</th>
                <th>Pipeline</th>
                <th>Status</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const stageColors = ["", "#60A5FA", "#A78BFA", "#F472B6", "#C9A84C"];
                const sc = stageColors[r.pipeline.currentStage] ?? "#C9A84C";
                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.fullName}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.nationality} · {r.passportNo}</div>
                    </td>
                    <td><RoleTag role={r.role} /></td>
                    <td style={{ fontSize: 12 }}>{r.eventName}</td>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12,
                        background: `${sc}12`, border: `1px solid ${sc}30`, color: sc,
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: sc }} />
                        {STAGE_LABELS[r.pipeline.currentStage]}
                      </span>
                    </td>
                    <td>
                      <PipelineMini
                        currentStage={r.pipeline.currentStage}
                        rejected={r.pipeline.rejected}
                        rejectedAt={r.pipeline.rejected ? r.pipeline.currentStage : undefined}
                        hasMoi
                      />
                    </td>
                    <td><Badge variant={pipelineVariant(r.pipeline)} /></td>
                    <td style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.submittedDate}</td>
                    <td>
                      <Link href={`/admin/requests/${r.id}`} className="btn btn-primary btn-sm">Review</Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Queue is clear</div>
                    <div style={{ fontSize: 12 }}>No requests awaiting review</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </GlassCard>
    </div>
  );
}
