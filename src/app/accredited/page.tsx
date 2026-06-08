"use client";
import { useState } from "react";
import { QrCode, Download, Share2, Smartphone, Clock, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import NextLink from "next/link";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { RoleTag } from "@/components/ui/RoleTag";
import { PassCard } from "@/components/shared/PassCard";
import { QRCode } from "@/components/shared/QRCode";
import { USER_PASSES } from "@/data/user-passes";

const activeCount = USER_PASSES.filter(p => !p.expired).length;

export default function AccreditedDashboard() {
  const [active, setActive] = useState(0);
  const pass = USER_PASSES[active];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
        {[
          { label: "Total Passes", value: USER_PASSES.length, color: "var(--gold)", icon: "🪪" },
          { label: "Active", value: activeCount, color: "#22C55E", icon: "✅" },
          { label: "Expired", value: USER_PASSES.length - activeCount, color: "#9CA3AF", icon: "⏱" },
          { label: "Events", value: new Set(USER_PASSES.map(p => p.event)).size, color: "#818CF8", icon: "🏟" },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Acc tabs */}
      <div className="acc-tabs">
        {USER_PASSES.map((p, i) => (
          <button
            key={p.id}
            className={`acc-tab${active === i ? " active" : ""}`}
            onClick={() => setActive(i)}
          >
            <div className={`acc-tab-dot${p.expired ? " expired-dot" : " active-dot"}`} />
            {p.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
        {/* Left col */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PassCard
            name={pass.name}
            passportNo={pass.passportNo}
            role={pass.role}
            event={pass.event}
            validUntil={pass.validTo}
            zones={pass.zones}
            accId={pass.accId}
            issuedDate={pass.issuedDate}
            qrSeed={pass.qrSeed}
            expired={pass.expired}
            style={pass.passStyle}
            roleStyle={pass.roleStyle}
          />

          <GlassCard style={pass.expired ? { opacity: 0.8 } : undefined}>
            <CardHeader>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>Accreditation Details</h3>
              {pass.expired
                ? <Badge variant="rejected">Expired</Badge>
                : <Badge variant="approved">Active</Badge>
              }
            </CardHeader>
            <CardBody>
              {pass.expired && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 14px", borderRadius: "var(--radius-sm)", marginBottom: 16,
                  background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)",
                }}>
                  <AlertTriangle size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: "#F87171", margin: 0 }}>
                    This accreditation expired on <strong>{pass.validTo}</strong>. It is no longer valid for event access.
                  </p>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
                {[
                  ["Full Name", pass.name],
                  ["Passport No.", pass.passportNo],
                  ["Event", pass.event],
                  ["Venue", pass.venue],
                  ["Validity", `${pass.validFrom} – ${pass.validTo}`],
                  ["Access Zone", pass.zoneDesc],
                  ["Issued Date", pass.issuedDate],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{val}</div>
                  </div>
                ))}
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Role</div>
                  <RoleTag role={pass.role} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Accreditation ID</div>
                  <div style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono)", color: pass.idColor }}>{pass.accId}</div>
                </div>
              </div>
            </CardBody>
          </GlassCard>
        </div>

        {/* Right col */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {pass.expired ? (
            <GlassCard style={{ opacity: 0.75 }}>
              <CardBody style={{ textAlign: "center", padding: "32px 20px" }}>
                <div style={{ width: 56, height: 56, background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <ShieldAlert size={24} color="#6B7280" />
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>QR code is disabled for expired accreditations</p>
                <button className="btn btn-secondary btn-sm btn-full" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Clock size={13} /> View Archive
                </button>
              </CardBody>
            </GlassCard>
          ) : (
            <GlassCard>
              <CardHeader><h3 style={{ fontSize: 14, fontWeight: 600 }}>QR Code</h3></CardHeader>
              <CardBody style={{ textAlign: "center" }}>
                <div style={{ display: "inline-block", background: "#fff", padding: 12, borderRadius: 12, marginBottom: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
                  <QRCode seed={pass.qrSeed} size={150} />
                </div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>Scan to verify at entry points</p>
                <div style={{
                  background: `${pass.accentColor}10`, border: `1px solid ${pass.accentColor}30`,
                  borderRadius: "var(--radius-sm)", padding: "8px 10px",
                  fontFamily: "var(--font-mono)", fontSize: 10, color: pass.idColor,
                  letterSpacing: "0.07em", wordBreak: "break-all",
                }}>{pass.accId}</div>
              </CardBody>
            </GlassCard>
          )}

          <GlassCard>
            <CardBody style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {!pass.expired && (
                <NextLink
                  href={`/accredited/qr?pass=${active}`}
                  className="btn btn-sm btn-full"
                  style={{
                    textAlign: "center",
                    background: "linear-gradient(135deg, #8B7A1A, #C9A84C)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    border: "none", textDecoration: "none",
                  }}
                >
                  <QrCode size={13} /> Full-Screen QR
                </NextLink>
              )}
              <button className="btn btn-primary btn-sm btn-full" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Download size={13} /> Download PDF Pass
              </button>
              {!pass.expired && (
                <button className="btn btn-secondary btn-sm btn-full" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Smartphone size={13} /> Add to Wallet
                </button>
              )}
              <button className="btn btn-secondary btn-sm btn-full" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Share2 size={13} /> Share Pass
              </button>
            </CardBody>
          </GlassCard>

          {!pass.expired && (
            <GlassCard>
              <CardBody>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <AlertTriangle size={13} style={{ color: "var(--gold)", flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                    Personal &amp; non-transferable. Misuse results in immediate revocation.
                  </p>
                </div>
              </CardBody>
            </GlassCard>
          )}

          <GlassCard>
            <CardBody>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                {pass.expired
                  ? <AlertTriangle size={14} color="#F87171" />
                  : <CheckCircle size={14} color="#22C55E" />
                }
                <span style={{ fontSize: 12, fontWeight: 600, color: pass.expired ? "#F87171" : "#22C55E" }}>
                  {pass.expired ? "Pass Expired" : "Pass Active"}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: "var(--text-muted)" }}>From</span>
                  <span style={{ fontWeight: 500 }}>{pass.validFrom}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: "var(--text-muted)" }}>{pass.expired ? "Expired" : "Until"}</span>
                  <span style={{ fontWeight: 500, color: pass.expired ? "#F87171" : undefined }}>{pass.validTo}</span>
                </div>
              </div>
            </CardBody>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
