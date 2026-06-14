"use client";
import { useEffect, useState } from "react";
import { Loader, Check, FileText, ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";
import { DocumentUploader, type UploadedDoc } from "@/components/shared/DocumentUploader";
import { requestsApi, resolveFileUrl, type RequestDto } from "@/lib/api";

const NATIONALITIES = [
  "Qatar", "Saudi Arabia", "UAE", "Bahrain", "Kuwait", "Oman", "Jordan",
  "Egypt", "Tunisia", "Morocco", "Algeria", "Libya", "Sudan", "Yemen",
  "Palestine", "Syria", "Iraq", "Lebanon", "Other",
];

const TODAY = new Date();
const MIN_DOB = new Date(1900, 0, 1);

function toDateInput(iso?: string | null): string {
  if (!iso) return "";
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(iso);
  if (m) return m[1];
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Props {
  open: boolean;
  request: RequestDto | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Edit a held (info-requested) application and resubmit it for review.
 * Sending a non-empty InfoResponse makes the backend clear the info flag and
 * move the request back to UnderReview.
 */
export function EditApplicationModal({ open, request, onClose, onSaved }: Props) {
  const [firstName,    setFirstName]    = useState("");
  const [lastName,     setLastName]     = useState("");
  const [nationality,  setNationality]  = useState("");
  const [passportNo,   setPassportNo]   = useState("");
  const [dob,          setDob]          = useState("");
  const [email,        setEmail]        = useState("");
  const [phone,        setPhone]        = useState("");
  const [organization, setOrganization] = useState("");
  const [position,     setPosition]     = useState("");
  const [responseNote, setResponseNote] = useState("");
  const [newDocs,      setNewDocs]      = useState<UploadedDoc[]>([]);
  const [saving,       setSaving]       = useState(false);
  const [errors,       setErrors]       = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !request) return;
    setFirstName(request.firstName ?? "");
    setLastName(request.lastName ?? "");
    setNationality(request.nationality ?? "");
    setPassportNo(request.passportNumber ?? "");
    setDob(toDateInput(request.dateOfBirth));
    setEmail(request.email ?? "");
    setPhone(request.phone ?? "");
    setOrganization(request.organization ?? "");
    setPosition(request.position ?? "");
    setResponseNote("");
    setNewDocs([]);
    setErrors({});
  }, [open, request]);

  const infoRequested = !!request?.isInfoRequested;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!firstName.trim())   e.firstName = "First name is required.";
    if (!lastName.trim())    e.lastName = "Last name is required.";
    if (!nationality)        e.nationality = "Please select a nationality.";
    if (!passportNo.trim())  e.passportNo = "Passport number is required.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Enter a valid email.";
    if (!dob) {
      e.dob = "Date of birth is required.";
    } else {
      const d = new Date(dob);
      if (Number.isNaN(d.getTime())) e.dob = "Enter a valid date.";
      else if (d > TODAY)            e.dob = "Date of birth cannot be in the future.";
      else if (d < MIN_DOB)          e.dob = "Date of birth is too far in the past.";
    }
    // Reviewers expect a note explaining the resubmission for held applications.
    if (infoRequested && !responseNote.trim()) e.responseNote = "Add a short note for the reviewer.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!request || !validate()) return;
    setSaving(true);

    // 1. Upload any newly added documents first; abort (without resubmitting)
    //    if one fails so the user can retry.
    for (const d of newDocs) {
      const up = await requestsApi.uploadDocument(request.id, {
        base64Content: d.base64Content,
        fileName:      d.fileName,
        type:          d.type,
      });
      if (!up.success) { setSaving(false); return; } // error shown via global toast
    }

    // 2. Update the applicant details (and clear the info-hold when responding).
    const res = await requestsApi.update(request.id, {
      firstName:      firstName.trim(),
      lastName:       lastName.trim(),
      nationality:    nationality.trim(),
      passportNumber: passportNo.trim().toUpperCase(),
      dateOfBirth:    dob,
      email:          email.trim().toLowerCase(),
      phone:          phone.trim() || undefined,
      organization:   organization.trim() || undefined,
      position:       position.trim() || undefined,
      // Clears the info-requested flag and returns the request to the pipeline.
      infoResponse:   infoRequested ? (responseNote.trim() || "Application details updated.") : undefined,
    });
    setSaving(false);
    if (res.success) onSaved();
    // Failures surface via the global API error toast.
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Application" maxWidth="560px">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {infoRequested && request?.infoRequestNote && (
          <div style={{ fontSize: 12, color: "var(--text-primary)", padding: "10px 12px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "var(--radius-sm)" }}>
            <strong style={{ color: "#F59E0B" }}>Information requested:</strong> {request.infoRequestNote}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="First Name *" error={errors.firstName}>
            <input className="form-control" value={firstName} onChange={e => setFirstName(e.target.value)} />
          </Field>
          <Field label="Last Name *" error={errors.lastName}>
            <input className="form-control" value={lastName} onChange={e => setLastName(e.target.value)} />
          </Field>
          <Field label="Nationality *" error={errors.nationality}>
            <Select
              options={NATIONALITIES.map(n => ({ value: n, label: n }))}
              value={nationality}
              onChange={v => setNationality(v)}
              placeholder="Select nationality"
              isSearchable
            />
          </Field>
          <Field label="Passport Number *" error={errors.passportNo}>
            <input className="form-control" value={passportNo} onChange={e => setPassportNo(e.target.value)} />
          </Field>
          <Field label="Date of Birth *" error={errors.dob}>
            <DatePicker value={dob} onChange={setDob} placeholder="Select date of birth" minDate={MIN_DOB} maxDate={TODAY} showDropdowns portal error={!!errors.dob} />
          </Field>
          <Field label="Email" error={errors.email}>
            <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className="form-control" value={phone} onChange={e => setPhone(e.target.value)} />
          </Field>
          <Field label="Organization">
            <input className="form-control" value={organization} onChange={e => setOrganization(e.target.value)} />
          </Field>
          <Field label="Position / Title">
            <input className="form-control" value={position} onChange={e => setPosition(e.target.value)} />
          </Field>
        </div>

        {/* Documents */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Documents</label>

          {/* Existing documents (read-only) */}
          {request && request.documents.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {request.documents.map(doc => (
                <div key={doc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "7px 10px", background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <FileText size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.fileName}</span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>· {doc.type}</span>
                  </div>
                  {doc.blobUrl && (
                    <a href={resolveFileUrl(doc.blobUrl)} target="_blank" rel="noopener noreferrer" title="View document"
                       style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--gold)", textDecoration: "none", flexShrink: 0 }}>
                      <ExternalLink size={13} /> View
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add new documents */}
          <DocumentUploader value={newDocs} onChange={setNewDocs} />
        </div>

        {infoRequested && (
          <Field label="Note to reviewer *" error={errors.responseNote}>
            <textarea
              className="form-control"
              style={{ minHeight: 70, resize: "vertical" }}
              placeholder="Explain what you changed / your response…"
              value={responseNote}
              onChange={e => setResponseNote(e.target.value)}
            />
          </Field>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {saving
              ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
              : <><Check size={13} /> {infoRequested ? "Save & Resubmit" : "Save Changes"}</>}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Modal>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: 11, color: "#F87171" }}>{error}</span>}
    </div>
  );
}
