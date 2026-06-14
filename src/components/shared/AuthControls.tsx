"use client";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLang } from "@/contexts/LanguageContext";

/**
 * Floating language + theme switcher for public (pre-login) pages
 * like /login and /pass-access. Mirrors the controls in the Topbar,
 * pinned to the top corner. Respects RTL via logical `insetInlineEnd`.
 */
export function AuthControls() {
  const { theme, toggle } = useTheme();
  const { lang, setLang } = useLang();

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        insetInlineEnd: 20,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
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
    </div>
  );
}
