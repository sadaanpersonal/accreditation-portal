"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, LayoutGrid, List, Shield, Loader, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { EventCard, type EventCardData } from "@/components/shared/EventCard";
import { CreateEventModal } from "@/components/shared/CreateEventModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { eventsApi, type EventDto } from "@/lib/api";
import { useAuth, Permissions } from "@/contexts/AuthContext";

const DELETE_BLOCKED_REASON = "Events with accredited users can't be deleted.";

const CARD_COLORS  = ["linear-gradient(135deg,#4A0A1E,#8B1A3A)","linear-gradient(135deg,#1A4A8A,#2060B0)","linear-gradient(135deg,#065F46,#059669)","linear-gradient(135deg,#4C1D95,#6D28D9)","linear-gradient(135deg,#78350F,#D97706)"];
const CARD_ACCENTS = ["#C9A84C","#60A5FA","#34D399","#A78BFA","#F59E0B"];

type View = "card" | "list";

/** Map API EventDto → EventCardData shape expected by EventCard. */
function toEventShape(dto: EventDto, idx: number): EventCardData {
  const statusMap: Record<string, "active" | "upcoming" | "completed"> = {
    Active:    "active",
    Draft:     "upcoming",
    Completed: "completed",
    Cancelled: "completed",
  };
  const ci = idx % CARD_COLORS.length;
  const expired = dto.status === "Completed" || dto.status === "Cancelled" || new Date(dto.endDate) < new Date();
  return {
    id:             dto.id,
    name:           dto.name,
    status:         statusMap[dto.status] ?? "upcoming",
    moiRequired:    dto.moiRequired,
    dates:          `${new Date(dto.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} – ${new Date(dto.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
    location:       [dto.venue, dto.location].filter(Boolean).join(", "),
    accreditations: dto.accreditations ?? 0,
    color:          CARD_COLORS[ci],
    accentColor:    CARD_ACCENTS[ci],
    expired,
  };
}

export default function AdminEventsPage() {
  const { hasPermission } = useAuth();
  const canCreate  = hasPermission(Permissions.EventsCreate);
  const canEdit    = hasPermission(Permissions.EventsUpdate);
  const canRemove  = hasPermission(Permissions.EventsDelete);

  const [events,       setEvents]       = useState<EventDto[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editEvent,    setEditEvent]    = useState<EventDto | null>(null);
  const [confirmEvent, setConfirmEvent] = useState<EventCardData | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [view,         setView]         = useState<View>("card");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params: Record<string, string | number> = { pageNumber: page, pageSize: 20 };
    if (statusFilter !== "all") params.status = statusFilter;
    const res = await eventsApi.list(params);
    setLoading(false);
    if (res.success && res.data) {
      setEvents(res.data.items);
      setTotalPages(res.data.totalPages);
    } else {
      setError(res.message ?? "Failed to load events.");
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  function handleSaved() {
    // Re-fetch after create/update so we get server-assigned ID / counts
    load();
    setModalOpen(false);
    setEditEvent(null);
  }

  function openCreate() {
    setEditEvent(null);
    setModalOpen(true);
  }

  function handleEdit(id: string) {
    setEditEvent(events.find(e => e.id === id) ?? null);
    setModalOpen(true);
  }

  function handleDelete(card: EventCardData) {
    setConfirmEvent(card);
  }

  async function doDelete() {
    if (!confirmEvent) return;
    setDeleting(true);
    const res = await eventsApi.delete(confirmEvent.id);
    setDeleting(false);
    setConfirmEvent(null);
    if (res.success) {
      toast.success("Event deleted.");
      load();
    }
    // Failures surface automatically via the global API error toast.
  }

  const filtered   = events.map((e, i) => toEventShape(e, i));
  const activeCount    = events.filter(e => e.status === "Active").length;
  const upcomingCount  = events.filter(e => e.status === "Draft").length;
  const completedCount = events.filter(e => e.status === "Completed" || e.status === "Cancelled").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Events</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0" }}>
            {events.length} total · {activeCount} active · {upcomingCount} upcoming · {completedCount} completed
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* View toggle */}
          <div style={{ display: "flex", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: 3, gap: 2 }}>
            {(["card", "list"] as View[]).map(v => (
              <button key={v} onClick={() => setView(v)} title={v === "card" ? "Card view" : "List view"}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 7, border: "none", cursor: "pointer", background: view === v ? "var(--surface-3)" : "transparent", color: view === v ? "var(--text-primary)" : "var(--text-muted)", transition: "all 0.15s" }}
              >
                {v === "card" ? <LayoutGrid size={15} /> : <List size={15} />}
              </button>
            ))}
          </div>

          <select className="form-control" style={{ margin: 0, width: "auto", fontSize: 13 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Draft">Upcoming</option>
            <option value="Completed">Completed</option>
          </select>

          <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh" style={{ padding: "6px 10px" }}>
            <RefreshCw size={14} />
          </button>

          {canCreate && (
            <button className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={openCreate}>
              <Plus size={14} /> Create Event
            </button>
          )}
        </div>
      </div>

      {/* Stats chips */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "Active",       count: activeCount,                                     color: "#22C55E" },
          { label: "Upcoming",     count: upcomingCount,                                   color: "#F59E0B" },
          { label: "Completed",    count: completedCount,                                  color: "#6B7280" },
          { label: "MOI Required", count: events.filter(e => e.moiRequired).length,        color: "#C9A84C", icon: <Shield size={10} /> },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: `${s.color}12`, border: `1px solid ${s.color}30`, fontSize: 11, fontWeight: 600, color: s.color }}>
            {s.icon ?? <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />}
            {s.label} · {s.count}
          </div>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "48px 24px", color: "var(--text-muted)" }}>
          <Loader size={20} style={{ animation: "spin 1s linear infinite" }} /> Loading events…
        </div>
      )}

      {error && !loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 12, color: "#F87171" }}>
          <AlertCircle size={16} /> {error}
          <button className="btn btn-secondary btn-sm" onClick={load} style={{ marginLeft: "auto" }}>Retry</button>
        </div>
      )}

      {/* Card view */}
      {!loading && !error && view === "card" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={canEdit ? () => handleEdit(event.id) : undefined}
              onDelete={canRemove ? () => handleDelete(event) : undefined}
              canDelete={event.accreditations === 0}
              deleteDisabledReason={DELETE_BLOCKED_REASON}
            />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No events found</div>
              <div style={{ fontSize: 12 }}>Try a different status filter or create one</div>
            </div>
          )}
        </div>
      )}

      {/* List view */}
      {!loading && !error && view === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(event => (
            <EventCard
              key={event.id}
              event={event}
              listView
              onEdit={canEdit ? () => handleEdit(event.id) : undefined}
              onDelete={canRemove ? () => handleDelete(event) : undefined}
              canDelete={event.accreditations === 0}
              deleteDisabledReason={DELETE_BLOCKED_REASON}
            />
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)", background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No events found</div>
              <div style={{ fontSize: 12 }}>Try a different filter</div>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ fontSize: 12, color: "var(--text-muted)", alignSelf: "center" }}>Page {page} of {totalPages}</span>
          <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      <CreateEventModal
        open={modalOpen}
        event={editEvent}
        onClose={() => { setModalOpen(false); setEditEvent(null); }}
        onCreate={handleSaved}
      />

      <ConfirmDialog
        open={!!confirmEvent}
        danger
        title="Delete event?"
        message={<>This will permanently remove <strong>{confirmEvent?.name}</strong>. This action cannot be undone.</>}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={doDelete}
        onClose={() => setConfirmEvent(null)}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
