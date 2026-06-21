"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { FileUpload } from "@/components/file-upload";
import { DashboardSkeleton } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { hasFirebaseEnv, getMissingFirebaseEnv } from "@/lib/env-validation";
import {
  applyToOpportunity,
  createOpportunity,
  deleteOpportunity,
  getAllFreelancers,
  getAllStartupProfiles,
  getApplicationsForFreelancer,
  getApplicationsForStartup,
  getFreelancerProfile,
  getMessagesForApplication,
  getOpenOpportunities,
  getRecommendationsForStartup,
  getStartupOpportunities,
  getStartupProfile,
  saveFreelancerProfile,
  saveRecommendationsForOpportunity,
  saveStartupProfile,
  sendMessage,
  subscribeToApplicationsForFreelancer,
  subscribeToApplicationsForStartup,
  subscribeToMessagesForApplication,
  subscribeToOpenOpportunities,
  subscribeToStartupOpportunities,
  updateApplicationStatus,
  updateOpportunity,
} from "@/lib/firestore";
import { formatCurrency, formatDate, getRoleHomePath } from "@/lib/utils";
import type {
  AIRecommendation,
  ApplicationRecord,
  FreelancerProfile,
  MessageRecord,
  Opportunity,
  StartupProfile,
} from "@/types";

