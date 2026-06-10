"use client";
import { useState } from "react";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";

export default function AdminSettingsPage() {
  const [portal, setPortal] = useState({ name: "QOC Accreditation Portal", org: "Qatar Olympic Committee", email: "accreditation@qoc.qa", timezone: "Asia/Qatar" });
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ maxWidth: 940, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Settings</h1>

      <GlassCard>
        <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Portal Configuration</h2></CardHeader>
        <CardBody>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Portal Name</label>
              <input className="form-control" value={portal.name} onChange={e => setPortal(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Organization</label>
              <input className="form-control" value={portal.org} onChange={e => setPortal(p => ({ ...p, org: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input className="form-control" type="email" value={portal.email} onChange={e => setPortal(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select className="form-control" value={portal.timezone} onChange={e => setPortal(p => ({ ...p, timezone: e.target.value }))}>
                <option value="Asia/Qatar">Asia/Qatar (UTC+3)</option>
                <option value="UTC">UTC</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 4 }}>
              <button type="submit" className="btn btn-primary">Save Changes</button>
              {saved && <span style={{ fontSize: 12, color: "#22C55E" }}>✓ Saved successfully</span>}
            </div>
          </form>
        </CardBody>
      </GlassCard>

      <GlassCard>
        <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Approval Pipeline</h2></CardHeader>
        <CardBody>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
            Configure which stages are active in the 4-stage approval pipeline.
          </p>
          {["FA Owner Review", "Zone Owner Assignment", "Media Owner Approval", "MOI Clearance"].map((stage, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Stage {i + 1}: {stage}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{i === 3 ? "External — cannot be disabled" : "Required stage"}</div>
              </div>
              <div style={{ width: 36, height: 20, borderRadius: 10, background: "#22C55E", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 3px", cursor: i === 3 ? "not-allowed" : "pointer", opacity: i === 3 ? 0.6 : 1 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff" }} />
              </div>
            </div>
          ))}
        </CardBody>
      </GlassCard>
    </div>
  );
}
