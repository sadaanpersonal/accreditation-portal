export type RequestStatus = "pending" | "approved" | "rejected" | "info-requested";
export type AccreditationRole = "VIP" | "Athlete" | "Staff" | "Media" | "Official" | "Coach";
export type PipelineStage = 1 | 2 | 3 | 4 | 5; // 5 = fully approved

export interface PipelineState {
  currentStage: PipelineStage;
  rejected: boolean;
  infoRequested: boolean;
  infoNote?: string;
}

export interface AccreditationRequest {
  id: string;
  reqId: string;
  initials: string;
  firstName: string;
  lastName: string;
  fullName: string;
  passportNo: string;
  nationality: string;
  nationalityFlag: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  eventId: string;
  eventName: string;
  role: AccreditationRole;
  venue?: string;
  zones?: string[];
  validFrom: string;
  validTo: string;
  submittedDate: string;
  submittedBy: string;
  notes?: string;
  pipeline: PipelineState;
  documents: { name: string; file: string; size: string }[];
}

export const REQUESTS: AccreditationRequest[] = [
  {
    id: "req-001",
    reqId: "REQ-2026-001847",
    initials: "MA",
    firstName: "Mohammed",
    lastName: "Al-Rashid",
    fullName: "Mohammed Al-Rashid",
    passportNo: "QA-1987-003241",
    nationality: "Qatari",
    nationalityFlag: "🇶🇦",
    dob: "12 June 1987",
    gender: "Male",
    email: "mohammed.alrashid@qoc.qa",
    phone: "+974 5512 3344",
    eventId: "asian-games-2026",
    eventName: "Asian Games 2026",
    role: "VIP",
    zones: ["vip"],
    validFrom: "15 Sep 2026",
    validTo: "30 Sep 2026",
    submittedDate: "15 May 2026",
    submittedBy: "Hamad Al-Kuwari",
    notes: "Requires VIP lounge access and dedicated parking permit for all event days.",
    pipeline: { currentStage: 5, rejected: false, infoRequested: false },
    documents: [
      { name: "Passport Copy", file: "passport_alrashid.pdf", size: "2.4 MB" },
      { name: "National ID", file: "national_id.jpg", size: "840 KB" },
    ],
  },
  {
    id: "req-002",
    reqId: "REQ-2026-001848",
    initials: "FS",
    firstName: "Fatima",
    lastName: "Al-Sayed",
    fullName: "Fatima Khalid Al-Sayed",
    passportNo: "QA-1991-007810",
    nationality: "Qatari",
    nationalityFlag: "🇶🇦",
    dob: "14 March 1991",
    gender: "Female",
    email: "fatima.alsayed@qatarmedia.qa",
    phone: "+974 5512 8890",
    eventId: "gulf-athletics-2026",
    eventName: "Gulf Athletics Championship 2026",
    role: "Media",
    zones: ["media"],
    validFrom: "1 Jun 2026",
    validTo: "15 Jun 2026",
    submittedDate: "17 May 2026",
    submittedBy: "Hamad Al-Kuwari",
    notes: "Press credential for Gulf Athletics Championship 2026 — accredited media photographer with full field access required.",
    pipeline: { currentStage: 1, rejected: false, infoRequested: false },
    documents: [
      { name: "Passport Copy", file: "passport_alsayed.pdf", size: "2.4 MB" },
      { name: "National ID", file: "national_id.jpg", size: "840 KB" },
      { name: "Press Card", file: "press_credential.pdf", size: "1.1 MB" },
    ],
  },
  {
    id: "req-003",
    reqId: "REQ-2026-001849",
    initials: "KA",
    firstName: "Khalid",
    lastName: "Al-Anzi",
    fullName: "Khalid Al-Anzi",
    passportNo: "KW-1983-001122",
    nationality: "Kuwaiti",
    nationalityFlag: "🇰🇼",
    dob: "5 March 1983",
    gender: "Male",
    email: "k.alanzi@koc.kw",
    phone: "+965 9876 5432",
    eventId: "qoc-summit-2025",
    eventName: "QOC Staff Summit",
    role: "Staff",
    zones: ["back"],
    validFrom: "5 Dec 2025",
    validTo: "10 Dec 2025",
    submittedDate: "18 May 2026",
    submittedBy: "Hamad Al-Kuwari",
    pipeline: { currentStage: 2, rejected: false, infoRequested: true, infoNote: "Please provide updated staff authorisation letter from your national federation." },
    documents: [
      { name: "Passport Copy", file: "passport_alanzi.pdf", size: "1.8 MB" },
    ],
  },
  {
    id: "req-004",
    reqId: "REQ-2026-001850",
    initials: "NM",
    firstName: "Noora",
    lastName: "Al-Marri",
    fullName: "Noora Al-Marri",
    passportNo: "QA-1995-009981",
    nationality: "Qatari",
    nationalityFlag: "🇶🇦",
    dob: "22 August 1995",
    gender: "Female",
    email: "noora.almarri@qatarsport.qa",
    phone: "+974 5511 2233",
    eventId: "asian-games-2026",
    eventName: "Asian Games 2026",
    role: "Athlete",
    zones: ["field", "track"],
    validFrom: "15 Sep 2026",
    validTo: "30 Sep 2026",
    submittedDate: "14 May 2026",
    submittedBy: "Hamad Al-Kuwari",
    pipeline: { currentStage: 3, rejected: false, infoRequested: false },
    documents: [
      { name: "Passport Copy", file: "passport_almarri.pdf", size: "2.1 MB" },
      { name: "National ID", file: "national_id.jpg", size: "650 KB" },
    ],
  },
  {
    id: "req-005",
    reqId: "REQ-2026-001851",
    initials: "YH",
    firstName: "Yousef",
    lastName: "Al-Hajri",
    fullName: "Yousef Al-Hajri",
    passportNo: "QA-1989-004567",
    nationality: "Qatari",
    nationalityFlag: "🇶🇦",
    dob: "18 November 1989",
    gender: "Male",
    email: "y.alhajri@qoc.qa",
    phone: "+974 5599 8877",
    eventId: "gulf-athletics-2026",
    eventName: "Gulf Athletics 2026",
    role: "VIP",
    zones: ["vip"],
    validFrom: "1 Jun 2026",
    validTo: "15 Jun 2026",
    submittedDate: "12 May 2026",
    submittedBy: "Hamad Al-Kuwari",
    pipeline: { currentStage: 2, rejected: true, infoRequested: false },
    documents: [
      { name: "Passport Copy", file: "passport_alhajri.pdf", size: "2.0 MB" },
    ],
  },
];

