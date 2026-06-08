"use client";
import { useState } from "react";
import { Search, Filter } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { RoleTag } from "@/components/ui/RoleTag";
import { PipelineMini } from "@/components/ui/PipelineMini";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { REQUESTS, ADMIN_EXTRA_REQUESTS, type PipelineState } from "@/data/requests";

const all = [...REQUESTS, ...ADMIN_EXTRA_REQUESTS];

function pipelineVariant(p: PipelineState): "approved" | "pending" | "rejected" | "review" {
  if (p.currentStage === 5 && !p.rejected) return "approved";
  if (p.rejected) return "rejected";
  if (p.infoRequested) return "review";
  return "pending";
}

export default function AdminRequestsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const events = Array.from(new Set(all.map(r => r.eventName)));

  const filtered = all.filter(r => {
    const matchSearch = !search || r.fullName.toLowerCase().includes(search.toLowerCase()) || r.eventName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || pipelineVariant(r.pipeline) === statusFilter;
    const matchEvent = eventFilter === "all" || r.eventName === eventFilter;
    return matchSearch && matchStatus && matchEvent;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>All Accreditation Requests</h1>

      <GlassCard>
        <CardHeader>
          <div style={{ display: "flex", gap: 10, flex: 1, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 200px" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input className="form-control" style={{ paddingLeft: 32, margin: 0 }} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Filter size={14} style={{ color: "var(--text-muted)" }} />
              <select className="form-control" style={{ margin: 0, width: "auto" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select className="form-control" style={{ margin: 0, width: "auto" }} value={eventFilter} onChange={e => setEventFilter(e.target.value)}>
                <option value="all">All Events</option>
                {events.map(ev => <option key={ev} value={ev}>{ev}</option>)}
              </select>
            </div>
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
                <th>Venue</th>
                <th>Pipeline</th>
                <th>Status</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{r.fullName}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.nationality} · {r.passportNo}</div>
                  </td>
                  <td><RoleTag role={r.role} /></td>
                  <td style={{ fontSize: 12 }}>{r.eventName}</td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.venue ?? "—"}</td>
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
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No requests found</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </GlassCard>
    </div>
  );
}
