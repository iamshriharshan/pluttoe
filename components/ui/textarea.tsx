import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-[24px] border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400",
        className
      )}
      {...props}
    />
  );
}
