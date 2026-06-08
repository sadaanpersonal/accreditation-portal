"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle } from "lucide-react";

export default function ActivatePage() {
  const router = useRouter();
  const [step, setStep] = useState<"verify" | "set-password" | "done">("verify");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);

  const token = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") : "";

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setStep("set-password");
  }

  function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return;
    setStep("done");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: "var(--maroon)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(107,15,43,0.4)" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--gold)" }}>QOC</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Activate Account</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Qatar Olympic Committee · Accreditation Portal</p>
        </div>

        <div className="glass-card" style={{ padding: "28px 24px" }}>
          {step === "verify" && (
            <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                Enter the 6-digit verification code sent to your email.
              </p>
              <div className="form-group">
                <label className="form-label">Verification Code</label>
                <input
                  className="form-control"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                  style={{ fontSize: 22, letterSpacing: "0.3em", textAlign: "center", fontFamily: "var(--font-mono)" }}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={code.length < 6}>
                Verify Code
              </button>
            </form>
          )}

          {step === "set-password" && (
            <form onSubmit={handleSetPassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Set your account password.</p>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: "relative" }}>
                  <input className="form-control" type={showPw ? "text" : "password"} required minLength={8} placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input className="form-control" type="password" required placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} />
                {confirm && password !== confirm && (
                  <p style={{ fontSize: 11, color: "#F87171", marginTop: 4 }}>Passwords do not match</p>
                )}
              </div>
              <button type="submit" className="btn btn-primary" disabled={!password || password !== confirm}>
                Set Password & Activate
              </button>
            </form>
          )}

          {step === "done" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ width: 56, height: 56, background: "#22C55E20", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <CheckCircle size={28} color="#22C55E" />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Account Activated!</h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Your account is ready. You can now sign in.</p>
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => router.push("/login")}>
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
