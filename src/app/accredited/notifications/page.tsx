"use client";
import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCircle, Info, XCircle, Upload, Shield, Calendar, Loader } from "lucide-react";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { notificationsApi, type NotificationDto } from "@/lib/api";

function getNotifStyle(n: NotificationDto): { Icon: React.ElementType; color: string } {
  const t = ((n.type ?? "") + " " + (n.title ?? "")).toLowerCase();
  if (t.includes("approv") || t.includes("success") || t.includes("complet") || t.includes("issued"))
    return { Icon: CheckCircle, color: "#22C55E" };
  if (t.includes("reject") || t.includes("denied") || t.includes("revok") || t.includes("fail"))
    return { Icon: XCircle, color: "#F87171" };
  if (t.includes("upload") || t.includes("document") || t.includes("file"))
    return { Icon: Upload, color: "#818CF8" };
  if (t.includes("event") || t.includes("schedule") || t.includes("calendar"))
    return { Icon: Calendar, color: "#60A5FA" };
  if (t.includes("secur") || t.includes("permission") || t.includes("access") || t.includes("shield"))
    return { Icon: Shield, color: "var(--gold)" };
  if (t.includes("info") || t.includes("request") || t.includes("review") || t.includes("pending"))
    return { Icon: Info, color: "#F59E0B" };
  return { Icon: Bell, color: "var(--gold)" };
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1)   return "just now";
  if (diffMins < 60)  return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24)   return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7)   return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function AccreditedNotificationsPage() {
  const [items,      setItems]      = useState<NotificationDto[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await notificationsApi.list({ pageSize: 50, pageNumber: 1 });
    setLoading(false);
    if (res.success && res.data) setItems(res.data.items);
    else setError(res.message ?? "Failed to load notifications.");
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markAllRead() {
    setMarkingAll(true);
    await notificationsApi.markAllRead();
    setMarkingAll(false);
    setItems(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    await notificationsApi.markRead(id);
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  const unreadCount = items.filter(n => !n.read).length;

  return (
    <div style={{ maxWidth: 840, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <Bell size={20} /> Notifications
      </h1>
      <GlassCard>
        <CardHeader>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {loading ? "Loading…" : `${items.length} notification${items.length !== 1 ? "s" : ""}${unreadCount > 0 ? ` · ${unreadCount} unread` : ""}`}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={markAllRead}
            disabled={markingAll || unreadCount === 0}
          >
            {markingAll ? "Marking…" : "Mark all read"}
          </button>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 24px", color: "var(--text-muted)", gap: 10 }}>
              <Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Loading notifications…
            </div>
          ) : error ? (
            <div style={{ padding: 24, textAlign: "center", color: "#F87171" }}>
              {error}
              <button className="btn btn-secondary btn-sm" onClick={load} style={{ display: "block", margin: "10px auto 0" }}>Retry</button>
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--text-muted)" }}>
              <Bell size={28} style={{ margin: "0 auto 10px", display: "block", opacity: 0.4 }} />
              <div style={{ fontWeight: 600 }}>No notifications</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>You&apos;re all caught up</div>
            </div>
          ) : (
            items.map((n, i) => {
              const { Icon, color } = getNotifStyle(n);
              return (
                <div
                  key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  style={{
                    display: "flex", gap: 12, padding: "14px 18px",
                    borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none",
                    background: !n.read ? "rgba(201,168,76,0.04)" : "transparent",
                    cursor: !n.read ? "pointer" : "default",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: `${color}18`, display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0, marginTop: 2,
                  }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{n.title}</span>
                      {!n.read && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", flexShrink: 0 }} />}
                    </div>
                    {n.message && (
                      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>{n.message}</p>
                    )}
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </CardBody>
      </GlassCard>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
