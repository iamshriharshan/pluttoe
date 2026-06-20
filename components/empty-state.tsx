import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex min-h-48 flex-col items-start justify-between gap-4">
      <div className="space-y-2">
        <p className="text-lg font-semibold text-zinc-950">{title}</p>
        <p className="max-w-xl text-sm leading-6 text-zinc-500">{description}</p>
      </div>
      {action}
    </Card>
  );
}
