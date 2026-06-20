"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PlutoShell } from "@/components/pluto-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { hasFirebaseEnv, getMissingFirebaseEnv } from "@/lib/env-validation";
import { getRoleHomePath } from "@/lib/utils";
import type { UserRole } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { profile, signInWithRole } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("freelancer");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (profile) {
      router.replace(getRoleHomePath(profile.role));
    }
  }, [profile, router]);

  const envReady = mounted ? hasFirebaseEnv() : null;
  const requiresName = mode === "signup";

  async function submit(method: "email" | "google") {
    if (method === "email" && (!email || !password || (requiresName && !displayName))) {
      toast.error("Complete the required sign-in fields.");
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithRole({
        role,
        displayName:
          displayName.trim() ||
          (role === "startup" ? "Pluto Startup" : "Pluto Freelancer"),
        email: email.trim(),
        password,
        mode,
        method,
      });
      toast.success(result.message ?? (mode === "signup" ? "Account created" : "Signed in"));
      router.replace(getRoleHomePath(result.profile?.role ?? role));
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PlutoShell user={profile}>
      <div className="mx-auto max-w-2xl">
        <Card>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">
            Pluto access
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-zinc-950">
            {mode === "signup" ? "Create your Pluto account" : "Sign in to Pluto"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-zinc-500">
            Choose your side first. Startups go to the startup workspace;
            freelancers go to the freelancer workspace.
          </p>

          {envReady === false ? (
            <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Firebase env is incomplete, but Pluto can still run in local persisted
              mode. Missing keys: {getMissingFirebaseEnv().join(", ")}
            </div>
          ) : null}

          <div className="mt-8 grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Button
                variant={mode === "signin" ? "primary" : "secondary"}
                onClick={() => setMode("signin")}
              >
                Sign in
              </Button>
              <Button
                variant={mode === "signup" ? "primary" : "secondary"}
                onClick={() => setMode("signup")}
              >
                Sign up
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Button
                variant={role === "freelancer" ? "primary" : "secondary"}
                onClick={() => setRole("freelancer")}
              >
                Freelancer
              </Button>
              <Button
                variant={role === "startup" ? "primary" : "secondary"}
                onClick={() => setRole("startup")}
              >
                Startup
              </Button>
            </div>

            {requiresName ? (
              <Input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder={role === "startup" ? "Company name" : "Full name"}
              />
            ) : null}
            <Button
              variant="secondary"
              disabled={loading}
              onClick={() => void submit("google")}
            >
              {loading ? "Connecting..." : "Continue with Google"}
            </Button>
            <div className="grid gap-4">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
              />
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
              />
            </div>
            <Button
              disabled={loading || !email || !password || (requiresName && !displayName)}
              onClick={() => void submit("email")}
            >
              {loading
                ? "Continuing..."
                : mode === "signup"
                  ? "Sign up with email"
                  : "Sign in with email"}
            </Button>
          </div>
        </Card>
      </div>
    </PlutoShell>
  );
}
