"use client";
import { useState } from "react";
import { FlipHorizontal } from "lucide-react";
import { QRCode } from "./QRCode";

interface Props {
  name: string;
  passportNo: string;
  role: string;
  event: string;
  validUntil: string;
  zones: string[];
  accId: string;
  issuedDate: string;
  qrSeed: number | string;
  style?: React.CSSProperties;
  roleStyle?: React.CSSProperties;
  expired?: boolean;
}

export function PassCard({ name, passportNo, role, event, validUntil, zones, accId, issuedDate, qrSeed, style, roleStyle, expired }: Props) {
  const [flipped, setFlipped] = useState(false);
  const nameParts = name.split(" ");
  const displayName = nameParts.length > 2
    ? `${nameParts.slice(0, 2).join(" ")}\n${nameParts.slice(2).join(" ")}`
    : name;

  return (
    <div className="pass-card-flip-wrapper" onClick={() => setFlipped(f => !f)}>
      <div className={`pass-card-inner${flipped ? " flipped" : ""}`}>

        {/* FRONT */}
        <div className="pass-card pass-card-face" style={{ margin: 0, ...style }}>
          {expired && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 10, pointerEvents: "none",
            }}>
              <div style={{
                background: "rgba(0,0,0,0.55)", border: "2px solid rgba(156,163,175,0.5)", color: "#9CA3AF",
                fontSize: 22, fontWeight: 800, letterSpacing: "0.2em", padding: "10px 28px",
                borderRadius: 8, transform: "rotate(-15deg)", textTransform: "uppercase", backdropFilter: "blur(2px)",
              }}>EXPIRED</div>
            </div>
          )}
          <div className="pass-header">
            <div className="pass-logo">
              <div className="emblem">
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--gold)", letterSpacing: "0.05em" }}>QOC</span>
              </div>
              <div>
                <h3>Qatar Olympic Committee</h3>
                <span>Official Accreditation Pass</span>
              </div>
            </div>
            <div className="pass-role-badge" style={roleStyle}>{role}</div>
          </div>
          <div className="pass-body">
            <div className="pass-info">
              <div className="pass-name" style={{ whiteSpace: "pre-line" }}>{displayName}</div>
              <div className="pass-passport">PASSPORT: {passportNo}</div>
              <div className="pass-details">
                <div className="pass-details-row">
                  <div className="pass-detail-item">
                    <div className="label">Event</div>
                    <div className="value">{event}</div>
                  </div>
                  <div className="pass-detail-item">
                    <div className="label">{expired ? "Expired" : "Valid Until"}</div>
                    <div className="value" style={expired ? { color: "#F87171" } : undefined}>{validUntil}</div>
                  </div>
                </div>
                <div className="pass-detail-item">
                  <div className="label">Zones</div>
                  <div className="value" style={{ display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center" }}>
                    {zones.map(z => (
                      <span key={z} className="pass-zone-chip" style={expired ? { opacity: 0.5 } : undefined}>{z}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="pass-qr" style={expired ? { opacity: 0.4 } : undefined}>
              <div className="qr-svg-wrap" style={{ padding: 8, borderRadius: 8 }}>
                <QRCode seed={qrSeed} size={80} />
              </div>
            </div>
          </div>
          <div className="pass-strip" />
          <span className="flip-hint">
            <FlipHorizontal size={11} style={{ marginRight: 3 }} /> Tap to flip
          </span>
        </div>

        {/* BACK */}
        <div className="pass-card pass-card-face pass-card-back-face" style={{ margin: 0, ...style }}>
          {/* Back header: logo left, QR right */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", width: "100%", marginBottom: 8 }}>
            <div style={{ paddingTop: 2 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--gold)", letterSpacing: "0.08em" }}>QOC</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", marginTop: 2, lineHeight: 1.4 }}>Qatar Olympic<br />Committee</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", marginTop: 5 }}>Official Accreditation Pass</div>
            </div>
            <div>
              <div style={{ background: "rgba(255,255,255,0.95)", padding: 7, borderRadius: 8, display: "inline-block" }}>
                <QRCode seed={qrSeed} size={72} />
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--gold)", letterSpacing: "0.06em", textAlign: "center", marginTop: 4 }}>{accId}</div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.12)", marginBottom: 8 }} />

          {/* Terms of Use — no overflow, no scroll, natural height */}
          <div style={{ width: "100%" }}>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Terms of Use</div>
            <ol style={{ margin: 0, paddingLeft: 13, display: "flex", flexDirection: "column", gap: 3 }}>
              {[
                "This pass is the property of Qatar Olympic Committee and must be returned upon request.",
                "Must be worn or carried visibly at all times within venue premises.",
                "Non-transferable — valid for the authorized holder only. Photo ID may be required.",
                "Access is restricted to zones listed on the front of this pass only.",
                "Misuse, tampering, or unauthorized duplication will result in immediate confiscation.",
                "Loss or theft must be reported immediately to the QOC Accreditation Centre.",
              ].map((rule, i) => (
                <li key={i} style={{ fontSize: 8, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>{rule}</li>
              ))}
            </ol>
          </div>

          {/* Footer */}
          <div style={{ width: "100%", borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 8, paddingTop: 7, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: 7.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
              <div style={{ fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>If found, please return to:</div>
              <div>QOC Accreditation Centre, Doha, Qatar</div>
              <div>Tel: +974 4494 9999 · accreditation@qoc.qa</div>
            </div>
            <div style={{ fontSize: 7.5, color: "rgba(255,255,255,0.35)", textAlign: "right", lineHeight: 1.5 }}>
              <div>Issued: {issuedDate}</div>
              <div>{expired ? "Expired" : "Expires"}: {validUntil}</div>
            </div>
          </div>

          <span className="flip-hint">
            <FlipHorizontal size={11} style={{ marginRight: 3 }} /> Tap to flip back
          </span>
        </div>

      </div>
    </div>
  );
}
