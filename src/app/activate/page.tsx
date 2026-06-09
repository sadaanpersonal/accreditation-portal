"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, CheckCircle, Loader, AlertCircle } from "lucide-react";
import { invitationsApi } from "@/lib/api";

function ActivateContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  const [step,       setStep]      = useState<"set-password" | "done">("set-password");
  const [firstName,  setFirstName] = useState("");
  const [lastName,   setLastName]  = useState("");
  const [password,   setPassword]  = useState("");
  const [confirm,    setConfirm]   = useState("");
  const [showPw,     setShowPw]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]     = useState("");
  const [email,      setEmail]     = useState("");

  useEffect(() => {
    if (!token) return;
    invitationsApi.byToken(token).then(res => {
      if (res.success && res.data) setEmail(res.data.email);
    });
  }, [token]);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return;
    if (!firstName.trim()) { setError("First name is required."); return; }
    if (!token) { setError("Invalid or missing invitation token."); return; }

    setError("");
    setSubmitting(true);
    const res = await invitationsApi.accept(token, password, firstName.trim(), lastName.trim());
    setSubmitting(false);

    if (res.success) {
      setStep("done");
    } else {
      setError(res.message ?? res.errors?.[0] ?? "Activation failed. The link may have expired.");
    }
  }

  if (!token) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px", color: "var(--text-muted)" }}>
        <AlertCircle size={32} style={{ margin: "0 auto 12px", display: "block", color: "#F87171" }} />
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Invalid Invitation Link</h2>
        <p style={{ fontSize: 13 }}>The link appears to be missing a token. Please check your email.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: "var(--maroon)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(107,15,43,0.4)" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--gold)" }}>QOC</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Activate Account</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Qatar Olympic Committee · Accreditation Portal</p>
          {email && <p style={{ fontSize: 12, color: "var(--gold)", marginTop: 6 }}>{email}</p>}
        </div>

        <div className="glass-card" style={{ padding: "28px 24px" }}>
          {step === "set-password" && (
            <form onSubmit={handleSetPassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                Complete your profile and choose a secure password.
              </p>

              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, fontSize: 13, color: "#F87171" }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {/* Name row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">First Name <span style={{ color: "#EF4444" }}>*</span></label>
                  <input
                    className="form-control"
                    type="text"
                    required
                    placeholder="First"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Last Name</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Last"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="form-control"
                    type={showPw ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  className="form-control"
                  type="password"
                  required
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                />
                {confirm && password !== confirm && (
                  <p style={{ fontSize: 11, color: "#F87171", marginTop: 4 }}>Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={!firstName.trim() || !password || password !== confirm || submitting}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                {submitting
                  ? <><Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> Activating…</>
                  : "Set Password & Activate"}
              </button>
            </form>
          )}

          {step === "done" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ width: 56, height: 56, background: "#22C55E20", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <CheckCircle size={28} color="#22C55E" />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Account Activated!</h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
                Welcome, {firstName}! Your account is ready. Sign in to get started.
              </p>
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => router.push("/login")}>
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>}>
      <ActivateContent />
    </Suspense>
  );
}
