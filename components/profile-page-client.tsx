"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { ProfileSkeleton } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { getProfileBundle } from "@/lib/firestore";
import { formatCurrency, formatDate, getRoleHomePath } from "@/lib/utils";
import type { ProfileBundle, UploadedFileAsset } from "@/types";

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{label}</p>
      <p className="mt-3 text-xl font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function asArray<T>(value: T[] | unknown): T[] {
  return Array.isArray(value) ? value : [];
}

export function ProfilePageClient({ id }: { id: string }) {
  const { authUser, profile: viewer } = useAuth();
  const [bundle, setBundle] = useState<ProfileBundle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfileBundle(id)
      .then((result) => setBundle(result))
      .catch((error) => {
        console.error(error);
        toast.error("Could not load profile.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!bundle?.user) {
    return (
      <EmptyState
        title="Profile not found"
        description="That Pluttoe profile either does not exist yet or is not accessible."
        action={
          <Link href={viewer ? getRoleHomePath(viewer.role) : "/login"}>
            <Button>{viewer ? "Back to workspace" : "Sign in"}</Button>
          </Link>
        }
      />
    );
  }

  const isOwnProfile = authUser?.uid === bundle.user.uid;
  const isFreelancer = bundle.user.role === "freelancer";

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-zinc-400">
              {bundle.user.role} profile
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">
              {isFreelancer
                ? bundle.freelancer?.fullName
                : bundle.startup?.companyName}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-500">
              {isFreelancer ? bundle.freelancer?.bio : bundle.startup?.about}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-zinc-950 bg-white px-3 py-1 text-xs font-medium text-zinc-950">
                {isFreelancer ? "GTM specialist" : bundle.startup?.industry}
              </span>
              {isFreelancer
                ? asArray<string>(bundle.freelancer?.skills).map((skill) => (
                    <Badge key={skill}>{skill}</Badge>
                  ))
                : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={viewer ? getRoleHomePath(viewer.role) : "/login"}>
              <Button variant="secondary">
                {viewer ? "Workspace" : "Sign in"}
              </Button>
            </Link>
            {isOwnProfile ? (
              <Button
                variant="ghost"
                onClick={async () => {
                  await navigator.clipboard.writeText(window.location.href);
                  toast.success("Profile link copied");
                }}
              >
                Copy profile link
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      {isFreelancer ? (
        <>
          <section className="grid gap-6 md:grid-cols-4">
            <Stat label="Experience" value={`${bundle.freelancer?.yearsExperience} years`} />
            <Stat
              label="Budget"
              value={formatCurrency(bundle.freelancer?.desiredMonthlyBudget ?? 0)}
            />
            <Stat label="Github" value={bundle.freelancer?.github || "Not shared"} />
            <Stat
              label="LinkedIn"
              value={bundle.freelancer?.linkedin || "Not shared"}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <p className="text-lg font-semibold text-zinc-950">Links and files</p>
              <div className="mt-5 space-y-4 text-sm text-zinc-600">
                <p>Portfolio URL: {bundle.freelancer?.portfolio || "Not shared"}</p>
                <p>Resume: {bundle.freelancer?.resume?.name || "Not uploaded"}</p>
                <div className="space-y-2">
                  <p className="font-medium text-zinc-950">Portfolio files</p>
                  {asArray<UploadedFileAsset>(
                    bundle.freelancer?.portfolioFiles
                  ).length ? (
                    asArray<UploadedFileAsset>(
                      bundle.freelancer?.portfolioFiles
                    ).map((file) => (
                      <a
                        key={file.path}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-2xl border border-zinc-200 px-4 py-3 hover:bg-zinc-50"
                      >
                        {file.name}
                      </a>
                    ))
                  ) : (
                    <p className="text-zinc-500">No portfolio files yet.</p>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <p className="text-lg font-semibold text-zinc-950">
                Application history
              </p>
              <div className="mt-5 space-y-4">
                {bundle.applications.length ? (
                  bundle.applications.map((application) => (
                    <div
                      key={application.id}
                      className="rounded-[24px] border border-zinc-200 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-zinc-950">
                            {application.opportunityTitle}
                          </p>
                          <p className="text-sm text-zinc-500">
                            {application.startupName}
                          </p>
                        </div>
                        <Badge>{application.status.replace("_", " ")}</Badge>
                      </div>
                      <p className="mt-3 text-xs text-zinc-400">
                        Last action {formatDate(application.lastActionAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No applications yet"
                    description="This GTM profile has not submitted any applications yet."
                  />
                )}
              </div>
            </Card>
          </section>
        </>
      ) : (
        <>
          <section className="grid gap-6 md:grid-cols-4">
            <Stat label="Industry" value={bundle.startup?.industry ?? "Unknown"} />
            <Stat label="Website" value={bundle.startup?.website || "Not shared"} />
            <Stat label="Team size" value={bundle.startup?.teamSize ?? "-"} />
            <Stat label="Opportunities" value={bundle.opportunities.length} />
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <p className="text-lg font-semibold text-zinc-950">Startup context</p>
              <div className="mt-5 space-y-4 text-sm leading-6 text-zinc-600">
                <p>
                  Pluttoe keeps startup sectors flexible, but every opportunity is
                  still centered on a GTM role.
                </p>
                {bundle.startup?.logo?.url ? (
                  <a
                    href={bundle.startup.logo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-full border border-zinc-200 px-4 py-2"
                  >
                    Open company logo
                  </a>
                ) : (
                  <p>No company logo uploaded yet.</p>
                )}
              </div>
            </Card>

            <Card>
              <p className="text-lg font-semibold text-zinc-950">
                Opportunities posted
              </p>
              <div className="mt-5 space-y-4">
                {bundle.opportunities.length ? (
                  bundle.opportunities.map((opportunity) => (
                    <div
                      key={opportunity.id}
                      className="rounded-[24px] border border-zinc-200 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-zinc-950">
                            {opportunity.title}
                          </p>
                          <p className="text-sm text-zinc-500">
                            {opportunity.category}
                          </p>
                        </div>
                        <Badge>{opportunity.industry}</Badge>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-zinc-600">
                        {opportunity.description}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {asArray<string>(opportunity.requiredSkills).map((skill) => (
                          <Badge key={skill}>{skill}</Badge>
                        ))}
                      </div>
                      <p className="mt-4 text-sm text-zinc-500">
                        {formatCurrency(opportunity.budgetMin)} -{" "}
                        {formatCurrency(opportunity.budgetMax)} / month
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No opportunities posted yet"
                    description="This startup has not published a GTM opportunity yet."
                  />
                )}
              </div>
            </Card>
          </section>
        </>
      )}

      {!isOwnProfile && viewer?.role === "startup" && isFreelancer ? (
        <Card>
          <p className="text-lg font-semibold text-zinc-950">
            Startup review mode
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-500">
            This profile view is optimized for startup reviewers deciding whether
            to approve a GTM freelancer for chat or final acceptance.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
