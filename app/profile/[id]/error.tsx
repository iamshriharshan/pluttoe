"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ProfileError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Card className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-semibold text-zinc-950">
        Profile failed to load
      </h2>
      <p className="mt-3 text-sm leading-6 text-zinc-500">
        Pluto hit an issue while loading this profile. Try the route again and we
        will request the profile fresh from Firestore.
      </p>
      <Button className="mt-6" onClick={reset}>
        Retry
      </Button>
    </Card>
  );
}
