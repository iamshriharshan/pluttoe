import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-zinc-950 text-white hover:bg-zinc-800 disabled:bg-zinc-300",
  secondary:
    "bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50 disabled:text-zinc-400",
  ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100 disabled:text-zinc-300",
  danger: "bg-rose-600 text-white hover:bg-rose-500 disabled:bg-rose-200",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition disabled:cursor-not-allowed",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
