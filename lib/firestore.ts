"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

import { getBackendMode } from "@/lib/backend-mode";
import { buildRecommendation } from "@/lib/ai-matching";
import { firebaseReady, getFirebaseServices } from "@/lib/firebase";
import {
  localApplyToOpportunity,
  localBootstrapUser,
  localCreateOpportunity,
  localDeleteOpportunity,
  localGetAllFreelancers,
  localGetAllStartupProfiles,
  localGetApplicationsForFreelancer,
  localGetApplicationsForStartup,
  localGetFreelancerProfile,
  localGetMessagesForApplication,
  localGetOpenOpportunities,
  localGetProfileBundle,
  localGetRecommendationsForStartup,
  localGetStartupOpportunities,
  localGetStartupProfile,
  localGetUserRecord,
  localSaveFreelancerProfile,
  localSaveRecommendationsForOpportunity,
  localSaveStartupProfile,
  localSendMessage,
  localUpdateApplicationStatus,
  localUpdateOpportunity,
  localUploadFile,
} from "@/lib/local-backend";
import type {
  AIRecommendation,
  ApplicationRecord,
  FreelancerProfile,
  MessageRecord,
  Opportunity,
  ProfileBundle,
  StartupProfile,
  UploadedFileAsset,
  UserRecord,
  UserRole,
} from "@/types";

function prefersLocalBackend() {
  return !firebaseReady() && getBackendMode() === "local";
}

function explainFirebaseError(error: unknown, action: string): never {
  throw new Error(getFirebaseErrorMessage(error, action));
}

function getFirebaseErrorMessage(error: unknown, action: string) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  const message = error instanceof Error ? error.message : "Unknown Firebase error";

  if (code === "permission-denied") {
    return `${action} failed because Firestore rules denied this request. Sign in with Firebase and deploy the current firestore.rules.`;
  }

  if (code === "failed-precondition") {
    return `${action} failed because Firestore needs an index or query precondition. Check the Firebase console error details.`;
  }

  return `${action} failed: ${message}`;
}

async function withBackend<T>(
  firebaseAction: () => Promise<T>,
  localAction: () => Promise<T>
) {
  if (prefersLocalBackend() || !firebaseReady()) {
    return localAction();
  }

  try {
    return await firebaseAction();
  } catch (error) {
    explainFirebaseError(error, "Firebase operation");
  }
}

function ensureFirebase() {
  if (!firebaseReady()) {
    throw new Error("Firebase is not configured. Add environment variables first.");
  }

  return getFirebaseServices();
}

function toDate(value: unknown) {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
}

