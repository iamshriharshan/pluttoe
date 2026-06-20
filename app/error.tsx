"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Pluttoe route error", error);
  }, [error]);

  return (
    <Card className="mx-auto mt-20 max-w-2xl">
      <h1 className="text-2xl font-semibold text-zinc-950">
        Pluttoe hit an unexpected error
      </h1>
      <p className="mt-3 text-sm leading-7 text-zinc-500">
        The app stopped this request before it cascaded. Retry once and if it
        persists, check the Firebase configuration and Firestore rules.
      </p>
      {process.env.NODE_ENV === "development" ? (
        <p className="mt-4 rounded-2xl bg-zinc-100 p-3 text-xs text-zinc-600">
          {error.message}
        </p>
      ) : null}
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </Card>
  );
}
