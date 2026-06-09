"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, UserPlus, Shield, ShieldCheck, User, Loader, RefreshCw } from "lucide-react";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { usersApi, type UserDto } from "@/lib/api";
import Link from "next/link";

const ROLE_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  SUPER_ADMIN:  { color: "#C9A84C", bg: "rgba(201,168,76,0.1)",   border: "rgba(201,168,76,0.3)" },
  FA_OWNER:     { color: "#A78BFA", bg: "rgba(167,139,250,0.1)",  border: "rgba(167,139,250,0.3)" },
  ZONE_OWNER:   { color: "#F472B6", bg: "rgba(244,114,182,0.1)",  border: "rgba(244,114,182,0.3)" },
  MEDIA_OWNER:  { color: "#FB923C", bg: "rgba(251,146,60,0.1)",   border: "rgba(251,146,60,0.3)" },
  MOI_OFFICER:  { color: "#C9A84C", bg: "rgba(201,168,76,0.1)",   border: "rgba(201,168,76,0.3)" },
  REQUESTOR:    { color: "#60A5FA", bg: "rgba(96,165,250,0.1)",   border: "rgba(96,165,250,0.3)" },
  ACCREDITED:   { color: "#4ADE80", bg: "rgba(74,222,128,0.1)",   border: "rgba(74,222,128,0.3)" },
};

function roleStyle(role: string) {
  return ROLE_STYLE[role] ?? ROLE_STYLE.REQUESTOR;
}

function roleLabel(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function roleIcon(role: string, color: string) {
  if (role === "SUPER_ADMIN") return <ShieldCheck size={14} color={color} />;
  if (role.includes("OWNER") || role === "MOI_OFFICER") return <Shield size={14} color={color} />;
  return <User size={14} color={color} />;
}

export default function UsersPage() {
  const [users,       setUsers]       = useState<UserDto[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [search,      setSearch]      = useState("");
  const [roleFilter,  setRoleFilter]  = useState("all");
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalCount,  setTotalCount]  = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params: Record<string, string | number> = { pageNumber: page, pageSize: 25 };
    if (search) params.searchTerm = search;
    if (roleFilter !== "all") params.role = roleFilter;
    const res = await usersApi.list(params);
    setLoading(false);
    if (res.success && res.data) {
      setUsers(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
    } else {
      setError(res.message ?? "Failed to load users.");
    }
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const roleOptions = Array.from(new Set(users.map(u => u.role))).filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Users</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0" }}>
            {loading ? "…" : `${totalCount} total · ${users.filter(u => u.isActive).length} active`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh"><RefreshCw size={14} /></button>
          <Link href="/admin/invitations" className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <UserPlus size={14} /> Invite User
          </Link>
        </div>
      </div>

      {/* Role stats */}
      {roleOptions.length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {roleOptions.map(r => {
            const rs = roleStyle(r);
            const count = users.filter(u => u.role === r).length;
            return (
              <div key={r} onClick={() => setRoleFilter(roleFilter === r ? "all" : r)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: rs.bg, border: `1px solid ${rs.border}`, borderRadius: 20, fontSize: 11, fontWeight: 600, color: rs.color, cursor: "pointer" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: rs.color }} />
                {roleLabel(r)} · {count}
              </div>
            );
          })}
        </div>
      )}

      <GlassCard>
        <CardHeader>
          <div style={{ display: "flex", gap: 10, flex: 1 }}>
            <div style={{ position: "relative", flex: "1 1 200px" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input className="form-control" style={{ paddingLeft: 32, margin: 0 }} placeholder="Search by name or email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="form-control" style={{ margin: 0, width: "auto" }} value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
              <option value="all">All Roles</option>
              {roleOptions.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
            </select>
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{loading ? "…" : `${users.length} shown`}</span>
        </CardHeader>

        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 24px", color: "var(--text-muted)", gap: 10 }}>
              <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading users…
            </div>
          ) : error ? (
            <div style={{ padding: 24, color: "#F87171", textAlign: "center" }}>{error}</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const rs = roleStyle(u.role);
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: rs.bg, border: `1px solid ${rs.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {roleIcon(u.role, rs.color)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{u.fullName}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ display: "inline-block", fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20, background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color }}>
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.phone ?? "—"}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20, background: u.isActive ? "rgba(34,197,94,0.1)" : "rgba(107,114,128,0.1)", border: `1px solid ${u.isActive ? "rgba(34,197,94,0.3)" : "rgba(107,114,128,0.3)"}`, color: u.isActive ? "#22C55E" : "#6B7280" }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: u.isActive ? "#22C55E" : "#6B7280" }} />
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm">Edit</button>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No users found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardBody>
      </GlassCard>

      {!loading && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ fontSize: 12, color: "var(--text-muted)", alignSelf: "center" }}>Page {page} of {totalPages}</span>
          <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
