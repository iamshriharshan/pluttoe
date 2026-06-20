"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { PlutoShell } from "@/components/pluto-shell";
import { DashboardSkeleton } from "@/components/skeletons";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleHomePath } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && profile) {
      router.replace(getRoleHomePath(profile.role));
    }
    if (!loading && !profile) {
      router.replace("/login");
    }
  }, [loading, profile, router]);

  return (
    <PlutoShell user={profile}>
      <DashboardSkeleton />
    </PlutoShell>
  );
}
