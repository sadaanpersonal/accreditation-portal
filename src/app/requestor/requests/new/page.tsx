"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, CheckCircle, Loader, AlertCircle } from "lucide-react";
import Link from "next/link";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { VenueMap, VenueSelect } from "@/components/shared/VenueMap";
import { requestsApi, eventsApi, type EventDto } from "@/lib/api";

const ROLES = ["Athlete", "Media", "VIP", "Staff", "Official", "Coach"];
const NATIONALITIES = ["Qatar", "Saudi Arabia", "UAE", "Bahrain", "Kuwait", "Oman", "Jordan", "Egypt", "Tunisia", "Morocco", "Other"];

export default function NewRequestPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const presetEventId = searchParams.get("eventId") ?? "";

  const [events,    setEvents]    = useState<EventDto[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,     setError]     = useState("");
  const [createdId, setCreatedId] = useState("");

  const [form, setForm] = useState({
    firstName: "", lastName: "", nationality: "", passportNumber: "", dateOfBirth: "",
    role: "", eventId: presetEventId, venueId: "", zones: [] as string[],
    phone: "", email: "", organization: "", position: "", notes: "",
  });

  useEffect(() => {
    eventsApi.list({ pageNumber: 1, pageSize: 50, status: "Active" }).then(res => {
      if (res.success && res.data) setEvents(res.data.items);
    });
  }, []);

  // Sync preset eventId once events load (covers the case where events load after mount)
  useEffect(() => {
    if (presetEventId && form.eventId !== presetEventId) {
      setForm(prev => ({ ...prev, eventId: presetEventId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetEventId]);

  function set(key: keyof typeof form, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === "venueId") setForm(prev => ({ ...prev, venueId: value as string, zones: [] }));
  }

  function toggleZone(zid: string) {
    setForm(prev => ({
      ...prev,
      zones: prev.zones.includes(zid) ? prev.zones.filter(z => z !== zid) : [...prev.zones, zid],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await requestsApi.create({
      eventId:        form.eventId,
      role:           form.role,
      firstName:      form.firstName.trim(),
      lastName:       form.lastName.trim(),
      nationality:    form.nationality,
      dateOfBirth:    form.dateOfBirth,
      passportNumber: form.passportNumber.trim(),
      email:          form.email.trim() || undefined,
      phone:          form.phone.trim() || undefined,
      organization:   form.organization.trim() || undefined,
      position:       form.position.trim() || undefined,
      assignedVenue:  form.venueId || undefined,
      zoneAccess:     form.zones.join(", ") || undefined,
    });

    setSubmitting(false);
    if (!res.success || !res.data) {
      setError(res.message ?? res.errors?.[0] ?? "Failed to submit request.");
      return;
    }
    setCreatedId(res.data.accreditationId || res.data.id);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 480, margin: "60px auto", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, background: "#22C55E20", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CheckCircle size={32} color="#22C55E" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Request Submitted!</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 4 }}>
          Your accreditation request for <strong>{form.firstName} {form.lastName}</strong> has been submitted.
        </p>
        {createdId && (
          <p style={{ fontFamily: "monospace", fontSize: 12, color: "var(--gold)", marginBottom: 20 }}>
            ID: {createdId}
          </p>
        )}
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>It is now pending FA Owner approval.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn btn-secondary" onClick={() => { setSubmitted(false); setForm({ firstName: "", lastName: "", nationality: "", passportNumber: "", dateOfBirth: "", role: "", eventId: "", venueId: "", zones: [], phone: "", email: "", organization: "", position: "", notes: "" }); }}>Submit Another</button>
          <Link href="/requestor/requests" className="btn btn-primary">View My Requests</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Link href="/requestor/requests" style={{ color: "var(--text-muted)", display: "flex" }}>
          <ChevronLeft size={20} />
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>New Accreditation Request</h1>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", marginBottom: 16, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, color: "#F87171" }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <GlassCard>
          <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Personal Information</h2></CardHeader>
          <CardBody>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className="form-control" required placeholder="As on passport" value={form.firstName} onChange={e => set("firstName", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input className="form-control" required placeholder="As on passport" value={form.lastName} onChange={e => set("lastName", e.target.value)} />
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
                <input className="form-control" required placeholder="e.g. QA1234567" value={form.passportNumber} onChange={e => set("passportNumber", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth *</label>
                <input className="form-control" type="date" required value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" placeholder="Optional" value={form.email} onChange={e => set("email", e.target.value)} />
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
                <select className="form-control" required value={form.eventId} onChange={e => set("eventId", e.target.value)}>
                  <option value="">Select event</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Venue (optional)</label>
                <VenueSelect value={form.venueId} onChange={v => set("venueId", v)} />
              </div>
            </div>

            {form.venueId && (
              <div style={{ marginTop: 16 }}>
                <label className="form-label">Zone Access</label>
                <VenueMap venueId={form.venueId} selectedZones={form.zones} onToggle={toggleZone} />
              </div>
            )}

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Additional Notes</label>
              <textarea className="form-control" style={{ minHeight: 80, resize: "vertical" }} placeholder="Any special access requirements…" value={form.notes} onChange={e => set("notes", e.target.value)} />
            </div>
          </CardBody>
        </GlassCard>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Link href="/requestor/requests" className="btn btn-secondary">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {submitting && <Loader size={15} style={{ animation: "spin 1s linear infinite" }} />}
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
