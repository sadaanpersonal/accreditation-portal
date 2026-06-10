"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, Loader, FileText, Copy, Eye } from "lucide-react";
import Link from "next/link";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { RoleTag } from "@/components/ui/RoleTag";
import { ApprovalPipeline, type PipelineState } from "@/components/shared/ApprovalPipeline";
import { Modal } from "@/components/ui/Modal";
import { DocumentViewerModal } from "@/components/shared/DocumentViewerModal";
import { requestsApi, pipelineApi, resolveFileUrl, type RequestDto } from "@/lib/api";

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

const STAGE_NAMES: Record<number, string> = {
  1: "FA Owner", 2: "Zone Owner", 3: "Media Owner", 4: "MOI Clearance",
};

const CLONE_KEY = "qoc_clone_request";

/** Convert an ISO datetime string to yyyy-MM-dd for the date picker. */
function toDateInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AdminRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [req, setReq] = useState<RequestDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [infoModal, setInfoModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [infoNote, setInfoNote] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [zoneInput, setZoneInput] = useState("");
  const [venueInput, setVenueInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [viewDoc, setViewDoc] = useState<{ url: string; fileName: string } | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await requestsApi.get(id);
      if (res.success && res.data) {
        setReq(res.data);
        setZoneInput(res.data.zoneAccess ?? "");
        setVenueInput(res.data.assignedVenue ?? "");
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

  function handleCloneRequest() {
    if (!req) return;
    const clone = {
      firstName:      req.firstName,
      lastName:       req.lastName,
      nationality:    req.nationality,
      passportNumber: req.passportNumber,
      dateOfBirth:    toDateInput(req.dateOfBirth),
      role:           req.role,
      email:          req.email,
      phone:          req.phone,
      organization:   req.organization,
      position:       req.position,
      sourceEventId:   req.eventId,
      sourceEventName: req.eventName,
    };
    sessionStorage.setItem(CLONE_KEY, JSON.stringify(clone));
    router.push("/admin/requests/new?clone=1");
  }

  async function doReview(decision: string, notes?: string, extra?: { zoneAccess?: string; assignedVenue?: string }) {
    if (!req || actionLoading) return;   // guard: prevent double-submission
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await pipelineApi.review({ requestId: req.id, decision, notes, ...extra });
      if (res.success && res.data) {
        setReq(res.data);
        setInfoModal(false);
        setRejectModal(false);
        setInfoNote("");
        setRejectNote("");
      } else {
        setActionError(res.message ?? "Action failed.");
      }
    } catch {
      setActionError("Action failed.");
    } finally {
      setActionLoading(false);
    }
  }

  function handleApprove() {
    const extra = req?.currentStage === 2
      ? { zoneAccess: zoneInput || undefined, assignedVenue: venueInput || undefined }
      : undefined;
    doReview("Approved", undefined, extra);
  }

  function handleReject()      { doReview("Rejected", rejectNote || undefined); }
  function handleRequestInfo() { if (infoNote.trim()) doReview("RequestedInfo", infoNote); }

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
        <Link href="/admin/requests" style={{ color: "var(--gold)", fontSize: 13 }}>← Back to requests</Link>
      </div>
    );
  }

  const isComplete   = req.currentStage >= 5 && !req.isRejected;
  const isTerminated = req.isRejected || isComplete;
  const zones = req.zoneAccess ? req.zoneAccess.split(",").map(z => z.trim()).filter(Boolean) : [];

  const zoneContent = req.currentStage === 2 && !isTerminated && !req.isInfoRequested ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        className="form-control form-control-sm"
        placeholder="Zone access (e.g. Zone A, Zone B)"
        value={zoneInput}
        onChange={e => setZoneInput(e.target.value)}
      />
      <input
        className="form-control form-control-sm"
        placeholder="Assigned venue"
        value={venueInput}
        onChange={e => setVenueInput(e.target.value)}
      />
    </div>
  ) : null;

  return (
    <div style={{ maxWidth: 940, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Link href="/admin/requests" style={{ color: "var(--text-muted)", display: "flex" }}>
          <ChevronLeft size={20} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{req.fullName}</h1>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>#{req.accreditationId} · {req.eventName}</span>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleCloneRequest}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
          title="Create a new request for this person at a different event"
        >
          <Copy size={14} /> New Request
        </button>
        <Badge variant={pipelineVariant(req)} />
      </div>

      {actionError && (
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444", fontSize: 13, marginBottom: 16 }}>
          {actionError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Personal & Event Info */}
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
                  ["Event",         req.eventName],
                  ["Venue",         req.assignedVenue ?? "—"],
                  ["Submitted",     fmtDate(req.createdAt)],
                  ["Status",        req.status],
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

          {/* Zone Access */}
          {zones.length > 0 && (
            <GlassCard>
              <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Zone Access</h2></CardHeader>
              <CardBody>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {zones.map(z => (
                    <span key={z} style={{ padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 500, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)" }}>{z}</span>
                  ))}
                </div>
              </CardBody>
            </GlassCard>
          )}

          {/* Documents */}
          {req.documents.length > 0 && (
            <GlassCard>
              <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Documents</h2></CardHeader>
              <CardBody style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {req.documents.map(doc => (
                  <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 10px", background: "var(--surface-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <FileText size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.fileName}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {doc.type} · {(doc.fileSizeBytes / 1024).toFixed(0)} KB
                      </span>
                      {doc.blobUrl && (
                        <button
                          type="button"
                          onClick={() => setViewDoc({ url: resolveFileUrl(doc.blobUrl), fileName: doc.fileName })}
                          title="View document"
                          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--gold)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        >
                          <Eye size={14} /> View
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </CardBody>
            </GlassCard>
          )}

          {/* Review History */}
          {req.reviews.length > 0 && (
            <GlassCard>
              <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Review History</h2></CardHeader>
              <CardBody style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {req.reviews.map(rv => (
                  <div key={rv.id} style={{ padding: "10px 12px", background: "var(--surface-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>
                        Stage {rv.stage} — {STAGE_NAMES[rv.stage] ?? `Stage ${rv.stage}`}
                      </span>
                      <span style={{ fontSize: 11, color: rv.decision === "Approved" ? "#22C55E" : rv.decision === "Rejected" ? "#EF4444" : "#F59E0B", fontWeight: 600 }}>
                        {rv.decision}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      By {rv.reviewerName} · {fmtDate(rv.reviewedAt)}
                    </div>
                    {rv.notes && (
                      <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-primary)", lineHeight: 1.5 }}>{rv.notes}</p>
                    )}
                  </div>
                ))}
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
        <GlassCard style={{ alignSelf: "flex-start" }}>
          <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Approval Pipeline</h2></CardHeader>
          <CardBody>
            <ApprovalPipeline
              state={toPipelineState(req)}
              onApprove={!isTerminated && !req.isInfoRequested && !actionLoading ? handleApprove : undefined}
              onReject={!isTerminated && !actionLoading ? () => setRejectModal(true) : undefined}
              onRequestInfo={!isTerminated && !req.isInfoRequested && !actionLoading ? () => setInfoModal(true) : undefined}
              processing={actionLoading}
              zoneContent={zoneContent}
            />
            {actionLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, justifyContent: "center", color: "var(--text-muted)", fontSize: 12 }}>
                <Loader size={14} className="spin" /> Processing…
              </div>
            )}
            {isComplete && (
              <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: "var(--radius-sm)", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", fontSize: 12, color: "#22C55E", textAlign: "center" }}>
                ✓ Accreditation fully approved
              </div>
            )}
          </CardBody>
        </GlassCard>
      </div>

      {/* Request Info Modal */}
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
          <button className="btn btn-warning" onClick={handleRequestInfo} disabled={!infoNote.trim() || actionLoading}>
            {actionLoading ? <Loader size={13} className="spin" /> : null} Send Request
          </button>
        </div>
        {actionError && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 8 }}>{actionError}</p>}
      </Modal>

      {/* Reject Modal */}
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
          <button className="btn btn-danger" onClick={handleReject} disabled={actionLoading}>
            {actionLoading ? <Loader size={13} className="spin" /> : null} Confirm Reject
          </button>
        </div>
        {actionError && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 8 }}>{actionError}</p>}
      </Modal>

      {/* Document Viewer */}
      <DocumentViewerModal
        open={!!viewDoc}
        onClose={() => setViewDoc(null)}
        src={viewDoc?.url ?? ""}
        fileName={viewDoc?.fileName}
      />
    </div>
  );
}
