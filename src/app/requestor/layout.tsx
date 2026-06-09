"use client";
import { LayoutDashboard, FileText, PlusCircle, CalendarDays, Upload, Bell } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import type { NavSection } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";

const NAV: NavSection[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard",  href: "/requestor",              icon: <LayoutDashboard size={16} /> },
    ],
  },
  {
    label: "Accreditation",
    items: [
      { label: "My Requests", href: "/requestor/requests",     icon: <FileText size={16} /> },
      { label: "New Request", href: "/requestor/requests/new", icon: <PlusCircle size={16} /> },
      { label: "Bulk Upload", href: "/requestor/bulk-upload",  icon: <Upload size={16} /> },
    ],
  },
  {
    label: "Events",
    items: [
      { label: "Events", href: "/requestor/events", icon: <CalendarDays size={16} /> },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Notifications", href: "/requestor/notifications", icon: <Bell size={16} /> },
    ],
  },
];

export default function RequestorLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : "Requestor";
  const initials = user
    ? ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase() || "R"
    : "R";

  return (
    <AppLayout
      navSections={NAV}
      userName={fullName}
      userRole="Requestor · QOC Accreditation"
      userInitials={initials}
      brandTitle="QOC Portal"
      brandSub="Accreditation System"
      topbarTitle="Requestor Portal"
    >
      {children}
    </AppLayout>
  );
}
