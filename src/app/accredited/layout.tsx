"use client";
import { LayoutDashboard, CreditCard, QrCode, Bell } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import type { NavSection } from "@/components/layout/Sidebar";
import { useAuth } from "@/contexts/AuthContext";

const NAV: NavSection[] = [
  {
    label: "Menu",
    items: [
      { label: "Dashboard",          href: "/accredited",               icon: <LayoutDashboard size={16} /> },
      { label: "My Accreditations",  href: "/accredited/pass",          icon: <CreditCard size={16} /> },
      { label: "QR Pass",            href: "/accredited/qr",            icon: <QrCode size={16} /> },
      { label: "Notifications",      href: "/accredited/notifications",  icon: <Bell size={16} /> },
    ],
  },
];

export default function AccreditedLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : "Accredited";
  const initials = user
    ? ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase() || "A"
    : "A";

  return (
    <AppLayout
      navSections={NAV}
      userName={fullName}
      userRole="Accredited · QOC Portal"
      userInitials={initials}
      brandTitle="QOC Portal"
      brandSub="Accredited User"
      topbarTitle="My Accreditation"
    >
      {children}
    </AppLayout>
  );
}
