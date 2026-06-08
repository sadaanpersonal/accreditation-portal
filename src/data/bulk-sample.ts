export interface BulkRecord {
  initials: string;
  name: string;
  passport: string;
  nationality: string;
  event: string;
  venue: string;
  role: string;
  dob: string;
  email: string;
  phone: string;
  valid: boolean;
  error?: string;
}

export const BULK_SAMPLE: BulkRecord[] = [
  { initials: "AH", name: "Ahmed Hassan Al-Mansouri",  passport: "QA-1988-001234", nationality: "Qatari",   event: "Asian Games 2026",    venue: "Khalifa International Stadium", role: "Media",    dob: "15 Apr 1988", email: "ahmed.mansouri@qoc.qa",   phone: "+974 5512 3456", valid: true },
  { initials: "ST", name: "Sarah Elizabeth Thompson",   passport: "GB-1992-087654", nationality: "British",  event: "Asian Games 2026",    venue: "Al-Bayt Stadium",               role: "VIP",      dob: "22 Jul 1992", email: "s.thompson@bbc.co.uk",     phone: "+44 7700 900123", valid: true },
  { initials: "KR", name: "Khalid Ibrahim Al-Rashidi",  passport: "KW-1985-034521", nationality: "Kuwaiti",  event: "Gulf Athletics 2026", venue: "Khalifa International Stadium", role: "Athlete",  dob: "3 Nov 1985",  email: "k.rashidi@koa.kw",         phone: "+965 9876 5432", valid: true },
  { initials: "MD", name: "Maria Santos Delgado",       passport: "ES-1995-112233", nationality: "Spanish",  event: "Asian Games 2026",    venue: "",                              role: "Staff",    dob: "18 Feb 1995", email: "m.delgado@mediagroup.es",  phone: "+34 612 345 678", valid: false, error: "Missing venue" },
  { initials: "YJ", name: "Yusuf Abdulrahman Al-Jabri", passport: "OM-1990-067890", nationality: "Omani",    event: "Gulf Athletics 2026", venue: "Khalifa International Stadium", role: "Official", dob: "27 Sep 1990", email: "y.jabri@oman-sports.om",   phone: "+968 9123 4567", valid: true },
];
