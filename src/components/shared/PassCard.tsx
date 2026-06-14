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
  /** The string encoded into the QR — the public pass verification URL. */
  qrValue: string;
  style?: React.CSSProperties;
  roleStyle?: React.CSSProperties;
  expired?: boolean;
  /** Pass was cancelled by an admin — shows "CANCELLED" instead of "EXPIRED". */
  revoked?: boolean;
}

export function PassCard({ name, passportNo, role, event, validUntil, zones, accId, issuedDate, qrValue, style, roleStyle, expired, revoked }: Props) {
  const [flipped, setFlipped] = useState(false);
  const nameParts = name.split(" ");
  const displayName = nameParts.length > 2
    ? `${nameParts.slice(0, 2).join(" ")}\n${nameParts.slice(2).join(" ")}`
    : name;

  // A cancelled pass takes visual priority over a merely-expired one.
  const dim          = revoked || expired;
  const overlayText  = revoked ? "CANCELLED" : "EXPIRED";
  const overlayColor = revoked ? "#F87171" : "#9CA3AF";
  const overlayBorder = revoked ? "rgba(248,113,113,0.6)" : "rgba(156,163,175,0.5)";
  const validLabel   = revoked ? "Cancelled" : expired ? "Expired" : "Valid Until";

  return (
    <div className="pass-card-flip-wrapper" onClick={() => setFlipped(f => !f)}>
      <div className={`pass-card-inner${flipped ? " flipped" : ""}`}>

        {/* FRONT */}
        <div className="pass-card pass-card-face" style={{ margin: 0, ...style }}>
          {dim && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 10, pointerEvents: "none",
            }}>
              <div style={{
                background: "rgba(0,0,0,0.55)", border: `2px solid ${overlayBorder}`, color: overlayColor,
                fontSize: 22, fontWeight: 800, letterSpacing: "0.2em", padding: "10px 28px",
                borderRadius: 8, transform: "rotate(-15deg)", textTransform: "uppercase", backdropFilter: "blur(2px)",
              }}>{overlayText}</div>
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
          {/* Identity: holder name + QR side by side */}
          <div className="pass-identity">
            <div className="pass-identity-text">
              <div className="pass-name" style={{ whiteSpace: "pre-line" }}>{displayName}</div>
              <div className="pass-passport">PASSPORT: {passportNo}</div>
            </div>
            <div className="pass-qr" style={dim ? { opacity: 0.4 } : undefined}>
              <div className="qr-svg-wrap" style={{ padding: 7, borderRadius: 8 }}>
                <QRCode value={qrValue} size={66} />
              </div>
            </div>
          </div>

          <div className="pass-divider" />

          {/* Details span the full width for breathing room */}
          <div className="pass-details">
            <div className="pass-details-grid">
              <div className="pass-detail-item">
                <div className="label">Event</div>
                <div className="value">{event}</div>
              </div>
              <div className="pass-detail-item">
                <div className="label">{validLabel}</div>
                <div className="value" style={dim ? { color: "#F87171" } : undefined}>{validUntil}</div>
              </div>
            </div>
            <div className="pass-detail-item">
              <div className="label">Zones</div>
              <div className="value pass-zones">
                {zones.map(z => (
                  <span key={z} className="pass-zone-chip" style={dim ? { opacity: 0.5 } : undefined}>{z}</span>
                ))}
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
                <QRCode value={qrValue} size={72} />
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
              <div>{revoked ? "Cancelled" : expired ? "Expired" : "Expires"}: {validUntil}</div>
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
