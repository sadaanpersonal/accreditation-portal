"use client";
import { LayoutDashboard, CreditCard, QrCode, Bell } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import type { NavSection } from "@/components/layout/Sidebar";

const NAV: NavSection[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/accredited", icon: <LayoutDashboard size={16} /> },
    ],
  },
  {
    label: "My Pass",
    items: [
      { label: "Accreditation Pass", href: "/accredited/pass", icon: <CreditCard size={16} /> },
      { label: "QR Code", href: "/accredited/qr", icon: <QrCode size={16} /> },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Notifications", href: "/accredited/notifications", icon: <Bell size={16} /> },
    ],
  },
];

export default function AccreditedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout
      navSections={NAV}
      userName="Mohammed Hassan"
      userRole="Athlete · Qatar Athletics"
      userInitials="MH"
      brandTitle="QOC Portal"
      brandSub="Accredited User"
      topbarTitle="My Accreditation"
    >
      {children}
    </AppLayout>
  );
}
