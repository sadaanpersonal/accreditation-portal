"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck, ShieldX, Clock, ShieldAlert, Loader, AlertCircle,
  User, MapPin, CalendarDays, Copy, Check, RefreshCw, Hash, Globe, Ticket,
} from "lucide-react";
import { passAccessApi, type PassVerifyDto, type PassStatus } from "@/lib/api";
import { RoleTag } from "@/components/ui/RoleTag";
import { AuthControls } from "@/components/shared/AuthControls";

// ── Status presentation ───────────────────────────────────────────────────────
const STATUS_UI: Record<PassStatus, {
  label: string; color: string; Icon: typeof ShieldCheck; blurb: string;
}> = {
  Valid:       { label: "Valid Pass",    color: "#22C55E", Icon: ShieldCheck, blurb: "This accreditation is active and verified." },
  Expired:     { label: "Expired",       color: "#9CA3AF", Icon: Clock,       blurb: "This pass is past its validity period." },
  NotYetValid: { label: "Not Yet Valid", color: "#F59E0B", Icon: ShieldAlert, blurb: "This pass is not valid until its start date." },
  Revoked:     { label: "Revoked",       color: "#EF4444", Icon: ShieldX,     blurb: "This pass has been revoked and is no longer valid." },
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}

type Tab = "holder" | "access" | "validity";

