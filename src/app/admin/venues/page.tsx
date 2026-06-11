"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, MapPin, Loader, RefreshCw, Pencil, Trash2, Grid3X3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GlassCard, CardBody } from "@/components/ui/GlassCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { venuesApi, type VenueDto } from "@/lib/api";

/** Small read-only preview of a venue's zone layout. */
function MiniMap({ venue }: { venue: VenueDto }) {
  return (
    <svg viewBox="0 0 400 260" width="100%" style={{ display: "block", background: "var(--surface-2)", borderRadius: 8 }}>
      {venue.zones.map((z, i) => (
        <rect key={z.id ?? i} x={z.x} y={z.y} width={z.width} height={z.height} rx={3}
          fill={`${z.color}30`} stroke={z.color} strokeWidth={1} />
      ))}
      {venue.zones.length === 0 && (
        <text x={200} y={130} textAnchor="middle" dominantBaseline="middle" fontSize={13} fill="var(--text-muted)" fontFamily="DM Sans, sans-serif">
          No zones defined
        </text>
      )}
    </svg>
  );
}

export default function AdminVenuesPage() {
  const router = useRouter();
  const [venues,   setVenues]   = useState<VenueDto[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [toDelete, setToDelete] = useState<VenueDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await venuesApi.list();
    setLoading(false);
    if (res.success && res.data) setVenues(res.data);
    else setError(res.message ?? "Failed to load venues.");
  }, []);

  useEffect(() => { load(); }, [load]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const res = await venuesApi.delete(toDelete.id);
    setDeleting(false);
    setToDelete(null);
    if (res.success) {
      toast.success("Venue deleted.");
      load();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Venues</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0" }}>
            {loading ? "…" : `${venues.length} venue${venues.length === 1 ? "" : "s"} · zone layouts used in accreditation requests`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh"><RefreshCw size={14} /></button>
          <Link href="/admin/venues/new" className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} /> New Venue
          </Link>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 24px", color: "var(--text-muted)", gap: 10 }}>
          <Loader size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading venues…
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: "16px 20px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 12, color: "#F87171" }}>
          {error}
          <button className="btn btn-secondary btn-sm" onClick={load} style={{ marginLeft: 12 }}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {venues.map(v => (
            <GlassCard key={v.id}>
              <CardBody style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <MiniMap venue={v} />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, fontSize: 11, color: "var(--text-muted)" }}>
                      {v.location && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} /> {v.location}</span>}
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Grid3X3 size={11} /> {v.zones.length} zone{v.zones.length === 1 ? "" : "s"}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/admin/venues/${v.id}`)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <Pencil size={13} /> Edit
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setToDelete(v)} title="Delete venue" style={{ display: "flex", alignItems: "center", color: "#F87171", padding: "0 10px" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </CardBody>
            </GlassCard>
          ))}

          {venues.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
              <MapPin size={32} style={{ display: "block", margin: "0 auto 10px" }} />
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No venues yet</div>
              <div style={{ fontSize: 12 }}>Create your first venue and design its access zones</div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        danger
        title="Delete venue?"
        message={<><strong>{toDelete?.name}</strong> and its zone layout will be removed. Requests that already reference it keep their stored venue text.</>}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