function normalizeDoc<T extends { createdAt?: unknown; updatedAt?: unknown }>(
  id: string,
  data: T
): T & { id: string; createdAt: Date; updatedAt: Date } {
  return {
    ...data,
    id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function arrayOrEmpty<T>(value: T[] | unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeFreelancerProfile(
  id: string,
  data: FreelancerProfile
): FreelancerProfile {
  const normalized = normalizeDoc<FreelancerProfile>(id, data);
  const storedRate = Number(normalized.desiredMonthlyBudget) || 28;
  return {
    ...normalized,
    desiredMonthlyBudget:
      storedRate > 500 ? Math.round(storedRate / 160) : storedRate,
    skills: arrayOrEmpty<string>(normalized.skills),
    sectors: arrayOrEmpty<string>(normalized.sectors),
    portfolioFiles: arrayOrEmpty<UploadedFileAsset>(normalized.portfolioFiles),
  };
}

function normalizeOpportunity(id: string, data: Opportunity): Opportunity {
  const normalized = normalizeDoc<Opportunity>(id, data);
  return {
    ...normalized,
    requiredSkills: arrayOrEmpty<string>(normalized.requiredSkills),
  };
}

function normalizeRecommendation(
  id: string,
  data: AIRecommendation
): AIRecommendation {
  const normalized = normalizeDoc<AIRecommendation>(id, data);
  return {
    ...normalized,
    breakdown: normalized.breakdown ?? {
      skillsMatch: 0,
      experienceMatch: 0,
      budgetCompatibility: 0,
      industryRelevance: 0,
    },
    details: {
      matchedSkills: arrayOrEmpty<string>(normalized.details?.matchedSkills),
      budgetBand: normalized.details?.budgetBand ?? "poor",
      experienceSummary: normalized.details?.experienceSummary ?? "",
      categorySummary: normalized.details?.categorySummary ?? "",
    },
  };
}

function sortByCreatedAtDesc<T extends { createdAt?: Date }>(entries: T[]) {
  return [...entries].sort(
    (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
  );
}

export async function bootstrapUser(params: {
  uid: string;
  role: UserRole;
  displayName: string;
  email: string;
}) {
  return withBackend(
    async () => {
      const { db } = ensureFirebase();
      const userRef = doc(db, "users", params.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: params.uid,
          role: params.role,
          displayName: params.displayName,
          email: params.email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(userRef, {
          role: params.role,
          displayName: params.displayName,
          email: params.email,
          updatedAt: serverTimestamp(),
        });
      }

      if (params.role === "freelancer") {
        const freelancerRef = doc(db, "freelancers", params.uid);
        const freelancerSnap = await getDoc(freelancerRef);
        if (!freelancerSnap.exists()) {
          await setDoc(freelancerRef, {
            id: params.uid,
            fullName: params.displayName,
            headline: "Revenue-minded GTM operator",
            focusRole: "GTM",
            skills: ["Demand generation", "CRM", "Pipeline building"],
            yearsExperience: 3,
            sectors: ["SaaS"],
            github: "",
            linkedin: "",
            portfolio: "",
            bio: "GTM specialist focused on fast learning loops and measurable growth.",
            desiredMonthlyBudget: 28,
            resume: null,
            portfolioFiles: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        const startupRef = doc(db, "startups", params.uid);
        const startupSnap = await getDoc(startupRef);
        if (!startupSnap.exists()) {
          await setDoc(startupRef, {
            id: params.uid,
            companyName: params.displayName,
            industry: "SaaS",
            website: "",
            teamSize: "1-10",
            about: "Early-stage startup hiring a GTM partner who can drive execution.",
            logo: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
    },
    () => localBootstrapUser(params)
  );
}

export async function getUserRecord(uid: string) {
  return withBackend(
    async () => {
      const { db } = ensureFirebase();
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) return null;
      return normalizeDoc<UserRecord>(snap.id, snap.data() as UserRecord);
    },
    () => localGetUserRecord(uid)
  );
}

export async function getFreelancerProfile(uid: string) {
  return withBackend(
    async () => {
      const { db } = ensureFirebase();
      const snap = await getDoc(doc(db, "freelancers", uid));
      if (!snap.exists()) return null;
      return normalizeFreelancerProfile(snap.id, snap.data() as FreelancerProfile);
    },
    () => localGetFreelancerProfile(uid)
  );
}

export async function getStartupProfile(uid: string) {
  return withBackend(
    async () => {
      const { db } = ensureFirebase();
      const snap = await getDoc(doc(db, "startups", uid));
      if (!snap.exists()) return null;
      return normalizeDoc<StartupProfile>(snap.id, snap.data() as StartupProfile);
    },
    () => localGetStartupProfile(uid)
  );
}

export async function saveFreelancerProfile(
  uid: string,
  profile: Partial<FreelancerProfile>
) {
  return withBackend(
    async () => {
      const { db } = ensureFirebase();
      await setDoc(
        doc(db, "freelancers", uid),
        { ...profile, updatedAt: serverTimestamp() },
        { merge: true }
      );
    },
    () => localSaveFreelancerProfile(uid, profile)
  );
}

export async function saveStartupProfile(
  uid: string,
  profile: Partial<StartupProfile>
) {
  return withBackend(
    async () => {
      const { db } = ensureFirebase();
      await setDoc(
        doc(db, "startups", uid),
        { ...profile, updatedAt: serverTimestamp() },
        { merge: true }
      );
    },
    () => localSaveStartupProfile(uid, profile)
  );
}

export async function createOpportunity(
  startupId: string,
  payload: Omit<Opportunity, "id" | "startupId" | "createdAt" | "updatedAt">
) {
  if (prefersLocalBackend() || !firebaseReady()) {
    return localCreateOpportunity(startupId, payload);
  }

  try {
    const { db } = ensureFirebase();
    const opportunityRef = await addDoc(collection(db, "opportunities"), {
      ...payload,
      startupId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return opportunityRef.id;
  } catch (error) {
    explainFirebaseError(error, "Publishing opportunity");
  }
}

export async function updateOpportunity(
  opportunityId: string,
  changes: Partial<Omit<Opportunity, "id" | "startupId" | "createdAt" | "updatedAt">>
) {
  if (prefersLocalBackend() || !firebaseReady()) {
    return localUpdateOpportunity(opportunityId, changes);
  }

  try {
    const { db } = ensureFirebase();
    await updateDoc(doc(db, "opportunities", opportunityId), {
      ...changes,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    explainFirebaseError(error, "Updating opportunity");
  }
}

export async function deleteOpportunity(opportunityId: string) {
  if (prefersLocalBackend() || !firebaseReady()) {
    return localDeleteOpportunity(opportunityId);
  }

  try {
    const { db } = ensureFirebase();
    await deleteDoc(doc(db, "opportunities", opportunityId));
  } catch (error) {
    explainFirebaseError(error, "Deleting opportunity");
  }
}

export async function getStartupOpportunities(startupId: string) {
  if (prefersLocalBackend() || !firebaseReady()) {
    return localGetStartupOpportunities(startupId);
  }

  try {
    const { db } = ensureFirebase();
    const snapshot = await getDocs(
      query(
        collection(db, "opportunities"),
        where("startupId", "==", startupId)
      )
    );

    const firebaseOpportunities = sortByCreatedAtDesc(
      snapshot.docs.map((entry) =>
        normalizeOpportunity(entry.id, entry.data() as Opportunity)
      )
    );

    return firebaseOpportunities;
  } catch (error) {
    explainFirebaseError(error, "Loading startup opportunities");
  }
}

export async function getOpenOpportunities() {
  if (prefersLocalBackend() || !firebaseReady()) {
    return localGetOpenOpportunities();
  }

  try {
    const { db } = ensureFirebase();
    const snapshot = await getDocs(
      query(collection(db, "opportunities"), where("status", "==", "open"))
    );

    const firebaseOpportunities = sortByCreatedAtDesc(
      snapshot.docs.map((entry) =>
        normalizeOpportunity(entry.id, entry.data() as Opportunity)
      )
    );

    return firebaseOpportunities
      .filter((entry) => entry.status === "open")
      .slice(0, 12);
  } catch (error) {
    explainFirebaseError(error, "Loading open opportunities");
  }
}

export function subscribeToOpenOpportunities(
  onNext: (opportunities: Opportunity[]) => void,
  onError: (error: Error) => void
) {
  if (prefersLocalBackend() || !firebaseReady()) {
    return () => {};
  }

  const { db } = ensureFirebase();
  return onSnapshot(
    query(collection(db, "opportunities"), where("status", "==", "open")),
    (snapshot) => {
      onNext(
        sortByCreatedAtDesc(
          snapshot.docs.map((entry) =>
            normalizeOpportunity(entry.id, entry.data() as Opportunity)
          )
        ).slice(0, 12)
      );
    },
    (error) => onError(new Error(getFirebaseErrorMessage(error, "Watching open opportunities")))
  );
}

export function subscribeToStartupOpportunities(
  startupId: string,
  onNext: (opportunities: Opportunity[]) => void,
  onError: (error: Error) => void
) {
  if (prefersLocalBackend() || !firebaseReady()) {
    return () => {};
  }

  const { db } = ensureFirebase();
  return onSnapshot(
    query(collection(db, "opportunities"), where("startupId", "==", startupId)),
    (snapshot) => {
      onNext(
        sortByCreatedAtDesc(
          snapshot.docs.map((entry) =>
            normalizeOpportunity(entry.id, entry.data() as Opportunity)
          )
        )
      );
    },
    (error) => onError(new Error(getFirebaseErrorMessage(error, "Watching startup opportunities")))
  );
}

export async function applyToOpportunity(params: {
  opportunity: Opportunity;
  freelancerId: string;
  startupName: string;
}) {
  return withBackend(
    async () => {
      const { db } = ensureFirebase();
      const existing = await getDocs(
        query(
          collection(db, "applications"),
          where("opportunityId", "==", params.opportunity.id),
          where("freelancerId", "==", params.freelancerId),
          limit(1)
        )
      );

      if (!existing.empty) {
        return existing.docs[0].id;
      }

      const record = await addDoc(collection(db, "applications"), {
        startupId: params.opportunity.startupId,
        freelancerId: params.freelancerId,
        opportunityId: params.opportunity.id,
        opportunityTitle: params.opportunity.title,
        startupName: params.startupName,
        status: "applied",
        lastActionAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return record.id;
    },
    () => localApplyToOpportunity(params)
  );
}

export async function getApplicationsForFreelancer(freelancerId: string) {
  return withBackend(
    async () => {
      const { db } = ensureFirebase();
      const snapshot = await getDocs(
        query(
          collection(db, "applications"),
          where("freelancerId", "==", freelancerId)
        )
      );

      return sortByCreatedAtDesc(
        snapshot.docs.map((entry) => {
          const data = entry.data() as ApplicationRecord;
          return {
            ...normalizeDoc<ApplicationRecord>(entry.id, data),
            lastActionAt: toDate(data.lastActionAt),
          };
        })
      );
    },
    () => localGetApplicationsForFreelancer(freelancerId)
  );
}

function normalizeApplication(id: string, data: ApplicationRecord) {
  return {
    ...normalizeDoc<ApplicationRecord>(id, data),
    lastActionAt: toDate(data.lastActionAt),
  };
}

export function subscribeToApplicationsForFreelancer(
  freelancerId: string,
  onNext: (applications: ApplicationRecord[]) => void,
  onError: (error: Error) => void
) {
  if (prefersLocalBackend() || !firebaseReady()) {
    return () => {};
  }

  const { db } = ensureFirebase();
  return onSnapshot(
    query(collection(db, "applications"), where("freelancerId", "==", freelancerId)),
    (snapshot) => {
      onNext(
        sortByCreatedAtDesc(
          snapshot.docs.map((entry) =>
            normalizeApplication(entry.id, entry.data() as ApplicationRecord)
          )
        )
      );
    },
    (error) =>
      onError(
        new Error(getFirebaseErrorMessage(error, "Watching freelancer applications"))
      )
  );
}

export async function getApplicationsForStartup(startupId: string) {
  return withBackend(
    async () => {
      const { db } = ensureFirebase();
      const snapshot = await getDocs(
        query(
          collection(db, "applications"),
          where("startupId", "==", startupId)
        )
      );

      return sortByCreatedAtDesc(
        snapshot.docs.map((entry) => {
          const data = entry.data() as ApplicationRecord;
          return {
            ...normalizeDoc<ApplicationRecord>(entry.id, data),
            lastActionAt: toDate(data.lastActionAt),
          };
        })
      );
    },
    () => localGetApplicationsForStartup(startupId)
  );
}

export function subscribeToApplicationsForStartup(
  startupId: string,
  onNext: (applications: ApplicationRecord[]) => void,
  onError: (error: Error) => void
) {
  if (prefersLocalBackend() || !firebaseReady()) {
    return () => {};
  }

  const { db } = ensureFirebase();
  return onSnapshot(
    query(collection(db, "applications"), where("startupId", "==", startupId)),
    (snapshot) => {
      onNext(
        sortByCreatedAtDesc(
          snapshot.docs.map((entry) =>
            normalizeApplication(entry.id, entry.data() as ApplicationRecord)
          )
        )
      );
    },
    (error) =>
      onError(
        new Error(getFirebaseErrorMessage(error, "Watching startup applications"))
      )
  );
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationRecord["status"]
) {
  return withBackend(
    async () => {
      const { db } = ensureFirebase();
      await updateDoc(doc(db, "applications", applicationId), {
        status,
        lastActionAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
    () => localUpdateApplicationStatus(applicationId, status)
  );
}

function getParticipantMessageField(application: ApplicationRecord, viewerId: string) {
  if (viewerId === application.startupId) return "startupId";
  if (viewerId === application.freelancerId) return "freelancerId";
  return null;
}

export async function getMessagesForApplication(
  application: ApplicationRecord,
  viewerId: string
) {
  return withBackend(
    async () => {
      const participantField = getParticipantMessageField(application, viewerId);
      if (!participantField) return [];

      const { db } = ensureFirebase();
      const snapshot = await getDocs(
        query(
          collection(db, "messages"),
          where("applicationId", "==", application.id),
          where(participantField, "==", viewerId)
        )
      );

      return snapshot.docs
        .map((entry) =>
          normalizeDoc<MessageRecord>(entry.id, entry.data() as MessageRecord)
        )
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    },
    () => localGetMessagesForApplication(application.id)
  );
}

export function subscribeToMessagesForApplication(
  application: ApplicationRecord,
  viewerId: string,
  onNext: (messages: MessageRecord[]) => void,
  onError: (error: Error) => void
) {
  if (prefersLocalBackend() || !firebaseReady()) {
    return () => {};
  }

  const participantField = getParticipantMessageField(application, viewerId);
  if (!participantField) {
    onNext([]);
    return () => {};
  }

  const { db } = ensureFirebase();
  return onSnapshot(
    query(
      collection(db, "messages"),
      where("applicationId", "==", application.id),
      where(participantField, "==", viewerId)
    ),
    (snapshot) => {
      onNext(
        snapshot.docs
          .map((entry) =>
            normalizeDoc<MessageRecord>(entry.id, entry.data() as MessageRecord)
          )
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      );
    },
    (error) =>
      onError(new Error(getFirebaseErrorMessage(error, "Watching messages")))
  );
}

export async function sendMessage(params: {
  application: ApplicationRecord;
  senderId: string;
  senderName: string;
  body: string;
}) {
  return withBackend(
    async () => {
      const body = params.body.trim();
      const allowed =
        params.application.status === "chat_approved" ||
        params.application.status === "approved";
      const isParticipant =
        params.senderId === params.application.startupId ||
        params.senderId === params.application.freelancerId;

      if (!body || !allowed || !isParticipant) return null;

      const { db } = ensureFirebase();
      const messageRef = doc(collection(db, "messages"));

      await setDoc(messageRef, {
        applicationId: params.application.id,
        startupId: params.application.startupId,
        freelancerId: params.application.freelancerId,
        senderId: params.senderId,
        senderName: params.senderName,
        body,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return messageRef.id;
    },
    () =>
      localSendMessage({
        applicationId: params.application.id,
        senderId: params.senderId,
        senderName: params.senderName,
        body: params.body,
      })
  );
}

export async function getAllStartupProfiles() {
  return withBackend(
    async () => {
      const { db } = ensureFirebase();
      const snapshot = await getDocs(
        query(collection(db, "startups"), orderBy("createdAt", "desc"), limit(10))
      );

      return snapshot.docs.map((entry) =>
        normalizeDoc<StartupProfile>(entry.id, entry.data() as StartupProfile)
      );
    },
    () => localGetAllStartupProfiles()
  );
}

export async function getAllFreelancers() {
  return withBackend(
    async () => {
      const { db } = ensureFirebase();
      const [snapshot, freelancerUsers] = await Promise.all([
        getDocs(
          query(collection(db, "freelancers"), orderBy("createdAt", "desc"), limit(40))
        ),
        getDocs(query(collection(db, "users"), where("role", "==", "freelancer"))),
      ]);
      const freelancerIds = new Set(freelancerUsers.docs.map((entry) => entry.id));

      return snapshot.docs
        .filter((entry) => freelancerIds.has(entry.id))
        .map((entry) =>
          normalizeFreelancerProfile(entry.id, entry.data() as FreelancerProfile)
        );
    },
    () => localGetAllFreelancers()
  );
}

export async function saveRecommendationsForOpportunity(opportunity: Opportunity) {
  return withBackend(
    async () => {
      const { db } = ensureFirebase();
      const freelancers = await getAllFreelancers();
      const batch = writeBatch(db);

      freelancers.forEach((freelancer) => {
        const recommendation = buildRecommendation(
          opportunity.startupId,
          freelancer,
          opportunity
        );
        const recommendationRef = doc(
          db,
          "ai_recommendations",
          `${opportunity.id}_${freelancer.id}`
        );
        batch.set(recommendationRef, {
          ...recommendation,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
    },
    () => localSaveRecommendationsForOpportunity(opportunity)
  );
}

export async function getRecommendationsForStartup(startupId: string) {
  return withBackend(
    async () => {
      const { db } = ensureFirebase();
      const [snapshot, freelancerUsers] = await Promise.all([
        getDocs(
          query(
            collection(db, "ai_recommendations"),
            where("startupId", "==", startupId)
          )
        ),
        getDocs(query(collection(db, "users"), where("role", "==", "freelancer"))),
      ]);
      const freelancerIds = new Set(freelancerUsers.docs.map((entry) => entry.id));

      return snapshot.docs
        .map((entry) =>
          normalizeRecommendation(entry.id, entry.data() as AIRecommendation)
        )
        .filter((entry) => freelancerIds.has(entry.freelancerId))
        .sort((a, b) => b.score - a.score)
        .slice(0, 30);
    },
    () => localGetRecommendationsForStartup(startupId)
  );
}

export async function getProfileBundle(id: string): Promise<ProfileBundle> {
  return withBackend(
    async () => {
      const user = await getUserRecord(id);

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
        const [freelancer, applications] = await Promise.all([
          getFreelancerProfile(id),
          getApplicationsForFreelancer(id),
        ]);

        return {
          user,
          freelancer,
          startup: null,
          opportunities: [],
          applications,
        };
      }

      const [startup, opportunities, applications] = await Promise.all([
        getStartupProfile(id),
        getStartupOpportunities(id),
        getApplicationsForStartup(id),
      ]);

      return {
        user,
        freelancer: null,
        startup,
        opportunities,
        applications,
      };
    },
    () => localGetProfileBundle(id)
  );
}

export async function uploadFile(params: {
  userId: string;
  kind: "resume" | "portfolio" | "logo";
  file: File;
  onProgress?: (progress: number) => void;
}): Promise<UploadedFileAsset> {
  return withBackend(
    async () => {
      const { storage } = ensureFirebase();
      const storagePath = `${params.kind}/${params.userId}/${Date.now()}-${params.file.name}`;
      const fileRef = ref(storage, storagePath);
      const task = uploadBytesResumable(fileRef, params.file);

      await new Promise<void>((resolve, reject) => {
        const timeout =
          params.kind === "logo"
            ? window.setTimeout(() => {
                reject(
                  new Error(
                    "Logo upload timed out. Confirm Firebase Storage is enabled and the configured storage bucket is correct."
                  )
                );
                task.cancel();
              }, 30_000)
            : null;
        const clearUploadTimeout = () => {
          if (timeout !== null) window.clearTimeout(timeout);
        };

        task.on(
          "state_changed",
          (snapshot) => {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            params.onProgress?.(progress);
          },
          (error) => {
            clearUploadTimeout();
            reject(error);
          },
          () => {
            clearUploadTimeout();
            resolve();
          }
        );
      });

      const url = await getDownloadURL(fileRef);

      return {
        name: params.file.name,
        url,
        path: storagePath,
        size: params.file.size,
        type: params.file.type,
        uploadedAt: new Date(),
      };
    },
    () => localUploadFile(params)
  );
}
