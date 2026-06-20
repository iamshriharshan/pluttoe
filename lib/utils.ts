export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date?: Date | null) {
  if (!date) return "Just now";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getRoleHomePath(role?: "freelancer" | "startup" | null) {
  if (role === "startup") return "/startup";
  return "/freelancer";
}
