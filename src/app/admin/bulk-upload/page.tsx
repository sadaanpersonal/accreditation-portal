import { GlassCard, CardBody } from "@/components/ui/GlassCard";
import { BulkUpload } from "@/components/shared/BulkUpload";

export default function AdminBulkUploadPage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Bulk Upload</h1>
      <GlassCard>
        <CardBody>
          <BulkUpload />
        </CardBody>
      </GlassCard>
    </div>
  );
}
