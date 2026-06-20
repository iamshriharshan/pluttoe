import Link from "next/link";

import { PlutoShell } from "@/components/pluto-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <PlutoShell user={null}>
      <Card className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold text-zinc-950">Page not found</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-500">
          Pluto could not find that route. The app structure may have changed or the
          record does not exist yet.
        </p>
        <Link href="/" className="mt-6 inline-block">
          <Button>Return home</Button>
        </Link>
      </Card>
    </PlutoShell>
  );
}
