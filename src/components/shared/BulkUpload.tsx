"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, CheckCircle, AlertCircle, Download, ChevronRight, Loader, XCircle } from "lucide-react";
import { RoleTag } from "@/components/ui/RoleTag";
import { Select } from "@/components/ui/Select";
import { eventsApi, bulkUploadApi, type BulkUploadRow, type EventDto } from "@/lib/api";
import * as XLSX from "xlsx";

const STEPS = ["Upload File", "Review & Validate", "Confirm & Submit"];

// ── Template ─────────────────────────────────────────────────────────────────
// Column names must match backend (case/space/underscore-insensitive after normalisation)
const TEMPLATE_HEADERS = [
  "First Name", "Last Name", "Email", "Nationality",
  "Passport No", "Date Of Birth", "Role",
  "Phone", "Organization", "Position", "Venue",
];
const TEMPLATE_EXAMPLE = [
  "John", "Smith", "john@example.com", "Qatar",
  "QA1234567", "1990-01-15", "Media",
  "", "", "", "",
];

function downloadTemplate(format: "csv" | "xlsx") {
  const rows = [TEMPLATE_HEADERS, TEMPLATE_EXAMPLE];

  if (format === "csv") {
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: "bulk_upload_template.csv" });
    a.click();
    URL.revokeObjectURL(url);
  } else {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "bulk_upload_template.xlsx");
  }
}

