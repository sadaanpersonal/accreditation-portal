"use client";
import { useState, useEffect, type ReactNode } from "react";
import { X, Check, Calendar, Shield, Palette, Tag, Loader, Pipette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { eventsApi, venuesApi, type EventDto, type VenueDto } from "@/lib/api";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";

/** Today at 00:00 local — start dates may not be before this. */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Parse a yyyy-MM-dd string to a local Date (no tz drift), or null. */
function parseDate(value?: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
  /** When provided, the modal is in edit mode and updates this event. */
  event?: EventDto | null;
}

// `value` is the canonical hex stored on the event (self-describing for future
// card theming); `color`/`accent` drive the swatch + preview banner.
const THEMES = [
  { label: "Maroon",  color: "linear-gradient(135deg,#4A0A1E,#8B1A3A)", accent: "#C9A84C", value: "#8B1A3A" },
  { label: "Blue",    color: "linear-gradient(135deg,#0D2B5C,#2060B0)", accent: "#60A5FA", value: "#2060B0" },
  { label: "Purple",  color: "linear-gradient(135deg,#3B1E6B,#6D3ABF)", accent: "#A78BFA", value: "#6D3ABF" },
  { label: "Pink",    color: "linear-gradient(135deg,#4A0A2E,#9B1A68)", accent: "#F472B6", value: "#9B1A68" },
  { label: "Teal",    color: "linear-gradient(135deg,#0F3A38,#1A6B68)", accent: "#2DD4BF", value: "#1A6B68" },
  { label: "Emerald", color: "linear-gradient(135deg,#064E3B,#059669)", accent: "#34D399", value: "#059669" },
  { label: "Cyan",    color: "linear-gradient(135deg,#083344,#0891B2)", accent: "#22D3EE", value: "#0891B2" },
  { label: "Indigo",  color: "linear-gradient(135deg,#1E1B4B,#4F46E5)", accent: "#818CF8", value: "#4F46E5" },
  { label: "Amber",   color: "linear-gradient(135deg,#78350F,#D97706)", accent: "#FBBF24", value: "#D97706" },
  { label: "Orange",  color: "linear-gradient(135deg,#7C2D12,#EA580C)", accent: "#FB923C", value: "#EA580C" },
  { label: "Crimson", color: "linear-gradient(135deg,#4C0519,#BE123C)", accent: "#FB7185", value: "#BE123C" },
  { label: "Slate",   color: "linear-gradient(135deg,#1F2937,#374151)", accent: "#9CA3AF", value: "#374151" },
];

/** Darken a #RRGGBB hex toward black by `amount` (0–1). */
function darken(hex: string, amount = 0.5): string {
  const n = parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(n)) return hex;
  const r = Math.round(((n >> 16) & 255) * (1 - amount));
  const g = Math.round(((n >> 8) & 255) * (1 - amount));
  const b = Math.round((n & 255) * (1 - amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Build a preview gradient from a single picked colour. */
function gradientFromHex(hex: string): string {
  return `linear-gradient(135deg, ${darken(hex, 0.55)}, ${hex})`;
}

/** ISO date/datetime → yyyy-MM-dd for the date picker. */
function toDateInput(iso?: string): string {
  if (!iso) return "";
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(iso);
  if (m) return m[1];
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Resolve a stored theme (preset hex, preset label, or custom hex) back to picker state. */
function resolveTheme(theme?: string): { themeIdx: number; useCustom: boolean; customColor: string } {
  const fallback = { themeIdx: 0, useCustom: false, customColor: "#C9A84C" };
  if (!theme) return fallback;
  const t = theme.trim();
  const byValue = THEMES.findIndex(x => x.value.toLowerCase() === t.toLowerCase());
  if (byValue >= 0) return { themeIdx: byValue, useCustom: false, customColor: THEMES[byValue].value };
  const byLabel = THEMES.findIndex(x => x.label.toLowerCase() === t.toLowerCase());
  if (byLabel >= 0) return { themeIdx: byLabel, useCustom: false, customColor: THEMES[byLabel].value };
  if (/^#?[0-9a-fA-F]{6}$/.test(t)) {
    return { themeIdx: 0, useCustom: true, customColor: (t.startsWith("#") ? t : `#${t}`).toUpperCase() };
  }
  return fallback;
}

const EMPTY = {
  name: "",
  startDate: "",
  endDate: "",
  venue: "",
  location: "",
  eventCode: "",
  description: "",
  status: "Draft" as string,
  moiRequired: false,
  themeIdx: 0,
  useCustom: false,
  customColor: "#C9A84C",
};

// Field is defined at module scope so React always sees the same component
// identity across renders. If it were defined inside CreateEventModal the arrow
// function would be a new reference on every state change, causing React to
// unmount/remount every Field wrapper — and all their inputs — on each keystroke.
function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: "#F87171" }}>{error}</span>}
    </div>
  );
}

