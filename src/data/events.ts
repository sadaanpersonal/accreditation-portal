export type EventStatus = "active" | "upcoming" | "completed";

export interface Event {
  id: string;
  name: string;
  status: EventStatus;
  moiRequired: boolean;
  dates: string;
  location: string;
  accreditations: number;
  icon: string;
  color: string;
  accentColor: string;
}

export const EVENTS: Event[] = [
  {
    id: "gulf-athletics-2026",
    name: "Gulf Athletics Championship 2026",
    status: "active",
    moiRequired: true,
    dates: "1 Jun – 15 Jun 2026",
    location: "Khalifa International Stadium, Doha",
    accreditations: 84,
    icon: "Activity",
    color: "linear-gradient(135deg,#4A0A1E,#8B1A3A)",
    accentColor: "#C9A84C",
  },
  {
    id: "asian-games-2026",
    name: "Asian Games 2026 — Doha",
    status: "active",
    moiRequired: true,
    dates: "15 Sep – 30 Sep 2026",
    location: "Various Venues, Doha",
    accreditations: 231,
    icon: "Trophy",
    color: "linear-gradient(135deg,#0D2B5C,#2060B0)",
    accentColor: "#60A5FA",
  },
  {
    id: "fifa-qualifier-2026",
    name: "FIFA World Cup 2030 Qualifier",
    status: "upcoming",
    moiRequired: true,
    dates: "10 Dec 2026",
    location: "Jassim Bin Hamad Stadium, Doha",
    accreditations: 0,
    icon: "Target",
    color: "linear-gradient(135deg,#3B1E6B,#6D3ABF)",
    accentColor: "#A78BFA",
  },
  {
    id: "qoc-summit-2025",
    name: "QOC Annual Staff Summit 2025",
    status: "completed",
    moiRequired: false,
    dates: "10 Dec 2025",
    location: "QOC Headquarters, Doha",
    accreditations: 62,
    icon: "Users",
    color: "linear-gradient(135deg,#1F2937,#374151)",
    accentColor: "#9CA3AF",
  },
];