// ── File → base64 CSV ─────────────────────────────────────────────────────────
function bufferToBase64Csv(ab: ArrayBuffer): string {
  const wb    = XLSX.read(ab, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const csv   = XLSX.utils.sheet_to_csv(sheet);
  // Encode UTF-8 CSV to base64 safely
  const bytes = new TextEncoder().encode(csv);
  let binary  = "";
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function textToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary  = "";
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

// ── Component ─────────────────────────────────────────────────────────────────
export function BulkUpload() {
  const [step,        setStep]        = useState(0);
  const [events,      setEvents]      = useState<EventDto[]>([]);
  const [eventId,     setEventId]     = useState("");
  const [fileName,    setFileName]    = useState("");
  const [dragging,    setDragging]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [previewRows, setPreviewRows] = useState<BulkUploadRow[]>([]);
  const [preview,     setPreview]     = useState<{ totalRows: number; validRows: number; invalidRows: number } | null>(null);
  const [result,      setResult]      = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch active events for the dropdown
  useEffect(() => {
    eventsApi.list({ pageNumber: 1, pageSize: 100 }).then(res => {
      if (res.success && res.data) setEvents(res.data.items);
    });
  }, []);

  const callPreview = useCallback(async (base64: string) => {
    if (!eventId) { setError("Please select an event first."); return; }
    setLoading(true);
    setError("");
    const res = await bulkUploadApi.preview(base64, eventId);
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.message ?? "Preview failed.");
      return;
    }
    setPreviewRows(res.data.rows);
    setPreview({ totalRows: res.data.totalRows, validRows: res.data.validRows, invalidRows: res.data.invalidRows });
    setStep(1);
  }, [eventId]);

  async function processFile(file: File) {
    setFileName(file.name);
    const ab     = await file.arrayBuffer();
    const base64 = file.name.endsWith(".csv")
      ? textToBase64(new TextDecoder().decode(ab))
      : bufferToBase64Csv(ab);
    await callPreview(base64);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    // reset so same file can be re-uploaded
    e.target.value = "";
  }

  async function handleSubmit() {
    if (!eventId || previewRows.length === 0) return;
    setLoading(true);
    setError("");
    const res = await bulkUploadApi.process(eventId, previewRows.filter(r => r.isValid));
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.message ?? "Submission failed.");
      return;
    }
    setResult(res.data);
  }

  function reset() {
    setStep(0); setFileName(""); setPreviewRows([]); setPreview(null); setResult(null); setError("");
  }

  // ── Finished screen ─────────────────────────────────────────────────────────
  if (result) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px" }}>
        <div style={{ width: 64, height: 64, background: "#22C55E20", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CheckCircle size={32} color="#22C55E" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Bulk Upload Complete</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 4 }}>
          <strong style={{ color: "#22C55E" }}>{result.created}</strong> accreditation requests created.
          {result.skipped > 0 && <> &nbsp;<strong style={{ color: "#F87171" }}>{result.skipped}</strong> skipped.</>}
        </p>
        {result.errors.length > 0 && (
          <div style={{ marginTop: 12, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, padding: "10px 14px", textAlign: "left", maxWidth: 480, margin: "12px auto" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#F87171", marginBottom: 6 }}>Errors:</div>
            {result.errors.map((e, i) => <div key={i} style={{ fontSize: 11, color: "var(--text-muted)" }}>{e}</div>)}
          </div>
        )}
        <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={reset}>Upload Another File</button>
      </div>
    );
  }

  return (
    <div>
      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
                background: step > i ? "#22C55E" : step === i ? "var(--maroon)" : "var(--surface-3)",
                color: step >= i ? "#fff" : "var(--text-muted)",
                border: step > i ? "none" : step === i ? "2px solid var(--maroon)" : "1px solid var(--border)",
                flexShrink: 0,
              }}>
                {step > i ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: step === i ? 600 : 400, color: step === i ? "var(--text-primary)" : "var(--text-muted)", whiteSpace: "nowrap" }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: step > i ? "#22C55E" : "var(--border)", margin: "0 10px" }} />
            )}
          </div>
        ))}
      </div>

      {/* Global error */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, marginBottom: 16, fontSize: 13, color: "#F87171" }}>
          <XCircle size={15} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {/* ── Step 0: Upload ─────────────────────────────────────────────────── */}
      {step === 0 && (
        <div>
          {/* Event selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
              Event <span style={{ color: "#F87171" }}>*</span>
            </label>
            <Select
              options={events.map(ev => ({ value: ev.id, label: ev.name }))}
              value={eventId}
              onChange={v => setEventId(v)}
              placeholder="Select an event…"
              isSearchable
            />
          </div>

          {/* Drop zone */}
          <div
            className={`bulk-dropzone${dragging ? " bulk-dropzone-active" : ""}${!eventId ? " bulk-dropzone-disabled" : ""}`}
            onDragOver={e => { if (!eventId) return; e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { if (!eventId) return; handleDrop(e); }}
            onClick={() => { if (!eventId) { setError("Please select an event first."); return; } setError(""); inputRef.current?.click(); }}
            style={{ cursor: eventId ? "pointer" : "not-allowed", opacity: eventId ? 1 : 0.5 }}
          >
            {loading
              ? <><Loader size={28} style={{ color: "var(--gold)", marginBottom: 10, animation: "spin 1s linear infinite" }} /><div style={{ fontSize: 14, fontWeight: 600 }}>Analysing file…</div></>
              : <>
                  <Upload size={32} style={{ color: "var(--gold)", marginBottom: 12 }} />
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Drop your file here</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>or click to browse</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>CSV or Excel (.xlsx) · Max 5 MB · Up to 500 records</div>
                </>
            }
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={handleFile} />
          </div>

          {/* Template download + columns */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600 }}>Required columns</h3>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => downloadTemplate("csv")}>
                  <Download size={13} /> CSV
                </button>
                <button className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => downloadTemplate("xlsx")}>
                  <Download size={13} /> Excel
                </button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                { col: "First Name",    req: true  },
                { col: "Last Name",     req: true  },
                { col: "Email",         req: true  },
                { col: "Nationality",   req: true  },
                { col: "Passport No",   req: true  },
                { col: "Date Of Birth", req: true  },
                { col: "Role",          req: true  },
                { col: "Phone",         req: false },
                { col: "Organization",  req: false },
                { col: "Position",      req: false },
                { col: "Venue",         req: false },
              ].map(({ col, req }) => (
                <div key={col} style={{ fontSize: 12, color: "var(--text-muted)", padding: "4px 8px", background: "var(--surface-3)", borderRadius: 4, border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <code style={{ fontFamily: "var(--font-mono)" }}>{col}</code>
                  {!req && <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 6 }}>optional</span>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
              Valid roles: <code>Media</code>, <code>VIP</code>, <code>Staff</code>, <code>Athlete</code>, <code>Official</code>, <code>Coach</code>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Review ────────────────────────────────────────────────── */}
      {step === 1 && preview && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "10px 14px", borderRadius: "var(--radius)", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              File: <strong style={{ color: "var(--text-primary)" }}>{fileName}</strong>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 10, fontSize: 12 }}>
              <span style={{ color: "#22C55E" }}><CheckCircle size={13} style={{ verticalAlign: "middle", marginRight: 3 }} />{preview.validRows} valid</span>
              {preview.invalidRows > 0 && <span style={{ color: "#F87171" }}><AlertCircle size={13} style={{ verticalAlign: "middle", marginRight: 3 }} />{preview.invalidRows} errors</span>}
            </div>
          </div>

          {previewRows.length === 0 ? (
            <div style={{ padding: "32px 24px", textAlign: "center", color: "var(--text-muted)" }}>
              <AlertCircle size={24} style={{ margin: "0 auto 10px", display: "block", color: "#F59E0B" }} />
              <div style={{ fontWeight: 600 }}>No records found</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Make sure the file has a header row and at least one data row.</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Nationality</th>
                    <th>Passport</th>
                    <th>Role</th>
                    <th>DOB</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, i) => (
                    <tr key={i} style={r.isValid ? {} : { background: "rgba(248,113,113,0.06)" }}>
                      <td style={{ color: "var(--text-muted)", fontSize: 11 }}>{r.rowNumber}</td>
                      <td style={{ fontWeight: 500 }}>{r.firstName} {r.lastName}</td>
                      <td style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.email}</td>
                      <td>{r.nationality}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{r.passportNo}</td>
                      <td><RoleTag role={r.role as "Media" | "VIP" | "Staff" | "Athlete" | "Official" | "Coach"} /></td>
                      <td style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.dateOfBirth}</td>
                      <td>
                        {r.isValid
                          ? <span style={{ color: "#22C55E", fontSize: 11, fontWeight: 600 }}>✓ Valid</span>
                          : <span style={{ color: "#F87171", fontSize: 11 }} title={r.error ?? ""}><AlertCircle size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />{r.error}</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={reset}>Back</button>
            <button
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
              onClick={() => setStep(2)}
              disabled={preview.validRows === 0}
            >
              Continue <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Confirm ───────────────────────────────────────────────── */}
      {step === 2 && preview && (
        <div>
          <div className="glass-card" style={{ marginBottom: 16 }}>
            <div style={{ padding: "16px 18px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Submission Summary</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Total Records",   value: preview.totalRows },
                  { label: "Valid Records",    value: preview.validRows,   color: "#22C55E" },
                  { label: "Skipped (Errors)", value: preview.invalidRows, color: preview.invalidRows > 0 ? "#F87171" : undefined },
                  { label: "Event",            value: events.find(e => e.id === eventId)?.name ?? eventId },
                ].map(item => (
                  <div key={item.label} style={{ padding: "10px 12px", background: "var(--surface-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: item.color ?? "var(--text-primary)" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            {preview.validRows} request{preview.validRows !== 1 ? "s" : ""} will be submitted to the approval pipeline. This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)} disabled={loading}>Back</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {loading ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Submitting…</> : `Submit ${preview.validRows} Request${preview.validRows !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .bulk-dropzone {
          border: 2px dashed var(--border);
          border-radius: var(--radius);
          padding: 40px 24px;
          text-align: center;
          transition: border-color .2s, background .2s;
        }
        .bulk-dropzone:hover, .bulk-dropzone-active {
          border-color: var(--gold);
          background: rgba(201,168,76,0.04);
        }
        .bulk-dropzone-disabled { pointer-events: none; }
      `}</style>
    </div>
  );
}
