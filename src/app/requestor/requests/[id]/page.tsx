"use client";
import { useParams } from "next/navigation";
import { ChevronLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { RoleTag } from "@/components/ui/RoleTag";
import { ApprovalPipeline } from "@/components/shared/ApprovalPipeline";
import { REQUESTS, type PipelineState } from "@/data/requests";

function pipelineVariant(p: PipelineState): "approved" | "pending" | "rejected" | "review" {
  if (p.currentStage === 5 && !p.rejected) return "approved";
  if (p.rejected) return "rejected";
  if (p.infoRequested) return "review";
  return "pending";
}

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const req = REQUESTS.find(r => r.id === id);
  if (!req) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Request not found.</div>;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Link href="/requestor/requests" style={{ color: "var(--text-muted)", display: "flex" }}>
          <ChevronLeft size={20} />
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>{req.fullName}</h1>
        <Badge variant={pipelineVariant(req.pipeline)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <GlassCard>
            <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Personal Information</h2></CardHeader>
            <CardBody>
              <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", margin: 0 }}>
                {[
                  ["Full Name", req.fullName],
                  ["Nationality", req.nationality],
                  ["Passport No.", req.passportNo],
                  ["Date of Birth", req.dob],
                  ["Email", req.email],
                  ["Phone", req.phone],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{k}</dt>
                    <dd style={{ margin: 0, fontWeight: 500 }}>{v}</dd>
                  </div>
                ))}
                <div>
                  <dt style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Role</dt>
                  <dd style={{ margin: 0 }}><RoleTag role={req.role} /></dd>
                </div>
              </dl>
            </CardBody>
          </GlassCard>

          <GlassCard>
            <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Event & Access</h2></CardHeader>
            <CardBody>
              <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", margin: 0, marginBottom: req.zones?.length ? 14 : 0 }}>
                {[
                  ["Event", req.eventName],
                  ["Venue", req.venue ?? "—"],
                  ["Valid From", req.validFrom],
                  ["Valid Until", req.validTo],
                  ["Submitted", req.submittedDate],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{k}</dt>
                    <dd style={{ margin: 0, fontWeight: 500 }}>{v}</dd>
                  </div>
                ))}
              </dl>
              {req.zones && req.zones.length > 0 && (
                <div>
                  <dt style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Zone Access</dt>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {req.zones.map(z => (
                      <span key={z} style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)" }}>{z}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </GlassCard>

          {req.pipeline.infoRequested && req.pipeline.infoNote && (
            <GlassCard>
              <CardHeader>
                <h2 style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <MessageSquare size={15} color="#F59E0B" /> Information Requested
                </h2>
              </CardHeader>
              <CardBody>
                <p style={{ color: "var(--text-primary)", lineHeight: 1.6, margin: 0 }}>{req.pipeline.infoNote}</p>
                <button className="btn btn-primary" style={{ marginTop: 14 }}>Submit Response</button>
              </CardBody>
            </GlassCard>
          )}
        </div>

        <div>
          <GlassCard>
            <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Approval Pipeline</h2></CardHeader>
            <CardBody>
              <ApprovalPipeline state={req.pipeline} readOnly />
            </CardBody>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
