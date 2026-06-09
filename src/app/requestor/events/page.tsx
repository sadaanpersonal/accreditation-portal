"use client";
import { useEffect, useState, useCallback } from "react";
import { Search, Loader, RefreshCw } from "lucide-react";
import { EventCard, type EventCardData } from "@/components/shared/EventCard";
import { eventsApi, type EventDto } from "@/lib/api";

const CARD_COLORS  = [
  "linear-gradient(135deg,#6B0F2B,#8B1A3A)",
  "linear-gradient(135deg,#1A4A8A,#2060B0)",
  "linear-gradient(135deg,#065F46,#059669)",
  "linear-gradient(135deg,#4C1D95,#6D28D9)",
  "linear-gradient(135deg,#78350F,#D97706)",
  "linear-gradient(135deg,#1E3A5F,#2563EB)",
];
const CARD_ACCENTS = [
  "var(--gold)", "#60A5FA", "#34D399", "#A78BFA", "#F59E0B", "#93C5FD",
];

function normalizeStatus(s: string): "active" | "upcoming" | "completed" {
  const l = (s ?? "").toLowerCase();
  if (l === "active")    return "active";
  if (l === "upcoming")  return "upcoming";
  return "completed";
}

function formatDateRange(start: string, end: string): string {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    const yearOpts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", yearOpts)}`;
  } catch {
    return "";
  }
}

function toCardEvent(e: EventDto, idx: number): EventCardData {
  const ci = idx % CARD_COLORS.length;
  return {
    id:            e.id,
    name:          e.name,
    dates:         formatDateRange(e.startDate, e.endDate),
    location:      e.venue || e.location || "Qatar",
    status:        normalizeStatus(e.status),
    accreditations: e.accreditations ?? 0,
    moiRequired:   e.moiRequired,
    color:         CARD_COLORS[ci],
    accentColor:   CARD_ACCENTS[ci],
  };
}

export default function RequestorEventsPage() {
  const [events,  setEvents]  = useState<EventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");
  const [page,    setPage]    = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params: Record<string, string | number> = { pageSize: 12, pageNumber: page };
    if (search) params.searchTerm = search;
    if (filter !== "all") params.status = filter.charAt(0).toUpperCase() + filter.slice(1);
    const res = await eventsApi.list(params);
    setLoading(false);
    if (res.success && res.data) {
      setEvents(res.data.items);
      setTotalPages(res.data.totalPages);
    } else {
      setError(res.message ?? "Failed to load events.");
    }
  }, [search, filter, page]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Events</h1>
        <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading} title="Refresh">
          <RefreshCw size={13} style={loading ? { animation: "spin 1s linear infinite" } : undefined} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="form-control"
            style={{ paddingLeft: 32, margin: 0 }}
            placeholder="Search events…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
        <select
          className="form-control"
          style={{ margin: 0, width: "auto" }}
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(1); }}
        >
          <option value="all">All Events</option>
          <option value="active">Open</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Closed</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 24px", color: "var(--text-muted)", gap: 10 }}>
          <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading events…
        </div>
      ) : error ? (
        <div style={{ padding: "32px 24px", textAlign: "center", color: "#F87171" }}>
          {error}
          <button className="btn btn-secondary btn-sm" onClick={load} style={{ display: "block", margin: "12px auto 0" }}>Retry</button>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {events.map((e, i) => (
              <EventCard
                key={e.id}
                event={toCardEvent(e, i)}
                onApply={e.status.toLowerCase() !== "completed" ? () => {} : undefined}
                applied={false}
              />
            ))}
            {events.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
                No events found
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 8 }}>
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={{ fontSize: 12, color: "var(--text-muted)", alignSelf: "center" }}>Page {page} of {totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
