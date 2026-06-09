"use client";

import { useState } from "react";
import { Eye, EyeOff, LogIn, AlertCircle, Loader } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DEMO_USERS = [
  { label: "Admin",       email: "admin@qoc.qa",       password: "Admin@1234!" },
  { label: "FA Owner",    email: "fa-owner@qoc.qa",    password: "Admin@1234!" },
  { label: "Requestor",   email: "requestor1@demo.qa", password: "Demo@1234!" },
  { label: "Accredited",  email: "requestor2@demo.qa", password: "Demo@1234!" },
];

export default function LoginPage() {
  const { login } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) setError(result.message);
  }

  async function loginAs(demo: typeof DEMO_USERS[0]) {
    setEmail(demo.email);
    setPassword(demo.password);
    setError("");
    setLoading(true);
    const result = await login(demo.email, demo.password);
    setLoading(false);
    if (!result.success) setError(result.message);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56,
            background: "var(--maroon)", borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 8px 24px rgba(107,15,43,0.4)",
          }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--gold)" }}>QOC</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Welcome Back</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Qatar Olympic Committee · Accreditation Portal</p>
        </div>

        <div className="glass-card" style={{ padding: "28px 24px" }}>

          {/* Error banner */}
          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px", marginBottom: 16,
              background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: 10, fontSize: 13, color: "#F87171",
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-control"
                type="email"
                required
                autoComplete="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="form-control"
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: 40 }}
                  disabled={loading}
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

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}
            >
              {loading ? <Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> : <LogIn size={16} />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Demo quick-login */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10, textAlign: "center", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Demo Quick Login
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {DEMO_USERS.map(u => (
                <button
                  key={u.label}
                  onClick={() => loginAs(u)}
                  disabled={loading}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 11 }}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
