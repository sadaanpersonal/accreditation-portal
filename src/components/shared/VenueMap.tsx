"use client";
import { useState } from "react";

interface Zone {
  id: string; label: string; desc: string; color: string;
  sx: number; sy: number; sw: number; sh: number;
}
interface Venue { id: string; name: string; zones: Zone[]; }

const VENUES: Venue[] = [
  {
    id: "al-bayt", name: "Al Bayt Stadium",
    zones: [
      { id: "field", label: "Playing Field", desc: "Pitch & athlete tunnel",   color: "#4ADE80", sx: 60,  sy: 70,  sw: 280, sh: 120 },
      { id: "north", label: "North Stand",   desc: "General public seating",   color: "#A78BFA", sx: 60,  sy: 10,  sw: 280, sh: 60  },
      { id: "south", label: "South Stand",   desc: "General public seating",   color: "#34D399", sx: 60,  sy: 190, sw: 280, sh: 60  },
      { id: "vip",   label: "VIP Stand",     desc: "Hospitality & officials",  color: "#C9A84C", sx: 10,  sy: 10,  sw: 50,  sh: 240 },
      { id: "media", label: "Media Tribune", desc: "Accredited media seating", color: "#60A5FA", sx: 340, sy: 10,  sw: 50,  sh: 115 },
      { id: "press", label: "Press Box",     desc: "Broadcast & print media",  color: "#FB923C", sx: 340, sy: 125, sw: 50,  sh: 125 },
    ],
  },
  {
    id: "khalifa", name: "Khalifa International Stadium",
    zones: [
      { id: "track", label: "Track & Field", desc: "Competition running track", color: "#4ADE80", sx: 60,  sy: 70,  sw: 280, sh: 120 },
      { id: "north", label: "North Stand",   desc: "General seating",           color: "#A78BFA", sx: 60,  sy: 10,  sw: 280, sh: 60  },
      { id: "south", label: "South Stand",   desc: "General seating",           color: "#34D399", sx: 60,  sy: 190, sw: 280, sh: 60  },
      { id: "vip",   label: "VIP Suite",     desc: "Executive hospitality",     color: "#C9A84C", sx: 10,  sy: 10,  sw: 50,  sh: 120 },
      { id: "media", label: "Media Center",  desc: "Press & broadcast hub",     color: "#FB923C", sx: 10,  sy: 130, sw: 50,  sh: 120 },
      { id: "east",  label: "East Stand",    desc: "General seating east side", color: "#60A5FA", sx: 340, sy: 10,  sw: 50,  sh: 240 },
    ],
  },
  {
    id: "aquatics", name: "Hamad Aquatics Center",
    zones: [
      { id: "comp",   label: "Competition Pool", desc: "Main competition lanes",    color: "#38BDF8", sx: 10,  sy: 55,  sw: 225, sh: 130 },
      { id: "warmup", label: "Warm-up Pool",     desc: "Athlete preparation area",  color: "#34D399", sx: 245, sy: 55,  sw: 145, sh: 130 },
      { id: "off",    label: "Officials Area",   desc: "Judges & timing officials", color: "#A78BFA", sx: 10,  sy: 10,  sw: 380, sh: 45  },
      { id: "vip",    label: "VIP Gallery",      desc: "Hospitality seating",       color: "#C9A84C", sx: 10,  sy: 190, sw: 380, sh: 40  },
      { id: "media",  label: "Media Zone",       desc: "Press & broadcast area",    color: "#60A5FA", sx: 10,  sy: 232, sw: 380, sh: 22  },
    ],
  },
  {
    id: "arena", name: "Ali Bin Hamad Al-Attiyah Arena",
    zones: [
      { id: "court", label: "Court",       desc: "Playing surface",    color: "#FB923C", sx: 60,  sy: 60,  sw: 280, sh: 140 },
      { id: "north", label: "North Stand", desc: "Spectator seating",  color: "#A78BFA", sx: 60,  sy: 10,  sw: 280, sh: 50  },
      { id: "south", label: "South Stand", desc: "Spectator seating",  color: "#34D399", sx: 60,  sy: 200, sw: 280, sh: 50  },
      { id: "vip",   label: "VIP Suite",   desc: "Premium hospitality",color: "#C9A84C", sx: 10,  sy: 10,  sw: 50,  sh: 240 },
      { id: "media", label: "Media Box",   desc: "Press & commentary", color: "#60A5FA", sx: 340, sy: 10,  sw: 50,  sh: 240 },
    ],
  },
  {
    id: "qncc", name: "Qatar National Convention Centre",
    zones: [
      { id: "hall",  label: "Main Hall",  desc: "Main ceremony & events", color: "#A78BFA", sx: 130, sy: 10,  sw: 140, sh: 240 },
      { id: "vip",   label: "VIP Lounge", desc: "Executive reception",    color: "#C9A84C", sx: 10,  sy: 10,  sw: 120, sh: 120 },
      { id: "back",  label: "Backstage",  desc: "Performer & crew area",  color: "#34D399", sx: 10,  sy: 130, sw: 120, sh: 120 },
      { id: "media", label: "Media Room", desc: "Press conference area",  color: "#60A5FA", sx: 270, sy: 10,  sw: 120, sh: 120 },
      { id: "expo",  label: "Exhibition", desc: "Display & demo area",    color: "#FB923C", sx: 270, sy: 130, sw: 120, sh: 120 },
    ],
  },
];

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