export const ADMIN_EXTRA_REQUESTS: AccreditationRequest[] = [
  {
    id: "req-006",
    reqId: "REQ-2026-001852",
    initials: "AM",
    firstName: "Ahmad",
    lastName: "Al-Mutairi",
    fullName: "Ahmad Al-Mutairi",
    passportNo: "SA-1986-009876",
    nationality: "Saudi Arabian",
    nationalityFlag: "🇸🇦",
    dob: "3 April 1986",
    gender: "Male",
    email: "a.almutairi@soc.sa",
    phone: "+966 55 123 4567",
    eventId: "asian-games-2026",
    eventName: "Asian Games 2026",
    role: "VIP",
    zones: ["vip"],
    validFrom: "15 Sep 2026",
    validTo: "30 Sep 2026",
    submittedDate: "18 May 2026",
    submittedBy: "Hamad Al-Kuwari",
    pipeline: { currentStage: 1, rejected: false, infoRequested: false },
    documents: [
      { name: "Passport Copy", file: "passport_almutairi.pdf", size: "2.2 MB" },
    ],
  },
  {
    id: "req-007",
    reqId: "REQ-2026-001853",
    initials: "RJ",
    firstName: "Reem",
    lastName: "Al-Jaber",
    fullName: "Reem Al-Jaber",
    passportNo: "QA-2000-011234",
    nationality: "Qatari",
    nationalityFlag: "🇶🇦",
    dob: "7 July 2000",
    gender: "Female",
    email: "r.aljaber@qswim.qa",
    phone: "+974 5533 9988",
    eventId: "asian-games-2026",
    eventName: "World Aquatics 2026",
    role: "Athlete",
    zones: ["comp", "warmup"],
    validFrom: "15 Sep 2026",
    validTo: "30 Sep 2026",
    submittedDate: "19 May 2026",
    submittedBy: "Hamad Al-Kuwari",
    pipeline: { currentStage: 3, rejected: false, infoRequested: false },
    documents: [
      { name: "Passport Copy", file: "passport_aljaber.pdf", size: "1.9 MB" },
      { name: "National ID", file: "national_id.jpg", size: "720 KB" },
    ],
  },
];
