"use client";
import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, CheckCircle, Loader, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { eventsApi, requestsApi, type EventDto } from "@/lib/api";

const ROLES        = ["Athlete", "Media", "VIP", "Staff", "Official", "Coach"];
const NATIONALITIES = [
  "Qatar", "Saudi Arabia", "UAE", "Bahrain", "Kuwait", "Oman", "Jordan",
  "Egypt", "Tunisia", "Morocco", "Algeria", "Libya", "Sudan", "Yemen",
  "Palestine", "Syria", "Iraq", "Lebanon", "Other",
];

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

export default function AdminNewRequestPage() {
  const router = useRouter();

  const [events,     setEvents]     = useState<EventDto[]>([]);
  const [evLoading,  setEvLoading]  = useState(true);
  const [form,       setForm]       = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [submitted,  setSubmitted]  = useState(false);
  const [createdId,  setCreatedId]  = useState("");

  const loadEvents = useCallback(async () => {
    setEvLoading(true);
    const res = await eventsApi.list({ pageSize: 100, status: "Active" });
    setEvLoading(false);
    if (res.success && res.data) setEvents(res.data.items);
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  function set(key: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      assignedVenue: form.assignedVenue.trim() || undefined,
      documents:     [],
    });

    setSubmitting(false);

    if (res.success && res.data) {
      setCreatedId(res.data.id);
      setSubmitted(true);
    } else {
      setError(res.message ?? res.errors?.[0] ?? "Failed to submit request.");
    }
  }

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
          <button className="btn btn-secondary" onClick={() => { setSubmitted(false); setForm(INITIAL_FORM); }}>
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
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Link href="/admin/requests" style={{ color: "var(--text-muted)", display: "flex" }}>
          <ChevronLeft size={20} />
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>New Accreditation Request</h1>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "var(--radius)", color: "#F87171", fontSize: 13, marginBottom: 20 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <GlassCard>
          <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Personal Information</h2></CardHeader>
          <CardBody>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className="form-control" required placeholder="First name" value={form.firstName} onChange={e => set("firstName", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input className="form-control" required placeholder="Last name" value={form.lastName} onChange={e => set("lastName", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Nationality *</label>
                <select className="form-control" required value={form.nationality} onChange={e => set("nationality", e.target.value)}>
                  <option value="">Select nationality</option>
                  {NATIONALITIES.map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Passport Number *</label>
                <input className="form-control" required placeholder="e.g. QA1234567" value={form.passportNo} onChange={e => set("passportNo", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth *</label>
                <input className="form-control" type="date" required value={form.dob} onChange={e => set("dob", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-control" type="email" required placeholder="email@example.com" value={form.email} onChange={e => set("email", e.target.value)} />
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

        <GlassCard>
          <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Accreditation Details</h2></CardHeader>
          <CardBody>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Role *</label>
                <select className="form-control" required value={form.role} onChange={e => set("role", e.target.value)}>
                  <option value="">Select role</option>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Event *</label>
                <select className="form-control" required value={form.eventId} onChange={e => set("eventId", e.target.value)} disabled={evLoading}>
                  <option value="">{evLoading ? "Loading events…" : "Select event"}</option>
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
                {!evLoading && events.length === 0 && (
                  <p style={{ fontSize: 11, color: "#F59E0B", marginTop: 4 }}>No active events available.</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Venue</label>
                <input className="form-control" placeholder="e.g. Khalifa International Stadium" value={form.assignedVenue} onChange={e => set("assignedVenue", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Zone Access</label>
                <input className="form-control" placeholder="e.g. Zone A, Zone B (set during review)" value={form.zoneAccess} onChange={e => set("zoneAccess", e.target.value)} />
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Zone access can also be assigned during the review pipeline.</p>
              </div>
            </div>
          </CardBody>
        </GlassCard>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Link href="/admin/requests" className="btn btn-secondary">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {submitting ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Submitting…</> : "Submit Request"}
          </button>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