function BreakdownBars({
  recommendation,
}: {
  recommendation: AIRecommendation;
}) {
  const entries = [
    ["Skills", recommendation.breakdown.skillsMatch],
    ["Experience", recommendation.breakdown.experienceMatch],
    ["Budget", recommendation.breakdown.budgetCompatibility],
    ["Industry", recommendation.breakdown.industryRelevance],
  ] as const;

  return (
    <div className="space-y-3">
      {entries.map(([label, value]) => (
        <div key={label} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{label}</span>
            <span>{value}%</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100">
            <div
              className="h-2 rounded-full bg-zinc-950"
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function asArray<T>(value: T[] | unknown): T[] {
  return Array.isArray(value) ? value : [];
}

export function DashboardView({ requiredRole }: { requiredRole?: "freelancer" | "startup" }) {
  const router = useRouter();
  const { authUser, profile, loading, backend } = useAuth();
  const [freelancer, setFreelancer] = useState<FreelancerProfile | null>(null);
  const [startup, setStartup] = useState<StartupProfile | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [marketOpportunities, setMarketOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [messages, setMessages] = useState<Record<string, MessageRecord[]>>({});
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [freelancerDirectory, setFreelancerDirectory] = useState<FreelancerProfile[]>([]);
  const [startupDirectory, setStartupDirectory] = useState<StartupProfile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [refreshingMarket, setRefreshingMarket] = useState(false);
  const [refreshingMatches, setRefreshingMatches] = useState(false);
  const [editingOpportunityId, setEditingOpportunityId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [opportunityDraft, setOpportunityDraft] = useState({
    title: "",
    description: "",
    industry: "SaaS",
    category: "Demand Generation",
    requiredSkills: "Pipeline, SEO, lifecycle marketing",
    minExperience: "3",
    budgetMin: "20",
    budgetMax: "50",
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const envReady = mounted ? hasFirebaseEnv() : null;

  useEffect(() => {
    if (!loading && profile && requiredRole && profile.role !== requiredRole) {
      router.replace(getRoleHomePath(profile.role));
    }
  }, [loading, profile, requiredRole, router]);

  async function reload() {
    if (!authUser || !profile) return;

    if (profile.role === "freelancer") {
      const [nextFreelancer, nextApps, nextMarket, startups] = await Promise.all([
        getFreelancerProfile(authUser.uid),
        getApplicationsForFreelancer(authUser.uid),
        getOpenOpportunities(),
        getAllStartupProfiles(),
      ]);
      setFreelancer(nextFreelancer);
      setApplications(nextApps);
      setMarketOpportunities(nextMarket);
      setStartupDirectory(startups);
    } else {
      const [nextStartup, nextOpps, nextApps, nextRecommendations, freelancers] =
        await Promise.all([
          getStartupProfile(authUser.uid),
          getStartupOpportunities(authUser.uid),
          getApplicationsForStartup(authUser.uid),
          getRecommendationsForStartup(authUser.uid),
          getAllFreelancers(),
        ]);
      setStartup(nextStartup);
      setOpportunities(nextOpps);
      setApplications(nextApps);
      setRecommendations(nextRecommendations);
      setFreelancerDirectory(freelancers);
    }
  }

  useEffect(() => {
    if (!authUser || !profile || envReady === null) return;

    let active = true;

    const load = async () => {
      try {
        const task = async () => {
          if (profile.role === "freelancer") {
            const [nextFreelancer, nextApps, nextMarket, startups] =
              await Promise.all([
                getFreelancerProfile(authUser.uid),
                getApplicationsForFreelancer(authUser.uid),
                getOpenOpportunities(),
                getAllStartupProfiles(),
              ]);

            if (!active) return;

            startTransition(() => {
              setFreelancer(nextFreelancer);
              setApplications(nextApps);
              setMarketOpportunities(nextMarket);
              setStartupDirectory(startups);
            });
            return;
          }

          const [nextStartup, nextOpps, nextApps, nextRecommendations, freelancers] =
            await Promise.all([
              getStartupProfile(authUser.uid),
              getStartupOpportunities(authUser.uid),
              getApplicationsForStartup(authUser.uid),
              getRecommendationsForStartup(authUser.uid),
              getAllFreelancers(),
            ]);

          if (!active) return;

          startTransition(() => {
            setStartup(nextStartup);
            setOpportunities(nextOpps);
            setApplications(nextApps);
            setRecommendations(nextRecommendations);
            setFreelancerDirectory(freelancers);
          });
        };

        await task();
      } catch (error) {
        console.error(error);
        toast.error("Could not load dashboard data.");
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [authUser, envReady, profile]);

  useEffect(() => {
    if (!authUser || !profile || envReady !== true) return;

    const handleError = (error: Error) => {
      console.error(error);
      toast.error(error.message);
    };

    if (profile.role === "freelancer") {
      const unsubscribeMarket = subscribeToOpenOpportunities(
        setMarketOpportunities,
        handleError
      );
      const unsubscribeApplications = subscribeToApplicationsForFreelancer(
        authUser.uid,
        setApplications,
        handleError
      );

      return () => {
        unsubscribeMarket();
        unsubscribeApplications();
      };
    }

    const unsubscribeOpportunities = subscribeToStartupOpportunities(
      authUser.uid,
      setOpportunities,
      handleError
    );
    const unsubscribeApplications = subscribeToApplicationsForStartup(
      authUser.uid,
      setApplications,
      handleError
    );

    return () => {
      unsubscribeOpportunities();
      unsubscribeApplications();
    };
  }, [authUser, envReady, profile]);

  const startupNames = useMemo(() => {
    return new Map(startupDirectory.map((entry) => [entry.id, entry.companyName]));
  }, [startupDirectory]);

  const freelancerNames = useMemo(() => {
    return new Map(freelancerDirectory.map((entry) => [entry.id, entry.fullName]));
  }, [freelancerDirectory]);

  const opportunityTitles = useMemo(() => {
    return new Map(opportunities.map((entry) => [entry.id, entry.title]));
  }, [opportunities]);

  const appliedOpportunityIds = useMemo(() => {
    return new Set(applications.map((application) => application.opportunityId));
  }, [applications]);

  const chatApplications = useMemo(() => {
    return applications.filter(
      (application) =>
        application.status === "chat_approved" ||
        application.status === "approved"
    );
  }, [applications]);

  const loadMessages = useCallback(
    async (application: ApplicationRecord) => {
      if (!authUser) return;

      const nextMessages = await getMessagesForApplication(
        application,
        authUser.uid
      );
      setMessages((current) => ({ ...current, [application.id]: nextMessages }));
    },
    [authUser]
  );

  useEffect(() => {
    if (!authUser || !chatApplications.length || envReady !== true) return;

    const unsubscribeMessages = chatApplications.map((application) =>
      subscribeToMessagesForApplication(
        application,
        authUser.uid,
        (nextMessages) =>
          setMessages((current) => ({
            ...current,
            [application.id]: nextMessages,
          })),
        (error) => {
          console.error(error);
          toast.error(error.message);
        }
      )
    );

    return () => {
      unsubscribeMessages.forEach((unsubscribe) => unsubscribe());
    };
  }, [authUser, chatApplications, envReady]);

  useEffect(() => {
    if (!chatApplications.length || envReady === true) return;

    chatApplications.forEach((application) => {
      if (!messages[application.id]) {
        void loadMessages(application);
      }
    });
  }, [chatApplications, envReady, loadMessages, messages]);

  async function handleSendMessage(application: ApplicationRecord) {
    if (!authUser || !profile) return;

    const body = (messageDrafts[application.id] ?? "").trim();
    if (!body) {
      toast.error("Write a message first.");
      return;
    }

    const messageId = await sendMessage({
      application,
      senderId: authUser.uid,
      senderName: profile.displayName,
      body,
    });

    if (!messageId) {
      toast.error("Chat opens after the startup approves chat access.");
      return;
    }

    setMessageDrafts((current) => ({ ...current, [application.id]: "" }));
    if (envReady !== true) {
      await loadMessages(application);
      await reload();
    }
  }

  function renderChatPanel(application: ApplicationRecord) {
    const thread = messages[application.id] ?? [];
    const draft = messageDrafts[application.id] ?? "";

    return (
      <div
        key={`chat-${application.id}`}
        className="rounded-[26px] border border-zinc-200 p-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-zinc-950">
              {application.opportunityTitle}
            </p>
            <p className="text-sm text-zinc-500">
              {isFreelancer
                ? application.startupName
                : freelancerNames.get(application.freelancerId) ?? "Freelancer"}
            </p>
          </div>
          <Badge>{application.status.replace("_", " ")}</Badge>
        </div>

        <div className="mt-4 max-h-72 space-y-3 overflow-y-auto rounded-[22px] bg-zinc-50 p-3">
          {thread.length ? (
            thread.map((message) => {
              const mine = message.senderId === authUser?.uid;
              return (
                <div
                  key={message.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-[20px] px-4 py-3 text-sm ${
                      mine
                        ? "bg-zinc-950 text-white"
                        : "border border-zinc-200 bg-white text-zinc-700"
                    }`}
                  >
                    <p className={mine ? "text-zinc-300" : "text-zinc-400"}>
                      {message.senderName}
                    </p>
                    <p className="mt-1 leading-6">{message.body}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-zinc-500">
              Chat is approved. Send the first message to start the thread.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <Input
            value={draft}
            onChange={(event) =>
              setMessageDrafts((current) => ({
                ...current,
                [application.id]: event.target.value,
              }))
            }
            placeholder="Write a message"
          />
          <Button onClick={() => void handleSendMessage(application)}>Send</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!authUser || !profile) {
    return (
      <EmptyState
        title="You need an active Pluttoe session"
        description="Sign in to manage your GTM profile, review applicants, or apply to startup opportunities."
        action={
          <Link href="/login">
            <Button>Go to login</Button>
          </Link>
        }
      />
    );
  }

  if (requiredRole && profile.role !== requiredRole) {
    return <DashboardSkeleton />;
  }

  const isFreelancer = profile.role === "freelancer";

  return (
    <div className="space-y-6">
      <section className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">
            Fixed talent focus
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
            Pluttoe is tuned only for GTM talent matching.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500">
            Freelancers are always evaluated as GTM specialists. Startups vary by
            sector, budget, and category, while matching stays centered on
            pipeline impact, execution quality, and fit.
          </p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Signed in as</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {profile.displayName}
          </p>
          <span className="mt-4 inline-block rounded-full border border-zinc-950 px-3 py-1 text-xs font-medium text-zinc-950">{profile.role}</span>
          <p className="mt-3 text-xs text-zinc-400">
            Backend:{" "}
            {backend === "firebase" ? "Firebase live mode" : "Local persisted mode"}
          </p>
          {envReady === false ? (
            <p className="mt-2 text-xs leading-5 text-amber-700">
              Missing Firebase keys: {getMissingFirebaseEnv().join(", ")}
            </p>
          ) : null}
        </Card>
      </section>

      {isFreelancer ? (
        <>
          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-zinc-950">
                    Freelancer profile
                  </p>
                  <p className="text-sm text-zinc-500">
                    Keep this sharp. Startups review it before approving chat or
                    final acceptance.
                  </p>
                </div>
                <Link href={`/profile/${profile.uid}`}>
                  <Button variant="secondary">Open profile</Button>
                </Link>
              </div>

              {freelancer ? (
                <div className="mt-6 space-y-4">
                  <Input
                    value={freelancer.fullName}
                    onChange={(event) =>
                      setFreelancer({ ...freelancer, fullName: event.target.value })
                    }
                  />
                  <Textarea
                    value={freelancer.bio}
                    onChange={(event) =>
                      setFreelancer({ ...freelancer, bio: event.target.value })
                    }
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      value={freelancer.skills.join(", ")}
                      onChange={(event) =>
                        setFreelancer({
                          ...freelancer,
                          skills: event.target.value
                            .split(",")
                            .map((entry) => entry.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="GTM skills"
                    />
                    <Input
                      type="number"
                      value={freelancer.desiredMonthlyBudget}
                      onChange={(event) =>
                        setFreelancer({
                          ...freelancer,
                          desiredMonthlyBudget: Number(event.target.value),
                        })
                      }
                      placeholder="Desired hourly rate"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Input
                      value={freelancer.linkedin ?? ""}
                      onChange={(event) =>
                        setFreelancer({
                          ...freelancer,
                          linkedin: event.target.value,
                        })
                      }
                      placeholder="LinkedIn URL"
                    />
                    <Input
                      value={freelancer.github ?? ""}
                      onChange={(event) =>
                        setFreelancer({ ...freelancer, github: event.target.value })
                      }
                      placeholder="GitHub URL"
                    />
                    <Input
                      value={freelancer.portfolio ?? ""}
                      onChange={(event) =>
                        setFreelancer({
                          ...freelancer,
                          portfolio: event.target.value,
                        })
                      }
                      placeholder="Portfolio URL"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FileUpload
                      kind="resume"
                      userId={profile.uid}
                      onUploaded={async (asset) => {
                        const next = { ...freelancer, resume: asset };
                        setFreelancer(next);
                        await saveFreelancerProfile(profile.uid, { resume: asset });
                      }}
                    />
                    <FileUpload
                      kind="portfolio"
                      userId={profile.uid}
                      onUploaded={async (asset) => {
                        const nextFiles = [...freelancer.portfolioFiles, asset];
                        setFreelancer({
                          ...freelancer,
                          portfolioFiles: nextFiles,
                        });
                        await saveFreelancerProfile(profile.uid, {
                          portfolioFiles: nextFiles,
                        });
                      }}
                    />
                  </div>
                  <Button
                    disabled={submitting}
                    onClick={async () => {
                      setSubmitting(true);
                      try {
                        await saveFreelancerProfile(profile.uid, freelancer);
                        toast.success("Profile updated");
                      } catch (error) {
                        console.error(error);
                        toast.error("Could not save freelancer profile.");
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                  >
                    {submitting ? "Saving..." : "Save profile"}
                  </Button>
                </div>
              ) : null}
            </Card>

            <Card>
              <p className="text-lg font-semibold text-zinc-950">
                Application history
              </p>
              <div className="mt-5 space-y-4">
                {applications.length ? (
                  applications.map((application) => (
                    <div
                      key={application.id}
                      className="rounded-3xl border border-zinc-200 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
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
                        Updated {formatDate(application.lastActionAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No applications yet"
                    description="Start applying to open GTM roles and your history will appear here."
                  />
                )}
              </div>
            </Card>

            <Card>
              <p className="text-lg font-semibold text-zinc-950">
                Approved chats
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Threads open once a startup approves chat access.
              </p>
              <div className="mt-5 space-y-4">
                {chatApplications.length ? (
                  chatApplications.map(renderChatPanel)
                ) : (
                  <EmptyState
                    title="No approved chats yet"
                    description="Apply to opportunities and approved conversations will appear here."
                  />
                )}
              </div>
            </Card>
          </section>

          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-zinc-950">
                  Startups hiring GTM talent
                </p>
                <p className="text-sm text-zinc-500">
                  Review sector, budget, and role details before you apply.
                </p>
              </div>
              <Button
                variant="secondary"
                disabled={refreshingMarket}
                onClick={async () => {
                  setRefreshingMarket(true);
                  try {
                    await reload();
                    toast.success("Open opportunities refreshed");
                  } catch (error) {
                    console.error(error);
                    toast.error("Could not refresh opportunities.");
                  } finally {
                    setRefreshingMarket(false);
                  }
                }}
              >
                {refreshingMarket ? "Refreshing..." : "Refresh roles"}
              </Button>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {marketOpportunities.length ? (
                marketOpportunities.map((opportunity) => (
                  <div
                    key={opportunity.id}
                    className="rounded-[28px] border border-zinc-200 p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-lg font-medium text-zinc-950">
                          {opportunity.title}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {startupNames.get(opportunity.startupId) ?? "Startup"}
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
                    <div className="mt-4 text-sm text-zinc-500">
                      {formatCurrency(opportunity.budgetMin)} -{" "}
                      {formatCurrency(opportunity.budgetMax)} / hour
                    </div>
                    <div className="mt-5 flex gap-3">
                      <Link href={`/profile/${opportunity.startupId}`}>
                        <Button variant="secondary">View startup</Button>
                      </Link>
                      <Button
                        disabled={appliedOpportunityIds.has(opportunity.id)}
                        onClick={async () => {
                          try {
                            await applyToOpportunity({
                              opportunity,
                              freelancerId: profile.uid,
                              startupName:
                                startupNames.get(opportunity.startupId) ??
                                "Startup",
                            });
                            toast.success("Application submitted");
                            await reload();
                          } catch (error) {
                            console.error(error);
                            toast.error("Application failed.");
                          }
                        }}
                      >
                        {appliedOpportunityIds.has(opportunity.id)
                          ? "Applied"
                          : "Apply"}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No open opportunities yet"
                  description="When startups publish open GTM opportunities, they will appear here."
                />
              )}
            </div>
          </Card>
        </>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <Card>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-zinc-950">
                    Startup profile
                  </p>
                  <p className="text-sm text-zinc-500">
                    This is what freelancers see before applying.
                  </p>
                </div>
                <Link href={`/profile/${profile.uid}`}>
                  <Button variant="secondary">Open profile</Button>
                </Link>
              </div>

              {startup ? (
                <div className="mt-6 space-y-4">
                  <Input
                    value={startup.companyName}
                    onChange={(event) =>
                      setStartup({ ...startup, companyName: event.target.value })
                    }
                  />
                  <Textarea
                    value={startup.about}
                    onChange={(event) =>
                      setStartup({ ...startup, about: event.target.value })
                    }
                  />
                  <div className="grid gap-4 md:grid-cols-3">
                    <Input
                      value={startup.industry}
                      onChange={(event) =>
                        setStartup({ ...startup, industry: event.target.value })
                      }
                    />
                    <Input
                      value={startup.teamSize}
                      onChange={(event) =>
                        setStartup({ ...startup, teamSize: event.target.value })
                      }
                    />
                    <Input
                      value={startup.website ?? ""}
                      onChange={(event) =>
                        setStartup({ ...startup, website: event.target.value })
                      }
                      placeholder="Website"
                    />
                  </div>
                  <Button
                    disabled={submitting}
                    onClick={async () => {
                      setSubmitting(true);
                      try {
                        await saveStartupProfile(profile.uid, startup);
                        toast.success("Startup profile updated");
                      } catch (error) {
                        console.error(error);
                        toast.error("Could not save startup profile.");
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                  >
                    {submitting ? "Saving..." : "Save startup profile"}
                  </Button>
                </div>
              ) : null}
            </Card>

            <Card>
              <p className="text-lg font-semibold text-zinc-950">
                Post a GTM opportunity
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Pluttoe keeps the role fixed to GTM while sector, budget, and category
                change by startup.
              </p>
              <div className="mt-6 space-y-4">
                <Input
                  placeholder="Role title"
                  value={opportunityDraft.title}
                  onChange={(event) =>
                    setOpportunityDraft({
                      ...opportunityDraft,
                      title: event.target.value,
                    })
                  }
                />
                <Textarea
                  placeholder="What should this GTM specialist own?"
                  value={opportunityDraft.description}
                  onChange={(event) =>
                    setOpportunityDraft({
                      ...opportunityDraft,
                      description: event.target.value,
                    })
                  }
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    placeholder="Industry"
                    value={opportunityDraft.industry}
                    onChange={(event) =>
                      setOpportunityDraft({
                        ...opportunityDraft,
                        industry: event.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="Category"
                    value={opportunityDraft.category}
                    onChange={(event) =>
                      setOpportunityDraft({
                        ...opportunityDraft,
                        category: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Input
                    placeholder="Required skills"
                    value={opportunityDraft.requiredSkills}
                    onChange={(event) =>
                      setOpportunityDraft({
                        ...opportunityDraft,
                        requiredSkills: event.target.value,
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Min experience"
                    value={opportunityDraft.minExperience}
                    onChange={(event) =>
                      setOpportunityDraft({
                        ...opportunityDraft,
                        minExperience: event.target.value,
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Hourly pay min"
                    value={opportunityDraft.budgetMin}
                    onChange={(event) =>
                      setOpportunityDraft({
                        ...opportunityDraft,
                        budgetMin: event.target.value,
                      })
                    }
                  />
                </div>
                <Input
                  type="number"
                  placeholder="Hourly pay max"
                  value={opportunityDraft.budgetMax}
                  onChange={(event) =>
                    setOpportunityDraft({
                      ...opportunityDraft,
                      budgetMax: event.target.value,
                    })
                  }
                />
                <Button
                  disabled={submitting}
                  onClick={async () => {
                    const requiredSkills = opportunityDraft.requiredSkills
                      .split(",")
                      .map((entry) => entry.trim())
                      .filter(Boolean);
                    const minExperience = Number(opportunityDraft.minExperience);
                    const budgetMin = Number(opportunityDraft.budgetMin);
                    const budgetMax = Number(opportunityDraft.budgetMax);

                    if (
                      !opportunityDraft.title.trim() ||
                      !opportunityDraft.description.trim() ||
                      !requiredSkills.length ||
                      !Number.isFinite(minExperience) ||
                      !Number.isFinite(budgetMin) ||
                      !Number.isFinite(budgetMax) ||
                      budgetMax < budgetMin
                    ) {
                      toast.error("Complete the opportunity details first.");
                      return;
                    }

                    setSubmitting(true);
                    try {
                      const opportunityPayload = {
                        title: opportunityDraft.title.trim(),
                        description: opportunityDraft.description.trim(),
                        industry: opportunityDraft.industry.trim() || "SaaS",
                        category:
                          opportunityDraft.category.trim() || "Demand Generation",
                        requiredSkills,
                        minExperience,
                        budgetMin,
                        budgetMax,
                      };

                      if (editingOpportunityId) {
                        await updateOpportunity(editingOpportunityId, opportunityPayload);
                        toast.success("Opportunity updated");
                      } else {
                        await createOpportunity(profile.uid, {
                          ...opportunityPayload,
                          status: "open",
                        });
                        toast.success("Opportunity published");
                      }

                      setEditingOpportunityId(null);
                      setOpportunityDraft({
                        title: "",
                        description: "",
                        industry: "SaaS",
                        category: "Demand Generation",
                        requiredSkills: "Pipeline, SEO, lifecycle marketing",
                        minExperience: "3",
                        budgetMin: "20",
                        budgetMax: "50",
                      });
                      await reload();
                    } catch (error) {
                      console.error(error);
                      toast.error("Could not publish opportunity.");
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {submitting
                    ? editingOpportunityId
                      ? "Updating..."
                      : "Publishing..."
                    : editingOpportunityId
                      ? "Update opportunity"
                      : "Publish opportunity"}
                </Button>
                {editingOpportunityId ? (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingOpportunityId(null);
                      setOpportunityDraft({
                        title: "",
                        description: "",
                        industry: "SaaS",
                        category: "Demand Generation",
                        requiredSkills: "Pipeline, SEO, lifecycle marketing",
                        minExperience: "3",
                        budgetMin: "20",
                        budgetMax: "50",
                      });
                    }}
                  >
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </Card>
          </section>

          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-zinc-950">
                  My postings
                </p>
                <p className="text-sm text-zinc-500">
                  Only opportunities created by this startup are shown here.
                </p>
              </div>
              <Badge>{opportunities.length} posted</Badge>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {opportunities.length ? (
                opportunities.map((opportunity) => (
                  <div
                    key={opportunity.id}
                    className="rounded-[28px] border border-zinc-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-medium text-zinc-950">
                          {opportunity.title}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {opportunity.category}
                        </p>
                      </div>
                      <Badge>{opportunity.status}</Badge>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-zinc-600">
                      {opportunity.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {asArray<string>(opportunity.requiredSkills).map((skill) => (
                        <Badge key={skill}>{skill}</Badge>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-500">
                      <span>{opportunity.industry}</span>
                      <span>
                        {formatCurrency(opportunity.budgetMin)} -{" "}
                        {formatCurrency(opportunity.budgetMax)} / hour
                      </span>
                      <span>{opportunity.minExperience}+ years</span>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditingOpportunityId(opportunity.id);
                          setOpportunityDraft({
                            title: opportunity.title,
                            description: opportunity.description,
                            industry: opportunity.industry,
                            category: opportunity.category,
                            requiredSkills: opportunity.requiredSkills.join(", "),
                            minExperience: String(opportunity.minExperience),
                            budgetMin: String(opportunity.budgetMin),
                            budgetMax: String(opportunity.budgetMax),
                          });
                        }}
                      >
                        Edit job
                      </Button>
                      {opportunity.status === "open" ? (
                        <Button
                          variant="ghost"
                          onClick={async () => {
                            try {
                              await updateOpportunity(opportunity.id, { status: "closed" });
                              toast.success("Opportunity closed");
                              await reload();
                            } catch (error) {
                              console.error(error);
                              toast.error("Could not close opportunity.");
                            }
                          }}
                        >
                          Close job
                        </Button>
                      ) : null}
                      <Button
                        variant="danger"
                        onClick={async () => {
                          if (!window.confirm("Delete this job post?")) return;
                          try {
                            await deleteOpportunity(opportunity.id);
                            if (editingOpportunityId === opportunity.id) {
                              setEditingOpportunityId(null);
                            }
                            toast.success("Opportunity deleted");
                            await reload();
                          } catch (error) {
                            console.error(error);
                            toast.error("Could not delete opportunity.");
                          }
                        }}
                      >
                        Delete job
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No postings yet"
                  description="Publish a GTM opportunity and it will appear here immediately."
                />
              )}
            </div>
          </Card>

          <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <Card>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-zinc-950">
                    Applicants
                  </p>
                  <p className="text-sm text-zinc-500">
                    Approve for chat first, then approve the candidate if the fit
                    holds up.
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {applications.length ? (
                  applications.map((application) => (
                    <div
                      key={application.id}
                      className="rounded-[26px] border border-zinc-200 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-zinc-950">
                            {application.opportunityTitle}
                          </p>
                          <p className="text-sm text-zinc-500">
                            Freelancer: {freelancerNames.get(application.freelancerId) ?? "Freelancer"}
                          </p>
                        </div>
                        <Badge>{application.status.replace("_", " ")}</Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link href={`/profile/${application.freelancerId}`}>
                          <Button variant="secondary">Review profile</Button>
                        </Link>
                        <Button
                          variant="secondary"
                          disabled={
                            application.status === "chat_approved" ||
                            application.status === "approved"
                          }
                          onClick={async () => {
                            await updateApplicationStatus(
                              application.id,
                              "chat_approved"
                            );
                            toast.success("Chat access approved");
                            await reload();
                          }}
                        >
                          Approve chat
                        </Button>
                        <Button
                          disabled={application.status === "approved"}
                          onClick={async () => {
                            await updateApplicationStatus(application.id, "approved");
                            toast.success("Freelancer approved");
                            await reload();
                          }}
                        >
                          Approve match
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No applicants yet"
                    description="Once freelancers apply, they will appear here for review."
                  />
                )}
              </div>
            </Card>

            <Card>
              <p className="text-lg font-semibold text-zinc-950">
                Approved chats
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Use this after approving chat or approving the match.
              </p>
              <div className="mt-5 space-y-4">
                {chatApplications.length ? (
                  chatApplications.map(renderChatPanel)
                ) : (
                  <EmptyState
                    title="No active chats yet"
                    description="Approve chat for an applicant to start messaging."
                  />
                )}
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-zinc-950">
                    AI recommendations
                  </p>
                  <p className="text-sm text-zinc-500">
                    Sorted by the new 40 / 25 / 20 / 15 weighted score.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  disabled={refreshingMatches || !opportunities.length}
                  onClick={async () => {
                    if (!opportunities.length) {
                      toast.error("Publish an opportunity first.");
                      return;
                    }

                    setRefreshingMatches(true);
                    try {
                      await Promise.all(
                        opportunities.map((opportunity) =>
                          saveRecommendationsForOpportunity(opportunity)
                        )
                      );
                      toast.success("AI matches refreshed");
                      await reload();
                    } catch (error) {
                      console.error(error);
                      toast.error("Could not refresh recommendations.");
                    } finally {
                      setRefreshingMatches(false);
                    }
                  }}
                >
                  {refreshingMatches ? "Refreshing..." : "Refresh AI ranking"}
                </Button>
              </div>
              <div className="mt-6 space-y-4">
                {recommendations.length ? (
                  recommendations.map((recommendation) => (
                    <div
                      key={recommendation.id}
                      className="rounded-[28px] border border-zinc-200 p-5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-zinc-950">
                            {freelancerNames.get(recommendation.freelancerId) ?? "Freelancer"}
                          </p>
                          <p className="text-sm text-zinc-500">
                            {opportunityTitles.get(recommendation.opportunityId) ?? "Opportunity"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-semibold text-zinc-950">
                            {recommendation.score}
                          </p>
                          <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
                            total score
                          </p>
                        </div>
                      </div>
                      <div className="mt-5">
                        <BreakdownBars recommendation={recommendation} />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {asArray<string>(
                          recommendation.details?.matchedSkills
                        ).map((skill) => (
                          <Badge key={skill}>{skill}</Badge>
                        ))}
                      </div>
                      <div className="mt-4">
                        <Link href={`/profile/${recommendation.freelancerId}`}>
                          <Button variant="secondary">Review profile</Button>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No recommendations stored yet"
                    description="Refresh AI ranking after publishing an opportunity and Pluttoe will persist sorted recommendations in Firestore."
                  />
                )}
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
