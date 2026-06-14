"use client";
import { useRef, useState } from "react";
import { Upload, FileText, Image as ImageIcon, X, Plus, Eye } from "lucide-react";
import { toast } from "sonner";
import { DocumentViewerModal } from "@/components/shared/DocumentViewerModal";
import { Select } from "@/components/ui/Select";

export type DocType = "Passport" | "Photo" | "Supporting" | "Other";

// Only PDF / PNG / JPEG are accepted.
const ACCEPT_ATTR = ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg";
const ALLOWED_MIME = ["application/pdf", "image/png", "image/jpeg"];
const ALLOWED_EXT = /\.(pdf|png|jpe?g)$/i;

function isAllowed(file: File): boolean {
  return ALLOWED_MIME.includes(file.type) || ALLOWED_EXT.test(file.name);
}

export interface UploadedDoc {
  /** Raw base64 (no data: prefix) — ready for the API. */
  base64Content: string;
  fileName: string;
  type: DocType;
  /** Full data URL kept only for in-browser preview. */
  previewUrl: string;
  /** MIME type, used to decide whether to show an image preview. */
  mime: string;
  sizeBytes: number;
}

const DOC_TYPES: DocType[] = ["Passport", "Photo", "Supporting", "Other"];

interface Props {
  value: UploadedDoc[];
  onChange: (docs: UploadedDoc[]) => void;
}

/** Read a File into { rawBase64, dataUrl }. */
function readFile(file: File): Promise<{ raw: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const comma = dataUrl.indexOf(",");
      resolve({ raw: comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl, dataUrl });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentUploader({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [viewing, setViewing] = useState<UploadedDoc | null>(null);

  async function addFiles(files: FileList | null, defaultType: DocType) {
    if (!files?.length) return;

    const incoming = Array.from(files);
    const accepted = incoming.filter(isAllowed);
    const rejected = incoming.filter(f => !isAllowed(f));

    if (rejected.length) {
      toast.error(
        `Only PDF, PNG or JPEG files are allowed. Skipped: ${rejected.map(f => f.name).join(", ")}`,
      );
    }

    const added: UploadedDoc[] = [];
    for (const file of accepted) {
      const { raw, dataUrl } = await readFile(file);
      added.push({
        base64Content: raw,
        fileName: file.name,
        type: defaultType,
        previewUrl: dataUrl,
        mime: file.type,
        sizeBytes: file.size,
      });
    }
    if (added.length) onChange([...value, ...added]);
  }

  function updateType(index: number, type: DocType) {
    onChange(value.map((d, i) => (i === index ? { ...d, type } : d)));
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Dropzone / picker */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files, "Passport"); }}
        style={{
          border: "1.5px dashed var(--border-strong)", borderRadius: "var(--radius-sm)",
          padding: "28px 20px", textAlign: "center", cursor: "pointer",
          background: "var(--surface-3)", transition: "border-color 0.15s",
          display: "flex", flexDirection: "column", alignItems: "center",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          style={{ display: "none" }}
          onChange={e => { addFiles(e.target.files, "Passport"); if (inputRef.current) inputRef.current.value = ""; }}
        />
        <Upload size={26} style={{ color: "var(--gold)", marginBottom: 8 }} />
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
          Drag &amp; drop passport / photo, or click to browse
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          PDF, PNG or JPEG only · up to a few MB each
        </div>
      </div>

      {/* Uploaded list */}
      {value.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {value.map((doc, i) => {
            const isImage = doc.mime.startsWith("image/");
            return (
              <div
                key={`${doc.fileName}-${i}`}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "8px 10px",
                  background: "var(--surface-3)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  width: 44, height: 44, borderRadius: 6, overflow: "hidden", flexShrink: 0,
                  background: "var(--surface-4)", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isImage
                    /* eslint-disable-next-line @next/next/no-img-element */
                    ? <img src={doc.previewUrl} alt={doc.fileName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <FileText size={20} color="var(--text-muted)" />}
                </div>

                {/* Name + size */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.fileName}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatSize(doc.sizeBytes)}</div>
                </div>

                {/* Type selector */}
                <Select
                  options={DOC_TYPES.map(t => ({ value: t, label: t }))}
                  value={doc.type}
                  onChange={v => updateType(i, v as DocType)}
                  ariaLabel="Document type"
                  width={150}
                />

                {/* View */}
                <button
                  type="button"
                  onClick={() => setViewing(doc)}
                  title="View document"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gold)", display: "flex", padding: 4 }}
                >
                  <Eye size={16} />
                </button>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  title="Remove"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 4 }}
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {value.length === 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
          <ImageIcon size={13} /> No documents added yet. A passport copy is recommended.
        </div>
      )}

      {value.length > 0 && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => inputRef.current?.click()}
          style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6 }}
        >
          <Plus size={14} /> Add another document
        </button>
      )}

      <DocumentViewerModal
        open={!!viewing}
        onClose={() => setViewing(null)}
        src={viewing?.previewUrl ?? ""}
        fileName={viewing?.fileName}
        mime={viewing?.mime}
      />
    </div>
  );
}
