"use client";

import { useEffect, useState } from "react";
import { PassCard } from "@/components/shared/PassCard";
import { passesApi, passVerifyUrl, type PassDto } from "@/lib/api";
import { Loader, AlertCircle } from "lucide-react";

export default function PassPage() {
  const [passes,  setPasses]  = useState<PassDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    passesApi.mine().then(res => {
      setLoading(false);
      if (res.success && res.data) {
        setPasses(res.data);
      } else {
        setError(res.message ?? "Failed to load passes.");
      }
    });
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px", color: "var(--text-muted)", gap: 10 }}>
        <Loader size={20} style={{ animation: "spin 1s linear infinite" }} /> Loading your passes…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "24px 20px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 12, color: "#F87171", margin: 20 }}>
        <AlertCircle size={16} /> {error}
      </div>
    );
  }

  if (passes.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-muted)" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎫</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No accreditation passes yet</div>
        <div style={{ fontSize: 13 }}>Once your accreditation request is approved, your pass will appear here.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>My Accreditation Passes</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Tap a pass to flip and view terms of use</p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
        {passes.map(p => {
          const expired = new Date(p.validTo) < new Date();
          return (
            <div key={p.id}>
              <p style={{ fontSize: 11, color: "#F87171", marginBottom: 6, textAlign: "center", height: 14 }}>
                {p.isRevoked ? "REVOKED" : expired ? "EXPIRED" : ""}
              </p>
              <PassCard
                name={p.applicantName}
                passportNo={p.passportNumber}
                role={p.role}
                event={p.eventName}
                validUntil={new Date(p.validTo).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                zones={p.zoneAccess ? [p.zoneAccess] : ["General"]}
                accId={p.passNumber}
                issuedDate={new Date(p.issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                qrValue={passVerifyUrl(p.id)}
                revoked={p.isRevoked}
                expired={expired}
                style={{ width: 290 }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
