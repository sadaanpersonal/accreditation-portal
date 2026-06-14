"use client";
import { Select } from "@/components/ui/Select";
import type { VenueDto, VenueZoneDto } from "@/lib/api";

/* Venues and their zone layouts are managed by admins at /admin/venues and
   loaded from the API — this component just renders a venue's zones. Zones
   are identified by their id; coordinates live in a 400×260 canvas space. */

interface MapProps {
  venue: VenueDto | null | undefined;
  selectedZones: string[];           // selected zone ids
  onToggle: (zoneId: string) => void;
  readOnly?: boolean;
}

function zoneId(z: VenueZoneDto, idx: number): string {
  return z.id ?? `zone-${idx}`;
}

function buildSvg(venue: VenueDto, selectedIds: string[], onToggle: (id: string) => void, readOnly?: boolean) {
  return (
    <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" width="100%" style={{ display: "block" }}>
      <rect width="400" height="260" rx="8" fill="none" />
      {venue.zones.map((z, idx) => {
        const id  = zoneId(z, idx);
        const sel = selectedIds.includes(id);
        const cx = z.x + z.width / 2;
        const cy = z.y + z.height / 2;
        const narrow = z.width < z.height * 0.65;
        const fs = Math.min(Math.max(Math.min(z.width, z.height) / 3.5, 7), 11);
        const words = z.label.split(" ").slice(0, 2);

        return (
          <g
            key={id}
            className={`vzone${sel ? " vzone-sel" : ""}`}
            style={{ "--zc": z.color, cursor: readOnly ? "default" : "pointer" } as React.CSSProperties}
            onClick={() => !readOnly && onToggle(id)}
          >
            <rect
              className="vzone-rect"
              x={z.x} y={z.y} width={z.width} height={z.height} rx={4}
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
            ) : z.height < 36 || words.length === 1 ? (
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

export function VenueMap({ venue, selectedZones, onToggle, readOnly }: MapProps) {
  if (!venue || venue.zones.length === 0) return null;

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
        {venue.zones.map((z, idx) => {
          const id  = zoneId(z, idx);
          const sel = selectedZones.includes(id);
          return (
            <div
              key={id}
              onClick={() => !readOnly && onToggle(id)}
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
                {z.description && <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{z.description}</div>}
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

interface SelectProps {
  venues: VenueDto[];
  value: string;                     // venue id
  onChange: (venueId: string) => void;
  loading?: boolean;
}

export function VenueSelect({ venues, value, onChange, loading }: SelectProps) {
  return (
    <Select
      options={venues.map(v => ({ value: v.id, label: v.name }))}
      value={value}
      onChange={v => onChange(v)}
      placeholder={loading ? "Loading venues…" : "— Select venue —"}
      isDisabled={loading}
      isSearchable
    />
  );
}
