"use client";
import { useEffect, useRef, useState } from "react";
import { Plus, Copy, Trash2, Loader, Check, MousePointerClick, Move } from "lucide-react";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import type { VenueDto, SaveVenuePayload } from "@/lib/api";

/* ── Canvas constants ──────────────────────────────────────────────────────
   Zones are stored in a canonical 400×260 coordinate space (same space the
   request-form venue map renders), displayed here scaled-up with a grid.   */
const CANVAS_W = 400;
const CANVAS_H = 260;
const SNAP   = 5;
const MIN_W  = 20;
const MIN_H  = 14;

const ZONE_COLORS = [
  "#C9A84C", "#60A5FA", "#A78BFA", "#34D399", "#4ADE80",
  "#FB923C", "#F472B6", "#38BDF8", "#F87171", "#9CA3AF",
];

export interface DesignZone {
  uid:         string;
  label:       string;
  description: string;
  color:       string;
  x:           number;
  y:           number;
  width:       number;
  height:      number;
  capacity:    number | null;
}

type ResizeDir = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface DragState {
  mode:   "move" | "resize";
  dir?:   ResizeDir;
  uid:    string;
  startX: number;
  startY: number;
  orig:   { x: number; y: number; width: number; height: number };
}

let uidCounter = 0;
const nextUid = () => `dz-${++uidCounter}`;

const snap  = (v: number) => Math.round(v / SNAP) * SNAP;
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

interface Props {
  /** Existing venue when editing; null/undefined when creating. */
  initial?: VenueDto | null;
  saving?: boolean;
  onSave: (payload: SaveVenuePayload) => void;
  onCancel: () => void;
}

