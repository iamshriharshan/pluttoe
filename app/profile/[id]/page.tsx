import { PlutoShell } from "@/components/pluto-shell";
import { ProfilePageClient } from "@/components/profile-page-client";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PlutoShell user={null}>
      <ProfilePageClient id={id} />
    </PlutoShell>
  );
}
