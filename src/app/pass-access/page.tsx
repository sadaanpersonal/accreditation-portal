"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye, EyeOff, CheckCircle, Loader, AlertCircle,
  ShieldCheck, LogIn, UserPlus, Lock,
} from "lucide-react";
import { passAccessApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// ── types ────────────────────────────────────────────────────────────────────
type Mode = "loading" | "error" | "register" | "login" | "done-register" | "done-login";

// ── helpers ──────────────────────────────────────────────────────────────────
function PasswordInput({ value, onChange, placeholder = "Min. 8 characters" }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        className="form-control"
        type={show ? "text" : "password"}
        required
        minLength={8}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ paddingRight: 40 }}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        style={{
          position: "absolute", right: 10, top: "50%",
          transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-muted)", display: "flex",
        }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
function PassAccessContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";
  const { login }    = useAuth();

  const [mode,        setMode]       = useState<Mode>("loading");
  const [apiError,    setApiError]   = useState("");
  const [info,        setInfo]       = useState<{
    email: string; holderName: string; eventName: string; accreditationId: string;
  } | null>(null);

  // Registration fields
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Login field
  const [loginPw,   setLoginPw]   = useState("");

  // ── On mount: validate token ────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setMode("error"); setApiError("No access token found. Please use the link from your approval email."); return; }

    passAccessApi.check(token).then(res => {
      if (!res.success || !res.data) {
        setMode("error");
        setApiError(res.message ?? "This link is invalid or has expired. Please contact the accreditation office.");
        return;
      }
      const d = res.data;
      setInfo({ email: d.email, holderName: d.holderName, eventName: d.eventName, accreditationId: d.accreditationId });
      // Pre-fill name from holder name for registration
      const parts = d.holderName.trim().split(" ");
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" "));
      setMode(d.hasAccount ? "login" : "register");
    });
  }, [token]);

  // ── Registration submit ─────────────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return;
    setApiError(""); setSubmitting(true);
    const res = await passAccessApi.activate(token, firstName.trim(), lastName.trim(), password);
    setSubmitting(false);
    if (res.success) { setMode("done-register"); }
    else { setApiError(res.message ?? res.errors?.[0] ?? "Registration failed. Please try again."); }
  }

  // ── Login submit ────────────────────────────────────────────────────────
  // Use AuthContext.login() so it saves tokens + user to localStorage,
  // updates auth state, and redirects to /accredited — all in one call.
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!info) return;
    setApiError(""); setSubmitting(true);
    const result = await login(info.email, loginPw);
    setSubmitting(false);
    if (result.success) {
      setMode("done-login");
      // AuthContext.login() already called router.push("/accredited")
    } else {
      setApiError(result.message ?? "Login failed. Please check your password.");
    }
  }

  // ── Shared header ───────────────────────────────────────────────────────
  function Header() {
    return (
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{
          width: 56, height: 56, background: "var(--maroon)",
          borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(107,15,43,0.4)",
        }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--gold)" }}>QOC</span>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Qatar Olympic Committee</h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Accreditation Portal</p>
        {info && (
          <div style={{ marginTop: 14, padding: "10px 16px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: "var(--gold)", fontWeight: 600 }}>{info.eventName}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
              ID: <span style={{ fontFamily: "monospace", color: "rgba(201,168,76,0.7)" }}>{info.accreditationId}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Render: Loading ─────────────────────────────────────────────────────
  if (mode === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
        <Loader size={28} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block" }} />
        <p style={{ fontSize: 13 }}>Validating your access link…</p>
      </div>
    </div>
  );

  // ── Render: Error ───────────────────────────────────────────────────────
  if (mode === "error") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        <AlertCircle size={40} color="#F87171" style={{ margin: "0 auto 16px", display: "block" }} />
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Invalid Access Link</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>{apiError}</p>
        <button className="btn btn-secondary btn-sm" onClick={() => router.push("/login")}>Go to Login</button>
      </div>
    </div>
  );

  // ── Render: Registration done ───────────────────────────────────────────
  if (mode === "done-register") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <Header />
        <div className="glass-card" style={{ padding: "28px 24px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, background: "#22C55E20", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <CheckCircle size={28} color="#22C55E" />
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Account Created!</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
            Welcome, {firstName}! Sign in with your new credentials to view your accreditation pass.
          </p>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => router.push(`/login?email=${encodeURIComponent(info?.email ?? "")}`)}>
            Sign In Now
          </button>
        </div>
      </div>
    </div>
  );

  // ── Render: Login done (auto-redirect handled by AuthContext) ───────────
  if (mode === "done-login") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
        <CheckCircle size={32} color="#22C55E" style={{ margin: "0 auto 12px", display: "block" }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Signed in! Redirecting to your dashboard…</p>
        <Loader size={16} style={{ animation: "spin 1s linear infinite", margin: "10px auto 0", display: "block" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  // ── Render: Registration form ───────────────────────────────────────────
  if (mode === "register") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <Header />
        <div className="glass-card" style={{ padding: "28px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <UserPlus size={16} color="var(--gold)" />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Create Your Account</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
            First time here? Set up your password to access your accreditation pass.
          </p>

          {/* Locked email display */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Lock size={11} /> Email (locked)
            </label>
            <div style={{ padding: "10px 14px", background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{info?.email}</span>
              <Lock size={12} style={{ opacity: 0.4 }} />
            </div>
          </div>

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {apiError && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, fontSize: 13, color: "#F87171" }}>
                <AlertCircle size={14} /> {apiError}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">First Name <span style={{ color: "#EF4444" }}>*</span></label>
                <input className="form-control" required placeholder="First" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Last Name</label>
                <input className="form-control" placeholder="Last" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Password <span style={{ color: "#EF4444" }}>*</span></label>
              <PasswordInput value={password} onChange={setPassword} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Confirm Password <span style={{ color: "#EF4444" }}>*</span></label>
              <PasswordInput value={confirm} onChange={setConfirm} placeholder="Repeat password" />
              {confirm && password !== confirm && (
                <p style={{ fontSize: 11, color: "#F87171", marginTop: 4 }}>Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!firstName.trim() || !password || password !== confirm || submitting}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}
            >
              {submitting
                ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Creating account…</>
                : <><ShieldCheck size={14} /> Create Account & Access Pass</>}
            </button>
          </form>

          <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 16 }}>
            Already have an account?{" "}
            <button onClick={() => setMode("login")} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              Sign in instead
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  // ── Render: Login form ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <Header />
        <div className="glass-card" style={{ padding: "28px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <LogIn size={16} color="var(--gold)" />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Sign In to View Your Pass</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
            Welcome back! Sign in with your existing account.
          </p>

          {/* Locked email display */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Lock size={11} /> Email
            </label>
            <div style={{ padding: "10px 14px", background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{info?.email}</span>
              <Lock size={12} style={{ opacity: 0.4 }} />
            </div>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {apiError && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, fontSize: 13, color: "#F87171" }}>
                <AlertCircle size={14} /> {apiError}
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Password <span style={{ color: "#EF4444" }}>*</span></label>
              <PasswordInput value={loginPw} onChange={setLoginPw} placeholder="Your password" />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!loginPw || submitting}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}
            >
              {submitting
                ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Signing in…</>
                : <><LogIn size={14} /> Sign In & View Pass</>}
            </button>
          </form>

          <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 16 }}>
            Don&apos;t have an account yet?{" "}
            <button onClick={() => setMode("register")} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              Register instead
            </button>
          </p>

          <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 8 }}>
            <button onClick={() => router.push("/login")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 11, textDecoration: "underline" }}>
              Go to regular login
            </button>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function PassAccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader size={24} style={{ animation: "spin 1s linear infinite", color: "var(--text-muted)" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <PassAccessContent />
    </Suspense>
  );
}
