"use client";
import { useState } from "react";
import { Send, Plus, Copy, Check, Mail, Clock, CheckCircle2, XCircle } from "lucide-react";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";

interface Invitation {
  id: string;
  email: string;
  role: string;
  event: string;
  sentDate: string;
  status: "pending" | "accepted" | "expired";
}

const SAMPLE: Invitation[] = [
  { id: "inv-1", email: "ahmed.rashid@gulf-athletics.qa", role: "Requestor", event: "Gulf Athletics Championship 2026", sentDate: "28 May 2026", status: "pending" },
  { id: "inv-2", email: "sara.almansouri@qoc.qa",         role: "Admin",     event: "Asian Games 2026 — Doha",         sentDate: "22 May 2026", status: "accepted" },
  { id: "inv-3", email: "khalid.hamed@mediaqatar.qa",     role: "Requestor", event: "Gulf Athletics Championship 2026", sentDate: "10 May 2026", status: "expired" },
  { id: "inv-4", email: "noor.ali@asianoc.org",           role: "Requestor", event: "Asian Games 2026 — Doha",         sentDate: "2 Jun 2026",  status: "pending" },
];

const STATUS_STYLE = {
  pending:  { color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)",  icon: Clock,          label: "Pending" },
  accepted: { color: "#22C55E", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)",   icon: CheckCircle2,   label: "Accepted" },
  expired:  { color: "#6B7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.3)", icon: XCircle,        label: "Expired" },
};

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>(SAMPLE);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Requestor");
  const [event, setEvent] = useState("Gulf Athletics Championship 2026");
  const [copied, setCopied] = useState<string | null>(null);

  function handleSend() {
    if (!email.trim()) return;
    const inv: Invitation = {
      id: `inv-${Date.now()}`,
      email: email.trim(),
      role,
      event,
      sentDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      status: "pending",
    };
    setInvitations(prev => [inv, ...prev]);
    setEmail("");
  }

  function copyLink(id: string) {
    navigator.clipboard.writeText(`https://accreditation.qoc.qa/invite/${id}`).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  const pendingCount  = invitations.filter(i => i.status === "pending").length;
  const acceptedCount = invitations.filter(i => i.status === "accepted").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Invitations</h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0" }}>
          {invitations.length} sent · {pendingCount} pending · {acceptedCount} accepted
        </p>
      </div>

      {/* Send invite */}
      <GlassCard>
        <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Send Invitation</h2></CardHeader>
        <CardBody>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                <input
                  className="form-control"
                  style={{ paddingLeft: 32, margin: 0 }}
                  type="email"
                  placeholder="user@organisation.qa"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                />
              </div>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Role</label>
              <select className="form-control" style={{ margin: 0 }} value={role} onChange={e => setRole(e.target.value)}>
                <option>Requestor</option>
                <option>Admin</option>
                <option>FA Owner</option>
                <option>Zone Owner</option>
                <option>Media Owner</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Event</label>
              <select className="form-control" style={{ margin: 0 }} value={event} onChange={e => setEvent(e.target.value)}>
                <option>Gulf Athletics Championship 2026</option>
                <option>Asian Games 2026 — Doha</option>
                <option>FIFA World Cup 2030 Qualifier</option>
              </select>
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-end", height: 42 }}
              onClick={handleSend}
              disabled={!email.trim()}
            >
              <Send size={13} /> Send
            </button>
          </div>
        </CardBody>
      </GlassCard>

      {/* Invite list */}
      <GlassCard>
        <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Sent Invitations</h2></CardHeader>
        <CardBody style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Event</th>
                <th>Sent</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invitations.map(inv => {
                const s = STATUS_STYLE[inv.status];
                const Icon = s.icon;
                return (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 500, fontSize: 13 }}>{inv.email}</td>
                    <td style={{ fontSize: 12 }}>{inv.role}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{inv.event}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{inv.sentDate}</td>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
                        background: s.bg, border: `1px solid ${s.border}`, color: s.color,
                      }}>
                        <Icon size={11} />
                        {s.label}
                      </span>
                    </td>
                    <td>
                      {inv.status === "pending" && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ display: "flex", alignItems: "center", gap: 5 }}
                          onClick={() => copyLink(inv.id)}
                        >
                          {copied === inv.id ? <Check size={12} /> : <Copy size={12} />}
                          {copied === inv.id ? "Copied" : "Copy link"}
                        </button>
                      )}
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
