"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, BookOpen, UserCog, ShieldCheck, Contact,
  PlusCircle, Upload, Eye, Pencil, Calendar,
  ClipboardCheck, Map, HelpCircle, Camera,
  QrCode, Unlock, Bell, CalendarDays,
  ArrowRight, Check, FileEdit, GitBranch,
  BadgeCheck, Building2, MapPin, Shield,
  UserPlus, CheckSquare,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

/* ── reusable tiny sub-components ── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 800, letterSpacing: "0.18em",
      color: "var(--text-muted)", textTransform: "uppercase",
      paddingBottom: 10, marginBottom: 16,
      borderBottom: "1px solid var(--border)",
    }}>
      {children}
    </div>
  );
}

function ActionItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
      <span style={{ marginTop: 1, flexShrink: 0, color: "inherit", opacity: 0.7 }}>{icon}</span>
      {children}
    </li>
  );
}

function StageChip({ type, children }: { type: "approve" | "reject" | "info"; children: React.ReactNode }) {
  const styles = {
    approve: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)", color: "#22C55E" },
    reject: { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)", color: "#F87171" },
    info: { bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.3)", color: "#FBBF24" },
  }[type];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
      background: styles.bg, border: `1px solid ${styles.border}`, color: styles.color,
    }}>
      {children}
    </span>
  );
}

export function HowItWorksModal({ open, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const actors = [
    {
      icon: <UserCog size={28} />,
      role: "Requestor",
      tagline: "Initiates & tracks requests",
      color: "#C9A84C",
      actions: [
        { icon: <PlusCircle size={13} />, text: "Submit accreditation requests on behalf of applicants" },
        { icon: <Upload size={13} />, text: "Bulk-upload multiple applicants via CSV" },
        { icon: <Eye size={13} />, text: "Track each request through the 4-stage pipeline" },
        { icon: <Pencil size={13} />, text: "Edit & resubmit when additional info is requested" },
        { icon: <Calendar size={13} />, text: "Browse available events and view their status" },
      ],
    },
    {
      icon: <ShieldCheck size={28} />,
      role: "Admin",
      tagline: "Reviews, approves & manages",
      color: "#60A5FA",
      actions: [
        { icon: <ClipboardCheck size={13} />, text: "Review requests at each pipeline stage (FA, Zone, Media, MOI)" },
        { icon: <Map size={13} />, text: "Assign venue zone access via interactive venue maps" },
        { icon: <HelpCircle size={13} />, text: "Request additional information from the requestor" },
        { icon: <X size={13} />, text: "Reject requests that do not meet criteria" },
        { icon: <Contact size={13} />, text: "Issue QR-coded accreditation passes once fully approved" },
      ],
    },
    {
      icon: <Contact size={28} />,
      role: "Accredited User",
      tagline: "The pass holder at the event",
      color: "#4ADE80",
      actions: [
        { icon: <QrCode size={13} />, text: "Receive and present a QR-coded accreditation pass" },
        { icon: <Unlock size={13} />, text: "Activate their portal account with a secure link" },
        { icon: <ShieldCheck size={13} />, text: "Access only the zones their pass grants entry to" },
        { icon: <Bell size={13} />, text: "Receive real-time notifications about pass status" },
        { icon: <CalendarDays size={13} />, text: "View event schedule and venue information" },
      ],
    },
  ];

  const pipelineStages = [
    {
      num: "1", color: "#60A5FA", glow: "rgba(96,165,250,0.2)",
      title: "Stage 1 — FA Owner", sub: "Federation / Association Owner",
      badge: "First Review", badgeBg: "rgba(96,165,250,0.12)", badgeColor: "#60A5FA", badgeBorder: "rgba(96,165,250,0.3)",
      icon: <Building2 size={16} />,
      desc: "Verifies the applicant's role and federation affiliation. If anything is unclear, they can pause the pipeline and request more documents from the requestor.",
      chips: [
        { type: "approve" as const, text: "Approve → Stage 2" },
        { type: "reject" as const, text: "Reject → Closed" },
        { type: "info" as const, text: "Request Info → Paused" },
      ],
    },
    {
      num: "2", color: "#A78BFA", glow: "rgba(167,139,250,0.2)",
      title: "Stage 2 — Zone Owner", sub: "Venue / Zone Access Authority",
      badge: "Access Check", badgeBg: "rgba(167,139,250,0.12)", badgeColor: "#A78BFA", badgeBorder: "rgba(167,139,250,0.3)",
      icon: <MapPin size={16} />,
      desc: "Assigns the specific physical zones the applicant can enter — Field, Media Tribune, VIP Lounge, Back of House, etc. Reviews and confirms appropriate access level.",
      chips: [
        { type: "approve" as const, text: "Approve + zones → Stage 3" },
        { type: "reject" as const, text: "Reject → Closed" },
        { type: "info" as const, text: "Request Info → Paused" },
      ],
    },
    {
      num: "3", color: "#F472B6", glow: "rgba(244,114,182,0.2)",
      title: "Stage 3 — Media Owner", sub: "Media & Communications Authority",
      badge: "Media Check", badgeBg: "rgba(244,114,182,0.12)", badgeColor: "#F472B6", badgeBorder: "rgba(244,114,182,0.3)",
      icon: <Camera size={16} />,
      desc: "Validates press credentials, broadcaster affiliations, and production documentation. Required for any role with media, camera, or broadcast access to the venue.",
      chips: [
        { type: "approve" as const, text: "Approve → Stage 4" },
        { type: "reject" as const, text: "Reject → Closed" },
        { type: "info" as const, text: "Request Info → Paused" },
      ],
    },
    {
      num: "4", color: "#C9A84C", glow: "rgba(201,168,76,0.2)",
      title: "Stage 4 — MOI", sub: "Ministry of Interior, Qatar",
      badge: "MOI Required", badgeBg: "rgba(201,168,76,0.1)", badgeColor: "#C9A84C", badgeBorder: "rgba(201,168,76,0.4)",
      icon: <Shield size={16} />,
      desc: "Mandatory security clearance for VIPs, foreign nationals, and all MOI-flagged events. The Ministry of Interior performs a background check before the final pass is issued.",
      chips: [
        { type: "approve" as const, text: "Cleared → Pass issued" },
        { type: "reject" as const, text: "Denied → Closed" },
      ],
    },
  ];

  const roles = [
    { icon: <UserPlus size={20} />, name: "Requestor", color: "#60A5FA", items: ["Submits requests on behalf of applicants", "Monitors pipeline progress in real time", "Responds to info requests & resubmits", "Uses bulk upload for large groups"] },
    { icon: <ShieldCheck size={20} />, name: "FA Owner", color: "#C9A84C", items: ["First reviewer in the pipeline", "Verifies role and federation affiliation", "Manages events and accreditation windows"] },
    { icon: <MapPin size={20} />, name: "Zone Owner", color: "#A78BFA", items: ["Controls venue access zones", "Assigns zone permissions to each pass", "Reviews zone access requirements"] },
    { icon: <Camera size={20} />, name: "Media Owner", color: "#F472B6", items: ["Verifies press and broadcast credentials", "Approves camera and equipment access"] },
    { icon: <Shield size={20} />, name: "MOI", color: "#C9A84C", items: ["Background & security clearance", "Required for VIPs and foreign nationals", "Final authority on MOI-flagged events"] },
    { icon: <Contact size={20} />, name: "Accredited User", color: "#4ADE80", items: ["Receives the approved pass by email", "Scans QR code at entry checkpoints"] },
  ];

  const tips = [
    { icon: <CheckSquare size={16} />, color: "#60A5FA", bold: "Submit early", text: " — Pipeline review can take 2–3 business days per stage. Submit well before the event date." },
    { icon: <Upload size={16} />, color: "#C9A84C", bold: "Use bulk upload for groups", text: " — Download the CSV template, fill in all applicants, and upload in one go." },
    { icon: <HelpCircle size={16} />, color: "#FBBF24", bold: "Respond to info requests promptly", text: " — The pipeline pauses until you resubmit. Check notifications regularly." },
    { icon: <QrCode size={16} />, color: "#A78BFA", bold: "Save your QR pass", text: " — Download or add to mobile wallet. The QR code is required at every entry checkpoint." },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
          style={{
            position: "fixed", inset: 0, zIndex: 2000,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px 16px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: "100%", maxWidth: 860,
              maxHeight: "calc(100vh - 40px)",
              background: "var(--surface-1)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              display: "flex", flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 40px 120px rgba(0,0,0,0.7)",
            }}
          >
            {/* ── Sticky Header ── */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 24px",
              borderBottom: "1px solid var(--border)",
              background: "var(--surface-2)",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "linear-gradient(135deg, #6B0F2B, #8B1A3A)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <BookOpen size={18} color="#C9A84C" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>How Accreditation Works</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>QOC Accreditation Portal</div>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "var(--surface-3)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: 8, cursor: "pointer",
                  color: "var(--text-muted)", display: "flex", alignItems: "center",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Scrollable Body ── */}
            <div style={{ overflowY: "auto", flex: 1, padding: "28px 24px" }}>

              {/* The Three Actors */}
              <SectionTitle>The Three Actors</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
                {actors.map(a => (
                  <div
                    key={a.role}
                    style={{
                      background: `linear-gradient(160deg, ${a.color}18 0%, ${a.color}08 100%)`,
                      border: `1px solid ${a.color}30`,
                      borderRadius: 16, padding: "20px 18px",
                    }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: `${a.color}20`, border: `1px solid ${a.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: a.color, marginBottom: 12,
                    }}>
                      {a.icon}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{a.role}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>{a.tagline}</div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                      {a.actions.map((ac, i) => (
                        <ActionItem key={i} icon={ac.icon}>{ac.text}</ActionItem>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Pipeline Hero */}
              <div style={{
                background: "linear-gradient(135deg, #0a0608 0%, #1a0814 50%, #0d1120 100%)",
                border: "1px solid rgba(201,168,76,0.2)",
                borderRadius: 20, padding: "32px 28px",
                textAlign: "center", marginBottom: 32, position: "relative", overflow: "hidden",
              }}>
                {/* Glow */}
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, height: 200, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(201,168,76,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.3em", color: "var(--gold)", marginBottom: 10, position: "relative" }}>THE ACCREDITATION PIPELINE</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.35, marginBottom: 32, position: "relative" }}>
                  Every request travels through<br />4 approval stages before a pass is issued
                </h2>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 0, flexWrap: "wrap", position: "relative",
                }}>
                  {[
                    { name: "FA Owner", num: "Stage 1", color: "#60A5FA", glow: "rgba(96,165,250,0.2)" },
                    { name: "Zone Owner", num: "Stage 2", color: "#A78BFA", glow: "rgba(167,139,250,0.2)" },
                    { name: "Media Owner", num: "Stage 3", color: "#F472B6", glow: "rgba(244,114,182,0.2)" },
                    { name: "MOI", num: "Stage 4", color: "#C9A84C", glow: "rgba(201,168,76,0.2)" },
                  ].map((s, i, arr) => (
                    <div key={s.name} style={{ display: "flex", alignItems: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "0 12px" }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: "50%",
                          background: s.color, boxShadow: `0 0 0 5px ${s.glow}`,
                        }} />
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{s.name}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.05em" }}>{s.num}</div>
                      </div>
                      {i < arr.length - 1 && (
                        <div style={{ width: 40, height: 1, background: "linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))", flexShrink: 0 }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* The Process */}
              <SectionTitle>The Process</SectionTitle>
              <div style={{ display: "flex", alignItems: "stretch", gap: 0, marginBottom: 32, flexWrap: "wrap" }}>
                {[
                  { step: "01", icon: <FileEdit size={28} />, color: "#60A5FA", name: "Submit a Request", desc: "A Requestor fills in the applicant's name, passport, nationality, role and event — then submits into the pipeline." },
                  { step: "02", icon: <GitBranch size={28} />, color: "#C9A84C", name: "Pipeline Review", desc: "The request passes through up to 4 sequential stages. Each authority can approve, reject, or request more info." },
                  { step: "03", icon: <BadgeCheck size={28} />, color: "#4ADE80", name: "Pass Issued", desc: "Once all stages clear, a QR-coded accreditation pass is generated and delivered to the applicant." },
                ].map((p, i, arr) => (
                  <div key={p.step} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 200 }}>
                    <div style={{
                      flex: 1,
                      background: "var(--surface-2)", border: "1px solid var(--border)",
                      borderRadius: 14, padding: "22px 20px",
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 10 }}>STEP {p.step}</div>
                      <div style={{ color: p.color, marginBottom: 12 }}>{p.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55 }}>{p.desc}</div>
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ padding: "0 8px", color: "var(--text-muted)", flexShrink: 0 }}>
                        <ArrowRight size={16} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pipeline Stages in Detail */}
              <SectionTitle>Pipeline Stages in Detail</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 32 }}>
                {pipelineStages.map((s, i) => (
                  <div key={s.num} style={{ display: "flex", gap: 0 }}>
                    {/* Indicator */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40, flexShrink: 0 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: s.color, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", zIndex: 1,
                      }}>
                        {s.icon}
                      </div>
                      {i < pipelineStages.length - 1 && (
                        <div style={{ width: 2, flex: 1, background: "var(--border)", minHeight: 24, margin: "4px 0" }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, paddingLeft: 16, paddingBottom: i < pipelineStages.length - 1 ? 24 : 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{s.title}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.sub}</div>
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                          background: s.badgeBg, color: s.badgeColor, border: `1px solid ${s.badgeBorder}`,
                          flexShrink: 0,
                        }}>
                          {s.badge}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 10 }}>{s.desc}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {s.chips.map((c, ci) => (
                          <StageChip key={ci} type={c.type}>
                            {c.type === "approve" && <Check size={11} />}
                            {c.type === "reject" && <X size={11} />}
                            {c.type === "info" && <HelpCircle size={11} />}
                            {c.text}
                          </StageChip>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Request States */}
              <SectionTitle>Request States</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 32 }}>
                {[
                  { color: "#C9A84C", name: "In Review", desc: "Request is actively being reviewed at a pipeline stage.", dotColor: "#C9A84C" },
                  { color: "#FBBF24", name: "Info Requested", desc: "Reviewer needs more documents. Pipeline is paused.", dotColor: "#FBBF24" },
                  { color: "#4ADE80", name: "Approved", desc: "All stages cleared. Pass generated and sent.", dotColor: "#4ADE80" },
                  { color: "#F87171", name: "Rejected", desc: "Denied at a stage. A new request must be submitted.", dotColor: "#F87171" },
                ].map(s => (
                  <div key={s.name} style={{
                    background: "var(--surface-2)", border: "1px solid var(--border)",
                    borderRadius: 12, padding: "14px 16px",
                  }}>
                    {/* Mini pipeline visual */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
                      {[1, 2, 3, 4].map((dot, di) => (
                        <div key={dot} style={{ display: "flex", alignItems: "center" }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: s.name === "Approved"
                              ? s.dotColor
                              : s.name === "Rejected" && di === 1
                                ? "#F87171"
                                : s.name === "Info Requested" && di === 1
                                  ? "#FBBF24"
                                  : s.name === "In Review" && di === 0
                                    ? "#C9A84C"
                                    : "var(--border)",
                            boxShadow: s.name === "In Review" && di === 0 ? "0 0 0 3px rgba(201,168,76,0.2)" : undefined,
                          }} />
                          {di < 3 && (
                            <div style={{ width: 14, height: 1, background: s.name === "Approved" ? s.dotColor : "var(--border)" }} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                ))}
              </div>

              {/* Roles */}
              <SectionTitle>Roles & Responsibilities</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 32 }}>
                {roles.map(r => (
                  <div key={r.name} style={{
                    background: "var(--surface-2)", border: "1px solid var(--border)",
                    borderRadius: 12, padding: "16px",
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: `${r.color}15`, border: `1px solid ${r.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: r.color, marginBottom: 10,
                    }}>
                      {r.icon}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{r.name}</div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                      {r.items.map((item, i) => (
                        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                          <div style={{ width: 4, height: 4, borderRadius: "50%", background: r.color, marginTop: 5, flexShrink: 0 }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Tips */}
              <SectionTitle>Tips</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
                {tips.map((t, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "12px 16px",
                    background: "var(--surface-2)", border: "1px solid var(--border)",
                    borderRadius: 10,
                  }}>
                    <span style={{ color: t.color, flexShrink: 0, marginTop: 1 }}>{t.icon}</span>
                    <span style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.55 }}>
                      <strong>{t.bold}</strong>{t.text}
                    </span>
                  </div>
                ))}
              </div>

            </div>

            {/* ── Sticky Footer ── */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 24px",
              borderTop: "1px solid var(--border)",
              background: "var(--surface-2)",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Questions? Contact{" "}
                <a href="mailto:accreditation@qoc.qa" style={{ color: "var(--gold)", textDecoration: "none" }}>
                  accreditation@qoc.qa
                </a>
              </span>
              <button
                onClick={onClose}
                className="btn btn-primary btn-sm"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <Check size={14} /> Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
