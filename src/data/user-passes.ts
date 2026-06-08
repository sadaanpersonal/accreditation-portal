export interface UserPass {
  id: string;
  accId: string;
  label: string;
  event: string;
  role: "Media" | "VIP" | "Staff" | "Athlete" | "Official" | "Coach";
  name: string;
  passportNo: string;
  validFrom: string;
  validTo: string;
  issuedDate: string;
  zones: string[];
  zoneDesc: string;
  venue: string;
  qrSeed: number;
  expired: boolean;
  passStyle?: React.CSSProperties;
  roleStyle?: React.CSSProperties;
  accentColor: string;
  idColor: string;
}

export const USER_PASSES: UserPass[] = [
  {
    id: "acc-0",
    accId: "ACC-2026-GAC-001847",
    label: "Gulf Athletics 2026",
    event: "Gulf Athletics Championship 2026",
    role: "Media",
    name: "Fatima Khalid Al-Sayed",
    passportNo: "QA-1991-007810",
    validFrom: "1 Jun 2026",
    validTo: "15 Jun 2026",
    issuedDate: "19 May 2026",
    zones: ["Zone B"],
    zoneDesc: "Zone B — General + Field",
    venue: "Khalifa International Stadium, Doha",
    qrSeed: 48,
    expired: false,
    accentColor: "var(--gold)",
    idColor: "var(--gold)",
    roleStyle: { background: "linear-gradient(135deg,#6B0F2B,#8B1A3A)", color: "#fff", border: "none" },
  },
  {
    id: "acc-1",
    accId: "ACC-2026-AG-004421",
    label: "Asian Games 2026",
    event: "Asian Games 2026 — Doha",
    role: "VIP",
    name: "Fatima Khalid Al-Sayed",
    passportNo: "QA-1991-007810",
    validFrom: "15 Sep 2026",
    validTo: "30 Sep 2026",
    issuedDate: "2 Jun 2026",
    zones: ["Zone A"],
    zoneDesc: "Zone A — All Access",
    venue: "Various Venues, Doha",
    qrSeed: 77,
    expired: false,
    passStyle: { background: "linear-gradient(135deg, #0D2B5C 0%, #1A4A8A 40%, #2060B0 100%)", borderColor: "rgba(96,165,250,0.4)" },
    roleStyle: { background: "linear-gradient(135deg,#60A5FA,#93C5FD)", color: "#0D2B5C", border: "none" },
    accentColor: "#60A5FA",
    idColor: "#60A5FA",
  },
  {
    id: "acc-2",
    accId: "ACC-2025-SUM-000293",
    label: "QOC Summit 2025",
    event: "QOC Annual Staff Summit 2025",
    role: "Staff",
    name: "Fatima Khalid Al-Sayed",
    passportNo: "QA-1991-007810",
    validFrom: "5 Dec 2025",
    validTo: "10 Dec 2025",
    issuedDate: "1 Dec 2025",
    zones: ["Zone C"],
    zoneDesc: "Zone C — Staff Areas",
    venue: "QOC Headquarters, Doha",
    qrSeed: 12,
    expired: true,
    passStyle: { background: "linear-gradient(135deg,#1A1A1A 0%,#2D2D2D 60%,#3A3A3A 100%)", borderColor: "rgba(107,114,128,0.4)", opacity: 0.85 },
    roleStyle: { background: "rgba(107,114,128,0.3)", color: "#9CA3AF", border: "1px solid rgba(107,114,128,0.4)" },
    accentColor: "#9CA3AF",
    idColor: "#9CA3AF",
  },
];