export function VenueDesigner({ initial, saving, onSave, onCancel }: Props) {
  const [name,        setName]        = useState("");
  const [location,    setLocation]    = useState("");
  const [description, setDescription] = useState("");
  const [zones,       setZones]       = useState<DesignZone[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [nameError,   setNameError]   = useState("");

  const svgRef  = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);

  // Prefill when editing
  useEffect(() => {
    if (!initial) return;
    setName(initial.name ?? "");
    setLocation(initial.location ?? "");
    setDescription(initial.description ?? "");
    setZones(initial.zones.map(z => ({
      uid:         nextUid(),
      label:       z.label,
      description: z.description ?? "",
      color:       z.color || "#C9A84C",
      x:           z.x,
      y:           z.y,
      width:       z.width,
      height:      z.height,
      capacity:    z.capacity ?? null,
    })));
  }, [initial]);

  const selected = zones.find(z => z.uid === selectedUid) ?? null;

  /* ── Coordinate helpers ─────────────────────────────────────────────── */
  function toCanvasPoint(e: React.PointerEvent): { x: number; y: number } {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width)  * CANVAS_W,
      y: ((e.clientY - rect.top)  / rect.height) * CANVAS_H,
    };
  }

  /* ── Zone CRUD ──────────────────────────────────────────────────────── */
  function updateZone(uid: string, patch: Partial<DesignZone>) {
    setZones(prev => prev.map(z => (z.uid === uid ? { ...z, ...patch } : z)));
  }

  function addZone() {
    const zone: DesignZone = {
      uid:         nextUid(),
      label:       `Zone ${zones.length + 1}`,
      description: "",
      color:       ZONE_COLORS[zones.length % ZONE_COLORS.length],
      x:           snap(CANVAS_W / 2 - 50) + (zones.length % 4) * SNAP,
      y:           snap(CANVAS_H / 2 - 30) + (zones.length % 4) * SNAP,
      width:       100,
      height:      60,
      capacity:    null,
    };
    setZones(prev => [...prev, zone]);
    setSelectedUid(zone.uid);
  }

  function duplicateZone(uid: string) {
    const src = zones.find(z => z.uid === uid);
    if (!src) return;
    const copy: DesignZone = {
      ...src,
      uid:   nextUid(),
      label: `${src.label} copy`,
      x:     clamp(src.x + 10, 0, CANVAS_W - src.width),
      y:     clamp(src.y + 10, 0, CANVAS_H - src.height),
    };
    setZones(prev => [...prev, copy]);
    setSelectedUid(copy.uid);
  }

  function removeZone(uid: string) {
    setZones(prev => prev.filter(z => z.uid !== uid));
    setSelectedUid(s => (s === uid ? null : s));
  }

  /* ── Drag / resize ──────────────────────────────────────────────────── */
  function startMove(e: React.PointerEvent, uid: string) {
    e.preventDefault();
    e.stopPropagation();
    const z = zones.find(x => x.uid === uid)!;
    const pt = toCanvasPoint(e);
    dragRef.current = { mode: "move", uid, startX: pt.x, startY: pt.y, orig: { x: z.x, y: z.y, width: z.width, height: z.height } };
    setSelectedUid(uid);
    svgRef.current?.setPointerCapture(e.pointerId);
  }

  function startResize(e: React.PointerEvent, uid: string, dir: ResizeDir) {
    e.preventDefault();
    e.stopPropagation();
    const z = zones.find(x => x.uid === uid)!;
    const pt = toCanvasPoint(e);
    dragRef.current = { mode: "resize", dir, uid, startX: pt.x, startY: pt.y, orig: { x: z.x, y: z.y, width: z.width, height: z.height } };
    svgRef.current?.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const pt = toCanvasPoint(e);
    const dx = pt.x - drag.startX;
    const dy = pt.y - drag.startY;
    const o  = drag.orig;

    if (drag.mode === "move") {
      updateZone(drag.uid, {
        x: clamp(snap(o.x + dx), 0, CANVAS_W - o.width),
        y: clamp(snap(o.y + dy), 0, CANVAS_H - o.height),
      });
      return;
    }

    // Resize: adjust the edges named by dir
    let { x, y, width: w, height: h } = o;
    const d = drag.dir!;
    if (d.includes("e")) w = o.width + dx;
    if (d.includes("s")) h = o.height + dy;
    if (d.includes("w")) { x = o.x + dx; w = o.width - dx; }
    if (d.includes("n")) { y = o.y + dy; h = o.height - dy; }

    // Snap edges, enforce minimum size, keep inside the canvas
    x = snap(x); y = snap(y); w = snap(w); h = snap(h);
    if (w < MIN_W) { if (d.includes("w")) x = o.x + o.width - MIN_W; w = MIN_W; }
    if (h < MIN_H) { if (d.includes("n")) y = o.y + o.height - MIN_H; h = MIN_H; }
    if (x < 0) { w += x; x = 0; }
    if (y < 0) { h += y; y = 0; }
    if (x + w > CANVAS_W) w = CANVAS_W - x;
    if (y + h > CANVAS_H) h = CANVAS_H - y;

    updateZone(drag.uid, { x, y, width: w, height: h });
  }

  function endDrag(e: React.PointerEvent) {
    if (dragRef.current) svgRef.current?.releasePointerCapture(e.pointerId);
    dragRef.current = null;
  }

  /* ── Keyboard: nudge with arrows, Delete to remove ──────────────────── */
  function onKeyDown(e: React.KeyboardEvent) {
    if (!selected) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    const step = e.shiftKey ? 1 : SNAP;
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); removeZone(selected.uid); }
    else if (e.key === "ArrowLeft")  { e.preventDefault(); updateZone(selected.uid, { x: clamp(selected.x - step, 0, CANVAS_W - selected.width) }); }
    else if (e.key === "ArrowRight") { e.preventDefault(); updateZone(selected.uid, { x: clamp(selected.x + step, 0, CANVAS_W - selected.width) }); }
    else if (e.key === "ArrowUp")    { e.preventDefault(); updateZone(selected.uid, { y: clamp(selected.y - step, 0, CANVAS_H - selected.height) }); }
    else if (e.key === "ArrowDown")  { e.preventDefault(); updateZone(selected.uid, { y: clamp(selected.y + step, 0, CANVAS_H - selected.height) }); }
  }

  /* ── Save ───────────────────────────────────────────────────────────── */
  function handleSave() {
    if (!name.trim()) { setNameError("Venue name is required."); return; }
    setNameError("");
    onSave({
      name:        name.trim(),
      location:    location.trim() || undefined,
      description: description.trim() || undefined,
      zones: zones.map(z => ({
        label:       z.label.trim() || "Zone",
        description: z.description.trim() || undefined,
        color:       z.color,
        x:           Math.round(z.x * 10) / 10,
        y:           Math.round(z.y * 10) / 10,
        width:       Math.round(z.width * 10) / 10,
        height:      Math.round(z.height * 10) / 10,
        capacity:    z.capacity,
      })),
    });
  }

  /* ── Resize handle positions for the selected zone ──────────────────── */
  function handles(z: DesignZone): { dir: ResizeDir; cx: number; cy: number; cursor: string }[] {
    const { x, y, width: w, height: h } = z;
    return [
      { dir: "nw", cx: x,         cy: y,         cursor: "nwse-resize" },
      { dir: "n",  cx: x + w / 2, cy: y,         cursor: "ns-resize"   },
      { dir: "ne", cx: x + w,     cy: y,         cursor: "nesw-resize" },
      { dir: "e",  cx: x + w,     cy: y + h / 2, cursor: "ew-resize"   },
      { dir: "se", cx: x + w,     cy: y + h,     cursor: "nwse-resize" },
      { dir: "s",  cx: x + w / 2, cy: y + h,     cursor: "ns-resize"   },
      { dir: "sw", cx: x,         cy: y + h,     cursor: "nesw-resize" },
      { dir: "w",  cx: x,         cy: y + h / 2, cursor: "ew-resize"   },
    ];
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} onKeyDown={onKeyDown} tabIndex={-1}>

      {/* ── Venue details ─────────────────────────────────────────────── */}
      <GlassCard>
        <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Venue Details</h2></CardHeader>
        <CardBody>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Venue Name *</label>
              <input className="form-control" placeholder="e.g. Lusail Stadium" value={name} onChange={e => { setName(e.target.value); setNameError(""); }} />
              {nameError && <span style={{ fontSize: 11, color: "#F87171" }}>{nameError}</span>}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Location</label>
              <input className="form-control" placeholder="e.g. Lusail, Qatar" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0, gridColumn: "1 / -1" }}>
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} style={{ resize: "vertical" }} placeholder="Optional description…" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>
        </CardBody>
      </GlassCard>

      {/* ── Designer: canvas + side panel ─────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>

        {/* Canvas */}
        <GlassCard>
          <CardHeader>
            <h2 style={{ fontSize: 14, fontWeight: 600 }}>Zone Map</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{zones.length} zone{zones.length === 1 ? "" : "s"}</span>
              <button className="btn btn-primary btn-sm" onClick={addZone} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={14} /> Add Zone
              </button>
            </div>
          </CardHeader>
          <CardBody>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, color: "var(--text-muted)", marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MousePointerClick size={12} /> Click to select</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Move size={12} /> Drag to move · corners to resize</span>
              <span>Arrows nudge · Delete removes</span>
            </div>

            <div style={{ width: "100%", aspectRatio: `${CANVAS_W} / ${CANVAS_H}`, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-strong)", background: "var(--surface-2)" }}>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
                width="100%"
                height="100%"
                style={{ display: "block", touchAction: "none" }}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerLeave={endDrag}
                onPointerDown={() => setSelectedUid(null)}
              >
                {/* Grid */}
                <defs>
                  <pattern id="vd-grid" width={SNAP * 4} height={SNAP * 4} patternUnits="userSpaceOnUse">
                    <path d={`M ${SNAP * 4} 0 L 0 0 0 ${SNAP * 4}`} fill="none" stroke="rgba(201,168,76,0.08)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width={CANVAS_W} height={CANVAS_H} fill="url(#vd-grid)" />

                {/* Zones */}
                {zones.map(z => {
                  const isSel  = z.uid === selectedUid;
                  const cx     = z.x + z.width / 2;
                  const cy     = z.y + z.height / 2;
                  const narrow = z.width < z.height * 0.65;
                  const fs     = Math.min(Math.max(Math.min(z.width, z.height) / 3.5, 6), 11);
                  return (
                    <g key={z.uid}>
                      <rect
                        x={z.x} y={z.y} width={z.width} height={z.height} rx={4}
                        fill={`${z.color}26`}
                        stroke={z.color}
                        strokeWidth={isSel ? 2 : 1.2}
                        strokeDasharray={isSel ? "none" : undefined}
                        style={{ cursor: "move" }}
                        onPointerDown={e => startMove(e, z.uid)}
                      />
                      <text
                        x={cx} y={cy}
                        transform={narrow ? `rotate(-90 ${cx} ${cy})` : undefined}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize={fs} fontFamily="DM Sans, sans-serif" fontWeight={600}
                        fill={z.color}
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {z.label.slice(0, narrow ? 12 : 24)}
                      </text>

                      {/* Resize handles */}
                      {isSel && handles(z).map(h => (
                        <rect
                          key={h.dir}
                          x={h.cx - 3} y={h.cy - 3} width={6} height={6} rx={1.5}
                          fill="var(--surface-1)"
                          stroke={z.color}
                          strokeWidth={1.2}
                          style={{ cursor: h.cursor }}
                          onPointerDown={e => startResize(e, z.uid, h.dir)}
                        />
                      ))}
                    </g>
                  );
                })}

                {zones.length === 0 && (
                  <text x={CANVAS_W / 2} y={CANVAS_H / 2} textAnchor="middle" dominantBaseline="middle" fontSize={12} fill="var(--text-muted)" fontFamily="DM Sans, sans-serif">
                    No zones yet — click “Add Zone” to start designing
                  </text>
                )}
              </svg>
            </div>
          </CardBody>
        </GlassCard>

        {/* Side panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <GlassCard>
            <CardHeader><h3 style={{ fontSize: 13, fontWeight: 600 }}>{selected ? "Zone Details" : "Zones"}</h3></CardHeader>
            <CardBody style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {selected ? (
                <>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Label *</label>
                    <input className="form-control" value={selected.label} onChange={e => updateZone(selected.uid, { label: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Description</label>
                    <input className="form-control" placeholder="e.g. Press & broadcast area" value={selected.description} onChange={e => updateZone(selected.uid, { description: e.target.value })} />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Capacity</label>
                    <input
                      className="form-control"
                      type="number"
                      min={0}
                      placeholder="Unlimited"
                      value={selected.capacity ?? ""}
                      onChange={e => {
                        const v = e.target.value.trim();
                        updateZone(selected.uid, { capacity: v === "" ? null : Math.max(0, Number(v)) });
                      }}
                    />
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Max accreditations for this zone. Leave blank for unlimited.</span>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Colour</label>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {ZONE_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => updateZone(selected.uid, { color: c })}
                          title={c}
                          style={{
                            width: 22, height: 22, borderRadius: 6, cursor: "pointer", background: c,
                            border: selected.color === c ? "2px solid var(--text-primary)" : "2px solid transparent",
                          }}
                        />
                      ))}
                      <label title="Custom colour" style={{ position: "relative", width: 22, height: 22, borderRadius: 6, cursor: "pointer", border: "1.5px dashed var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        <input
                          type="color"
                          value={selected.color}
                          onChange={e => updateZone(selected.uid, { color: e.target.value })}
                          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                        />
                        <span style={{ fontSize: 12, color: "var(--text-muted)", pointerEvents: "none" }}>+</span>
                      </label>
                    </div>
                  </div>

                  {/* Geometry */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {([["X", "x"], ["Y", "y"], ["Width", "width"], ["Height", "height"]] as const).map(([lbl, key]) => (
                      <div className="form-group" style={{ margin: 0 }} key={key}>
                        <label className="form-label">{lbl}</label>
                        <input
                          className="form-control"
                          type="number"
                          value={Math.round(selected[key])}
                          onChange={e => {
                            const v = Number(e.target.value);
                            if (Number.isNaN(v)) return;
                            if (key === "x")      updateZone(selected.uid, { x: clamp(v, 0, CANVAS_W - selected.width) });
                            if (key === "y")      updateZone(selected.uid, { y: clamp(v, 0, CANVAS_H - selected.height) });
                            if (key === "width")  updateZone(selected.uid, { width: clamp(v, MIN_W, CANVAS_W - selected.x) });
                            if (key === "height") updateZone(selected.uid, { height: clamp(v, MIN_H, CANVAS_H - selected.y) });
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => duplicateZone(selected.uid)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <Copy size={13} /> Duplicate
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => removeZone(selected.uid)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, color: "#F87171" }}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                  Select a zone on the map to edit its label, colour and size — or add a new one.
                </p>
              )}
            </CardBody>
          </GlassCard>

          {/* Zone list */}
          {zones.length > 0 && (
            <GlassCard>
              <CardHeader><h3 style={{ fontSize: 13, fontWeight: 600 }}>All Zones ({zones.length})</h3></CardHeader>
              <CardBody style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto" }}>
                {zones.map(z => (
                  <div
                    key={z.uid}
                    onClick={() => setSelectedUid(z.uid)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                      borderRadius: 8, cursor: "pointer",
                      border: `1px solid ${z.uid === selectedUid ? z.color : "var(--border)"}`,
                      background: z.uid === selectedUid ? `${z.color}14` : "var(--surface-3)",
                    }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: z.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{z.label}</span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>{Math.round(z.width)}×{Math.round(z.height)}</span>
                  </div>
                ))}
              </CardBody>
            </GlassCard>
          )}
        </div>
      </div>

      {/* ── Actions ───────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {saving
            ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
            : <><Check size={14} /> {initial ? "Save Changes" : "Create Venue"}</>}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
