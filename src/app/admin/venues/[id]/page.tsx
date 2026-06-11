"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Loader } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { VenueDesigner } from "@/components/shared/VenueDesigner";
import { venuesApi, type VenueDto, type SaveVenuePayload } from "@/lib/api";

export default function EditVenuePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [venue,   setVenue]   = useState<VenueDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    venuesApi.get(id).then(res => {
      setLoading(false);
      if (res.success && res.data) setVenue(res.data);
      else setError(res.message ?? "Venue not found.");
    });
  }, [id]);

  async function handleSave(payload: SaveVenuePayload) {
    setSaving(true);
    const res = await venuesApi.update(id, payload);
    setSaving(false);
    if (res.success && res.data) {
      toast.success("Venue updated.");
      router.push("/admin/venues");
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300, gap: 10, color: "var(--text-muted)" }}>
        <Loader size={20} style={{ animation: "spin 1s linear infinite" }} /> Loading venue…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
        <p>{error || "Venue not found."}</p>
        <Link href="/admin/venues" style={{ color: "var(--gold)", fontSize: 13 }}>← Back to venues</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Link href="/admin/venues" style={{ color: "var(--text-muted)", display: "flex" }}>
          <ChevronLeft size={20} />
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Edit Venue</h1>
      </div>

      <VenueDesigner initial={venue} saving={saving} onSave={handleSave} onCancel={() => router.push("/admin/venues")} />
    </div>
  );
}
