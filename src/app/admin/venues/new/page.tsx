"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { VenueDesigner } from "@/components/shared/VenueDesigner";
import { venuesApi, type SaveVenuePayload } from "@/lib/api";

export default function NewVenuePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSave(payload: SaveVenuePayload) {
    setSaving(true);
    const res = await venuesApi.create(payload);
    setSaving(false);
    if (res.success && res.data) {
      toast.success("Venue created.");
      router.push("/admin/venues");
    }
    // Failures surface via the global API error toast.
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Link href="/admin/venues" style={{ color: "var(--text-muted)", display: "flex" }}>
          <ChevronLeft size={20} />
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>New Venue</h1>
      </div>

      <VenueDesigner saving={saving} onSave={handleSave} onCancel={() => router.push("/admin/venues")} />
    </div>
  );
}
