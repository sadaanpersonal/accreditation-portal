"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, CheckCircle, XCircle, LogIn, LogOut, Loader, ScanLine } from "lucide-react";
import { GlassCard, CardHeader, CardBody } from "@/components/ui/GlassCard";
import { checkInApi, type CheckInResult, type CheckInLogItem } from "@/lib/api";

/** Pull a pass id out of a scanned verify URL, or accept a raw GUID. */
function extractPassId(text: string): string | null {
  const url = text.match(/verify\/([0-9a-fA-F-]{36})/);
  if (url) return url[1];
  return /^[0-9a-fA-F-]{36}$/.test(text.trim()) ? text.trim() : null;
}

export default function CheckInPage() {
  const [direction, setDirection] = useState<"In" | "Out">("In");
  const [gate, setGate]           = useState("");
  const [scanning, setScanning]   = useState(false);
  const [busy, setBusy]           = useState(false);
  const [manual, setManual]       = useState("");
  const [result, setResult]       = useState<CheckInResult | null>(null);
  const [error, setError]         = useState("");
  const [recent, setRecent]       = useState<CheckInLogItem[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  const lockRef    = useRef(false); // debounce duplicate scans
  const dirRef     = useRef(direction);
  const gateRef    = useRef(gate);
  dirRef.current = direction;
  gateRef.current = gate;

  const loadLog = useCallback(async () => {
    const res = await checkInApi.log({ pageNumber: 1, pageSize: 8 });
    if (res.success && res.data) setRecent(res.data.items);
  }, []);

  useEffect(() => { loadLog(); }, [loadLog]);

  const submit = useCallback(async (passId: string) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setBusy(true);
    setError("");
    const res = await checkInApi.record(passId, dirRef.current, gateRef.current.trim() || undefined);
    setBusy(false);
    if (res.success && res.data) {
      setResult(res.data);
      loadLog();
    } else {
      setError(res.message ?? "Scan failed.");
    }
    // brief cooldown so one QR isn't recorded repeatedly
    setTimeout(() => { lockRef.current = false; }, 2500);
  }, [loadLog]);

  async function startScan() {
    setError("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (text: string) => {
          const id = extractPassId(text);
          if (id) submit(id);
        },
        () => {},
      );
      setScanning(true);
    } catch {
      setError("Could not start the camera. Check permissions, or use manual entry below.");
    }
  }

  const stopScan = useCallback(async () => {
    const s = scannerRef.current;
    if (s) {
      try { await s.stop(); await s.clear(); } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => () => { stopScan(); }, [stopScan]);

  function handleManual(e: React.FormEvent) {
    e.preventDefault();
    const id = extractPassId(manual);
    if (!id) { setError("Enter a valid pass ID or paste the QR link."); return; }
    submit(id);
    setManual("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900, margin: "0 auto" }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Gate Check-In</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Scan a pass QR to verify and log entry/exit.</p>
      </div>

      {/* Controls */}
      <GlassCard>
        <CardBody style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label className="form-label">Direction</label>
            <div style={{ display: "flex", gap: 6 }}>
              <button className={`btn btn-sm ${direction === "In" ? "btn-success" : "btn-secondary"}`} onClick={() => setDirection("In")} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <LogIn size={14} /> In
              </button>
              <button className={`btn btn-sm ${direction === "Out" ? "btn-primary" : "btn-secondary"}`} onClick={() => setDirection("Out")} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <LogOut size={14} /> Out
              </button>
            </div>
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <label className="form-label">Gate / Location</label>
            <input className="form-control" placeholder="e.g. Gate A — North" value={gate} onChange={e => setGate(e.target.value)} />
          </div>
        </CardBody>
      </GlassCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* Scanner */}
        <GlassCard>
          <CardHeader>
            <h2 style={{ fontSize: 14, fontWeight: 600 }}>Scanner</h2>
            {scanning
              ? <button className="btn btn-secondary btn-sm" onClick={stopScan} style={{ display: "flex", alignItems: "center", gap: 6 }}><CameraOff size={14} /> Stop</button>
              : <button className="btn btn-primary btn-sm" onClick={startScan} style={{ display: "flex", alignItems: "center", gap: 6 }}><Camera size={14} /> Start camera</button>}
          </CardHeader>
          <CardBody>
            <div id="qr-reader" style={{ width: "100%", borderRadius: 10, overflow: "hidden", minHeight: 220, background: "var(--surface-3)", display: scanning ? "block" : "flex", alignItems: "center", justifyContent: "center" }}>
              {!scanning && (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>
                  <ScanLine size={28} style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 13 }}>Camera is off. Press “Start camera”.</div>
                </div>
              )}
            </div>

            {/* Manual fallback */}
            <form onSubmit={handleManual} style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input className="form-control" style={{ margin: 0 }} placeholder="Or paste pass link / ID…" value={manual} onChange={e => setManual(e.target.value)} />
              <button className="btn btn-secondary btn-sm" type="submit" disabled={busy}>Check</button>
            </form>
            {error && <p style={{ fontSize: 12, color: "#F87171", marginTop: 8 }}>{error}</p>}
          </CardBody>
        </GlassCard>

        {/* Result */}
        <GlassCard>
          <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Result</h2></CardHeader>
          <CardBody>
            {busy ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", padding: "24px 0", justifyContent: "center" }}>
                <Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Verifying…
              </div>
            ) : result ? (
              <div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, marginBottom: 14,
                  background: result.allowed ? "rgba(34,197,94,0.1)" : "rgba(248,113,113,0.1)",
                  border: `1px solid ${result.allowed ? "rgba(34,197,94,0.4)" : "rgba(248,113,113,0.4)"}`,
                }}>
                  {result.allowed ? <CheckCircle size={32} color="#22C55E" /> : <XCircle size={32} color="#F87171" />}
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: result.allowed ? "#22C55E" : "#F87171" }}>
                      {result.allowed ? "ACCESS GRANTED" : "ACCESS DENIED"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{result.status} · checked {result.direction === "In" ? "in" : "out"}</div>
                  </div>
                </div>
                {result.message && <p style={{ fontSize: 12, color: "#F87171", marginBottom: 10 }}>{result.message}</p>}
                <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 14px", margin: 0 }}>
                  {[
                    ["Holder", result.holderName],
                    ["Role", result.role],
                    ["Event", result.eventName],
                    ["Zones", result.zoneAccess || "—"],
                    ["Gate", result.gate || "—"],
                    ["Time", new Date(result.scannedAt).toLocaleTimeString()],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt style={{ fontSize: 11, color: "var(--text-muted)" }}>{k}</dt>
                      <dd style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "var(--text-muted)", padding: "24px 0", textAlign: "center" }}>
                Scan a pass to see the result here.
              </p>
            )}
          </CardBody>
        </GlassCard>
      </div>

      {/* Recent scans */}
      <GlassCard>
        <CardHeader><h2 style={{ fontSize: 14, fontWeight: 600 }}>Recent Check-Ins</h2></CardHeader>
        <CardBody style={{ padding: 0 }}>
          <table className="data-table">
            <thead><tr><th>Holder</th><th>Pass</th><th>Dir.</th><th>Gate</th><th>By</th><th>Time</th></tr></thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.holderName}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-muted)" }}>{r.passNumber}</td>
                  <td><span style={{ fontSize: 11, fontWeight: 600, color: r.direction === "In" ? "#22C55E" : "#60A5FA" }}>{r.direction}</span></td>
                  <td style={{ fontSize: 12 }}>{r.gate || "—"}</td>
                  <td style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.scannedByName || "—"}</td>
                  <td style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(r.scannedAt).toLocaleString()}</td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>No check-ins yet.</td></tr>}
            </tbody>
          </table>
        </CardBody>
      </GlassCard>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
