"use client";
import { Menu, Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLang } from "@/contexts/LanguageContext";

interface Props {
  title: string;
  subtitle?: string;
  onMenuToggle: () => void;
  actions?: React.ReactNode;
  initials?: string;
  hasNotif?: boolean;
  onNotifClick?: () => void;
}

export function Topbar({ title, subtitle, onMenuToggle, actions, initials = "QC", hasNotif, onNotifClick }: Props) {
  const { theme, toggle } = useTheme();
  const { lang, setLang } = useLang();

  return (
    <header className="topbar">
      <button className="hamburger" onClick={onMenuToggle}>
        <Menu size={22} />
      </button>

      <div className="topbar-title">
        <h3>{title}</h3>
        {subtitle && <span>{subtitle}</span>}
      </div>

      <div className="topbar-actions">
        {actions}

        {/* Language switcher */}
        <button
          className="topbar-icon-btn"
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          title="Switch language"
          style={{ fontSize: 11, fontWeight: 700, minWidth: 36 }}
        >
          {lang === "en" ? "AR" : "EN"}
        </button>

        {/* Theme toggle */}
        <button className="topbar-icon-btn" onClick={toggle} title="Toggle theme">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="topbar-divider" />

        {/* Notifications */}
        <button className="topbar-icon-btn" onClick={onNotifClick} style={{ position: "relative" }}>
          <Bell size={16} />
          {hasNotif && <div className="notif-dot" />}
        </button>

        {/* Avatar */}
        <div className="user-avatar" style={{ cursor: "pointer" }}>{initials}</div>
      </div>
    </header>
  );
}
