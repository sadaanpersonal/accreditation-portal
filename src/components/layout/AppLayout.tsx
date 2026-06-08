"use client";
import { useState } from "react";
import { Sidebar, type NavSection } from "./Sidebar";
import { Topbar } from "./Topbar";
import { DemoNav } from "./DemoNav";

interface Props {
  navSections: NavSection[];
  userName: string;
  userRole: string;
  userInitials: string;
  brandTitle: string;
  brandSub: string;
  topbarTitle: string;
  topbarSubtitle?: string;
  topbarActions?: React.ReactNode;
  hasNotif?: boolean;
  onNotifClick?: () => void;
  children: React.ReactNode;
}

export function AppLayout({
  navSections, userName, userRole, userInitials,
  brandTitle, brandSub, topbarTitle, topbarSubtitle,
  topbarActions, hasNotif, onNotifClick, children,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ paddingTop: 52 }}>
      <DemoNav />
      <div className="app-shell">
        <Sidebar
          sections={navSections}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userName={userName}
          userRole={userRole}
          userInitials={userInitials}
          brandTitle={brandTitle}
          brandSub={brandSub}
        />
        <div className="main-content">
          <Topbar
            title={topbarTitle}
            subtitle={topbarSubtitle}
            onMenuToggle={() => setSidebarOpen(o => !o)}
            actions={topbarActions}
            initials={userInitials}
            hasNotif={hasNotif}
            onNotifClick={onNotifClick}
          />
          <div className="page-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
