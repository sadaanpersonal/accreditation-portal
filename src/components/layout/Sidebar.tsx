"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

interface Props {
  sections: NavSection[];
  open: boolean;
  onClose: () => void;
  userName: string;
  userRole: string;
  userInitials: string;
  brandTitle: string;
  brandSub: string;
}

export function Sidebar({ sections, open, onClose, userName, userRole, userInitials, brandTitle, brandSub }: Props) {
  const pathname  = usePathname();
  const { logout } = useAuth();

  // Most-specific match wins: /admin/requests/new should not also highlight /admin/requests
  const allItems = sections.flatMap(s => s.items);
  const bestMatchLen = Math.max(
    0,
    ...allItems
      .filter(item =>
        pathname === item.href ||
        (item.href !== "/" && pathname.startsWith(item.href + "/"))
      )
      .map(item => item.href.length)
  );

  function isActive(href: string) {
    const matches = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
    return matches && href.length === bestMatchLen;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn("sidebar-backdrop", open && "active")}
        onClick={onClose}
      />

      <aside className={cn("sidebar", open && "open")}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-emblem">
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--gold)", letterSpacing: "0.05em" }}>QOC</span>
          </div>
          <div className="sidebar-brand">
            <h2>{brandTitle}</h2>
            <span>{brandSub}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {sections.map((section, si) => (
            <div key={si}>
              {section.label && <div className="nav-section-label">{section.label}</div>}
              {section.items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn("nav-item", active && "active")}
                    onClick={() => { if (window.innerWidth <= 768) onClose(); }}
                  >
                    {item.icon}
                    {item.label}
                    {item.badge !== undefined && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{userInitials}</div>
            <div className="user-info">
              <strong>{userName}</strong>
              <span>{userRole}</span>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", color: "var(--text-muted)", display: "flex", borderRadius: 6, flexShrink: 0 }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
