"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { RoleTag } from "@/components/ui/RoleTag";
import { ApprovalPipeline } from "@/components/shared/ApprovalPipeline";
import { Modal } from "@/components/ui/Modal";
import { REQUESTS, ADMIN_EXTRA_REQUESTS, type PipelineState, type PipelineStage } from "@/data/requests";

const all = [...REQUESTS, ...ADMIN_EXTRA_REQUESTS];

function pipelineVariant(p: PipelineState): "approved" | "pending" | "rejected" | "review" {
  if (p.currentStage === 5 && !p.rejected) return "approved";
  if (p.rejected) return "rejected";
  if (p.infoRequested) return "review";
  return "pending";
}

export default function AdminRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const found = all.find(r => r.id === id);
  const [pipeline, setPipeline] = useState<PipelineState>(found?.pipeline ?? { currentStage: 1, rejected: false, infoRequested: false });
  const [infoModal, setInfoModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [infoNote, setInfoNote] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  if (!found) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Request not found.</div>;

  function handleApprove() {
    setPipeline(prev => {
      const next = Math.min(prev.currentStage + 1, 5) as PipelineStage;
      return { ...prev, currentStage: next, rejected: false, infoRequested: false, infoNote: undefined };
    });
  }

  function handleReject() {
    setPipeline(prev => ({ ...prev, rejected: true }));
    setRejectModal(false);
  }

  function handleRequestInfo() {
    setPipeline(prev => ({ ...prev, infoRequested: true, infoNote }));
    setInfoModal(false);
  }

  const isComplete = pipeline.currentStage === 5 && !pipeline.rejected;

  return (
    <div style={{ maxWidth: 940, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Link href="/admin/requests" style={{ color: "var(--text-muted)", display: "flex" }}>
          <ChevronLeft size={20} />
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700, flex: 1 }}>{found.fullName}</h1>
        <Badge variant={pipelineVariant(pipeline)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <GlassCard>
            <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Personal Information</h2></CardHeader>
            <CardBody>
              <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", margin: 0 }}>
                {[
                  ["Full Name", found.fullName],
                  ["Nationality", found.nationality],
                  ["Passport No.", found.passportNo],
                  ["Date of Birth", found.dob],
                  ["Email", found.email],
                  ["Phone", found.phone],
                  ["Event", found.eventName],
                  ["Venue", found.venue ?? "—"],
                  ["Valid", `${found.validFrom} – ${found.validTo}`],
                  ["Submitted", found.submittedDate],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{k}</dt>
                    <dd style={{ margin: 0, fontWeight: 500 }}>{v}</dd>
                  </div>
                ))}
                <div>
                  <dt style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Role</dt>
                  <dd style={{ margin: 0 }}><RoleTag role={found.role} /></dd>
                </div>
              </dl>
            </CardBody>
          </GlassCard>

          {found.zones && found.zones.length > 0 && (
            <GlassCard>
              <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Zone Access</h2></CardHeader>
              <CardBody>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {found.zones.map(z => (
                    <span key={z} style={{ padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 500, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)" }}>{z}</span>
                  ))}
                </div>
              </CardBody>
            </GlassCard>
          )}

          {found.documents.length > 0 && (
            <GlassCard>
              <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Documents</h2></CardHeader>
              <CardBody style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {found.documents.map(doc => (
                  <div key={doc.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "var(--surface-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{doc.name}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{doc.size}</span>
                  </div>
                ))}
              </CardBody>
            </GlassCard>
          )}
        </div>

        <GlassCard style={{ alignSelf: "flex-start" }}>
          <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Approval Pipeline</h2></CardHeader>
          <CardBody>
            <ApprovalPipeline
              state={pipeline}
              onApprove={!isComplete && !pipeline.rejected && !pipeline.infoRequested ? handleApprove : undefined}
              onReject={!isComplete && !pipeline.rejected ? () => setRejectModal(true) : undefined}
              onRequestInfo={!isComplete && !pipeline.rejected && !pipeline.infoRequested ? () => setInfoModal(true) : undefined}
            />
            {isComplete && (
              <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", fontSize: 12, color: "#22C55E", textAlign: "center" }}>
                ✓ Accreditation fully approved
              </div>
            )}
          </CardBody>
        </GlassCard>
      </div>

      <Modal open={infoModal} onClose={() => setInfoModal(false)} title="Request Additional Information">
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
          Describe what information you need from the requestor:
        </p>
        <textarea
          className="form-control"
          style={{ minHeight: 100, resize: "vertical" }}
          placeholder="e.g. Please provide an updated passport copy…"
          value={infoNote}
          onChange={e => setInfoNote(e.target.value)}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={() => setInfoModal(false)}>Cancel</button>
          <button className="btn btn-warning" onClick={handleRequestInfo} disabled={!infoNote.trim()}>Send Request</button>
        </div>
      </Modal>

      <Modal open={rejectModal} onClose={() => setRejectModal(false)} title="Reject Request">
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
          Provide a reason for rejection (optional):
        </p>
        <textarea
          className="form-control"
          style={{ minHeight: 80, resize: "vertical" }}
          placeholder="Rejection reason…"
          value={rejectNote}
          onChange={e => setRejectNote(e.target.value)}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={() => setRejectModal(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleReject}>Confirm Reject</button>
        </div>
      </Modal>
    </div>
  );
}
