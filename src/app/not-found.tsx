"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>

        {/* Logo */}
        <div style={{
          width: 56, height: 56, background: "var(--maroon)", borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 28px", boxShadow: "0 8px 24px rgba(107,15,43,0.4)",
        }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--gold)" }}>QOC</span>
        </div>

        {/* 404 */}
        <div style={{
          fontFamily: "var(--font-display), serif", fontWeight: 800, lineHeight: 1,
          fontSize: 110, letterSpacing: "0.02em",
          background: "linear-gradient(135deg, var(--maroon-light, #8B1A3A), var(--gold))",
          WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
          marginBottom: 8,
        }}>
          404
        </div>

        <div className="glass-card" style={{ padding: "28px 24px", marginTop: 8 }}>
          <div style={{
            width: 46, height: 46, borderRadius: "50%", margin: "0 auto 14px",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
          }}>
            <Compass size={22} color="var(--gold)" />
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Page not found</h1>
          <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 22 }}>
            The page you’re looking for doesn’t exist or may have been moved.
            Check the address or head back to safety.
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn btn-secondary"
              onClick={() => router.back()}
              style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
            >
              <ArrowLeft size={15} /> Go Back
            </button>
            <Link
              href="/"
              className="btn btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
            >
              <Home size={15} /> Home
            </Link>
          </div>
        </div>

        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 18 }}>
          Qatar Olympic Committee · Accreditation Portal
        </p>
      </div>
    </div>
  );
}
