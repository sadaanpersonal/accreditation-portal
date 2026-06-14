"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, Loader, AlertCircle } from "lucide-react";
import { PassCard } from "@/components/shared/PassCard";
import { passesApi, passVerifyUrl, type PassDto } from "@/lib/api";

function fmt(iso: string) {
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}

function PrintPasses() {
  const params = useSearchParams();
  const ids = (params.get("ids") ?? "").split(",").map(s => s.trim()).filter(Boolean);

  const [passes, setPasses] = useState<PassDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) { setLoading(false); return; }
    Promise.all(ids.map(id => passesApi.get(id)))
      .then(results => {
        setPasses(results.filter(r => r.success && r.data).map(r => r.data as PassDto));
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get("ids")]);

  // Auto-open the print dialog once the badges have rendered.
  useEffect(() => {
    if (!loading && passes.length > 0) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [loading, passes.length]);

  if (loading) return (
    <div className="print-center"><Loader size={22} style={{ animation: "spin 1s linear infinite" }} /> Preparing badges…</div>
  );

  if (passes.length === 0) return (
    <div className="print-center"><AlertCircle size={20} color="#F87171" /> No passes found to print.</div>
  );

  return (
    <div className="print-root">
      <div className="no-print print-toolbar">
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{passes.length} badge{passes.length !== 1 ? "s" : ""} ready</span>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Printer size={14} /> Print / Save PDF
        </button>
      </div>

      <div className="print-sheet">
        {passes.map(p => {
          const expired = new Date(p.validTo) < new Date();
          return (
            <div className="print-badge" key={p.id}>
              <PassCard
                name={p.applicantName}
                passportNo={p.passportNumber}
                role={p.role}
                event={p.eventName}
                validUntil={fmt(p.validTo)}
                zones={p.zoneAccess ? p.zoneAccess.split(",").map(z => z.trim()).filter(Boolean) : ["General"]}
                accId={p.passNumber}
                issuedDate={fmt(p.issuedAt)}
                qrValue={passVerifyUrl(p.id)}
                revoked={p.isRevoked}
                expired={expired}
                style={{ width: 320 }}
              />
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .print-center { min-height: 100vh; display: flex; align-items: center; justify-content: center; gap: 10px; color: var(--text-muted); }
        .print-root { min-height: 100vh; padding: 24px; }
        .print-toolbar { display: flex; align-items: center; justify-content: space-between; max-width: 700px; margin: 0 auto 20px; }
        .print-sheet { display: flex; flex-wrap: wrap; gap: 24px; justify-content: center; }
        .print-badge { break-inside: avoid; }
        @media print {
          @page { margin: 12mm; }
          body { background: #fff !important; }
          .bg-canvas, .no-print { display: none !important; }
          .print-root { padding: 0; }
          .print-sheet { gap: 16px; }
          .print-badge { page-break-after: always; break-after: page; }
          .print-badge:last-child { page-break-after: auto; break-after: auto; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}

export default function PrintPassesPage() {
  return (
    <Suspense fallback={<div className="print-center">Loading…</div>}>
      <PrintPasses />
    </Suspense>
  );
}
