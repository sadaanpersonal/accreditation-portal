"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import Link from "next/link";

const DEMO_USERS = [
  { label: "Requestor", email: "requestor@qoc.qa", href: "/requestor" },
  { label: "Admin", email: "admin@qoc.qa", href: "/admin" },
  { label: "Accredited User", email: "user@qoc.qa", href: "/accredited" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.includes("admin")) router.push("/admin");
    else if (email.includes("user")) router.push("/accredited");
    else router.push("/requestor");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: "var(--maroon)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(107,15,43,0.4)" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--gold)" }}>QOC</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Welcome Back</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Qatar Olympic Committee · Accreditation Portal</p>
        </div>

        <div className="glass-card" style={{ padding: "28px 24px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" required placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input className="form-control" type={showPw ? "text" : "password"} required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}>
              <LogIn size={16} /> Sign In
            </button>
          </form>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10, textAlign: "center" }}>DEMO — Click to login as:</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {DEMO_USERS.map(u => (
                <Link key={u.label} href={u.href} className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: "center", fontSize: 11 }}>
                  {u.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
