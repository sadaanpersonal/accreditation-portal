"use client";
import { Bell, CheckCircle, Info, XCircle, ArrowRight, Upload, Shield, Calendar } from "lucide-react";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { ADMIN_NOTIFICATIONS, type NotifIcon } from "@/data/notifications";

const ICON_MAP: Record<NotifIcon, React.ElementType> = {
  info: Info, check: CheckCircle, x: XCircle, arrow: ArrowRight,
  upload: Upload, shield: Shield, bell: Bell, calendar: Calendar,
};

const COLOR_MAP = {
  gold: "var(--gold)", green: "#22C55E", red: "#F87171", blue: "#60A5FA", purple: "#A78BFA",
};

export default function AdminNotificationsPage() {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <Bell size={20} /> Admin Notifications
      </h1>
      <GlassCard>
        <CardHeader>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{ADMIN_NOTIFICATIONS.length} notifications</span>
          <button className="btn btn-secondary btn-sm">Mark all read</button>
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {ADMIN_NOTIFICATIONS.map((n, i) => {
            const Icon = ICON_MAP[n.icon] ?? Info;
            const color = COLOR_MAP[n.iconColor] ?? "var(--gold)";
            return (
              <div key={n.id} style={{
                display: "flex", gap: 12, padding: "14px 18px",
                borderBottom: i < ADMIN_NOTIFICATIONS.length - 1 ? "1px solid var(--border)" : "none",
                background: n.unread ? "rgba(201,168,76,0.04)" : "transparent",
              }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{n.title}</span>
                    {n.unread && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", flexShrink: 0 }} />}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>{n.body}</p>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>{n.time}</span>
                </div>
              </div>
            );
          })}
        </CardBody>
      </GlassCard>
    </div>
  );
}
