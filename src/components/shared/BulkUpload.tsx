"use client";
import { useState } from "react";
import { Upload, CheckCircle, AlertCircle, Download, ChevronRight } from "lucide-react";
import { BULK_SAMPLE, type BulkRecord } from "@/data/bulk-sample";
import { RoleTag } from "@/components/ui/RoleTag";

const STEPS = ["Upload File", "Review & Validate", "Confirm & Submit"];

export function BulkUpload() {
  const [step, setStep] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const records: BulkRecord[] = BULK_SAMPLE;
  const validCount = records.filter(r => r.valid).length;
  const invalidCount = records.length - validCount;

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFileName(f.name); setStep(1); }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) { setFileName(f.name); setStep(1); }
  }

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px" }}>
        <div style={{ width: 64, height: 64, background: "#22C55E20", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CheckCircle size={32} color="#22C55E" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Bulk Upload Submitted</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
          {validCount} accreditation requests have been submitted for review.
          {invalidCount > 0 && ` ${invalidCount} records were skipped due to errors.`}
        </p>
        <button className="btn btn-primary" onClick={() => { setStep(0); setFileName(""); setSubmitted(false); }}>
          Upload Another File
        </button>
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

      {/* Step 0: Upload */}
      {step === 0 && (
        <div>
          <div
            className={`bulk-dropzone${dragging ? " bulk-dropzone-active" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <Upload size={32} style={{ color: "var(--gold)", marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Drop your CSV file here</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>or</div>
            <label className="btn btn-primary btn-sm" style={{ cursor: "pointer" }}>
              Browse File
              <input type="file" accept=".csv,.xlsx" style={{ display: "none" }} onChange={handleFile} />
            </label>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>Supported: CSV, XLSX · Max 5MB · Up to 500 records</div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600 }}>Required columns</h3>
              <button className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Download size={13} /> Download Template
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {["full_name", "nationality", "passport_no", "role", "dob", "event_id", "venue_id", "zones", "email (optional)", "phone (optional)"].map(col => (
                <div key={col} style={{ fontSize: 12, color: "var(--text-muted)", padding: "4px 8px", background: "var(--surface-3)", borderRadius: 4, border: "1px solid var(--border)" }}>
                  <code style={{ fontFamily: "var(--font-mono)" }}>{col}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Review */}
      {step === 1 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "10px 14px", borderRadius: "var(--radius)", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              File: <strong style={{ color: "var(--text-primary)" }}>{fileName || "sample_upload.csv"}</strong>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 10, fontSize: 12 }}>
              <span style={{ color: "#22C55E" }}><CheckCircle size={13} style={{ verticalAlign: "middle", marginRight: 3 }} />{validCount} valid</span>
              {invalidCount > 0 && <span style={{ color: "#F87171" }}><AlertCircle size={13} style={{ verticalAlign: "middle", marginRight: 3 }} />{invalidCount} errors</span>}
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Nationality</th>
                  <th>Passport</th>
                  <th>Role</th>
                  <th>Event</th>
                  <th>Venue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i} style={r.valid ? {} : { background: "rgba(248,113,113,0.06)" }}>
                    <td style={{ color: "var(--text-muted)", fontSize: 11 }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td>{r.nationality}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{r.passport}</td>
                    <td><RoleTag role={r.role as any} /></td>
                    <td style={{ fontSize: 11 }}>{r.event}</td>
                    <td style={{ fontSize: 11 }}>{r.venue}</td>
                    <td>
                      {r.valid
                        ? <span style={{ color: "#22C55E", fontSize: 11, fontWeight: 600 }}>✓ Valid</span>
                        : <span style={{ color: "#F87171", fontSize: 11 }} title={r.error}>⚠ {r.error}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={() => setStep(0)}>Back</button>
            <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => setStep(2)}>
              Continue <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && (
        <div>
          <div className="glass-card" style={{ marginBottom: 16 }}>
            <div style={{ padding: "16px 18px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Submission Summary</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Total Records", value: records.length },
                  { label: "Valid Records", value: validCount, color: "#22C55E" },
                  { label: "Skipped (Errors)", value: invalidCount, color: invalidCount > 0 ? "#F87171" : undefined },
                  { label: "File", value: fileName || "sample_upload.csv" },
                ].map(item => (
                  <div key={item.label} style={{ padding: "10px 12px", background: "var(--surface-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: item.color || "var(--text-primary)" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            {validCount} requests will be submitted to the approval pipeline. This action cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-primary" onClick={() => setSubmitted(true)}>
              Submit {validCount} Requests
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