export function CreateEventModal({ open, onClose, onCreate, event }: Props) {
  const isEdit = !!event;
  const [form, setForm]     = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState("");
  const [venues, setVenues] = useState<VenueDto[]>([]);

  // Load the managed venue library whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    venuesApi.list().then(res => { if (res.success && res.data) setVenues(res.data); });
  }, [open]);

  // Initialise the form whenever the modal opens (prefill in edit mode, blank for create).
  useEffect(() => {
    if (!open) return;
    if (event) {
      const th = resolveTheme(event.theme);
      setForm({
        name:        event.name ?? "",
        startDate:   toDateInput(event.startDate),
        endDate:     toDateInput(event.endDate),
        venue:       event.venue ?? "",
        location:    event.location ?? "",
        eventCode:   event.eventCode ?? "",
        description: event.description ?? "",
        status:      event.status ?? "Draft",
        moiRequired: event.moiRequired ?? false,
        themeIdx:    th.themeIdx,
        useCustom:   th.useCustom,
        customColor: th.customColor,
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
    setApiErr("");
  }, [open, event]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim())      e.name      = "Event name is required";
    if (!form.venue.trim())     e.venue     = "Venue is required";
    if (!form.eventCode.trim()) e.eventCode = "Event code (e.g. GAC) is required";

    const start = parseDate(form.startDate);
    const end   = parseDate(form.endDate);

    if (!start) {
      e.startDate = "Start date is required";
    } else if (!isEdit && start < startOfToday()) {
      // Existing events may legitimately have a start date in the past.
      e.startDate = "Start date cannot be in the past";
    }

    if (!end) {
      e.endDate = "End date is required";
    } else if (start && end < start) {
      e.endDate = "End date cannot be before the start date";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Venue dropdown options, built from the managed venue library. In edit mode
  // an event may hold a free-text venue not in the library — keep it selectable.
  const venueOptions = venues.map(v => ({
    value: v.name,
    label: v.location ? `${v.name} · ${v.location}` : v.name,
  }));
  if (form.venue && !venues.some(v => v.name === form.venue)) {
    venueOptions.unshift({ value: form.venue, label: `${form.venue} (current)` });
  }

  // Resolved theme presentation + the hex value persisted on the event.
  const previewGradient = form.useCustom ? gradientFromHex(form.customColor) : THEMES[form.themeIdx].color;
  const themeValue      = form.useCustom ? form.customColor.toUpperCase() : THEMES[form.themeIdx].value;
  const themeLabel      = form.useCustom ? form.customColor.toUpperCase() : THEMES[form.themeIdx].label;

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    setApiErr("");
    const body = {
      name:        form.name.trim(),
      description: form.description.trim() || undefined,
      startDate:   form.startDate,
      endDate:     form.endDate,
      venue:       form.venue.trim(),
      location:    form.location.trim() || undefined,
      eventCode:   form.eventCode.trim().toUpperCase(),
      status:      form.status,
      moiRequired: form.moiRequired,
      theme:       themeValue,
    };
    const res = event
      ? await eventsApi.update(event.id, body)
      : await eventsApi.create(body);
    setSaving(false);
    if (!res.success || !res.data) {
      setApiErr(res.message ?? res.errors?.[0] ?? `Failed to ${isEdit ? "update" : "create"} event.`);
      return;
    }
    onCreate();
    setForm(EMPTY);
    setErrors({});
    setApiErr("");
    onClose();
  }

  function handleClose() {
    setForm(EMPTY);
    setErrors({});
    setApiErr("");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
          style={{
            position: "fixed", inset: 0, zIndex: 2000,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px 16px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: "100%", maxWidth: 520,
              background: "var(--surface-1)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 22px",
              borderBottom: "1px solid var(--border)",
              background: "var(--surface-2)",
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{isEdit ? "Edit Event" : "Create Event"}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{isEdit ? "Update event details" : "Add a new accreditation event"}</div>
              </div>
              <button
                onClick={handleClose}
                style={{ background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 8, padding: 7, cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Preview banner */}
            <div style={{ height: 6, background: previewGradient, transition: "background 0.3s" }} />

            {/* Body */}
            <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: 18, maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>

              {/* API Error */}
              {apiErr && (
                <div style={{ fontSize: 12, color: "#F87171", padding: "8px 12px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8 }}>
                  {apiErr}
                </div>
              )}

              {/* Event Name */}
              <Field label="Event Name" error={errors.name}>
                <div style={{ position: "relative" }}>
                  <Tag size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                  <input className="form-control" style={{ paddingLeft: 34 }} placeholder="e.g. Gulf Athletics Championship 2027" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
              </Field>

              {/* Event Code + Dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <Field label="Event Code" error={errors.eventCode}>
                  <input className="form-control" placeholder="e.g. GAC" maxLength={10} value={form.eventCode} onChange={e => setForm(f => ({ ...f, eventCode: e.target.value.toUpperCase() }))} />
                </Field>
                <Field label="Start Date" error={errors.startDate}>
                  <DatePicker
                    value={form.startDate}
                    onChange={v => setForm(f => ({
                      ...f,
                      startDate: v,
                      // Keep the range valid: clear an end date that now precedes the new start.
                      endDate: f.endDate && v && parseDate(f.endDate)! < parseDate(v)! ? "" : f.endDate,
                    }))}
                    placeholder="Start date"
                    minDate={isEdit ? undefined : startOfToday()}
                    error={!!errors.startDate}
                    portal
                  />
                </Field>
                <Field label="End Date" error={errors.endDate}>
                  <DatePicker
                    value={form.endDate}
                    onChange={v => setForm(f => ({ ...f, endDate: v }))}
                    placeholder="End date"
                    minDate={parseDate(form.startDate) ?? startOfToday()}
                    error={!!errors.endDate}
                    portal
                  />
                </Field>
              </div>

              {/* Venue */}
              <Field label="Venue" error={errors.venue}>
                <Select
                  isSearchable
                  placeholder={venues.length ? "Select a venue" : "No venues available"}
                  options={venueOptions}
                  value={form.venue}
                  onChange={v => setForm(f => {
                    const picked = venues.find(x => x.name === v);
                    // Auto-fill the city/location from the chosen venue when empty.
                    return { ...f, venue: v, location: !f.location && picked?.location ? picked.location : f.location };
                  })}
                />
                {venues.length === 0 && (
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    No venues yet — add one under Venues to choose it here.
                  </span>
                )}
              </Field>

              {/* Location (city) */}
              <Field label="City / Location" error={errors.location}>
                <div style={{ position: "relative" }}>
                  <Calendar size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                  <input className="form-control" style={{ paddingLeft: 34 }} placeholder="e.g. Doha, Qatar" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
              </Field>

              {/* Description */}
              <Field label="Description (optional)" error="">
                <textarea className="form-control" rows={2} placeholder="Short description of the event…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: "vertical" }} />
              </Field>

              {/* Status + MOI row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Status">
                  <Select
                    options={[
                      { value: "Draft", label: "Upcoming (Draft)" },
                      { value: "Active", label: "Active" },
                      { value: "Completed", label: "Completed" },
                    ]}
                    value={form.status}
                    onChange={v => setForm(f => ({ ...f, status: v }))}
                  />
                </Field>

                <Field label="MOI Required">
                  <div
                    onClick={() => setForm(f => ({ ...f, moiRequired: !f.moiRequired }))}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", borderRadius: "var(--radius-sm)",
                      border: `1px solid ${form.moiRequired ? "rgba(201,168,76,0.4)" : "var(--border)"}`,
                      background: form.moiRequired ? "rgba(201,168,76,0.06)" : "var(--surface-3)",
                      cursor: "pointer", userSelect: "none", transition: "all 0.18s",
                      height: 42, boxSizing: "border-box",
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 5,
                      border: `2px solid ${form.moiRequired ? "#C9A84C" : "var(--border)"}`,
                      background: form.moiRequired ? "#C9A84C" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.18s", flexShrink: 0,
                    }}>
                      {form.moiRequired && <Check size={11} color="#000" strokeWidth={3} />}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Shield size={13} style={{ color: form.moiRequired ? "#C9A84C" : "var(--text-muted)" }} />
                      <span style={{ fontSize: 12, color: form.moiRequired ? "var(--text-primary)" : "var(--text-muted)" }}>
                        Required
                      </span>
                    </div>
                  </div>
                </Field>
              </div>

              {/* Theme */}
              <Field label="Theme Colour">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {THEMES.map((t, i) => {
                    const selected = !form.useCustom && form.themeIdx === i;
                    return (
                      <button
                        key={t.label}
                        type="button"
                        title={t.label}
                        onClick={() => setForm(f => ({ ...f, themeIdx: i, useCustom: false }))}
                        style={{
                          width: 34, height: 34, borderRadius: 8, cursor: "pointer",
                          background: t.color,
                          border: selected ? `3px solid ${t.accent}` : "3px solid transparent",
                          boxShadow: selected ? `0 0 0 1px ${t.accent}80` : "none",
                          transition: "all 0.15s",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {selected && <Check size={13} color={t.accent} strokeWidth={3} />}
                      </button>
                    );
                  })}

                  {/* Custom colour picker (eyedropper) */}
                  <label
                    title="Pick a custom colour"
                    style={{
                      position: "relative",
                      width: 34, height: 34, borderRadius: 8, cursor: "pointer",
                      background: form.useCustom ? gradientFromHex(form.customColor) : "var(--surface-3)",
                      border: form.useCustom ? `3px solid ${form.customColor}` : "3px dashed var(--border-strong)",
                      boxShadow: form.useCustom ? `0 0 0 1px ${form.customColor}80` : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    <input
                      type="color"
                      value={form.customColor}
                      onChange={e => setForm(f => ({ ...f, customColor: e.target.value, useCustom: true }))}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", border: "none", padding: 0 }}
                    />
                    {form.useCustom
                      ? <Check size={13} color="#fff" strokeWidth={3} style={{ pointerEvents: "none" }} />
                      : <Pipette size={14} style={{ color: "var(--text-muted)", pointerEvents: "none" }} />}
                  </label>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 6 }}>
                    <Palette size={13} style={{ color: "var(--text-muted)" }} />
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: form.useCustom ? "var(--font-mono), monospace" : undefined }}>
                      {themeLabel}
                    </span>
                  </div>
                </div>
              </Field>
            </div>

            {/* Footer */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10,
              padding: "14px 22px",
              borderTop: "1px solid var(--border)",
              background: "var(--surface-2)",
            }}>
              <button className="btn btn-secondary btn-sm" onClick={handleClose} disabled={saving}>Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSubmit}
                disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                {saving
                  ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
                  : <><Check size={13} /> {isEdit ? "Save Changes" : "Create Event"}</>
                }
              </button>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
