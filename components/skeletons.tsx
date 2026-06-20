export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-52 rounded-[32px] bg-zinc-200/70" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-72 rounded-[28px] bg-zinc-200/70" />
        <div className="h-72 rounded-[28px] bg-zinc-200/70" />
      </div>
      <div className="h-80 rounded-[28px] bg-zinc-200/70" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="h-40 rounded-[28px] bg-zinc-200/70" />
        <div className="h-40 rounded-[28px] bg-zinc-200/70" />
        <div className="h-40 rounded-[28px] bg-zinc-200/70" />
      </div>
      <div className="h-96 rounded-[28px] bg-zinc-200/70" />
    </div>
  );
}
