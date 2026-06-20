"use client";

import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleHomePath } from "@/lib/utils";
import type { UserRecord } from "@/types";

export function PlutoShell({
  user,
  children,
}: {
  user: UserRecord | null;
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const activeUser = user ?? auth.profile;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,244,245,0.95),_rgba(250,250,250,1)_40%,_rgba(255,255,255,1)_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 md:px-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-full border border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/pluto-logo.png" alt="Pluto" width={40} height={40} className="rounded-full" priority />
            <div>
              <p className="text-sm font-semibold text-zinc-950">Pluto</p>
              <p className="text-xs text-zinc-500">GTM matching platform</p>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
            {activeUser ? (
              <>
                <Link href={getRoleHomePath(activeUser.role)}>
                  <Button variant="ghost">
                    {activeUser.role === "startup" ? "Startup workspace" : "Freelancer workspace"}
                  </Button>
                </Link>
                <Link href={`/profile/${activeUser.uid}`}>
                  <Button variant="secondary">Profile</Button>
                </Link>
                <span className="rounded-full border border-zinc-950 px-3 py-1 text-xs font-medium text-zinc-950">
                  {activeUser.role}
                </span>
                <Button variant="ghost" onClick={() => void auth.signOutUser()}>
                  Sign out
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button>Enter Pluto</Button>
              </Link>
            )}
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
