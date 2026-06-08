"use client";
import { useState } from "react";
import { Search, UserPlus, Shield, ShieldCheck, User } from "lucide-react";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Requestor" | "FA Owner" | "Zone Owner" | "Media Owner" | "Accredited";
  event?: string;
  joinedDate: string;
  active: boolean;
}

const USERS: AppUser[] = [
  { id: "u1",  name: "Fatima Al-Kuwari",      email: "fatima.kuwari@qoc.qa",           role: "Admin",       joinedDate: "1 Jan 2026",  active: true },
  { id: "u2",  name: "Ahmed Al-Rashid",        email: "ahmed.rashid@gulf-athletics.qa", role: "Requestor",   event: "Gulf Athletics Championship 2026", joinedDate: "5 Feb 2026",  active: true },
  { id: "u3",  name: "Sara Al-Mansouri",       email: "sara.almansouri@qoc.qa",         role: "FA Owner",    event: "Gulf Athletics Championship 2026", joinedDate: "8 Feb 2026",  active: true },
  { id: "u4",  name: "Khalid Hamed",           email: "khalid.hamed@mediaqatar.qa",     role: "Media Owner", event: "Asian Games 2026 — Doha",          joinedDate: "12 Mar 2026", active: true },
  { id: "u5",  name: "Noor Al-Ali",            email: "noor.ali@asianoc.org",           role: "Requestor",   event: "Asian Games 2026 — Doha",          joinedDate: "20 Mar 2026", active: true },
  { id: "u6",  name: "Mohammed Al-Thani",      email: "m.thani@qoc.qa",                 role: "Zone Owner",  event: "Gulf Athletics Championship 2026", joinedDate: "3 Apr 2026",  active: false },
  { id: "u7",  name: "Fatima Khalid Al-Sayed", email: "fk.sayed@athletes.qa",           role: "Accredited",  event: "Gulf Athletics Championship 2026", joinedDate: "19 May 2026", active: true },
];

const ROLE_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  Admin:        { color: "#C9A84C", bg: "rgba(201,168,76,0.1)",   border: "rgba(201,168,76,0.3)" },
  Requestor:    { color: "#60A5FA", bg: "rgba(96,165,250,0.1)",   border: "rgba(96,165,250,0.3)" },
  "FA Owner":   { color: "#A78BFA", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.3)" },
  "Zone Owner": { color: "#F472B6", bg: "rgba(244,114,182,0.1)", border: "rgba(244,114,182,0.3)" },
  "Media Owner":{ color: "#F472B6", bg: "rgba(244,114,182,0.1)", border: "rgba(244,114,182,0.3)" },
  Accredited:   { color: "#4ADE80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.3)" },
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = USERS.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roles = Array.from(new Set(USERS.map(u => u.role)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Users</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0" }}>
            {USERS.length} total · {USERS.filter(u => u.active).length} active
          </p>
        </div>
        <button className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <UserPlus size={14} /> Invite User
        </button>
      </div>

      {/* Role stats */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {roles.map(r => {
          const s = ROLE_STYLE[r] ?? ROLE_STYLE.Requestor;
          const count = USERS.filter(u => u.role === r).length;
          return (
            <div key={r} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
              background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: 20, fontSize: 11, fontWeight: 600, color: s.color,
              cursor: "pointer",
            }} onClick={() => setRoleFilter(roleFilter === r ? "all" : r)}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }} />
              {r} · {count}
            </div>
          );
        })}
      </div>

      <GlassCard>
        <CardHeader>
          <div style={{ display: "flex", gap: 10, flex: 1 }}>
            <div style={{ position: "relative", flex: "1 1 200px" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                className="form-control"
                style={{ paddingLeft: 32, margin: 0 }}
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="form-control" style={{ margin: 0, width: "auto" }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{filtered.length} results</span>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Event</th>
                <th>Joined</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const rs = ROLE_STYLE[u.role] ?? ROLE_STYLE.Requestor;
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: rs.bg, border: `1px solid ${rs.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {u.role === "Admin" ? <ShieldCheck size={14} color={rs.color} /> :
                           u.role.includes("Owner") ? <Shield size={14} color={rs.color} /> :
                           <User size={14} color={rs.color} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        display: "inline-block", fontSize: 11, fontWeight: 600,
                        padding: "2px 9px", borderRadius: 20,
                        background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color,
                      }}>{u.role}</span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.event ?? "—"}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.joinedDate}</td>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20,
                        background: u.active ? "rgba(34,197,94,0.1)" : "rgba(107,114,128,0.1)",
                        border: `1px solid ${u.active ? "rgba(34,197,94,0.3)" : "rgba(107,114,128,0.3)"}`,
                        color: u.active ? "#22C55E" : "#6B7280",
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: u.active ? "#22C55E" : "#6B7280" }} />
                        {u.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm">Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </GlassCard>
    </div>
  );
}
