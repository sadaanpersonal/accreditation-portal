"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = "480px" }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="modal-box"
            style={{ maxWidth, maxHeight: "calc(100vh - 40px)", display: "flex", flexDirection: "column" }}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            {/* Pinned header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: title ? 16 : 0, flexShrink: 0 }}>
              {title && <h2 style={{ marginBottom: 0 }}>{title}</h2>}
              <button
                onClick={onClose}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, marginLeft: "auto" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable content */}
            <div style={{ overflowY: "auto", flex: "1 1 auto", minHeight: 0, margin: "0 -6px", padding: "0 6px" }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