export default function VerifyPassPage() {
  const { id } = useParams<{ id: string }>();
  const [data,    setData]    = useState<PassVerifyDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [tab,     setTab]     = useState<Tab>("holder");
  const [copied,  setCopied]  = useState(false);
  const [now,     setNow]     = useState<Date | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    passAccessApi.verify(id).then(res => {
      setLoading(false);
      if (res.success && res.data) { setData(res.data); setNow(new Date()); }
      else setError(res.message ?? "This pass could not be verified.");
    });
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Live "verified at" clock — ticks every second once a result is shown.
  useEffect(() => {
    if (!data) return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [data]);

  function copyId() {
    if (!data) return;
    navigator.clipboard?.writeText(data.accreditationId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const zones = data?.zoneAccess
    ? data.zoneAccess.split(",").map(z => z.trim()).filter(Boolean)
    : [];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 20px 48px" }}>
      <AuthControls />

      {/* Brand header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{
          width: 52, height: 52, background: "var(--maroon)", borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 12px", boxShadow: "0 8px 24px rgba(107,15,43,0.4)",
        }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "var(--gold)" }}>QOC</span>
        </div>
        <h1 style={{ fontSize: 17, fontWeight: 700 }}>Accreditation Verification</h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>Qatar Olympic Committee · Official Pass Check</p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "60px 0", color: "var(--text-muted)" }}>
          <Loader size={20} style={{ animation: "spin 1s linear infinite" }} /> Verifying pass…
        </div>
      )}

      {/* Error / not found */}
      {!loading && error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ width: "100%", maxWidth: 440 }}
        >
          <div className="glass-card" style={{ padding: "32px 24px", textAlign: "center" }}>
            <AlertCircle size={40} color="#EF4444" style={{ margin: "0 auto 14px", display: "block" }} />
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Pass Not Verified</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>{error}</p>
            <button className="btn btn-secondary btn-sm" onClick={load} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        </motion.div>
      )}

      {/* Verified result */}
      {!loading && data && (() => {
        const ui = STATUS_UI[data.status] ?? STATUS_UI.Expired;
        const { Icon } = ui;
        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* Status hero */}
            <div className="glass-card" style={{ padding: "28px 24px", textAlign: "center", borderColor: `${ui.color}55` }}>
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
                style={{
                  width: 84, height: 84, borderRadius: "50%", margin: "0 auto 16px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: `${ui.color}1A`, border: `2px solid ${ui.color}`,
                  boxShadow: `0 0 0 6px ${ui.color}14`,
                }}
                className={data.status === "Valid" ? "verify-pulse" : undefined}
              >
                <Icon size={40} color={ui.color} />
              </motion.div>
              <div style={{ fontSize: 22, fontWeight: 800, color: ui.color, letterSpacing: "0.02em", textTransform: "uppercase" }}>
                {ui.label}
              </div>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "6px 0 16px", lineHeight: 1.5 }}>{ui.blurb}</p>

              <div style={{ paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 700 }}>{data.holderName}</div>
                <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
                  <RoleTag role={data.role} />
                </div>
              </div>

              {data.isRevoked && data.revokedReason && (
                <div style={{ marginTop: 16, padding: "10px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, fontSize: 12, color: "#EF4444", textAlign: "left" }}>
                  <strong>Reason:</strong> {data.revokedReason}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, background: "var(--surface-2)", padding: 4, borderRadius: 12, border: "1px solid var(--border)" }}>
              {([
                ["holder",   "Holder",   User],
                ["access",   "Access",   MapPin],
                ["validity", "Validity", CalendarDays],
              ] as [Tab, string, typeof User][]).map(([key, label, TabIcon]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "9px 8px", borderRadius: 9, border: "none", cursor: "pointer",
                    fontSize: 12.5, fontWeight: 600, transition: "var(--transition)",
                    background: tab === key ? "var(--maroon)" : "transparent",
                    color: tab === key ? "#fff" : "var(--text-muted)",
                  }}
                >
                  <TabIcon size={14} /> {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="glass-card" style={{ padding: "20px 22px" }}>
              <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                {tab === "holder" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <Field icon={User}  label="Holder Name" value={data.holderName} />
                    <Field icon={Globe} label="Nationality" value={data.nationality || "—"} />
                    <Field
                      icon={Hash} label="Accreditation ID"
                      value={data.accreditationId} mono
                      action={
                        <button onClick={copyId} title="Copy ID" style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "#22C55E" : "var(--gold)", display: "flex" }}>
                          {copied ? <Check size={15} /> : <Copy size={15} />}
                        </button>
                      }
                    />
                    <Field icon={Ticket} label="Pass Number" value={data.passNumber} mono />
                  </div>
                )}

                {tab === "access" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <Field icon={CalendarDays} label="Event" value={data.eventName} />
                    <Field icon={MapPin}       label="Venue" value={data.venueName || "—"} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "var(--text-muted)", marginBottom: 7 }}>
                        <MapPin size={13} /> Zone Access
                      </div>
                      {zones.length ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {zones.map(z => (
                            <span key={z} style={{ padding: "4px 11px", borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)" }}>{z}</span>
                          ))}
                        </div>
                      ) : <span style={{ fontSize: 13 }}>General Access</span>}
                    </div>
                  </div>
                )}

                {tab === "validity" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <Field icon={CalendarDays} label="Valid From" value={fmtDate(data.validFrom)} />
                    <Field icon={CalendarDays} label="Valid Until" value={fmtDate(data.validTo)} valueColor={data.status === "Expired" ? "#EF4444" : undefined} />
                    <Field icon={Clock}        label="Issued On" value={fmtDate(data.issuedAt)} />
                    <Field icon={ShieldCheck}  label="Current Status" value={ui.label} valueColor={ui.color} />
                  </div>
                )}
              </motion.div>
            </div>

            {/* Footer: live verified-at + re-check */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "0 4px" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Verified at {now ? now.toLocaleTimeString("en-GB") : "…"}
              </span>
              <button onClick={load} className="btn btn-secondary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <RefreshCw size={13} /> Re-check
              </button>
            </div>
          </motion.div>
        );
      })()}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes verifyPulse {
          0%   { box-shadow: 0 0 0 6px rgba(34,197,94,0.14); }
          70%  { box-shadow: 0 0 0 16px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
        .verify-pulse { animation: verifyPulse 2s ease-out infinite; }
      `}</style>
    </div>
  );
}

// ── Detail row ──────────────────────────────────────────────────────────────
function Field({ icon: Icon, label, value, mono, valueColor, action }: {
  icon: typeof User; label: string; value: string;
  mono?: boolean; valueColor?: string; action?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>
          <Icon size={13} /> {label}
        </div>
        <div style={{
          fontSize: 14, fontWeight: 600, color: valueColor ?? "var(--text-primary)",
          fontFamily: mono ? "var(--font-mono), monospace" : undefined,
          wordBreak: "break-word",
        }}>
          {value}
        </div>
      </div>
      {action}
    </div>
  );
}
