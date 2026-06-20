import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700",
        className
      )}
      {...props}
    />
  );
}
