"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { EventCard } from "@/components/shared/EventCard";
import { EVENTS } from "@/data/events";

export default function RequestorEventsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [applied, setApplied] = useState<Set<string>>(new Set(["gulf-athletics-2026"]));

  const filtered = EVENTS.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || e.status === filter;
    return matchSearch && matchFilter;
  });

  function handleApply(id: string) {
    setApplied(prev => { const next = new Set(prev); next.add(id); return next; });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Events</h1>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="form-control" style={{ paddingLeft: 32, margin: 0 }} placeholder="Search events…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ margin: 0, width: "auto" }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Events</option>
          <option value="active">Open</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Closed</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {filtered.map(event => (
          <EventCard
            key={event.id}
            event={event}
            onApply={event.status !== "completed" ? () => handleApply(event.id) : undefined}
            applied={applied.has(event.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--text-muted)", padding: 40 }}>No events found</div>
        )}
      </div>
    </div>
  );
}
