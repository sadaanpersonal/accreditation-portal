"use client";
import { Calendar, MapPin, Users, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Event } from "@/data/events";

interface Props {
  event: Event;
  href?: string;
  onApply?: () => void;
  applied?: boolean;
}

export function EventCard({ event, href, onApply, applied }: Props) {
  const isActive = event.status === "active";
  const isCompleted = event.status === "completed";
  const statusColor = isActive ? "#22C55E" : event.status === "upcoming" ? "#F59E0B" : "#6B7280";
  const statusLabel = isActive ? "Open" : event.status === "upcoming" ? "Upcoming" : "Closed";

  const inner = (
    <div className="glass-card" style={{ overflow: "hidden", cursor: href ? "pointer" : "default", transition: "var(--transition)" }}>
      <div style={{ height: 6, background: event.color }} />
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0,
              lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{event.name}</h3>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "3px 8px", borderRadius: 20, border: `1px solid ${statusColor}40`,
            color: statusColor, background: `${statusColor}18`, flexShrink: 0,
          }}>{statusLabel}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
            <Calendar size={13} style={{ color: event.accentColor, flexShrink: 0 }} />
            <span>{event.dates}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
            <MapPin size={13} style={{ color: event.accentColor, flexShrink: 0 }} />
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{event.location}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
            <Users size={13} style={{ color: event.accentColor, flexShrink: 0 }} />
            <span>{event.accreditations.toLocaleString()} accredited</span>
          </div>
        </div>

        {onApply && (
          <button
            className={`btn btn-sm${applied ? " btn-secondary" : " btn-primary"}`}
            style={{ width: "100%" }}
            onClick={e => { e.preventDefault(); onApply(); }}
            disabled={applied || isCompleted}
          >
            {applied ? "Applied" : isCompleted ? "Closed" : "Apply Now"}
          </button>
        )}

        {href && !onApply && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, fontSize: 12, color: event.accentColor }}>
            <span>View details</span>
            <ChevronRight size={14} />
          </div>
        )}
      </div>
    </div>
  );

  if (href) return <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link>;
  return inner;
}
