"use client";
import { Toaster } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

/** App-wide toast surface. Errors from the API client surface here automatically. */
export function AppToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={theme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: "var(--font-body), sans-serif",
          borderRadius: "var(--radius-sm)",
        },
      }}
    />
  );
}
