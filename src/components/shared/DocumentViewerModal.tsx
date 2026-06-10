"use client";
import { Modal } from "@/components/ui/Modal";
import { ExternalLink, FileText } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Absolute http(s) URL, data: URL, or blob: URL. */
  src: string;
  fileName?: string;
  mime?: string;
}

function inferKind(src: string, mime?: string): "image" | "pdf" | "other" {
  const m = (mime ?? "").toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m === "application/pdf") return "pdf";
  const path = src.split("?")[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp)$/.test(path)) return "image";
  if (/\.pdf$/.test(path)) return "pdf";
  if (src.startsWith("data:image/")) return "image";
  if (src.startsWith("data:application/pdf")) return "pdf";
  return "other";
}

export function DocumentViewerModal({ open, onClose, src, fileName, mime }: Props) {
  const kind = inferKind(src, mime);
  const canOpenInTab = !src.startsWith("data:"); // Chrome blocks top-level data: navigation

  return (
    <Modal open={open} onClose={onClose} title={fileName ?? "Document"} maxWidth="760px">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            background: "var(--surface-3)", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            minHeight: 320, maxHeight: "70vh",
          }}
        >
          {kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={fileName ?? "document"} style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", display: "block" }} />
          )}
          {kind === "pdf" && (
            <iframe src={src} title={fileName ?? "document"} style={{ width: "100%", height: "70vh", border: "none" }} />
          )}
          {kind === "other" && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
              <FileText size={36} style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 13 }}>Preview is not available for this file type.</p>
            </div>
          )}
        </div>

        {canOpenInTab && (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ alignSelf: "flex-end", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <ExternalLink size={14} /> Open in new tab
          </a>
        )}
      </div>
    </Modal>
  );
}
