"use client";
import { useEffect, useState } from "react";
import { Loader, Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { usersApi, type UserDto, type RoleDto } from "@/lib/api";

interface Props {
  open: boolean;
  user: UserDto | null;
  roles: RoleDto[];
  onClose: () => void;
  onSaved: () => void;
}

function roleLabel(code: string) {
  return code.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export function EditUserModal({ open, user, roles, onClose, onSaved }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [phone,     setPhone]     = useState("");
  const [roleId,    setRoleId]    = useState("");
  const [isActive,  setIsActive]  = useState(true);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setPhone(user.phone ?? "");
    setIsActive(user.isActive);
    setRoleId(roles.find(r => r.code === user.role)?.id ?? "");
  }, [open, user, roles]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const res = await usersApi.update(user.id, {
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      phone:     phone.trim() || null,
      roleId:    roleId || undefined,
      isActive,
    });
    setSaving(false);
    if (res.success) onSaved();
    // Failures surface via the global API error toast.
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit User" maxWidth="460px">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{user?.email}</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="First Name">
            <input className="form-control" value={firstName} onChange={e => setFirstName(e.target.value)} />
          </Field>
          <Field label="Last Name">
            <input className="form-control" value={lastName} onChange={e => setLastName(e.target.value)} />
          </Field>
        </div>

        <Field label="Phone">
          <input className="form-control" placeholder="Optional" value={phone} onChange={e => setPhone(e.target.value)} />
        </Field>

        {roles.length > 0 && (
          <Field label="Role">
            <select className="form-control" value={roleId} onChange={e => setRoleId(e.target.value)}>
              <option value="">No role</option>
              {roles.map(r => <option key={r.id} value={r.id}>{roleLabel(r.code)}</option>)}
            </select>
          </Field>
        )}

        <div
          onClick={() => setIsActive(v => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
            borderRadius: "var(--radius-sm)", cursor: "pointer", userSelect: "none",
            border: `1px solid ${isActive ? "rgba(34,197,94,0.4)" : "var(--border)"}`,
            background: isActive ? "rgba(34,197,94,0.06)" : "var(--surface-3)",
          }}
        >
          <div style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
            border: `2px solid ${isActive ? "#22C55E" : "var(--border)"}`,
            background: isActive ? "#22C55E" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {isActive && <Check size={11} color="#000" strokeWidth={3} />}
          </div>
          <span style={{ fontSize: 13, color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}>
            Active account
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving || !firstName.trim() || !lastName.trim()}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            {saving ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : "Save Changes"}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
