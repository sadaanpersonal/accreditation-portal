export interface Zone {
  id: string;
  label: string;
  desc: string;
  color: string;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface Venue {
  id: string;
  name: string;
  zones: Zone[];
}

export const VENUES: Venue[] = [
  {
    id: "al-bayt",
    name: "Al Bayt Stadium",
    zones: [
      { id: "field", label: "Playing Field",  desc: "Pitch & athlete tunnel",    color: "#4ADE80", sx: 60,  sy: 70,  sw: 280, sh: 120 },
      { id: "north", label: "North Stand",    desc: "General public seating",    color: "#A78BFA", sx: 60,  sy: 10,  sw: 280, sh: 60  },
      { id: "south", label: "South Stand",    desc: "General public seating",    color: "#34D399", sx: 60,  sy: 190, sw: 280, sh: 60  },
      { id: "vip",   label: "VIP Stand",      desc: "Hospitality & officials",   color: "#C9A84C", sx: 10,  sy: 10,  sw: 50,  sh: 240 },
      { id: "media", label: "Media Tribune",  desc: "Accredited media seating",  color: "#60A5FA", sx: 340, sy: 10,  sw: 50,  sh: 115 },
      { id: "press", label: "Press Box",      desc: "Broadcast & print media",   color: "#FB923C", sx: 340, sy: 125, sw: 50,  sh: 125 },
    ],
  },
  {
    id: "khalifa",
    name: "Khalifa International Stadium",
    zones: [
      { id: "track", label: "Track & Field",  desc: "Competition running track", color: "#4ADE80", sx: 60,  sy: 70,  sw: 280, sh: 120 },
      { id: "north", label: "North Stand",    desc: "General seating",           color: "#A78BFA", sx: 60,  sy: 10,  sw: 280, sh: 60  },
      { id: "south", label: "South Stand",    desc: "General seating",           color: "#34D399", sx: 60,  sy: 190, sw: 280, sh: 60  },
      { id: "vip",   label: "VIP Suite",      desc: "Executive hospitality",     color: "#C9A84C", sx: 10,  sy: 10,  sw: 50,  sh: 120 },
      { id: "media", label: "Media Center",   desc: "Press & broadcast hub",     color: "#FB923C", sx: 10,  sy: 130, sw: 50,  sh: 120 },
      { id: "east",  label: "East Stand",     desc: "General seating east side", color: "#60A5FA", sx: 340, sy: 10,  sw: 50,  sh: 240 },
    ],
  },
  {
    id: "aquatics",
    name: "Hamad Aquatics Center",
    zones: [
      { id: "comp",   label: "Competition Pool", desc: "Main competition lanes",    color: "#38BDF8", sx: 10,  sy: 55,  sw: 225, sh: 130 },
      { id: "warmup", label: "Warm-up Pool",     desc: "Athlete preparation area",  color: "#34D399", sx: 245, sy: 55,  sw: 145, sh: 130 },
      { id: "off",    label: "Officials Area",   desc: "Judges & timing officials", color: "#A78BFA", sx: 10,  sy: 10,  sw: 380, sh: 45  },
      { id: "vip",    label: "VIP Gallery",      desc: "Hospitality seating",       color: "#C9A84C", sx: 10,  sy: 190, sw: 380, sh: 40  },
      { id: "media",  label: "Media Zone",       desc: "Press & broadcast area",    color: "#60A5FA", sx: 10,  sy: 232, sw: 380, sh: 22  },
    ],
  },
  {
    id: "arena",
    name: "Ali Bin Hamad Al-Attiyah Arena",
    zones: [
      { id: "court",  label: "Court",         desc: "Playing surface",         color: "#FB923C", sx: 60,  sy: 60,  sw: 280, sh: 140 },
      { id: "north",  label: "North Stand",   desc: "Spectator seating",       color: "#A78BFA", sx: 60,  sy: 10,  sw: 280, sh: 50  },
      { id: "south",  label: "South Stand",   desc: "Spectator seating",       color: "#34D399", sx: 60,  sy: 200, sw: 280, sh: 50  },
      { id: "vip",    label: "VIP Suite",     desc: "Premium hospitality",     color: "#C9A84C", sx: 10,  sy: 10,  sw: 50,  sh: 240 },
      { id: "media",  label: "Media Box",     desc: "Press & commentary",      color: "#60A5FA", sx: 340, sy: 10,  sw: 50,  sh: 240 },
    ],
  },
  {
    id: "qncc",
    name: "Qatar National Convention Centre",
    zones: [
      { id: "hall",  label: "Main Hall",   desc: "Main ceremony & events",  color: "#A78BFA", sx: 130, sy: 10,  sw: 140, sh: 240 },
      { id: "vip",   label: "VIP Lounge",  desc: "Executive reception",     color: "#C9A84C", sx: 10,  sy: 10,  sw: 120, sh: 120 },
      { id: "back",  label: "Backstage",   desc: "Performer & crew area",   color: "#34D399", sx: 10,  sy: 130, sw: 120, sh: 120 },
      { id: "media", label: "Media Room",  desc: "Press conference area",   color: "#60A5FA", sx: 270, sy: 10,  sw: 120, sh: 120 },
      { id: "expo",  label: "Exhibition",  desc: "Display & demo area",     color: "#FB923C", sx: 270, sy: 130, sw: 120, sh: 120 },
    ],
  },
];
