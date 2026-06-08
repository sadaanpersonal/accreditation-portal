"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { EventCard } from "@/components/shared/EventCard";
import { CreateEventModal } from "@/components/shared/CreateEventModal";
import { EVENTS, type Event } from "@/data/events";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>(EVENTS);
  const [modalOpen, setModalOpen] = useState(false);

  function handleCreate(event: Event) {
    setEvents(prev => [event, ...prev]);
  }

  const activeCount   = events.filter(e => e.status === "active").length;
  const upcomingCount = events.filter(e => e.status === "upcoming").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Events</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0" }}>
            {events.length} total · {activeCount} active · {upcomingCount} upcoming
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
          onClick={() => setModalOpen(true)}
        >
          <Plus size={14} /> Create Event
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      <CreateEventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
