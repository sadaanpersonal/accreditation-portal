"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, MessageSquare, Loader } from "lucide-react";
import Link from "next/link";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { RoleTag } from "@/components/ui/RoleTag";
import { ApprovalPipeline, type PipelineState } from "@/components/shared/ApprovalPipeline";
import { requestsApi, pipelineApi, type RequestDto } from "@/lib/api";

function toPipelineState(req: RequestDto): PipelineState {
  return {
    currentStage: req.currentStage,
    rejected: req.isRejected,
    infoRequested: req.isInfoRequested,
    infoNote: req.infoRequestNote,
  };
}

function pipelineVariant(req: RequestDto): "approved" | "pending" | "rejected" | "review" {
  if (req.currentStage >= 5 && !req.isRejected) return "approved";
  if (req.isRejected) return "rejected";
  if (req.isInfoRequested) return "review";
  return "pending";
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso; }
}

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [req, setReq] = useState<RequestDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [responseNote, setResponseNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await requestsApi.get(id);
      if (res.success && res.data) {
        setReq(res.data);
      } else {
        setError(res.message ?? "Request not found.");
      }
    } catch {
      setError("Failed to load request.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleSubmitResponse() {
    if (!responseNote.trim() || !req) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await pipelineApi.respondInfo({ requestId: req.id, responseNote });
      if (res.success && res.data) {
        setReq(res.data);
        setResponseNote("");
        setSubmitSuccess(true);
      } else {
        setSubmitError(res.message ?? "Failed to submit response.");
      }
    } catch {
      setSubmitError("Failed to submit response.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, gap: 10, color: "var(--text-muted)" }}>
        <Loader size={20} className="spin" /> Loading request…
      </div>
    );
  }

  if (error || !req) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
        <p>{error ?? "Request not found."}</p>
        <Link href="/requestor/requests" style={{ color: "var(--gold)", fontSize: 13 }}>← Back to requests</Link>
      </div>
    );
  }

  const zones = req.zoneAccess ? req.zoneAccess.split(",").map(z => z.trim()).filter(Boolean) : [];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Link href="/requestor/requests" style={{ color: "var(--text-muted)", display: "flex" }}>
          <ChevronLeft size={20} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{req.fullName}</h1>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>#{req.accreditationId}</span>
        </div>
        <Badge variant={pipelineVariant(req)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Personal Information */}
          <GlassCard>
            <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Personal Information</h2></CardHeader>
            <CardBody>
              <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", margin: 0 }}>
                {[
                  ["Full Name",     req.fullName],
                  ["Nationality",   req.nationality],
                  ["Passport No.",  req.passportNumber],
                  ["Date of Birth", fmtDate(req.dateOfBirth)],
                  ["Email",         req.email],
                  ["Phone",         req.phone ?? "—"],
                  ["Organization",  req.organization ?? "—"],
                  ["Position",      req.position ?? "—"],
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

          {/* Event & Access */}
          <GlassCard>
            <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Event & Access</h2></CardHeader>
            <CardBody>
              <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", margin: 0, marginBottom: zones.length ? 14 : 0 }}>
                {[
                  ["Event",     req.eventName],
                  ["Venue",     req.assignedVenue ?? "—"],
                  ["Submitted", fmtDate(req.createdAt)],
                  ["Status",    req.status],
                  ...(req.pass ? [
                    ["Valid From",  fmtDate(req.pass.validFrom)],
                    ["Valid Until", fmtDate(req.pass.validTo)],
                  ] : []),
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{k}</dt>
                    <dd style={{ margin: 0, fontWeight: 500 }}>{v}</dd>
                  </div>
                ))}
              </dl>
              {zones.length > 0 && (
                <div>
                  <dt style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Zone Access</dt>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {zones.map(z => (
                      <span key={z} style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)" }}>{z}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </GlassCard>

          {/* Documents */}
          {req.documents.length > 0 && (
            <GlassCard>
              <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Documents</h2></CardHeader>
              <CardBody style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {req.documents.map(doc => (
                  <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "var(--surface-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{doc.fileName}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {doc.type} · {(doc.fileSizeBytes / 1024).toFixed(0)} KB
                    </span>
                  </div>
                ))}
              </CardBody>
            </GlassCard>
          )}

          {/* Information Requested */}
          {req.isInfoRequested && req.infoRequestNote && (
            <GlassCard>
              <CardHeader>
                <h2 style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <MessageSquare size={15} color="#F59E0B" /> Information Requested
                </h2>
              </CardHeader>
              <CardBody>
                <p style={{ color: "var(--text-primary)", lineHeight: 1.6, margin: 0, marginBottom: 14, padding: "10px 12px", background: "rgba(245,158,11,0.06)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  {req.infoRequestNote}
                </p>
                {submitSuccess ? (
                  <div style={{ padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", fontSize: 13, color: "#22C55E" }}>
                    ✓ Your response has been submitted.
                  </div>
                ) : (
                  <>
                    <textarea
                      className="form-control"
                      style={{ minHeight: 90, resize: "vertical", marginBottom: 10 }}
                      placeholder="Type your response here…"
                      value={responseNote}
                      onChange={e => setResponseNote(e.target.value)}
                    />
                    {submitError && <p style={{ color: "#EF4444", fontSize: 12, marginBottom: 8 }}>{submitError}</p>}
                    <button
                      className="btn btn-primary"
                      onClick={handleSubmitResponse}
                      disabled={submitting || !responseNote.trim()}
                    >
                      {submitting ? <Loader size={14} className="spin" /> : null}
                      {submitting ? " Submitting…" : "Submit Response"}
                    </button>
                  </>
                )}
              </CardBody>
            </GlassCard>
          )}

          {/* Rejection Reason */}
          {req.isRejected && req.rejectionReason && (
            <GlassCard>
              <CardHeader>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "#EF4444" }}>Rejection Reason</h2>
              </CardHeader>
              <CardBody>
                <p style={{ color: "var(--text-primary)", lineHeight: 1.6, margin: 0 }}>{req.rejectionReason}</p>
              </CardBody>
            </GlassCard>
          )}
        </div>

        {/* Sidebar: Pipeline */}
        <div>
          <GlassCard>
            <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Approval Pipeline</h2></CardHeader>
            <CardBody>
              <ApprovalPipeline state={toPipelineState(req)} readOnly />
            </CardBody>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
