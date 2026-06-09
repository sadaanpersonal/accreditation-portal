"use client";
import { useEffect, useState, useCallback } from "react";
import { QrCode, Download, Share2, Smartphone, Clock, AlertTriangle, CheckCircle, ShieldAlert, Loader } from "lucide-react";
import NextLink from "next/link";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { RoleTag } from "@/components/ui/RoleTag";
import { PassCard } from "@/components/shared/PassCard";
import { QRCode } from "@/components/shared/QRCode";
import { passesApi, type PassDto } from "@/lib/api";

// ── Role-based visual styles ───────────────────────────────────────────────
interface PassVisuals {
  passStyle?:   React.CSSProperties;
  roleStyle?:   React.CSSProperties;
  accentColor:  string;
  idColor:      string;
}

const ROLE_VISUALS: Record<string, PassVisuals> = {
  Media:    { roleStyle: { background: "linear-gradient(135deg,#6B0F2B,#8B1A3A)", color: "#fff", border: "none" }, accentColor: "var(--gold)", idColor: "var(--gold)" },
  VIP:      { passStyle: { background: "linear-gradient(135deg,#0D2B5C 0%,#1A4A8A 40%,#2060B0 100%)", borderColor: "rgba(96,165,250,0.4)" }, roleStyle: { background: "linear-gradient(135deg,#60A5FA,#93C5FD)", color: "#0D2B5C", border: "none" }, accentColor: "#60A5FA", idColor: "#60A5FA" },
  Staff:    { passStyle: { background: "linear-gradient(135deg,#1A1A1A 0%,#2D2D2D 60%,#3A3A3A 100%)", borderColor: "rgba(107,114,128,0.4)", opacity: 0.85 }, roleStyle: { background: "rgba(107,114,128,0.3)", color: "#9CA3AF", border: "1px solid rgba(107,114,128,0.4)" }, accentColor: "#9CA3AF", idColor: "#9CA3AF" },
  Athlete:  { passStyle: { background: "linear-gradient(135deg,#065F46 0%,#047857 50%,#059669 100%)", borderColor: "rgba(52,211,153,0.4)" }, roleStyle: { background: "linear-gradient(135deg,#34D399,#6EE7B7)", color: "#065F46", border: "none" }, accentColor: "#34D399", idColor: "#34D399" },
  Official: { roleStyle: { background: "linear-gradient(135deg,#7C3AED,#8B5CF6)", color: "#fff", border: "none" }, accentColor: "#A78BFA", idColor: "#A78BFA" },
  Coach:    { roleStyle: { background: "linear-gradient(135deg,#D97706,#F59E0B)", color: "#fff", border: "none" }, accentColor: "#F59E0B", idColor: "#F59E0B" },
};

function getVisuals(role: string): PassVisuals {
  return ROLE_VISUALS[role] ?? { accentColor: "var(--gold)", idColor: "var(--gold)" };
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
}

function isExpired(pass: PassDto): boolean {
  if (pass.isRevoked) return true;
  try { return new Date(pass.validTo) < new Date(); } catch { return false; }
}

