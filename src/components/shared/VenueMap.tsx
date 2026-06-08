"use client";
import { useState } from "react";
import { VENUES, type Venue, type Zone } from "@/data/venues";

interface Props {
  venueId: string;
  selectedZones: string[];
  onToggle: (zoneId: string) => void;
  readOnly?: boolean;
}

function buildSvg(venue: Venue, selectedIds: string[], onToggle: (id: string) => void, readOnly?: boolean) {
  return (
    <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" width="100%" style={{ display: "block" }}>
      <rect width="400" height="260" rx="8" fill="none" />
      {venue.zones.map(z => {
        const sel = selectedIds.includes(z.id);
        const cx = z.sx + z.sw / 2;
        const cy = z.sy + z.sh / 2;
        const narrow = z.sw < z.sh * 0.65;
        const fs = Math.min(Math.max(Math.min(z.sw, z.sh) / 3.5, 7), 11);
        const words = z.label.split(" ").slice(0, 2);

        return (
          <g
            key={z.id}
            className={`vzone${sel ? " vzone-sel" : ""}`}
            style={{ "--zc": z.color, cursor: readOnly ? "default" : "pointer" } as React.CSSProperties}
            onClick={() => !readOnly && onToggle(z.id)}
          >
            <rect
              className="vzone-rect"
              x={z.sx} y={z.sy} width={z.sw} height={z.sh} rx={4}
            />
            {narrow ? (
              <text
                transform={`rotate(-90 ${cx} ${cy})`}
                x={cx} y={cy}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={fs} fontFamily="DM Sans,sans-serif" fontWeight="600"
                className="vzone-label" style={{ pointerEvents: "none" }}
              >
                {z.label.slice(0, 10)}
              </text>
            ) : z.sh < 36 || words.length === 1 ? (
              <text
                x={cx} y={cy}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={fs} fontFamily="DM Sans,sans-serif" fontWeight="600"
                className="vzone-label" style={{ pointerEvents: "none" }}
              >
                {words[0]}
              </text>
            ) : (
              <text
                textAnchor="middle" fontSize={fs} fontFamily="DM Sans,sans-serif"
                fontWeight="600" className="vzone-label" style={{ pointerEvents: "none" }}
              >
                <tspan x={cx} y={cy - (fs + 2) / 2}>{words[0]}</tspan>
                <tspan x={cx} y={cy + (fs + 2) / 2}>{words[1]}</tspan>
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function VenueMap({ venueId, selectedZones, onToggle, readOnly }: Props) {
  const venue = VENUES.find(v => v.id === venueId);
  if (!venue) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="venue-map-container">
        {buildSvg(venue, selectedZones, onToggle, readOnly)}
      </div>

      {!readOnly && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
          Click zones on the map or cards below to select access areas
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {venue.zones.map(z => {
          const sel = selectedZones.includes(z.id);
          return (
            <div
              key={z.id}
              onClick={() => !readOnly && onToggle(z.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                border: `1px solid ${sel ? z.color : "var(--border)"}`,
                borderRadius: "var(--radius-sm)",
                background: sel ? `${z.color}18` : "var(--surface-3)",
                cursor: readOnly ? "default" : "pointer",
                transition: "var(--transition)",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: sel ? z.color : "var(--text-primary)" }}>{z.label}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{z.desc}</div>
              </div>
              {sel && (
                <span style={{ fontSize: 14, color: z.color }}>✓</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function VenueSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="form-control" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">— Select venue —</option>
      {VENUES.map(v => (
        <option key={v.id} value={v.id}>{v.name}</option>
      ))}
    </select>
  );
}
