import Link from "next/link";

import { PlutoShell } from "@/components/pluto-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <PlutoShell user={null}>
      <Card className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold text-zinc-950">Unauthorized</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-500">
          This route is protected for a different role. Pluto redirected you here
          before exposing data that does not belong to your workflow.
        </p>
        <Link href="/dashboard" className="mt-6 inline-block">
          <Button>Go to dashboard</Button>
        </Link>
      </Card>
    </PlutoShell>
  );
}
