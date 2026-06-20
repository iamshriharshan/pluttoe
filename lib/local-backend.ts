import { buildRecommendation } from "@/lib/ai-matching";
import type {
  AIRecommendation,
  ApplicationRecord,
  FreelancerProfile,
  Opportunity,
  MessageRecord,
  ProfileBundle,
  StartupProfile,
  UploadedFileAsset,
  UserRecord,
  UserRole,
} from "@/types";

const STORE_KEY = "pluto_local_backend_store_v1";

type LocalStore = {
  users: Record<string, UserRecord>;
  freelancers: Record<string, FreelancerProfile>;
  startups: Record<string, StartupProfile>;
  opportunities: Record<string, Opportunity>;
  applications: Record<string, ApplicationRecord>;
  messages: Record<string, MessageRecord>;
  recommendations: Record<string, AIRecommendation>;
};

function now() {
  return new Date();
}

function cloneDate<T>(value: T): T {
  return JSON.parse(JSON.stringify(value), (key, item) => {
    if (
      typeof item === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(item)
    ) {
      return new Date(item);
    }
    return item;
  });
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function arrayOrEmpty<T>(value: T[] | unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeFreelancer(profile: FreelancerProfile): FreelancerProfile {
  return {
    ...profile,
    skills: arrayOrEmpty<string>(profile.skills),
    sectors: arrayOrEmpty<string>(profile.sectors),
    portfolioFiles: arrayOrEmpty<UploadedFileAsset>(profile.portfolioFiles),
  };
}

function normalizeOpportunityRecord(opportunity: Opportunity): Opportunity {
  return {
    ...opportunity,
    requiredSkills: arrayOrEmpty<string>(opportunity.requiredSkills),
  };
}

function normalizeRecommendationRecord(
  recommendation: AIRecommendation
): AIRecommendation {
  return {
    ...recommendation,
    breakdown: recommendation.breakdown ?? {
      skillsMatch: 0,
      experienceMatch: 0,
      budgetCompatibility: 0,
      industryRelevance: 0,
    },
    details: {
      matchedSkills: arrayOrEmpty<string>(recommendation.details?.matchedSkills),
      budgetBand: recommendation.details?.budgetBand ?? "poor",
      experienceSummary: recommendation.details?.experienceSummary ?? "",
      categorySummary: recommendation.details?.categorySummary ?? "",
    },
  };
}

function createSeedStore(): LocalStore {
  const current = now();
  const startupUser: UserRecord = {
    uid: "startup_seed_1",
    email: "hello@northstar.ai",
    role: "startup",
    displayName: "Northstar AI",
    createdAt: current,
    updatedAt: current,
  };

  const freelancerUser: UserRecord = {
    uid: "freelancer_seed_1",
    email: "ava@pluto.dev",
    role: "freelancer",
    displayName: "Ava Stone",
    createdAt: current,
    updatedAt: current,
  };

  const startup: StartupProfile = {
    id: startupUser.uid,
    companyName: "Northstar AI",
    industry: "AI Infrastructure",
    website: "https://northstar.ai",
    teamSize: "11-25",
    about:
      "Developer infrastructure startup looking for a GTM operator who can build repeatable outbound and lifecycle systems.",
    logo: null,
    createdAt: current,
    updatedAt: current,
  };

  const freelancer: FreelancerProfile = {
    id: freelancerUser.uid,
    fullName: "Ava Stone",
    headline: "Pipeline and growth systems specialist",
    focusRole: "GTM",
    skills: ["Demand Generation", "Lifecycle Marketing", "HubSpot", "Outbound"],
    yearsExperience: 5,
    sectors: ["AI Infrastructure", "SaaS", "Developer Tools"],
    github: "https://github.com/ava-stone",
    linkedin: "https://linkedin.com/in/ava-stone",
    portfolio: "https://ava-stone.notion.site",
    bio:
      "Hands-on GTM operator who builds acquisition systems, pipeline reporting, and founder-friendly execution loops.",
    desiredMonthlyBudget: 5200,
    resume: null,
    portfolioFiles: [],
    createdAt: current,
    updatedAt: current,
  };

  const opportunity: Opportunity = {
    id: "opp_seed_1",
    startupId: startup.id,
    title: "Founding GTM Lead",
    description:
      "Own pipeline generation, CRM hygiene, reporting, and experimentation cadence with the founders.",
    industry: "AI Infrastructure",
    category: "Outbound and Lifecycle",
    requiredSkills: ["Outbound", "HubSpot", "Lifecycle Marketing"],
    minExperience: 4,
    budgetMin: 4500,
    budgetMax: 6500,
    status: "open",
    createdAt: current,
    updatedAt: current,
  };

  return {
    users: {
      [startupUser.uid]: startupUser,
      [freelancerUser.uid]: freelancerUser,
    },
    freelancers: {
      [freelancer.id]: freelancer,
    },
    startups: {
      [startup.id]: startup,
    },
    opportunities: {
      [opportunity.id]: opportunity,
    },
    applications: {},
    messages: {},
    recommendations: {},
  };
}

function readStore(): LocalStore {
  if (typeof window === "undefined") {
    return createSeedStore();
  }

  const raw = window.localStorage.getItem(STORE_KEY);
  if (!raw) {
    const seeded = createSeedStore();
    writeStore(seeded);
    return seeded;
  }

  try {
    const parsed = cloneDate(JSON.parse(raw)) as Partial<LocalStore>;
    return {
      users: parsed.users ?? {},
      freelancers: Object.fromEntries(
        Object.entries(parsed.freelancers ?? {}).map(([id, profile]) => [
          id,
          normalizeFreelancer(profile),
        ])
      ),
      startups: parsed.startups ?? {},
      opportunities: Object.fromEntries(
        Object.entries(parsed.opportunities ?? {}).map(([id, opportunity]) => [
          id,
          normalizeOpportunityRecord(opportunity),
        ])
      ),
      applications: parsed.applications ?? {},
      messages: parsed.messages ?? {},
      recommendations: Object.fromEntries(
        Object.entries(parsed.recommendations ?? {}).map(
          ([id, recommendation]) => [
            id,
            normalizeRecommendationRecord(recommendation),
          ]
        )
      ),
    };
  } catch {
    const seeded = createSeedStore();
    writeStore(seeded);
    return seeded;
  }
}

function writeStore(store: LocalStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export async function localBootstrapUser(params: {
  uid: string;
  role: UserRole;
  displayName: string;
  email: string;
}) {
  const store = readStore();
  const current = now();

  store.users[params.uid] = {
    uid: params.uid,
    role: params.role,
    displayName: params.displayName,
    email: params.email,
    createdAt: store.users[params.uid]?.createdAt ?? current,
    updatedAt: current,
  };

  if (params.role === "freelancer") {
    store.freelancers[params.uid] = {
      id: params.uid,
      fullName: params.displayName,
      headline: store.freelancers[params.uid]?.headline ?? "Revenue-minded GTM operator",
      focusRole: "GTM",
      skills: store.freelancers[params.uid]?.skills ?? [
        "Demand generation",
        "CRM",
        "Pipeline building",
      ],
      yearsExperience: store.freelancers[params.uid]?.yearsExperience ?? 3,
      sectors: store.freelancers[params.uid]?.sectors ?? ["SaaS"],
      github: store.freelancers[params.uid]?.github ?? "",
      linkedin: store.freelancers[params.uid]?.linkedin ?? "",
      portfolio: store.freelancers[params.uid]?.portfolio ?? "",
      bio:
        store.freelancers[params.uid]?.bio ??
        "GTM specialist focused on fast learning loops and measurable growth.",
      desiredMonthlyBudget:
        store.freelancers[params.uid]?.desiredMonthlyBudget ?? 4500,
      resume: store.freelancers[params.uid]?.resume ?? null,
      portfolioFiles: store.freelancers[params.uid]?.portfolioFiles ?? [],
      createdAt: store.freelancers[params.uid]?.createdAt ?? current,
      updatedAt: current,
    };
  } else {
    store.startups[params.uid] = {
      id: params.uid,
      companyName: params.displayName,
      industry: store.startups[params.uid]?.industry ?? "SaaS",
      website: store.startups[params.uid]?.website ?? "",
      teamSize: store.startups[params.uid]?.teamSize ?? "1-10",
      about:
        store.startups[params.uid]?.about ??
        "Early-stage startup hiring a GTM partner who can drive execution.",
      logo: store.startups[params.uid]?.logo ?? null,
      createdAt: store.startups[params.uid]?.createdAt ?? current,
      updatedAt: current,
    };
  }

  writeStore(store);
}

export async function localGetUserRecord(uid: string) {
  return readStore().users[uid] ?? null;
}

export async function localGetFreelancerProfile(uid: string) {
  return readStore().freelancers[uid] ?? null;
}

export async function localGetStartupProfile(uid: string) {
  return readStore().startups[uid] ?? null;
}

export async function localSaveFreelancerProfile(
  uid: string,
  profile: Partial<FreelancerProfile>
) {
  const store = readStore();
  const existing = store.freelancers[uid];
  if (!existing) return;
  store.freelancers[uid] = {
    ...existing,
    ...profile,
    updatedAt: now(),
  };
  writeStore(store);
}

export async function localSaveStartupProfile(
  uid: string,
  profile: Partial<StartupProfile>
) {
  const store = readStore();
  const existing = store.startups[uid];
  if (!existing) return;
  store.startups[uid] = {
    ...existing,
    ...profile,
    updatedAt: now(),
  };
  writeStore(store);
}

export async function localCreateOpportunity(
  startupId: string,
  payload: Omit<Opportunity, "id" | "startupId" | "createdAt" | "updatedAt">
) {
  const store = readStore();
  const id = uid("opp");
  store.opportunities[id] = {
    id,
    startupId,
    ...payload,
    createdAt: now(),
    updatedAt: now(),
  };
  writeStore(store);
  return id;
}

export async function localUpsertOpportunity(opportunity: Opportunity) {
  const store = readStore();
  const existing = store.opportunities[opportunity.id];
  store.opportunities[opportunity.id] = {
    ...opportunity,
    createdAt: existing?.createdAt ?? opportunity.createdAt ?? now(),
    updatedAt: opportunity.updatedAt ?? now(),
  };
  writeStore(store);
}

export async function localGetStartupOpportunities(startupId: string) {
  return Object.values(readStore().opportunities)
    .filter((entry) => entry.startupId === startupId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function localGetOpenOpportunities() {
  return Object.values(readStore().opportunities)
    .filter((entry) => entry.status === "open")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 12);
}

export async function localApplyToOpportunity(params: {
  opportunity: Opportunity;
  freelancerId: string;
  startupName: string;
}) {
  const store = readStore();
  const existing = Object.values(store.applications).find(
    (entry) =>
      entry.opportunityId === params.opportunity.id &&
      entry.freelancerId === params.freelancerId
  );
  if (existing) return existing.id;

  const id = uid("app");
  store.applications[id] = {
    id,
    startupId: params.opportunity.startupId,
    freelancerId: params.freelancerId,
    opportunityId: params.opportunity.id,
    opportunityTitle: params.opportunity.title,
    startupName: params.startupName,
    status: "applied",
    lastActionAt: now(),
    createdAt: now(),
    updatedAt: now(),
  };
  writeStore(store);
  return id;
}

export async function localGetApplicationsForFreelancer(freelancerId: string) {
  return Object.values(readStore().applications)
    .filter((entry) => entry.freelancerId === freelancerId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function localGetApplicationsForStartup(startupId: string) {
  return Object.values(readStore().applications)
    .filter((entry) => entry.startupId === startupId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function localUpdateApplicationStatus(
  applicationId: string,
  status: ApplicationRecord["status"]
) {
  const store = readStore();
  const current = store.applications[applicationId];
  if (!current) return;
  store.applications[applicationId] = {
    ...current,
    status,
    lastActionAt: now(),
    updatedAt: now(),
  };
  writeStore(store);
}

export async function localGetMessagesForApplication(applicationId: string) {
  return Object.values(readStore().messages)
    .filter((entry) => entry.applicationId === applicationId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function localSendMessage(params: {
  applicationId: string;
  senderId: string;
  senderName: string;
  body: string;
}) {
  const store = readStore();
  const application = store.applications[params.applicationId];
  const body = params.body.trim();

  if (!application || !body) return null;

  const allowed =
    application.status === "chat_approved" || application.status === "approved";
  const isParticipant =
    params.senderId === application.startupId ||
    params.senderId === application.freelancerId;

  if (!allowed || !isParticipant) return null;

  const id = uid("msg");
  const current = now();
  store.messages[id] = {
    id,
    applicationId: application.id,
    startupId: application.startupId,
    freelancerId: application.freelancerId,
    senderId: params.senderId,
    senderName: params.senderName,
    body,
    createdAt: current,
    updatedAt: current,
  };
  store.applications[application.id] = {
    ...application,
    lastActionAt: current,
    updatedAt: current,
  };
  writeStore(store);
  return id;
}

export async function localGetAllStartupProfiles() {
  return Object.values(readStore().startups).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export async function localGetAllFreelancers() {
  const store = readStore();
  return Object.values(store.freelancers).filter(
    (entry) => store.users[entry.id]?.role === "freelancer"
  ).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export async function localSaveRecommendationsForOpportunity(opportunity: Opportunity) {
  const store = readStore();
  const freelancers = Object.values(store.freelancers).filter(
    (entry) => store.users[entry.id]?.role === "freelancer"
  );

  for (const freelancer of freelancers) {
    const recommendation = buildRecommendation(
      opportunity.startupId,
      freelancer,
      opportunity
    );
    const id = `${opportunity.id}_${freelancer.id}`;
    store.recommendations[id] = {
      id,
      ...recommendation,
      createdAt: store.recommendations[id]?.createdAt ?? now(),
      updatedAt: now(),
    };
  }

  writeStore(store);
}

export async function localGetRecommendationsForStartup(startupId: string) {
  const store = readStore();
  return Object.values(store.recommendations)
    .filter(
      (entry) =>
        entry.startupId === startupId &&
        store.users[entry.freelancerId]?.role === "freelancer"
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);
}

export async function localGetProfileBundle(id: string): Promise<ProfileBundle> {
  const store = readStore();
  const user = store.users[id] ?? null;

  if (!user) {
    return {
      user: null,
      freelancer: null,
      startup: null,
      opportunities: [],
      applications: [],
    };
  }

  if (user.role === "freelancer") {
    return {
      user,
      freelancer: store.freelancers[id] ?? null,
      startup: null,
      opportunities: [],
      applications: await localGetApplicationsForFreelancer(id),
    };
  }

  return {
    user,
    freelancer: null,
    startup: store.startups[id] ?? null,
    opportunities: await localGetStartupOpportunities(id),
    applications: await localGetApplicationsForStartup(id),
  };
}

export async function localUploadFile(params: {
  userId: string;
  kind: "resume" | "portfolio" | "logo";
  file: File;
  onProgress?: (progress: number) => void;
}): Promise<UploadedFileAsset> {
  const result = await new Promise<UploadedFileAsset>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadstart = () => params.onProgress?.(5);
    reader.onprogress = (event) => {
      if (!event.lengthComputable) return;
      params.onProgress?.(
        Math.max(5, Math.round((event.loaded / event.total) * 100))
      );
    };
    reader.onerror = () => reject(reader.error);
    reader.onload = () =>
      resolve({
        name: params.file.name,
        url: String(reader.result),
        path: `${params.kind}/${params.userId}/${params.file.name}`,
        size: params.file.size,
        type: params.file.type,
        uploadedAt: now(),
      });
    reader.readAsDataURL(params.file);
  });

  params.onProgress?.(100);
  return result;
}
