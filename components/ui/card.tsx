import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-zinc-200/80 bg-white/92 p-6 shadow-[0_20px_70px_-40px_rgba(24,24,27,0.35)] backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
