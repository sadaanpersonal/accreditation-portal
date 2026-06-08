"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { VenueMap, VenueSelect } from "@/components/shared/VenueMap";
import { EVENTS } from "@/data/events";

const ROLES = ["Athlete", "Media", "VIP", "Staff", "Official", "Coach"];
const NATIONALITIES = ["Qatar", "Saudi Arabia", "UAE", "Bahrain", "Kuwait", "Oman", "Jordan", "Egypt", "Tunisia", "Morocco"];

export default function NewRequestPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", nationality: "", passportNo: "", dob: "",
    role: "", eventId: "", venueId: "", zones: [] as string[],
    phone: "", email: "", notes: "",
  });

  function set(key: keyof typeof form, value: any) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === "venueId") setForm(prev => ({ ...prev, venueId: value, zones: [] }));
  }

  function toggleZone(zid: string) {
    setForm(prev => ({
      ...prev,
      zones: prev.zones.includes(zid) ? prev.zones.filter(z => z !== zid) : [...prev.zones, zid],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 480, margin: "60px auto", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, background: "#22C55E20", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CheckCircle size={32} color="#22C55E" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Request Submitted!</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
          Your accreditation request for <strong>{form.name}</strong> has been submitted and is now pending FA Owner approval.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn btn-secondary" onClick={() => setSubmitted(false)}>Submit Another</button>
          <Link href="/requestor/requests" className="btn btn-primary">View All Requests</Link>
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

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <GlassCard>
          <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Personal Information</h2></CardHeader>
          <CardBody>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-control" required placeholder="As on passport" value={form.name} onChange={e => set("name", e.target.value)} />
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
                <label className="form-label">Email</label>
                <input className="form-control" type="email" placeholder="Optional" value={form.email} onChange={e => set("email", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" placeholder="Optional" value={form.phone} onChange={e => set("phone", e.target.value)} />
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
                  {EVENTS.filter(e => e.status === "active").map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Venue</label>
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
          <button type="submit" className="btn btn-primary">Submit Request</button>
        </div>
      </form>
    </div>
  );
}
