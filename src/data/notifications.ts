export type NotifType = "accreditation" | "system";
export type NotifIcon = "info" | "check" | "x" | "arrow" | "upload" | "shield" | "bell" | "calendar";

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  type: NotifType;
  icon: NotifIcon;
  iconColor: "gold" | "green" | "red" | "blue" | "purple";
}

export const REQUESTOR_NOTIFICATIONS: Notification[] = [
  {
    id: "rn1",
    title: "Info Requested — Khalid Al-Anzi (QOC Staff Summit)",
    body: "Zone Owner has requested additional information for this accreditation request. Please review and resubmit with the required documents.",
    time: "Today, 11:20",
    unread: true,
    type: "accreditation",
    icon: "info",
    iconColor: "gold",
  },
  {
    id: "rn2",
    title: "Approved — Mohammed Al-Rashid (Asian Games 2026)",
    body: "The accreditation request for Mohammed Al-Rashid has been fully approved through all pipeline stages. The pass is now active.",
    time: "Today, 09:14",
    unread: true,
    type: "accreditation",
    icon: "check",
    iconColor: "green",
  },
  {
    id: "rn3",
    title: "Pipeline Advanced — Noora Al-Marri (Asian Games 2026)",
    body: "Request for Noora Al-Marri passed Zone Owner review and is now with the Media Owner for approval.",
    time: "19 May 2026",
    unread: false,
    type: "accreditation",
    icon: "arrow",
    iconColor: "blue",
  },
  {
    id: "rn4",
    title: "Rejected — Yousef Al-Hajri (Gulf Athletics 2026)",
    body: "The accreditation request for Yousef Al-Hajri was rejected at the Zone Owner stage. Please contact the admin for further details.",
    time: "12 May 2026",
    unread: false,
    type: "accreditation",
    icon: "x",
    iconColor: "red",
  },
  {
    id: "rn5",
    title: "New Event Available — FIFA World Cup 2030 Qualifier",
    body: "A new event has been added. You can now submit accreditation requests for the FIFA World Cup 2030 Qualifier on 10 Dec 2026.",
    time: "10 May 2026",
    unread: false,
    type: "system",
    icon: "calendar",
    iconColor: "purple",
  },
];

export const ADMIN_NOTIFICATIONS: Notification[] = [
  {
    id: "an1",
    title: "5 Requests Pending Your Review",
    body: "There are 5 accreditation requests in the Review Queue awaiting FA Owner approval. Oldest submission is 3 days old.",
    time: "Today, 08:00",
    unread: true,
    type: "accreditation",
    icon: "bell",
    iconColor: "gold",
  },
  {
    id: "an2",
    title: "Bulk Upload Completed — 5 Records Processed",
    body: "A bulk upload of 5 accreditation requests was submitted by Hamad Al-Kuwari. All records have been queued for pipeline review.",
    time: "Today, 07:45",
    unread: true,
    type: "accreditation",
    icon: "upload",
    iconColor: "blue",
  },
  {
    id: "an3",
    title: "MOI Clearance Required — 3 VIP Requests",
    body: "3 VIP accreditation requests for Asian Games 2026 require MOI clearance before final approval can be issued.",
    time: "Yesterday, 16:10",
    unread: true,
    type: "accreditation",
    icon: "shield",
    iconColor: "purple",
  },
  {
    id: "an4",
    title: "Accreditation Approved — Mohammed Al-Rashid",
    body: "All pipeline stages completed for Mohammed Al-Rashid (Asian Games 2026, VIP). Pass has been issued and invitation sent.",
    time: "20 May 2026",
    unread: false,
    type: "accreditation",
    icon: "check",
    iconColor: "green",
  },
  {
    id: "an5",
    title: "Applicant Resubmitted — Khalid Al-Anzi",
    body: "Khalid Al-Anzi has resubmitted their accreditation request for QOC Staff Summit following the info request at Zone Owner stage.",
    time: "18 May 2026",
    unread: false,
    type: "accreditation",
    icon: "x",
    iconColor: "red",
  },
];
