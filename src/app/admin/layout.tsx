"use client";

import {
  LayoutDashboard, PlusCircle, Upload, FolderOpen,
  ClipboardCheck, Send, CalendarDays, Users, Settings,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import type { NavSection } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";

const NAV: NavSection[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard",    href: "/admin",              icon: <LayoutDashboard size={16} /> },
    ],
  },
  {
    label: "Accreditation",
    items: [
      { label: "New Request",  href: "/admin/requests/new", icon: <PlusCircle size={16} /> },
      { label: "Bulk Upload",  href: "/admin/bulk-upload",  icon: <Upload size={16} /> },
      { label: "All Requests", href: "/admin/requests",     icon: <FolderOpen size={16} /> },
      { label: "Review Queue", href: "/admin/review",       icon: <ClipboardCheck size={16} /> },
      { label: "Invitations",  href: "/admin/invitations",  icon: <Send size={16} /> },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Events",    href: "/admin/events",    icon: <CalendarDays size={16} /> },
      { label: "Users",     href: "/admin/users",     icon: <Users size={16} /> },
      { label: "Settings",  href: "/admin/settings",  icon: <Settings size={16} /> },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const fullName  = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : "Admin";
  const initials  = user
    ? ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase() || "A"
    : "A";
  const roleLabel = user
    ? (user.roleCode ?? user.role).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    : "Admin";

  return (
    <AppLayout
      navSections={NAV}
      userName={fullName}
      userRole={`${roleLabel} · QOC Accreditation`}
      userInitials={initials}
      brandTitle="QOC Admin"
      brandSub="Accreditation Management"
      topbarTitle="Admin Panel"
    >
      {children}
    </AppLayout>
  );
}
