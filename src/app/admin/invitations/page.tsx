"use client";

import { useEffect, useState, useCallback } from "react";
import { Send, Copy, Check, Mail, Clock, CheckCircle2, XCircle, Loader, RefreshCw, Trash2 } from "lucide-react";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { invitationsApi, eventsApi, type InvitationDto, type EventDto } from "@/lib/api";

const STATUS_STYLE = {
  Pending:  { color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)",  icon: Clock,        label: "Pending" },
  Accepted: { color: "#22C55E", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)",   icon: CheckCircle2, label: "Accepted" },
  Expired:  { color: "#6B7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.3)", icon: XCircle,      label: "Expired" },
  Revoked:  { color: "#F87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)", icon: XCircle,      label: "Revoked" },
} as const;

type InvStatus = keyof typeof STATUS_STYLE;

export default function InvitationsPage() {
  const [items,      setItems]      = useState<InvitationDto[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [events,     setEvents]     = useState<EventDto[]>([]);
  const [copied,     setCopied]     = useState<string | null>(null);
  const [sending,    setSending]    = useState(false);
  const [sendError,  setSendError]  = useState("");
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Send-form state
  const [email,      setEmail]      = useState("");
  const [role,       setRole]       = useState("REQUESTOR");
  const [eventId,    setEventId]    = useState("");
  const [message,    setMessage]    = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await invitationsApi.list({ pageNumber: page, pageSize: 20 });
    setLoading(false);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
    } else {
      setError(res.message ?? "Failed to load invitations.");
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    eventsApi.list({ pageNumber: 1, pageSize: 100 }).then(res => {
      if (res.success && res.data) setEvents(res.data.items);
    });
  }, []);

  async function handleSend() {
    if (!email.trim()) return;
    setSending(true);
    setSendError("");
    const res = await invitationsApi.send({
      email:           email.trim(),
      suggestedRole:   role,
      eventId:         eventId || undefined,
      personalMessage: message.trim() || undefined,
      expiryDays:      7,
    });
    setSending(false);
    if (res.success) {
      setEmail(""); setMessage("");
      load();
    } else {
      setSendError(res.message ?? res.errors?.[0] ?? "Failed to send.");
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this invitation?")) return;
    await invitationsApi.revoke(id);
    load();
  }

  function copyLink(inv: InvitationDto) {
    const link = inv.inviteLink || `${window.location.origin}/activate?token=${inv.id}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(inv.id);
    setTimeout(() => setCopied(null), 1500);
  }

  const pendingCount  = items.filter(i => i.status === "Pending").length;
  const acceptedCount = items.filter(i => i.status === "Accepted").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Invitations</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0" }}>
            {totalCount} sent · {pendingCount} pending · {acceptedCount} accepted
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh"><RefreshCw size={14} /></button>
      </div>

      {/* Send invite form */}
      <GlassCard>
        <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Send Invitation</h2></CardHeader>
        <CardBody>
          {sendError && (
            <div style={{ fontSize: 12, color: "#F87171", padding: "8px 12px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, marginBottom: 12 }}>
              {sendError}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                <input className="form-control" style={{ paddingLeft: 32, margin: 0 }} type="email" placeholder="user@organisation.qa" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} />
              </div>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Role</label>
              <select className="form-control" style={{ margin: 0 }} value={role} onChange={e => setRole(e.target.value)}>
                <option value="REQUESTOR">Requestor</option>
                <option value="FA_OWNER">FA Owner</option>
                <option value="ZONE_OWNER">Zone Owner</option>
                <option value="MEDIA_OWNER">Media Owner</option>
                <option value="MOI_OFFICER">MOI Officer</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Event (optional)</label>
              <select className="form-control" style={{ margin: 0 }} value={eventId} onChange={e => setEventId(e.target.value)}>
                <option value="">— No specific event —</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-end", height: 42 }} onClick={handleSend} disabled={!email.trim() || sending}>
              {sending ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={13} />}
              Send
            </button>
          </div>
        </CardBody>
      </GlassCard>

      {/* List */}
      <GlassCard>
        <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Sent Invitations</h2></CardHeader>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 24px", color: "var(--text-muted)", gap: 10 }}>
              <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading…
            </div>
          ) : error ? (
            <div style={{ padding: 24, color: "#F87171", textAlign: "center" }}>{error}</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Event</th>
                  <th>Sent</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(inv => {
                  const st = STATUS_STYLE[(inv.status as InvStatus)] ?? STATUS_STYLE.Pending;
                  const Icon = st.icon;
                  return (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 500, fontSize: 13 }}>{inv.email}</td>
                      <td style={{ fontSize: 12 }}>{inv.suggestedRole ?? "—"}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{inv.eventName ?? "—"}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—"}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : "—"}</td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: st.bg, border: `1px solid ${st.border}`, color: st.color }}>
                          <Icon size={11} /> {st.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          {inv.status === "Pending" && (
                            <>
                              <button className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 5 }} onClick={() => copyLink(inv)}>
                                {copied === inv.id ? <Check size={12} /> : <Copy size={12} />}
                                {copied === inv.id ? "Copied" : "Copy"}
                              </button>
                              <button className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 5, color: "#F87171" }} onClick={() => handleRevoke(inv.id)}>
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No invitations sent yet</td></tr>
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
