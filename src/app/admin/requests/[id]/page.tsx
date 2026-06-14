"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, Loader, FileText, Copy, Eye, MapPin, MessageSquare, Pencil, Ban, Printer } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { RoleTag } from "@/components/ui/RoleTag";
import { ApprovalPipeline, type PipelineState } from "@/components/shared/ApprovalPipeline";
import { Modal } from "@/components/ui/Modal";
import { DocumentViewerModal } from "@/components/shared/DocumentViewerModal";
import { EditApplicationModal } from "@/components/shared/EditApplicationModal";
import { VenueMap, VenueSelect } from "@/components/shared/VenueMap";
import { PassCard } from "@/components/shared/PassCard";
import { requestsApi, pipelineApi, venuesApi, passesApi, passVerifyUrl, resolveFileUrl, type RequestDto, type VenueDto, type PassDto } from "@/lib/api";
import { useAuth, Permissions } from "@/contexts/AuthContext";

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
  const { hasPermission } = useAuth();
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
  const [editOpen, setEditOpen] = useState(false);

  // Cancel (revoke) a granted pass
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Zone-owner stage: pick a venue + zones from the managed venue library
  const [venues, setVenues] = useState<VenueDto[]>([]);
  const [zoneVenueId, setZoneVenueId] = useState("");
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [zoneModalOpen, setZoneModalOpen] = useState(false);

  const zoneVenue = venues.find(v => v.id === zoneVenueId) ?? null;
  const selectedZoneLabels = zoneVenue
    ? zoneVenue.zones.filter((z, i) => selectedZoneIds.includes(z.id ?? `zone-${i}`)).map(z => z.label)
    : [];

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

  useEffect(() => {
    venuesApi.list().then(res => {
      if (res.success && res.data) setVenues(res.data);
    });
  }, []);

  // Once approved, a pass is granted. Fetch the full pass (the summary embedded
  // in the request lacks the QR payload) so the admin sees the real scannable
  // pass. Falls back to request data if the full fetch isn't available.
  const [pass, setPass] = useState<PassDto | null>(null);

  useEffect(() => {
    const passId = req?.pass?.id;
    if (!passId) { setPass(null); return; }
    passesApi.get(passId).then(res => { if (res.success && res.data) setPass(res.data); });
  }, [req?.pass?.id]);

  // Once the request and venue library are both loaded, pre-select the venue
  // (matched by stored name) and the zones whose labels were requested.
  useEffect(() => {
    if (!req || venues.length === 0) return;
    const venueName = (req.assignedVenue ?? "").trim().toLowerCase();
    const matched = venueName ? venues.find(v => v.name.trim().toLowerCase() === venueName) : null;
    if (!matched) return;
    setZoneVenueId(matched.id);
    const requested = (req.zoneAccess ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    const ids = matched.zones
      .filter(z => requested.includes(z.label.trim().toLowerCase()))
      .map((z, i) => z.id ?? `zone-${i}`);
    setSelectedZoneIds(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req, venues]);

  function toggleZone(zid: string) {
    setSelectedZoneIds(prev => prev.includes(zid) ? prev.filter(z => z !== zid) : [...prev, zid]);
  }

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
      ? {
          // Prefer the visual venue/zone picker; fall back to the free-text fields
          // when the stored venue isn't in the managed library.
          zoneAccess:    zoneVenue ? (selectedZoneLabels.join(", ") || undefined) : (zoneInput || undefined),
          assignedVenue: zoneVenue ? zoneVenue.name : (venueInput || undefined),
        }
      : undefined;
    doReview("Approved", undefined, extra);
  }

  function handleReject()      { doReview("Rejected", rejectNote || undefined); }
  function handleRequestInfo() { if (infoNote.trim()) doReview("RequestedInfo", infoNote); }

  async function handleCancelPass() {
    const passId = pass?.id ?? req?.pass?.id;
    if (!passId || cancelLoading) return;
    setCancelLoading(true);
    setCancelError(null);
    try {
      const reason = cancelReason.trim() || "Cancelled by administrator";
      const res = await passesApi.revoke(passId, reason);
      if (res.success) {
        // Reflect the revoked state locally, then reload the request summary.
        setPass(prev => prev ? { ...prev, isRevoked: true, revokedReason: reason } : prev);
        setCancelModal(false);
        setCancelReason("");
        toast.success("Pass cancelled. The QR code now shows as revoked.");
        load();
      } else {
        setCancelError(res.message ?? "Failed to cancel pass.");
      }
    } catch {
      setCancelError("Failed to cancel pass.");
    } finally {
      setCancelLoading(false);
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
        <Link href="/admin/requests" style={{ color: "var(--gold)", fontSize: 13 }}>← Back to requests</Link>
      </div>
    );
  }

  const isComplete   = req.currentStage >= 5 && !req.isRejected;
  const isTerminated = req.isRejected || isComplete;
  const zones = req.zoneAccess ? req.zoneAccess.split(",").map(z => z.trim()).filter(Boolean) : [];

  // Props for the granted-pass card: prefer the full pass (accurate QR payload),
  // otherwise fall back to the request + embedded pass summary.
  const passView = pass ? {
    name:       pass.applicantName,
    passportNo: pass.passportNumber,
    role:       pass.role,
    event:      pass.eventName,
    validUntil: fmtDate(pass.validTo),
    zones:      pass.zoneAccess ? pass.zoneAccess.split(",").map(z => z.trim()).filter(Boolean) : ["General"],
    accId:      pass.passNumber,
    issuedDate: fmtDate(pass.issuedAt),
    qrValue:    passVerifyUrl(pass.id),
    revoked:    pass.isRevoked,
    expired:    new Date(pass.validTo) < new Date(),
  } : req.pass ? {
    name:       req.fullName,
    passportNo: req.passportNumber,
    role:       req.role,
    event:      req.eventName,
    validUntil: fmtDate(req.pass.validTo),
    zones:      zones.length ? zones : ["General"],
    accId:      req.pass.passNumber,
    issuedDate: fmtDate(req.pass.validFrom),
    qrValue:    passVerifyUrl(req.pass.id),
    revoked:    req.pass.isRevoked,
    expired:    new Date(req.pass.validTo) < new Date(),
  } : null;

  // A pass can be cancelled only while it is still active — not already revoked
  // and not past its validity window — and only by someone with revoke rights.
  const passRevoked = pass?.isRevoked ?? req.pass?.isRevoked ?? false;
  const passValidTo = pass?.validTo ?? req.pass?.validTo;
  const passActive  = !!req.pass && !passRevoked && !!passValidTo && new Date(passValidTo) > new Date();
  const canCancelPass = passActive && hasPermission(Permissions.PassesRevoke);
  const passRevokedReason = pass?.revokedReason;

  const zoneContent = req.currentStage === 2 && !isTerminated && !req.isInfoRequested ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Venue</label>
        <VenueSelect
          venues={venues}
          value={zoneVenueId}
          onChange={v => { setZoneVenueId(v); setSelectedZoneIds([]); }}
        />
      </div>

      {zoneVenue ? (
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
            Granted Zones
          </label>
          {selectedZoneLabels.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {selectedZoneLabels.map(z => (
                <span key={z} style={{ padding: "3px 9px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)" }}>{z}</span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 8px" }}>No zones selected yet.</p>
          )}
          <button className="btn btn-secondary btn-sm btn-full" onClick={() => setZoneModalOpen(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <MapPin size={13} /> Select Zones ({selectedZoneIds.length})
          </button>
        </div>
      ) : (
        // Fallback for venues not in the managed library (e.g. legacy / free text)
        <input
          className="form-control form-control-sm"
          placeholder="Zone access (e.g. Zone A, Zone B)"
          value={zoneInput}
          onChange={e => setZoneInput(e.target.value)}
        />
      )}
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

          {/* Information Requested — let the creator/admin amend & resubmit */}
          {req.isInfoRequested && (
            <GlassCard>
              <CardHeader>
                <h2 style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, color: "#F59E0B" }}>
                  <MessageSquare size={15} /> Information Requested
                </h2>
              </CardHeader>
              <CardBody>
                {req.infoRequestNote && (
                  <p style={{ color: "var(--text-primary)", lineHeight: 1.6, margin: "0 0 14px", padding: "10px 12px", background: "rgba(245,158,11,0.06)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    {req.infoRequestNote}
                  </p>
                )}
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 12px" }}>
                  This application is on hold. Update the details and resubmit it to the pipeline.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => setEditOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Pencil size={14} /> Edit &amp; Resubmit
                </button>
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

        {/* Sidebar: Pipeline + granted pass */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, alignSelf: "flex-start" }}>
          <GlassCard>
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

          {/* Granted Pass — shown once a pass has been issued */}
          {req.pass && (
            <GlassCard>
              <CardHeader>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600 }}>Granted Pass</h2>
                  {req.pass.isRevoked && (
                    <span className="badge badge-rejected" style={{ fontSize: 10 }}>Revoked</span>
                  )}
                </div>
              </CardHeader>
              <CardBody style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                {passView ? (
                  <PassCard
                    name={passView.name}
                    passportNo={passView.passportNo}
                    role={passView.role}
                    event={passView.event}
                    validUntil={passView.validUntil}
                    zones={passView.zones}
                    accId={passView.accId}
                    issuedDate={passView.issuedDate}
                    qrValue={passView.qrValue}
                    revoked={passView.revoked}
                    expired={passView.expired}
                    style={{ width: 290 }}
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "24px 0", color: "var(--text-muted)", fontSize: 12 }}>
                    <Loader size={14} className="spin" /> Loading pass…
                  </div>
                )}

                {/* Print badge (opens the print-ready view in a new tab) */}
                <button
                  className="btn btn-secondary btn-sm btn-full"
                  onClick={() => window.open(`/print/passes?ids=${req.pass!.id}`, "_blank")}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <Printer size={14} /> Print Badge
                </button>

                {/* Cancel — only while the pass is still active */}
                {canCancelPass && (
                  <button
                    className="btn btn-danger btn-sm btn-full"
                    onClick={() => setCancelModal(true)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    <Ban size={14} /> Cancel Pass
                  </button>
                )}

                {passRevoked && (
                  <div style={{ width: "100%", padding: "9px 12px", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 11.5, color: "#EF4444", textAlign: "center" }}>
                    This pass has been cancelled.{passRevokedReason ? ` ${passRevokedReason}` : ""}
                  </div>
                )}
              </CardBody>
            </GlassCard>
          )}
        </div>
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

      {/* Cancel Pass Modal */}
      <Modal open={cancelModal} onClose={() => { if (!cancelLoading) setCancelModal(false); }} title="Cancel Accreditation Pass">
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.6 }}>
          This will immediately revoke the pass for <strong style={{ color: "var(--text-primary)" }}>{req.fullName}</strong>.
          Its QR code will show as <strong style={{ color: "#EF4444" }}>cancelled</strong> at all entry points. This cannot be undone.
        </p>
        <label className="form-label">Reason (optional)</label>
        <textarea
          className="form-control"
          style={{ minHeight: 80, resize: "vertical" }}
          placeholder="e.g. Credentials reassigned, security concern…"
          value={cancelReason}
          onChange={e => setCancelReason(e.target.value)}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={() => setCancelModal(false)} disabled={cancelLoading}>Keep Pass</button>
          <button className="btn btn-danger" onClick={handleCancelPass} disabled={cancelLoading} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {cancelLoading ? <Loader size={13} className="spin" /> : <Ban size={14} />} Cancel Pass
          </button>
        </div>
        {cancelError && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 8 }}>{cancelError}</p>}
      </Modal>

      {/* Document Viewer */}
      <DocumentViewerModal
        open={!!viewDoc}
        onClose={() => setViewDoc(null)}
        src={viewDoc?.url ?? ""}
        fileName={viewDoc?.fileName}
      />

      {/* Edit / resubmit a held application */}
      <EditApplicationModal
        open={editOpen}
        request={req}
        onClose={() => setEditOpen(false)}
        onSaved={() => { setEditOpen(false); toast.success("Application updated and resubmitted for review."); load(); }}
      />

      {/* Zone selection (Zone Owner stage) */}
      <Modal open={zoneModalOpen} onClose={() => setZoneModalOpen(false)} title={`Select Access Zones — ${zoneVenue?.name ?? ""}`} maxWidth="640px">
        {zoneVenue ? (
          <>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
              Click zones on the map or the cards below to grant access for this accreditation.
            </p>
            <VenueMap venue={zoneVenue} selectedZones={selectedZoneIds} onToggle={toggleZone} />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setZoneModalOpen(false)}>
                Done · {selectedZoneIds.length} selected
              </button>
            </div>
          </>
        ) : (
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Select a venue first.</p>
        )}
      </Modal>
    </div>
  );
}
