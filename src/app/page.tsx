"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Roles } from "@/contexts/AuthContext";

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    const role = user.roleCode ?? user.role ?? "";
    if (
      role === Roles.SuperAdmin ||
      role === Roles.FAOwner    ||
      role === Roles.ZoneOwner  ||
      role === Roles.MediaOwner ||
      role === Roles.MoiOfficer
    ) {
      router.replace("/admin");
    } else if (role === Roles.Requestor) {
      router.replace("/requestor");
    } else if (role === Roles.Accredited) {
      router.replace("/accredited");
    } else {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  return null;
}
