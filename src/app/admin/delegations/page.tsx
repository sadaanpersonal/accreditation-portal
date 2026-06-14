"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader, RefreshCw, UserCheck, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { delegationsApi, type DelegationDto, type DelegationUserOption } from "@/lib/api";

const STAGES = [
  { value: "1", label: "Stage 1 — FA Owner" },
  { value: "2", label: "Stage 2 — Zone Owner" },
  { value: "3", label: "Stage 3 — Media Owner" },
  { value: "4", label: "Stage 4 — MOI" },
];

function fmt(iso: string) {
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso; }
}

export default function DelegationsPage() {
  const [items, setItems]   = useState<DelegationDto[]>([]);
  const [users, setUsers]   = useState<DelegationUserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  // create form
  const [toUserId, setToUserId] = useState("");
  const [stage, setStage]       = useState("1");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt]     = useState("");
  const [note, setNote]         = useState("");
  const [saving, setSaving]     = useState(false);
  const [formErr, setFormErr]   = useState("");

  const [removeId, setRemoveId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await delegationsApi.list();
    setLoading(false);
    if (res.success && res.data) setItems(res.data);
    else setError(res.message ?? "Failed to load delegations.");
  }, []);

  useEffect(() => {
    load();
    delegationsApi.candidates().then(res => {
      if (res.success && res.data) setUsers(res.data);
    });
  }, [load]);

  async function create() {
    setFormErr("");
    if (!toUserId)            { setFormErr("Select a user to delegate to."); return; }
    if (!startsAt || !endsAt) { setFormErr("Pick a start and end date."); return; }
    setSaving(true);
    const res = await delegationsApi.create({
      toUserId,
      stage: Number(stage),
      startsAt: `${startsAt}T00:00:00`,
      endsAt:   `${endsAt}T23:59:59`,
      note: note.trim() || undefined,
    });
    setSaving(false);
    if (res.success) {
      toast.success("Delegation created.");
      setToUserId(""); setStage("1"); setStartsAt(""); setEndsAt(""); setNote("");
      load();
    } else {
      setFormErr(res.message ?? "Failed to create delegation.");
    }
  }

  async function remove() {
    if (!removeId) return;
    const res = await delegationsApi.remove(removeId);
    setRemoveId(null);
    if (res.success) { toast.success("Delegation removed."); load(); }
    else toast.error(res.message ?? "Failed to remove.");
  }

  const userOptions = users.map(u => ({ value: u.id, label: `${u.name}${u.roleName ? ` · ${u.roleName}` : ""}` }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Reviewer Delegation</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Cover a pipeline stage for a colleague who is out of office.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh"><RefreshCw size={14} /></button>
      </div>

      {/* Create */}
      <GlassCard>
        <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>New Delegation</h2></CardHeader>
        <CardBody>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Delegate to *</label>
              <Select options={userOptions} value={toUserId} onChange={setToUserId} placeholder="Select a user" isSearchable />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Stage *</label>
              <Select options={STAGES} value={stage} onChange={setStage} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">From *</label>
              <DatePicker value={startsAt} onChange={setStartsAt} placeholder="Start date" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Until *</label>
              <DatePicker value={endsAt} onChange={setEndsAt} placeholder="End date" />
            </div>
            <div className="form-group" style={{ margin: 0, gridColumn: "1 / -1" }}>
              <label className="form-label">Note</label>
              <input className="form-control" placeholder="Optional — e.g. Annual leave cover" value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>
          {formErr && <p style={{ fontSize: 12, color: "#F87171", marginTop: 10 }}>{formErr}</p>}
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-primary btn-sm" onClick={create} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {saving ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={14} />} Create Delegation
            </button>
          </div>
        </CardBody>
      </GlassCard>

      {/* List */}
      <GlassCard>
        <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Delegations</h2></CardHeader>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 24px", color: "var(--text-muted)", gap: 10 }}>
              <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading…
            </div>
          ) : error ? (
            <div style={{ padding: 24, color: "#F87171", textAlign: "center" }}>{error}</div>
          ) : (
            <table className="data-table">
              <thead><tr><th>From</th><th>To</th><th>Stage</th><th>Period</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {items.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 500 }}>{d.fromUserName}</td>
                    <td style={{ display: "flex", alignItems: "center", gap: 6 }}><UserCheck size={13} color="var(--gold)" /> {d.toUserName}</td>
                    <td style={{ fontSize: 12 }}>{d.stageName}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmt(d.startsAt)} → {fmt(d.endsAt)}</td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 600, color: d.isActive ? "#22C55E" : "var(--text-muted)" }}>
                        {d.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => setRemoveId(d.id)} title="Remove" style={{ background: "none", border: "none", cursor: "pointer", color: "#F87171", display: "flex" }}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 28 }}>No delegations yet.</td></tr>}
              </tbody>
            </table>
          )}
        </CardBody>
      </GlassCard>

      <ConfirmDialog
        open={!!removeId}
        title="Remove delegation?"
        message="The delegate will no longer be able to review that stage."
        confirmLabel="Remove"
        danger
        onConfirm={remove}
        onClose={() => setRemoveId(null)}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
