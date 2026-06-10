"use client";
import { AlertTriangle, Loader } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface Props {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style the confirm button as destructive. */
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel",
  danger, loading, onConfirm, onClose,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={undefined} maxWidth="420px">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: danger ? "rgba(248,113,113,0.12)" : "rgba(201,168,76,0.12)",
              border: `1px solid ${danger ? "rgba(248,113,113,0.3)" : "rgba(201,168,76,0.3)"}`,
            }}
          >
            <AlertTriangle size={20} color={danger ? "#F87171" : "var(--gold)"} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: "2px 0 6px" }}>{title}</h2>
            <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{message}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            {loading && <Loader size={13} style={{ animation: "spin 1s linear infinite" }} />}
            {confirmLabel}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Modal>
  );
}
