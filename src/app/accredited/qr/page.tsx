"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Maximize2, Minimize2, Shield, MapPin, Calendar, CheckCircle, ChevronLeft, ChevronRight, Loader, AlertCircle } from "lucide-react";
import { QRCode } from "@/components/shared/QRCode";
import { passesApi, type PassDto } from "@/lib/api";

export default function QRPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>}>
      <QRPageContent />
    </Suspense>
  );
}

function QRPageContent() {
  const searchParams = useSearchParams();
  const [passes,    setPasses]    = useState<PassDto[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    passesApi.mine().then(res => {
      setLoading(false);
      if (res.success && res.data) {
        const active = res.data.filter(p => !p.isRevoked);
        setPasses(active);
        const idx = parseInt(searchParams.get("pass") ?? "0", 10) || 0;
        setActiveIdx(Math.min(idx, Math.max(active.length - 1, 0)));
      } else {
        setError(res.message ?? "Failed to load passes.");
      }
    });
  }, [searchParams]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px", color: "var(--text-muted)", gap: 10 }}>
      <Loader size={20} style={{ animation: "spin 1s linear infinite" }} /> Loading…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "24px 20px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 12, color: "#F87171", margin: 20 }}>
      <AlertCircle size={16} /> {error}
    </div>
  );

  if (passes.length === 0) return (
    <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-muted)" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🎫</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No active passes</div>
      <div style={{ fontSize: 13 }}>Your accreditation pass will appear here once approved.</div>
    </div>
  );

  const pass = passes[activeIdx];
  const qrSeed = pass.qrPayload || pass.passNumber;
  const expired = new Date(pass.validTo) < new Date();
  const validToStr = new Date(pass.validTo).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const zones = pass.zoneAccess ? [pass.zoneAccess] : ["General"];

  // ── Fullscreen overlay ──────────────────────────────────────────
  if (fullscreen) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "linear-gradient(160deg, #0a0608 0%, #1a0814 40%, #0d1120 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <button onClick={() => setFullscreen(false)} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
          <Minimize2 size={15} /> Close
        </button>

        {passes.length > 1 && (
          <>
            <button onClick={() => setActiveIdx((activeIdx - 1 + passes.length) % passes.length)} style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: 10, cursor: "pointer", color: "rgba(255,255,255,0.6)" }}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setActiveIdx((activeIdx + 1) % passes.length)} style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: 10, cursor: "pointer", color: "rgba(255,255,255,0.6)" }}>
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 0 0 1px rgba(201,168,76,0.5), 0 0 60px rgba(201,168,76,0.25), 0 24px 80px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", minWidth: 300 }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg, #6B0F2B, #C9A84C, #6B0F2B)", borderRadius: "20px 20px 0 0" }} />
          <div style={{ marginTop: 8, marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.25em", color: "#6B0F2B", textTransform: "uppercase" }}>Qatar Olympic Committee</div>
            <div style={{ fontSize: 9, color: "#9CA3AF", letterSpacing: "0.1em", marginTop: 2 }}>Official Accreditation QR Pass</div>
          </div>
          <QRCode seed={qrSeed} size={260} fg="#0A0608" />
          <div style={{ marginTop: 16, textAlign: "center", paddingBottom: 4 }}>
            <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", color: "#6B0F2B", marginBottom: 8 }}>{pass.passNumber}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111", lineHeight: 1.2 }}>{pass.applicantName}</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{pass.role} · {pass.eventName}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, background: "#dcfce7", border: "1px solid #86efac", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "#16a34a" }}>
              <CheckCircle size={11} /> Valid until {validToStr}
            </div>
          </div>
        </div>

        {passes.length > 1 && (
          <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
            {passes.map((_, i) => (
              <div key={i} onClick={() => setActiveIdx(i)} style={{ width: activeIdx === i ? 20 : 6, height: 6, borderRadius: 3, background: activeIdx === i ? "#C9A84C" : "rgba(255,255,255,0.3)", cursor: "pointer", transition: "all 0.2s" }} />
            ))}
          </div>
        )}

        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 16, textAlign: "center" }}>Present this to venue security staff for scanning</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Normal view ────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      <div style={{ width: "100%", maxWidth: 520, textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>My QR Pass</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Tap &ldquo;Show for Scanning&rdquo; at any venue entry point</p>
      </div>

      {passes.length > 1 && (
        <div className="acc-tabs" style={{ marginBottom: 20, justifyContent: "center" }}>
          {passes.map((p, i) => (
            <button key={p.id} className={`acc-tab${activeIdx === i ? " active" : ""}`} onClick={() => setActiveIdx(i)}>
              <div className="acc-tab-dot active-dot" />
              {p.eventName}
            </button>
          ))}
        </div>
      )}

      {expired ? (
        <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
          <div className="glass-card" style={{ padding: "40px 24px", opacity: 0.7 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚫</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>QR Unavailable</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>This pass expired on <strong>{validToStr}</strong>.</p>
          </div>
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ background: "linear-gradient(160deg, var(--surface-1) 0%, var(--surface-2) 100%)", border: "1px solid var(--border)", borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", position: "relative" }}>
            <div style={{ height: 5, background: "linear-gradient(90deg, #6B0F2B, #C9A84C, #6B0F2B)" }} />

            <div style={{ padding: "24px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "var(--gold)", textTransform: "uppercase" }}>QOC Accreditation</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>{pass.applicantName}</div>
                </div>
                <div style={{ padding: "4px 10px", borderRadius: 20, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", fontSize: 11, fontWeight: 700, color: "var(--gold)" }}>{pass.role}</div>
              </div>

              <div style={{ background: "#fff", borderRadius: 16, padding: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(201,168,76,0.2)", position: "relative" }}>
                {[
                  { top: 8, left: 8, borderTop: "3px solid #C9A84C", borderLeft: "3px solid #C9A84C" },
                  { top: 8, right: 8, borderTop: "3px solid #C9A84C", borderRight: "3px solid #C9A84C" },
                  { bottom: 8, left: 8, borderBottom: "3px solid #C9A84C", borderLeft: "3px solid #C9A84C" },
                  { bottom: 8, right: 8, borderBottom: "3px solid #C9A84C", borderRight: "3px solid #C9A84C" },
                ].map((cs, i) => <div key={i} style={{ position: "absolute", width: 16, height: 16, borderRadius: 2, ...cs }} />)}
                <QRCode seed={qrSeed} size={180} fg="#0A0608" />
              </div>

              <div style={{ textAlign: "center", margin: "14px 0 18px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "var(--gold)" }}>{pass.passNumber}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--surface-3)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <Calendar size={13} style={{ color: "var(--gold)", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>EVENT</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{pass.eventName}</div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#22C55E", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", padding: "2px 8px", borderRadius: 10 }}>Valid</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--surface-3)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <MapPin size={13} style={{ color: "var(--gold)", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>VENUE</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{pass.venueName || "—"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 12px", background: "var(--surface-3)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <Shield size={13} style={{ color: "var(--gold)", flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 5 }}>ZONE ACCESS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {zones.map(z => <span key={z} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 8, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)" }}>{z}</span>)}
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={() => setFullscreen(true)} style={{ width: "100%", padding: "13px 0", background: "linear-gradient(135deg, #6B0F2B, #8B1A3A)", border: "none", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 14, fontWeight: 700, color: "#fff", boxShadow: "0 4px 20px rgba(107,15,43,0.45)" }}>
                <Maximize2 size={17} /> Show Fullscreen for Scanning
              </button>
              <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 10 }}>Tap to display at full brightness for security scanners</p>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
