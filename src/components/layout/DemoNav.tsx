"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { HowItWorksModal } from "@/components/shared/HowItWorksModal";

const ROLES = [
  { label: "Requestor",       path: "/requestor" },
  { label: "Admin",           path: "/admin" },
  { label: "Accredited User", path: "/accredited" },
];

export function DemoNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [guideOpen, setGuideOpen] = useState(false);

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <>
      <nav className="demo-nav">
        {ROLES.map(r => (
          <button
            key={r.path}
            className={`demo-nav-btn${isActive(r.path) ? " active" : ""}`}
            onClick={() => router.push(r.path)}
          >
            {r.label}
          </button>
        ))}
        <button
          className="demo-nav-btn"
          onClick={() => setGuideOpen(true)}
        >
          How it Works
        </button>
      </nav>

      <HowItWorksModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}
