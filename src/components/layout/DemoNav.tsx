"use client";
import { useState } from "react";
import { Loader } from "lucide-react";
import { authApi, saveTokens } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { HowItWorksModal } from "@/components/shared/HowItWorksModal";

// ── Demo user definitions ────────────────────────────────────────────────────
const DEMO_USERS = [
  {
    label:    "Super Admin",
    sublabel: "Full access",
    email:    "admin@qoc.qa",
    password: "Admin@1234!",
    path:     "/admin",
    color:    "var(--gold)",
  },
  {
    label:    "FA Owner",
    sublabel: "Stage-1 reviewer",
    email:    "fa-owner@qoc.qa",
    password: "Admin@1234!",
    path:     "/admin",
    color:    "#60A5FA",
  },
  {
    label:    "Requestor",
    sublabel: "Submit requests",
    email:    "requestor1@demo.qa",
    password: "Demo@1234!",
    path:     "/requestor",
    color:    "#34D399",
  },
  {
    label:    "Accreditor",
    sublabel: "Watch request",
    email:    "accredited1@demo.qa",
    password: "Demo@1234!",
    path:     "/accredited",
    color:    "#F87171",
  },
] as const;

// ── Component ────────────────────────────────────────────────────────────────
export function DemoNav() {
  const { user } = useAuth();
  const [loading,   setLoading]   = useState<string | null>(null);
  const [error,     setError]     = useState("");
  const [guideOpen, setGuideOpen] = useState(false);

  async function switchTo(demo: (typeof DEMO_USERS)[number]) {
    if (loading) return;
    setError("");

    // Already logged in as this user — just navigate
    if (user?.email === demo.email) {
      window.location.href = demo.path;
      return;
    }

    setLoading(demo.email);

    const res = await authApi.login(demo.email, demo.password);

    if (!res.success || !res.data) {
      setError(res.message ?? res.errors?.[0] ?? "Login failed");
      setLoading(null);
      return;
    }

    // Persist tokens
    saveTokens({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken });

    // Build user object — backend now sends res.data.userInfo (after our fix)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serverUser = (res.data as any).userInfo;

    // Decode JWT as fallback
    let jwtPayload: Record<string, unknown> | null = null;
    try {
      const base64 = res.data.accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      jwtPayload = JSON.parse(atob(base64));
    } catch { /* ignore */ }

    const permissions: string[] = (() => {
      if (serverUser?.permissions?.length) return serverUser.permissions as string[];
      const p = jwtPayload?.["permission"];
      if (Array.isArray(p)) return p as string[];
      if (typeof p === "string") return [p];
      return [];
    })();

    const roleCode: string = serverUser?.roleCode ?? serverUser?.role ?? String(jwtPayload?.["role"] ?? "");

    const builtUser = {
      id:          String(serverUser?.id ?? jwtPayload?.["sub"] ?? ""),
      userName:    String(serverUser?.userName ?? jwtPayload?.["unique_name"] ?? ""),
      firstName:   String(serverUser?.firstName ?? ""),
      lastName:    String(serverUser?.lastName ?? ""),
      email:       String(serverUser?.email ?? demo.email),
      role:        roleCode,
      roleCode,
      roleId:      String(serverUser?.roleId ?? ""),
      permissions,
    };

    localStorage.setItem("qoc_user", JSON.stringify(builtUser));

    // Full page navigation so AuthContext re-initialises from the new localStorage state
    window.location.href = demo.path;
  }

  const activeEmail = user?.email;

  return (
    <>
      <nav className="demo-nav">
        <span className="demo-nav-label">Demo:</span>

        {DEMO_USERS.map(d => {
          const isActive  = activeEmail === d.email;
          const isLoading = loading === d.email;

          return (
            <button
              key={d.email}
              className={`demo-nav-btn${isActive ? " active" : ""}`}
              onClick={() => switchTo(d)}
              disabled={!!loading}
              title={`${d.label} — ${d.sublabel}\n${d.email}`}
              style={isActive ? { color: d.color } : undefined}
            >
              {isLoading && (
                <Loader
                  size={11}
                  style={{ animation: "spin 0.8s linear infinite", verticalAlign: "middle", marginRight: 4 }}
                />
              )}
              {d.label}
              {isActive && <span style={{ fontSize: 9, marginLeft: 3, opacity: 0.6 }}>●</span>}
            </button>
          );
        })}

        <span className="demo-nav-divider" />

        <button className="demo-nav-btn" onClick={() => setGuideOpen(true)}>
          How it Works
        </button>

        {error && (
          <span style={{ fontSize: 11, color: "#F87171", padding: "0 8px", alignSelf: "center" }}>
            {error}
          </span>
        )}
      </nav>

      <HowItWorksModal open={guideOpen} onClose={() => setGuideOpen(false)} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
