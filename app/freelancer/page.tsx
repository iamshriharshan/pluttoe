"use client";

import { PlutoShell } from "@/components/pluto-shell";
import { DashboardView } from "@/components/dashboard-view";
import { useAuth } from "@/contexts/AuthContext";

export default function FreelancerPage() {
  const { profile } = useAuth();

  return (
    <PlutoShell user={profile}>
      <DashboardView requiredRole="freelancer" />
    </PlutoShell>
  );
}
