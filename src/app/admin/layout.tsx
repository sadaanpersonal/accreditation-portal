"use client";

import {
  LayoutDashboard, PlusCircle, Upload, FolderOpen,
  ClipboardCheck, Send, CalendarDays, Users, Settings, MapPin,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import type { NavSection } from "@/components/layout/Sidebar";
import { useAuth, Permissions } from "@/contexts/AuthContext";

// Items carry the permission required to see them; items with no permission
// are always shown. Sections that end up empty are dropped entirely.
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
      { label: "New Request",  href: "/admin/requests/new", icon: <PlusCircle size={16} />,    permission: Permissions.RequestsCreate },
      { label: "Bulk Upload",  href: "/admin/bulk-upload",  icon: <Upload size={16} />,        permission: Permissions.RequestsBulkUpload },
      { label: "All Requests", href: "/admin/requests",     icon: <FolderOpen size={16} />,    permission: Permissions.RequestsViewAll },
      { label: "Review Queue", href: "/admin/review",       icon: <ClipboardCheck size={16} />, permission: Permissions.RequestsReview },
      { label: "Invitations",  href: "/admin/invitations",  icon: <Send size={16} />,          permission: Permissions.InvitationsManage },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Events",    href: "/admin/events",    icon: <CalendarDays size={16} />, permission: Permissions.EventsView },
      { label: "Venues",    href: "/admin/venues",    icon: <MapPin size={16} />,       permission: Permissions.VenuesManage },
      { label: "Users",     href: "/admin/users",     icon: <Users size={16} />,        permission: Permissions.UsersView },
      { label: "Settings",  href: "/admin/settings",  icon: <Settings size={16} />,     permission: Permissions.RolesManage },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, hasPermission } = useAuth();

  // Keep only items the current user is permitted to see; drop empty sections.
  const navSections: NavSection[] = NAV
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.permission || hasPermission(item.permission)),
    }))
    .filter(section => section.items.length > 0);

  const fullName  = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : "Admin";
  const initials  = user
    ? ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase() || "A"
    : "A";
  const roleLabel = user
    ? (user.roleCode ?? user.role).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    : "Admin";

  return (
    <AppLayout
      navSections={navSections}
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
