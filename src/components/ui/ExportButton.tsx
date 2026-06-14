"use client";
import { useState } from "react";
import { Download, ChevronDown, Loader, FileText, FileSpreadsheet, FileType } from "lucide-react";
import { runExport, type ExportFormat, type TableData } from "@/lib/export";

interface Props {
  filename: string;
  title: string;
  /** Lazily fetch the rows to export (so it can pull the full, unpaginated set). */
  fetchData: () => Promise<TableData>;
  disabled?: boolean;
}

const FORMATS: { key: ExportFormat; label: string; icon: React.ReactNode }[] = [
  { key: "csv",  label: "CSV (.csv)",   icon: <FileText size={14} /> },
  { key: "xlsx", label: "Excel (.xlsx)", icon: <FileSpreadsheet size={14} /> },
  { key: "pdf",  label: "PDF (.pdf)",   icon: <FileType size={14} /> },
];

export function ExportButton({ filename, title, fetchData, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handle(format: ExportFormat) {
    setOpen(false);
    setBusy(true);
    try {
      const data = await fetchData();
      runExport(format, filename, title, data);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        className="btn btn-secondary btn-sm"
        disabled={disabled || busy}
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 6 }}
      >
        {busy ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={14} />}
        Export <ChevronDown size={13} />
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div style={{
            position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 41,
            background: "var(--surface-2)", border: "1px solid var(--border-strong)",
            borderRadius: 10, boxShadow: "0 16px 48px rgba(0,0,0,0.45)", padding: 4, minWidth: 170,
          }}>
            {FORMATS.map(f => (
              <button
                key={f.key}
                onClick={() => handle(f.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  padding: "8px 10px", background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-primary)", fontSize: 13, borderRadius: 7, textAlign: "left",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(201,168,76,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
