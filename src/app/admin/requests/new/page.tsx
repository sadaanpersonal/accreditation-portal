"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { ChevronLeft, ChevronRight, CheckCircle, Loader, AlertCircle, Copy } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { DatePicker } from "@/components/ui/DatePicker";
import { Stepper } from "@/components/ui/Stepper";
import { DocumentUploader, type UploadedDoc } from "@/components/shared/DocumentUploader";
import { VenueMap, VenueSelect } from "@/components/shared/VenueMap";
import { eventsApi, requestsApi, venuesApi, type EventDto, type VenueDto } from "@/lib/api";

const ROLES        = ["Athlete", "Media", "VIP", "Staff", "Official", "Coach"];
const NATIONALITIES = [
  "Qatar", "Saudi Arabia", "UAE", "Bahrain", "Kuwait", "Oman", "Jordan",
  "Egypt", "Tunisia", "Morocco", "Algeria", "Libya", "Sudan", "Yemen",
  "Palestine", "Syria", "Iraq", "Lebanon", "Other",
];

const STEPS = ["Applicant Info", "Event & Role", "Documents", "Review"];
const CLONE_KEY = "qoc_clone_request";
const TODAY = new Date();
const MIN_DOB = new Date(1900, 0, 1);

interface CloneData {
  firstName?: string; lastName?: string; nationality?: string; passportNumber?: string;
  dateOfBirth?: string; role?: string; email?: string; phone?: string;
  organization?: string; position?: string;
  sourceEventId?: string; sourceEventName?: string;
}

interface FormState {
  firstName:    string;
  lastName:     string;
  nationality:  string;
  passportNo:   string;
  dob:          string;
  email:        string;
  phone:        string;
  organization: string;
  position:     string;
  role:         string;
  eventId:      string;
  assignedVenue: string;
  zoneAccess:   string;
  notes:        string;
}

const INITIAL_FORM: FormState = {
  firstName: "", lastName: "", nationality: "", passportNo: "", dob: "",
  email: "", phone: "", organization: "", position: "",
  role: "", eventId: "", assignedVenue: "", zoneAccess: "", notes: "",
};

type FieldErrors = Partial<Record<"firstName" | "lastName" | "nationality" | "passportNo" | "dob" | "email" | "role" | "eventId", string>>;

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso; }
}

function AdminNewRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isClone = searchParams.get("clone") === "1";

  const [step,       setStep]       = useState(0);
  const [events,     setEvents]     = useState<EventDto[]>([]);
  const [evLoading,  setEvLoading]  = useState(true);
  const [venues,     setVenues]     = useState<VenueDto[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [venueId,    setVenueId]    = useState("");
  const [zoneIds,    setZoneIds]    = useState<string[]>([]);
  const [form,       setForm]       = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [submitted,  setSubmitted]  = useState(false);
  const [createdId,  setCreatedId]  = useState("");
  const [errors,     setErrors]     = useState<FieldErrors>({});
  const [excludeEventId, setExcludeEventId] = useState("");
  const [clonedFrom, setClonedFrom] = useState<{ name: string; eventName?: string } | null>(null);
  const [docs,       setDocs]       = useState<UploadedDoc[]>([]);

  const loadEvents = useCallback(async () => {
    setEvLoading(true);
    const res = await eventsApi.list({ pageSize: 100, status: "Active" });
    setEvLoading(false);
    if (res.success && res.data) setEvents(res.data.items);
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  useEffect(() => {
    venuesApi.list().then(res => {
      setVenuesLoading(false);
      if (res.success && res.data) setVenues(res.data);
    });
  }, []);

  const selectedVenue = venues.find(v => v.id === venueId) ?? null;
  const selectedZoneLabels = selectedVenue
    ? selectedVenue.zones.filter((z, i) => zoneIds.includes(z.id ?? `zone-${i}`)).map(z => z.label)
    : [];

  function toggleZone(zid: string) {
    setZoneIds(prev => prev.includes(zid) ? prev.filter(z => z !== zid) : [...prev, zid]);
  }

  // Load clone prefill (once) from sessionStorage
  useEffect(() => {
    if (!isClone || typeof window === "undefined") return;
    const raw = sessionStorage.getItem(CLONE_KEY);
    if (!raw) return;
    try {
      const d: CloneData = JSON.parse(raw);
      setForm(prev => ({
        ...prev,
        firstName:    d.firstName      ?? prev.firstName,
        lastName:     d.lastName       ?? prev.lastName,
        nationality:  d.nationality    ?? prev.nationality,
        passportNo:   d.passportNumber ?? prev.passportNo,
        dob:          d.dateOfBirth    ?? prev.dob,
        role:         d.role           ?? prev.role,
        email:        d.email          ?? prev.email,
        phone:        d.phone          ?? prev.phone,
        organization: d.organization   ?? prev.organization,
        position:     d.position       ?? prev.position,
        eventId:      "",
      }));
      if (d.sourceEventId) setExcludeEventId(d.sourceEventId);
      setClonedFrom({
        name: `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim(),
        eventName: d.sourceEventName,
      });
    } catch {
      /* ignore malformed payload */
    } finally {
      sessionStorage.removeItem(CLONE_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClone]);

  function set(key: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validateStep(s: number): boolean {
    const e: FieldErrors = {};
    if (s === 0) {
      if (!form.firstName.trim())   e.firstName = "First name is required.";
      if (!form.lastName.trim())    e.lastName = "Last name is required.";
      if (!form.nationality)        e.nationality = "Please select a nationality.";
      if (!form.passportNo.trim())  e.passportNo = "Passport number is required.";
      if (!form.email.trim())       e.email = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email address.";
      if (!form.dob) {
        e.dob = "Date of birth is required.";
      } else {
        const dob = new Date(form.dob);
        if (Number.isNaN(dob.getTime())) e.dob = "Enter a valid date.";
        else if (dob > TODAY)            e.dob = "Date of birth cannot be in the future.";
        else if (dob < MIN_DOB)          e.dob = "Date of birth is too far in the past.";
      }
    }
    if (s === 1) {
      if (!form.role)    e.role = "Please select a role.";
      if (!form.eventId) e.eventId = "Please select an event.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setError("");
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setError("");
    setStep(s => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    if (!validateStep(0)) { setStep(0); return; }
    if (!validateStep(1)) { setStep(1); return; }

    setError("");
    setSubmitting(true);

    const res = await requestsApi.create({
      eventId:       form.eventId,
      role:          form.role,
      firstName:     form.firstName.trim(),
      lastName:      form.lastName.trim(),
      nationality:   form.nationality,
      dateOfBirth:   form.dob,
      passportNumber: form.passportNo.trim().toUpperCase(),
      email:         form.email.trim().toLowerCase(),
      phone:         form.phone.trim() || undefined,
      organization:  form.organization.trim() || undefined,
      position:      form.position.trim() || undefined,
      // Store the readable venue name and zone labels (not internal ids)
      assignedVenue: selectedVenue?.name || undefined,
      zoneAccess:    selectedZoneLabels.join(", ") || undefined,
      documents:     docs.map(d => ({ base64Content: d.base64Content, fileName: d.fileName, type: d.type })),
    });

    setSubmitting(false);

    if (res.success && res.data) {
      setCreatedId(res.data.id);
      setSubmitted(true);
    } else {
      setError(res.message ?? res.errors?.[0] ?? "Failed to submit request.");
    }
  }

  const selectableEvents = events.filter(ev => ev.id !== excludeEventId);
  const selectedEvent = events.find(ev => ev.id === form.eventId);

  if (submitted) {
    return (
      <div style={{ maxWidth: 480, margin: "60px auto", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, background: "rgba(34,197,94,0.12)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CheckCircle size={32} color="#22C55E" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Request Submitted!</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
          Accreditation request for <strong>{form.firstName} {form.lastName}</strong> has been submitted and entered the FA Owner review stage.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn btn-secondary" onClick={() => { setSubmitted(false); setErrors({}); setStep(0); setDocs([]); setForm(INITIAL_FORM); setVenueId(""); setZoneIds([]); }}>
            Submit Another
          </button>
          {createdId && (
            <button className="btn btn-secondary" onClick={() => router.push(`/admin/requests/${createdId}`)}>
              View Request
            </button>
          )}
          <Link href="/admin/requests" className="btn btn-primary">View All Requests</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Link href="/admin/requests" style={{ color: "var(--text-muted)", display: "flex" }}>
          <ChevronLeft size={20} />
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>New Accreditation Request</h1>
      </div>

      {clonedFrom && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", marginBottom: 16, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 10, color: "var(--gold)" }}>
          <Copy size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13 }}>
            Pre-filled from <strong>{clonedFrom.name || "an existing request"}</strong>.
            {clonedFrom.eventName && <> Select a <strong>different event</strong> — “{clonedFrom.eventName}” is excluded because a person can’t be accredited twice for the same event.</>}
          </div>
        </div>
      )}

      <Stepper steps={STEPS} current={step} onStepClick={setStep} />

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "var(--radius)", color: "#F87171", fontSize: 13, marginBottom: 20 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* ── Step 0: Applicant Info ─────────────────────────────────── */}
      {step === 0 && (
        <GlassCard>
          <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Applicant Information</h2></CardHeader>
          <CardBody>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className="form-control" placeholder="First name" value={form.firstName} onChange={e => set("firstName", e.target.value)} />
                {errors.firstName && <span style={{ fontSize: 11, color: "#F87171" }}>{errors.firstName}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input className="form-control" placeholder="Last name" value={form.lastName} onChange={e => set("lastName", e.target.value)} />
                {errors.lastName && <span style={{ fontSize: 11, color: "#F87171" }}>{errors.lastName}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Nationality *</label>
                <select className="form-control" value={form.nationality} onChange={e => set("nationality", e.target.value)}>
                  <option value="">Select nationality</option>
                  {NATIONALITIES.map(n => <option key={n}>{n}</option>)}
                </select>
                {errors.nationality && <span style={{ fontSize: 11, color: "#F87171" }}>{errors.nationality}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Passport Number *</label>
                <input className="form-control" placeholder="e.g. QA1234567" value={form.passportNo} onChange={e => set("passportNo", e.target.value)} />
                {errors.passportNo && <span style={{ fontSize: 11, color: "#F87171" }}>{errors.passportNo}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth *</label>
                <DatePicker
                  value={form.dob}
                  onChange={v => set("dob", v)}
                  placeholder="Select date of birth"
                  minDate={MIN_DOB}
                  maxDate={TODAY}
                  showDropdowns
                  error={!!errors.dob}
                />
                {errors.dob && <span style={{ fontSize: 11, color: "#F87171" }}>{errors.dob}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-control" type="email" placeholder="email@example.com" value={form.email} onChange={e => set("email", e.target.value)} />
                {errors.email && <span style={{ fontSize: 11, color: "#F87171" }}>{errors.email}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" placeholder="Optional" value={form.phone} onChange={e => set("phone", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Organization</label>
                <input className="form-control" placeholder="Optional" value={form.organization} onChange={e => set("organization", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Position / Title</label>
                <input className="form-control" placeholder="Optional" value={form.position} onChange={e => set("position", e.target.value)} />
              </div>
            </div>
          </CardBody>
        </GlassCard>
      )}

      {/* ── Step 1: Event & Role ───────────────────────────────────── */}
      {step === 1 && (
        <GlassCard>
          <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Event &amp; Role</h2></CardHeader>
          <CardBody>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Role *</label>
                <select className="form-control" value={form.role} onChange={e => set("role", e.target.value)}>
                  <option value="">Select role</option>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
                {errors.role && <span style={{ fontSize: 11, color: "#F87171" }}>{errors.role}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Event *</label>
                <select className="form-control" value={form.eventId} onChange={e => set("eventId", e.target.value)} disabled={evLoading}>
                  <option value="">{evLoading ? "Loading events…" : "Select event"}</option>
                  {selectableEvents.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
                {errors.eventId && <span style={{ fontSize: 11, color: "#F87171" }}>{errors.eventId}</span>}
                {!evLoading && selectableEvents.length === 0 && (
                  <p style={{ fontSize: 11, color: "#F59E0B", marginTop: 4 }}>No other active events available.</p>
                )}
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Venue (optional)</label>
                <VenueSelect venues={venues} loading={venuesLoading} value={venueId} onChange={v => { setVenueId(v); setZoneIds([]); }} />
              </div>
            </div>

            {selectedVenue && (
              <div style={{ marginTop: 16 }}>
                <label className="form-label">Zone Access</label>
                <VenueMap venue={selectedVenue} selectedZones={zoneIds} onToggle={toggleZone} />
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Zone access can also be adjusted during the review pipeline.</p>
              </div>
            )}
          </CardBody>
        </GlassCard>
      )}

      {/* ── Step 2: Documents ──────────────────────────────────────── */}
      {step === 2 && (
        <GlassCard>
          <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Documents</h2></CardHeader>
          <CardBody>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
              Upload a copy of the passport and a recent photo. Supporting documents are optional.
            </p>
            <DocumentUploader value={docs} onChange={setDocs} />
          </CardBody>
        </GlassCard>
      )}

      {/* ── Step 3: Review ─────────────────────────────────────────── */}
      {step === 3 && (
        <GlassCard>
          <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Review &amp; Submit</h2></CardHeader>
          <CardBody style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <ReviewSection title="Applicant" onEdit={() => setStep(0)} rows={[
              ["Full Name", `${form.firstName} ${form.lastName}`.trim() || "—"],
              ["Nationality", form.nationality || "—"],
              ["Passport No.", form.passportNo || "—"],
              ["Date of Birth", fmtDate(form.dob)],
              ["Email", form.email || "—"],
              ["Phone", form.phone || "—"],
              ["Organization", form.organization || "—"],
              ["Position", form.position || "—"],
            ]} />
            <ReviewSection title="Event & Role" onEdit={() => setStep(1)} rows={[
              ["Role", form.role || "—"],
              ["Event", selectedEvent?.name ?? "—"],
              ["Assigned Venue", selectedVenue?.name ?? "—"],
              ["Zone Access", selectedZoneLabels.length ? selectedZoneLabels.join(", ") : "—"],
            ]} />
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700 }}>Documents</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setStep(2)}>Edit</button>
              </div>
              {docs.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>No documents attached.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {docs.map((d, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 10px", background: "var(--surface-3)", borderRadius: 6, border: "1px solid var(--border)" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.fileName}</span>
                      <span style={{ color: "var(--gold)", fontWeight: 600, flexShrink: 0, marginLeft: 10 }}>{d.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardBody>
        </GlassCard>
      )}

      {/* ── Wizard navigation ──────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 20 }}>
        {step === 0
          ? <Link href="/admin/requests" className="btn btn-secondary">Cancel</Link>
          : <button className="btn btn-secondary" onClick={goBack} style={{ display: "flex", alignItems: "center", gap: 6 }}><ChevronLeft size={15} /> Back</button>}

        {step < STEPS.length - 1
          ? <button className="btn btn-primary" onClick={goNext} style={{ display: "flex", alignItems: "center", gap: 6 }}>Next <ChevronRight size={15} /></button>
          : <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {submitting ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Submitting…</> : "Submit Request"}
            </button>}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ReviewSection({ title, rows, onEdit }: { title: string; rows: [string, string][]; onEdit: () => void }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700 }}>{title}</h3>
        <button className="btn btn-secondary btn-sm" onClick={onEdit}>Edit</button>
      </div>
      <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", margin: 0 }}>
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt style={{ fontSize: 11, color: "var(--text-muted)" }}>{k}</dt>
            <dd style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function AdminNewRequestPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", padding: "80px 24px", color: "var(--text-muted)" }}>
        <Loader size={20} style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <AdminNewRequestForm />
    </Suspense>
  );
}
