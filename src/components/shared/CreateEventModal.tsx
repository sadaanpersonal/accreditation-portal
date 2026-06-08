"use client";
import { useState } from "react";
import { X, Check, Calendar, MapPin, Shield, Palette, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Event, EventStatus } from "@/data/events";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (event: Event) => void;
}

const THEMES = [
  { label: "Maroon",  color: "linear-gradient(135deg,#4A0A1E,#8B1A3A)", accent: "#C9A84C" },
  { label: "Blue",    color: "linear-gradient(135deg,#0D2B5C,#2060B0)", accent: "#60A5FA" },
  { label: "Purple",  color: "linear-gradient(135deg,#3B1E6B,#6D3ABF)", accent: "#A78BFA" },
  { label: "Pink",    color: "linear-gradient(135deg,#4A0A2E,#9B1A68)", accent: "#F472B6" },
  { label: "Teal",    color: "linear-gradient(135deg,#0F3A38,#1A6B68)", accent: "#2DD4BF" },
  { label: "Slate",   color: "linear-gradient(135deg,#1F2937,#374151)", accent: "#9CA3AF" },
];

const STATUS_OPTIONS: { value: EventStatus; label: string; color: string }[] = [
  { value: "active",    label: "Active",    color: "#22C55E" },
  { value: "upcoming",  label: "Upcoming",  color: "#F59E0B" },
  { value: "completed", label: "Completed", color: "#6B7280" },
];

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const EMPTY = {
  name: "",
  dates: "",
  location: "",
  status: "upcoming" as EventStatus,
  moiRequired: false,
  themeIdx: 0,
};

export function CreateEventModal({ open, onClose, onCreate }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim())     e.name     = "Event name is required";
    if (!form.dates.trim())    e.dates    = "Dates are required";
    if (!form.location.trim()) e.location = "Location is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const theme = THEMES[form.themeIdx];
    const event: Event = {
      id:             slugify(form.name) || `event-${Date.now()}`,
      name:           form.name.trim(),
      status:         form.status,
      moiRequired:    form.moiRequired,
      dates:          form.dates.trim(),
      location:       form.location.trim(),
      accreditations: 0,
      icon:           "Calendar",
      color:          theme.color,
      accentColor:    theme.accent,
    };
    onCreate(event);
    setForm(EMPTY);
    setErrors({});
    onClose();
  }

  function handleClose() {
    setForm(EMPTY);
    setErrors({});
    onClose();
  }

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: "#F87171" }}>{error}</span>}
    </div>
  );

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
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Create Event</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Add a new accreditation event</div>
              </div>
              <button
                onClick={handleClose}
                style={{ background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 8, padding: 7, cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Preview banner */}
            <div style={{ height: 6, background: THEMES[form.themeIdx].color, transition: "background 0.3s" }} />

            {/* Body */}
            <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: 18, maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>

              {/* Event Name */}
              <Field label="Event Name" error={errors.name}>
                <div style={{ position: "relative" }}>
                  <Tag size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                  <input
                    className="form-control"
                    style={{ paddingLeft: 34 }}
                    placeholder="e.g. Gulf Athletics Championship 2027"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
              </Field>

              {/* Dates */}
              <Field label="Dates" error={errors.dates}>
                <div style={{ position: "relative" }}>
                  <Calendar size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                  <input
                    className="form-control"
                    style={{ paddingLeft: 34 }}
                    placeholder="e.g. 1 Jun – 15 Jun 2027"
                    value={form.dates}
                    onChange={e => setForm(f => ({ ...f, dates: e.target.value }))}
                  />
                </div>
              </Field>

              {/* Location */}
              <Field label="Location / Venue" error={errors.location}>
                <div style={{ position: "relative" }}>
                  <MapPin size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                  <input
                    className="form-control"
                    style={{ paddingLeft: 34 }}
                    placeholder="e.g. Khalifa International Stadium, Doha"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  />
                </div>
              </Field>

              {/* Status + MOI row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Status">
                  <select
                    className="form-control"
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as EventStatus }))}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
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
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {THEMES.map((t, i) => (
                    <button
                      key={t.label}
                      title={t.label}
                      onClick={() => setForm(f => ({ ...f, themeIdx: i }))}
                      style={{
                        width: 34, height: 34, borderRadius: 8, cursor: "pointer",
                        background: t.color,
                        border: form.themeIdx === i
                          ? `3px solid ${t.accent}`
                          : "3px solid transparent",
                        boxShadow: form.themeIdx === i ? `0 0 0 1px ${t.accent}80` : "none",
                        transition: "all 0.15s",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {form.themeIdx === i && (
                        <Check size={13} color={t.accent} strokeWidth={3} />
                      )}
                    </button>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 6 }}>
                    <Palette size={13} style={{ color: "var(--text-muted)" }} />
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{THEMES[form.themeIdx].label}</span>
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
              <button className="btn btn-secondary btn-sm" onClick={handleClose}>Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSubmit}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <Check size={13} /> Create Event
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