export default function AccreditedDashboard() {
  const [passes,  setPasses]  = useState<PassDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [active,  setActive]  = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await passesApi.mine();
    setLoading(false);
    if (res.success && res.data) {
      setPasses(res.data);
      setActive(0);
    } else {
      setError(res.message ?? "Failed to load passes.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300, gap: 12, color: "var(--text-muted)" }}>
        <Loader size={20} style={{ animation: "spin 1s linear infinite" }} /> Loading passes…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px", color: "#F87171" }}>
        {error}
        <button className="btn btn-secondary btn-sm" onClick={load} style={{ display: "block", margin: "12px auto 0" }}>Retry</button>
      </div>
    );
  }

  if (passes.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--text-muted)" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🪪</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Passes Yet</h2>
        <p style={{ fontSize: 13 }}>Your accreditation passes will appear here once approved.</p>
      </div>
    );
  }

  const pass    = passes[active];
  const expired = isExpired(pass);
  const visuals = getVisuals(pass.role);
  const zones   = (pass.zoneAccess ?? "").split(",").map(z => z.trim()).filter(Boolean);

  const activeCount = passes.filter(p => !isExpired(p)).length;
  const eventSet    = new Set(passes.map(p => p.eventName));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
        {[
          { label: "Total Passes", value: passes.length,              color: "var(--gold)", icon: "🪪" },
          { label: "Active",       value: activeCount,                 color: "#22C55E",     icon: "✅" },
          { label: "Expired",      value: passes.length - activeCount, color: "#9CA3AF",     icon: "⏱" },
          { label: "Events",       value: eventSet.size,               color: "#818CF8",     icon: "🏟" },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pass tabs */}
      <div className="acc-tabs">
        {passes.map((p, i) => {
          const exp = isExpired(p);
          return (
            <button
              key={p.id}
              className={`acc-tab${active === i ? " active" : ""}`}
              onClick={() => setActive(i)}
            >
              <div className={`acc-tab-dot${exp ? " expired-dot" : " active-dot"}`} />
              {p.eventName}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
        {/* Left col */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PassCard
            name={pass.applicantName}
            passportNo={pass.passportNumber}
            role={pass.role}
            event={pass.eventName}
            validUntil={formatDate(pass.validTo)}
            zones={zones}
            accId={pass.passNumber}
            issuedDate={formatDate(pass.issuedAt)}
            qrSeed={pass.qrPayload}
            expired={expired}
            style={visuals.passStyle}
            roleStyle={visuals.roleStyle}
          />

          <GlassCard style={expired ? { opacity: 0.8 } : undefined}>
            <CardHeader>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>Accreditation Details</h3>
              {expired ? <Badge variant="rejected">Expired</Badge> : <Badge variant="approved">Active</Badge>}
            </CardHeader>
            <CardBody>
              {expired && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 14px", borderRadius: "var(--radius-sm)", marginBottom: 16,
                  background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)",
                }}>
                  <AlertTriangle size={15} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: "#F87171", margin: 0 }}>
                    {pass.isRevoked
                      ? <>This accreditation has been <strong>revoked</strong>. {pass.revokedReason && <span>Reason: {pass.revokedReason}</span>}</>
                      : <>This accreditation expired on <strong>{formatDate(pass.validTo)}</strong>. It is no longer valid for event access.</>
                    }
                  </p>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
                {([
                  ["Full Name",     pass.applicantName],
                  ["Passport No.",  pass.passportNumber],
                  ["Event",         pass.eventName],
                  ["Venue",         pass.venueName],
                  ["Validity",      `${formatDate(pass.validFrom)} – ${formatDate(pass.validTo)}`],
                  ["Access Zones",  pass.zoneAccess || "—"],
                  ["Issued Date",   formatDate(pass.issuedAt)],
                ] as [string, string][]).map(([label, val]) => (
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
                  <div style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono)", color: visuals.idColor }}>{pass.passNumber}</div>
                </div>
              </div>
            </CardBody>
          </GlassCard>
        </div>

        {/* Right col */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {expired ? (
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
                  <QRCode seed={pass.qrPayload} size={150} />
                </div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>Scan to verify at entry points</p>
                <div style={{
                  background: `${visuals.accentColor}10`, border: `1px solid ${visuals.accentColor}30`,
                  borderRadius: "var(--radius-sm)", padding: "8px 10px",
                  fontFamily: "var(--font-mono)", fontSize: 10, color: visuals.idColor,
                  letterSpacing: "0.07em", wordBreak: "break-all",
                }}>{pass.passNumber}</div>
              </CardBody>
            </GlassCard>
          )}

          <GlassCard>
            <CardBody style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {!expired && (
                <NextLink
                  href={`/accredited/qr?pass=${active}`}
                  className="btn btn-sm btn-full"
                  style={{
                    textAlign: "center",
                    background: "linear-gradient(135deg,#8B7A1A,#C9A84C)", color: "#fff",
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
              {!expired && (
                <button className="btn btn-secondary btn-sm btn-full" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Smartphone size={13} /> Add to Wallet
                </button>
              )}
              <button className="btn btn-secondary btn-sm btn-full" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Share2 size={13} /> Share Pass
              </button>
            </CardBody>
          </GlassCard>

          {!expired && (
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
                {expired
                  ? <AlertTriangle size={14} color="#F87171" />
                  : <CheckCircle size={14} color="#22C55E" />
                }
                <span style={{ fontSize: 12, fontWeight: 600, color: expired ? "#F87171" : "#22C55E" }}>
                  {expired ? "Pass Expired" : "Pass Active"}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: "var(--text-muted)" }}>From</span>
                  <span style={{ fontWeight: 500 }}>{formatDate(pass.validFrom)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: "var(--text-muted)" }}>{expired ? "Expired" : "Until"}</span>
                  <span style={{ fontWeight: 500, color: expired ? "#F87171" : undefined }}>{formatDate(pass.validTo)}</span>
                </div>
              </div>
            </CardBody>
          </GlassCard>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
