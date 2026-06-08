"use client";
import { PassCard } from "@/components/shared/PassCard";
import { USER_PASSES } from "@/data/user-passes";

export default function PassPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>My Accreditation Passes</h1>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: -10 }}>Tap a pass to flip and view terms of use</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
        {USER_PASSES.map((p, i) => (
          <div key={i}>
            <p style={{ fontSize: 11, color: "#F87171", marginBottom: 6, textAlign: "center", height: "14px" }}>
              {p.expired ? "EXPIRED" : ""}
            </p>
            <PassCard
              name={p.name}
              passportNo={p.passportNo}
              role={p.role}
              event={p.event}
              validUntil={p.validTo}
              zones={p.zones}
              accId={p.accId}
              issuedDate={p.issuedDate}
              qrSeed={p.qrSeed}
              expired={p.expired}
              style={{ width: 290, ...p.passStyle }}
              roleStyle={p.roleStyle}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
