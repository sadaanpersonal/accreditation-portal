"use client";
import { Calendar, MapPin, Users, ChevronRight, Shield, MoreHorizontal } from "lucide-react";
import Link from "next/link";

export interface EventCardData {
  id:            string;
  name:          string;
  dates:         string;
  location:      string;
  status:        "active" | "upcoming" | "completed";
  accreditations: number;
  moiRequired?:  boolean;
  color:         string;
  accentColor:   string;
}

interface Props {
  event:    EventCardData;
  href?:    string;
  onApply?: () => void;
  applied?: boolean;
  listView?: boolean;
}

export function EventCard({ event, href, onApply, applied, listView }: Props) {
  const isActive    = event.status === "active";
  const isCompleted = event.status === "completed";
  const statusColor = isActive ? "#22C55E" : event.status === "upcoming" ? "#F59E0B" : "#6B7280";
  const statusLabel = isActive ? "Open" : event.status === "upcoming" ? "Upcoming" : "Closed";

  // ── List row ───────────────────────────────────────────────────
  if (listView) {
    const inner = (
      <div style={{
        display: "flex", alignItems: "center", gap: 0,
        background: "var(--surface-1)", border: "1px solid var(--border)",
        borderRadius: 12, overflow: "hidden",
        cursor: href ? "pointer" : "default",
        transition: "border-color 0.15s",
      }}>
        {/* Colour accent strip */}
        <div style={{ width: 5, alignSelf: "stretch", background: event.color, flexShrink: 0 }} />

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {/* Name + badges */}
          <div style={{ flex: "1 1 220px", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {event.name}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                padding: "2px 7px", borderRadius: 20, flexShrink: 0,
                border: `1px solid ${statusColor}40`, color: statusColor, background: `${statusColor}18`,
              }}>{statusLabel}</span>
              {event.moiRequired && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 3,
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                  padding: "2px 7px", borderRadius: 20, flexShrink: 0,
                  border: "1px solid rgba(201,168,76,0.35)",
                  color: "var(--gold)", background: "rgba(201,168,76,0.1)",
                }}>
                  <Shield size={9} /> MOI
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-muted)" }}>
                <Calendar size={11} style={{ color: event.accentColor }} /> {event.dates}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-muted)" }}>
                <MapPin size={11} style={{ color: event.accentColor }} /> {event.location}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <Users size={13} style={{ color: event.accentColor }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{event.accreditations.toLocaleString()}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>accredited</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "0 14px", flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
          {onApply && (
            <button
              className={`btn btn-sm${applied ? " btn-secondary" : " btn-primary"}`}
              onClick={e => { e.preventDefault(); onApply(); }}
              disabled={applied || isCompleted}
            >
              {applied ? "Applied" : isCompleted ? "Closed" : "Apply Now"}
            </button>
          )}
          {href && !onApply && (
            <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: event.accentColor, fontWeight: 600 }}>
              View <ChevronRight size={13} />
            </div>
          )}
          {!href && !onApply && (
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex" }}>
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>
      </div>
    );

    if (href) return <Link href={href} style={{ textDecoration: "none", display: "block" }}>{inner}</Link>;
    return inner;
  }

  // ── Card (default) ─────────────────────────────────────────────
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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              padding: "3px 8px", borderRadius: 20, border: `1px solid ${statusColor}40`,
              color: statusColor, background: `${statusColor}18`,
            }}>{statusLabel}</span>
            {event.moiRequired && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                padding: "2px 7px", borderRadius: 20,
                border: "1px solid rgba(201,168,76,0.35)",
                color: "var(--gold)", background: "rgba(201,168,76,0.1)",
              }}>
                <Shield size={9} /> MOI
              </span>
            )}
          </div>
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
