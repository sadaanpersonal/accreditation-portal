"use client";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>QOC Accreditation Portal</title>
        <meta name="description" content="Qatar Olympic Committee — Official Accreditation Portal" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <div className="bg-canvas">
              <div className="bg-orb bg-orb-1" />
              <div className="bg-orb bg-orb-2" />
              <div className="bg-orb bg-orb-3" />
            </div>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
