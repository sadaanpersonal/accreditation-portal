"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Maximize2, Minimize2, Shield, MapPin, Calendar, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { QRCode } from "@/components/shared/QRCode";
import { USER_PASSES } from "@/data/user-passes";

// Wrap in Suspense so Next.js can statically render the shell
export default function QRPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>}>
      <QRPageContent />
    </Suspense>
  );
}

function QRPageContent() {
  const searchParams = useSearchParams();
  const initialPass = Math.min(
    Math.max(parseInt(searchParams.get("pass") ?? "0", 10) || 0, 0),
    USER_PASSES.length - 1
  );

  const [activeIdx, setActiveIdx] = useState(initialPass);
  const [fullscreen, setFullscreen] = useState(false);

  // Keep index in sync if query param changes (e.g. back navigation)
  useEffect(() => {
    setActiveIdx(initialPass);
  }, [initialPass]);

  const pass = USER_PASSES[activeIdx];
  const activePasses = USER_PASSES.filter(p => !p.expired);

  // ── Fullscreen overlay ──────────────────────────────────────────
  if (fullscreen) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "linear-gradient(160deg, #0a0608 0%, #1a0814 40%, #0d1120 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}>
        <button
          onClick={() => setFullscreen(false)}
          style={{
            position: "absolute", top: 20, right: 20,
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 10, padding: "8px 16px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 13, color: "rgba(255,255,255,0.8)",
          }}
        >
          <Minimize2 size={15} /> Close
        </button>

        {/* Pass selector arrows (only if multiple active passes) */}
        {activePasses.length > 1 && (
          <>
            <button
              onClick={() => {
                const prev = (activeIdx - 1 + USER_PASSES.length) % USER_PASSES.length;
                setActiveIdx(prev);
              }}
              style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: 10, cursor: "pointer", color: "rgba(255,255,255,0.6)" }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => {
                const next = (activeIdx + 1) % USER_PASSES.length;
                setActiveIdx(next);
              }}
              style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: 10, cursor: "pointer", color: "rgba(255,255,255,0.6)" }}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Glow */}
        <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* QR card */}
        <div style={{
          background: "#fff", borderRadius: 20, padding: 28,
          boxShadow: "0 0 0 1px rgba(201,168,76,0.5), 0 0 60px rgba(201,168,76,0.25), 0 24px 80px rgba(0,0,0,0.6)",
          display: "flex", flexDirection: "column", alignItems: "center",
          position: "relative", minWidth: 300,
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg, #6B0F2B, #C9A84C, #6B0F2B)", borderRadius: "20px 20px 0 0" }} />
          <div style={{ marginTop: 8, marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.25em", color: "#6B0F2B", textTransform: "uppercase" }}>Qatar Olympic Committee</div>
            <div style={{ fontSize: 9, color: "#9CA3AF", letterSpacing: "0.1em", marginTop: 2 }}>Official Accreditation QR Pass</div>
          </div>
          <QRCode seed={pass.qrSeed} size={260} fg="#0A0608" />
          <div style={{ marginTop: 16, textAlign: "center", paddingBottom: 4 }}>
            <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", color: "#6B0F2B", marginBottom: 8 }}>{pass.accId}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111", lineHeight: 1.2 }}>{pass.name}</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{pass.role} · {pass.label}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, background: "#dcfce7", border: "1px solid #86efac", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "#16a34a" }}>
              <CheckCircle size={11} /> Valid until {pass.validTo}
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        {USER_PASSES.filter(p => !p.expired).length > 1 && (
          <div style={{ display: "flex", gap: 6, marginTop: 20 }}>
            {USER_PASSES.map((p, i) => !p.expired && (
              <div
                key={i}
                onClick={() => setActiveIdx(i)}
                style={{
                  width: activeIdx === i ? 20 : 6, height: 6, borderRadius: 3,
                  background: activeIdx === i ? "#C9A84C" : "rgba(255,255,255,0.3)",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              />
            ))}
          </div>
        )}

        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 16, textAlign: "center" }}>
          Present this to venue security staff for scanning
        </p>
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

      {/* Pass selector tabs */}
      <div className="acc-tabs" style={{ marginBottom: 20, justifyContent: "center" }}>
        {USER_PASSES.map((p, i) => (
          <button
            key={p.id}
            className={`acc-tab${activeIdx === i ? " active" : ""}`}
            onClick={() => setActiveIdx(i)}
            disabled={p.expired}
            style={p.expired ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
          >
            <div className={`acc-tab-dot${p.expired ? " expired-dot" : " active-dot"}`} />
            {p.label}
          </button>
        ))}
      </div>

      {pass.expired ? (
        <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
          <div className="glass-card" style={{ padding: "40px 24px", opacity: 0.7 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚫</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>QR Unavailable</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              This pass expired on <strong>{pass.validTo}</strong> and can no longer be used for entry.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{
            background: "linear-gradient(160deg, var(--surface-1) 0%, var(--surface-2) 100%)",
            border: "1px solid var(--border)", borderRadius: 24, overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)", position: "relative",
          }}>
            <div style={{ height: 5, background: "linear-gradient(90deg, #6B0F2B, #C9A84C, #6B0F2B)" }} />
            <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

            <div style={{ padding: "24px 28px" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "var(--gold)", textTransform: "uppercase" }}>QOC Accreditation</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>{pass.name}</div>
                </div>
                <div style={{
                  padding: "4px 10px", borderRadius: 20,
                  background: `${pass.accentColor}20`, border: `1px solid ${pass.accentColor}50`,
                  fontSize: 11, fontWeight: 700, color: pass.accentColor,
                }}>{pass.role}</div>
              </div>

              {/* QR with corner accents */}
              <div style={{ background: "#fff", borderRadius: 16, padding: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(201,168,76,0.2)", position: "relative" }}>
                {[
                  { top: 8, left: 8, borderTop: "3px solid #C9A84C", borderLeft: "3px solid #C9A84C" },
                  { top: 8, right: 8, borderTop: "3px solid #C9A84C", borderRight: "3px solid #C9A84C" },
                  { bottom: 8, left: 8, borderBottom: "3px solid #C9A84C", borderLeft: "3px solid #C9A84C" },
                  { bottom: 8, right: 8, borderBottom: "3px solid #C9A84C", borderRight: "3px solid #C9A84C" },
                ].map((cs, i) => (
                  <div key={i} style={{ position: "absolute", width: 16, height: 16, borderRadius: 2, ...cs }} />
                ))}
                <QRCode seed={pass.qrSeed} size={180} fg="#0A0608" />
              </div>

              {/* ACC ID */}
              <div style={{ textAlign: "center", margin: "14px 0 18px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "var(--gold)" }}>{pass.accId}</div>
              </div>

              {/* Info rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--surface-3)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <Calendar size={13} style={{ color: "var(--gold)", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.05em" }}>EVENT</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{pass.event}</div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#22C55E", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", padding: "2px 8px", borderRadius: 10 }}>Valid</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--surface-3)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <MapPin size={13} style={{ color: "var(--gold)", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.05em" }}>VENUE</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{pass.venue}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 12px", background: "var(--surface-3)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <Shield size={13} style={{ color: "var(--gold)", flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: 5 }}>ZONE ACCESS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {pass.zones.map(z => (
                        <span key={z} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 8, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)" }}>{z}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scan button */}
              <button
                onClick={() => setFullscreen(true)}
                style={{
                  width: "100%", padding: "13px 0",
                  background: "linear-gradient(135deg, #6B0F2B, #8B1A3A)",
                  border: "none", borderRadius: 12, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  fontSize: 14, fontWeight: 700, color: "#fff",
                  boxShadow: "0 4px 20px rgba(107,15,43,0.45)",
                }}
              >
                <Maximize2 size={17} />
                Show Fullscreen for Scanning
              </button>
              <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 10 }}>
                Tap to display at full brightness for security scanners
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
