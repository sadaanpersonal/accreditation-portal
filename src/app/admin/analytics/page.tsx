"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Loader, RefreshCw, FileText, CheckCircle, Clock, XCircle, HelpCircle, TrendingUp } from "lucide-react";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { ExportButton } from "@/components/ui/ExportButton";
import { requestsApi, type RequestDto } from "@/lib/api";

const STAGE_NAMES = ["FA Owner", "Zone Owner", "Media Owner", "MOI"];

function stageName(r: RequestDto): string {
  if (r.isRejected) return "Rejected";
  if (r.currentStage > 4) return "Approved";
  return STAGE_NAMES[r.currentStage - 1] ?? `Stage ${r.currentStage}`;
}

function isOpen(r: RequestDto): boolean {
  return !r.isRejected && r.status !== "Approved" && r.currentStage <= 4;
}

/** Count occurrences keyed by a selector, returned sorted desc. */
function tally(rows: RequestDto[], key: (r: RequestDto) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = key(r) || "—";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
}

const COLORS = ["#C9A84C", "#60A5FA", "#A78BFA", "#34D399", "#F472B6", "#FB923C", "#22D3EE", "#F87171"];

function Bars({ data, max }: { data: [string, number][]; max: number }) {
  if (data.length === 0) return <p style={{ fontSize: 12, color: "var(--text-muted)" }}>No data.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map(([label, count], i) => (
        <div key={label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: "var(--text-secondary)" }}>{label}</span>
            <span style={{ fontWeight: 600 }}>{count}</span>
          </div>
          <div style={{ height: 8, background: "var(--surface-3)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${max ? (count / max) * 100 : 0}%`, height: "100%", background: COLORS[i % COLORS.length], borderRadius: 4, transition: "width 0.4s" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Kpi({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <GlassCard>
      <CardBody style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}1A`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{label}</div>
        </div>
      </CardBody>
    </GlassCard>
  );
}

export default function AnalyticsPage() {
  const [rows, setRows] = useState<RequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await requestsApi.list({ pageNumber: 1, pageSize: 1000 });
    setLoading(false);
    if (res.success && res.data) setRows(res.data.items);
    else setError(res.message ?? "Failed to load analytics.");
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const total = rows.length;
    const approved = rows.filter(r => r.status === "Approved").length;
    const rejected = rows.filter(r => r.isRejected || r.status === "Rejected").length;
    const info = rows.filter(r => r.isInfoRequested).length;
    const open = rows.filter(isOpen).length;
    const decided = approved + rejected;
    const approvalRate = decided ? Math.round((approved / decided) * 100) : 0;

    const byStatus = tally(rows, r => (r.isRejected ? "Rejected" : r.status));
    const byRole = tally(rows, r => r.role);
    const byEvent = tally(rows, r => r.eventName).slice(0, 8);
    const byNationality = tally(rows, r => r.nationality).slice(0, 8);
    const byStage = tally(rows.filter(isOpen), stageName);

    return { total, approved, rejected, info, open, approvalRate, byStatus, byRole, byEvent, byNationality, byStage };
  }, [rows]);

  const fetchExport = useCallback(async () => ({
    headers: ["Metric", "Value"],
    rows: [
      ["Total requests", stats.total],
      ["Approved", stats.approved],
      ["In pipeline", stats.open],
      ["Rejected", stats.rejected],
      ["Info requested", stats.info],
      ["Approval rate %", stats.approvalRate],
      ...stats.byRole.map(([k, v]) => [`Role: ${k}`, v] as [string, number]),
      ...stats.byEvent.map(([k, v]) => [`Event: ${k}`, v] as [string, number]),
    ],
  }), [stats]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "80px 24px", color: "var(--text-muted)", gap: 10 }}>
      <Loader size={20} style={{ animation: "spin 1s linear infinite" }} /> Loading analytics…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return <div style={{ padding: 24, color: "#F87171" }}>{error}</div>;

  const maxStatus = Math.max(1, ...stats.byStatus.map(d => d[1]));
  const maxRole = Math.max(1, ...stats.byRole.map(d => d[1]));
  const maxEvent = Math.max(1, ...stats.byEvent.map(d => d[1]));
  const maxNat = Math.max(1, ...stats.byNationality.map(d => d[1]));
  const maxStage = Math.max(1, ...stats.byStage.map(d => d[1]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Analytics</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh"><RefreshCw size={14} /></button>
          <ExportButton filename="accreditation-analytics" title="Accreditation Analytics" fetchData={fetchExport} disabled={stats.total === 0} />
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <Kpi icon={<FileText size={20} />} label="Total Requests" value={stats.total} color="#C9A84C" />
        <Kpi icon={<CheckCircle size={20} />} label="Approved" value={stats.approved} color="#22C55E" />
        <Kpi icon={<Clock size={20} />} label="In Pipeline" value={stats.open} color="#60A5FA" />
        <Kpi icon={<HelpCircle size={20} />} label="Info Requested" value={stats.info} color="#F59E0B" />
        <Kpi icon={<XCircle size={20} />} label="Rejected" value={stats.rejected} color="#F87171" />
        <Kpi icon={<TrendingUp size={20} />} label="Approval Rate" value={`${stats.approvalRate}%`} color="#A78BFA" />
      </div>

      {/* Breakdowns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <GlassCard>
          <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Pipeline Stage (open)</h2></CardHeader>
          <CardBody><Bars data={stats.byStage} max={maxStage} /></CardBody>
        </GlassCard>
        <GlassCard>
          <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>By Status</h2></CardHeader>
          <CardBody><Bars data={stats.byStatus} max={maxStatus} /></CardBody>
        </GlassCard>
        <GlassCard>
          <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>By Role</h2></CardHeader>
          <CardBody><Bars data={stats.byRole} max={maxRole} /></CardBody>
        </GlassCard>
        <GlassCard>
          <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Top Events</h2></CardHeader>
          <CardBody><Bars data={stats.byEvent} max={maxEvent} /></CardBody>
        </GlassCard>
        <GlassCard>
          <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Top Nationalities</h2></CardHeader>
          <CardBody><Bars data={stats.byNationality} max={maxNat} /></CardBody>
        </GlassCard>
      </div>
    </div>
  );
}
