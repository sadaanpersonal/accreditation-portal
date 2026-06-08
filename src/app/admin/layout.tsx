"use client";
import {
  LayoutDashboard, PlusCircle, Upload, FolderOpen,
  ClipboardCheck, Send, CalendarDays, Users,
  Bell, Settings,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import type { NavSection } from "@/components/layout/Sidebar";
import { REQUESTS, ADMIN_EXTRA_REQUESTS } from "@/data/requests";

// Compute live badge counts from data
const allRequests = [...REQUESTS, ...ADMIN_EXTRA_REQUESTS];
const reviewCount = allRequests.filter(
  r => !r.pipeline.rejected && r.pipeline.currentStage < 5
).length;

const NAV: NavSection[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: <LayoutDashboard size={16} /> },
    ],
  },
  {
    label: "Accreditation",
    items: [
      { label: "New Request",   href: "/admin/requests/new", icon: <PlusCircle size={16} /> },
      { label: "Bulk Upload",   href: "/admin/bulk-upload",  icon: <Upload size={16} /> },
      { label: "All Requests",  href: "/admin/requests",     icon: <FolderOpen size={16} />,     badge: allRequests.length },
      { label: "Review Queue",  href: "/admin/review",       icon: <ClipboardCheck size={16} />, badge: reviewCount },
      { label: "Invitations",   href: "/admin/invitations",  icon: <Send size={16} /> },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Events",   href: "/admin/events",   icon: <CalendarDays size={16} /> },
      { label: "Users",    href: "/admin/users",    icon: <Users size={16} /> },
      { label: "Settings", href: "/admin/settings", icon: <Settings size={16} /> },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Notifications", href: "/admin/notifications", icon: <Bell size={16} /> },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout
      navSections={NAV}
      userName="Fatima Al-Kuwari"
      userRole="Admin · QOC Accreditation"
      userInitials="FK"
      brandTitle="QOC Admin"
      brandSub="Accreditation Management"
      topbarTitle="Admin Panel"
    >
      {children}
    </AppLayout>
  );
}
