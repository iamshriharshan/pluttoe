"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

import {
  clearBackendMode,
  clearLocalSession,
  getBackendMode,
  getLocalSession,
  setBackendMode,
  setLocalSession,
} from "@/lib/backend-mode";
import { bootstrapUser, getUserRecord } from "@/lib/firestore";
import { firebaseReady, getFirebaseServices } from "@/lib/firebase";
import type { SessionUser, UserRecord, UserRole } from "@/types";

interface SignInParams {
  role: UserRole;
  displayName: string;
  email: string;
  password?: string;
  mode: "signin" | "signup";
  method: "email" | "google";
}

interface SignInResult {
  message: string | null;
  profile: UserRecord | null;
}

function makeLocalUid(params: Pick<SignInParams, "role" | "email">) {
  const normalizedEmail = params.email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `local_${params.role}_${normalizedEmail || "user"}`;
}

async function startLocalSession(
  params: SignInParams,
  setAuthUser: (value: SessionUser | null) => void,
  setProfile: (value: UserRecord | null) => void,
  setBackend: (value: "firebase" | "local") => void
): Promise<UserRecord | null> {
  const uid = makeLocalUid(params);
  setBackendMode("local");
  setLocalSession({
    uid,
    role: params.role,
    email: params.email,
    displayName: params.displayName,
  });
  await bootstrapUser({
    uid,
    role: params.role,
    displayName: params.displayName,
    email: params.email,
  });
  const nextProfile = await getUserRecord(uid);
  setAuthUser({ uid, backend: "local" });
  setProfile(nextProfile);
  setBackend("local");
  syncCookies(uid, nextProfile?.role);
  return nextProfile;
}

interface AuthContextValue {
  authUser: SessionUser | null;
  profile: UserRecord | null;
  loading: boolean;
  backend: "firebase" | "local";
  signInWithRole: (params: SignInParams) => Promise<SignInResult>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function syncCookies(uid?: string, role?: UserRole) {
  if (typeof document === "undefined") return;

  const attrs = "path=/; SameSite=Lax";
  if (!uid || !role) {
    document.cookie = `pluto_session=; Max-Age=0; ${attrs}`;
    document.cookie = `pluto_role=; Max-Age=0; ${attrs}`;
    return;
  }

  document.cookie = `pluto_session=${uid}; Max-Age=604800; ${attrs}`;
  document.cookie = `pluto_role=${role}; Max-Age=604800; ${attrs}`;
}

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
}

async function loadLocalSessionState(
  setAuthUser: (value: SessionUser | null) => void,
  setProfile: (value: UserRecord | null) => void,
  setLoading: (value: boolean) => void
) {
  const session = getLocalSession();
  if (!session) {
    setLoading(false);
    return;
  }

  let profile = await getUserRecord(session.uid);
  if (!profile) {
    await bootstrapUser(session);
    profile = await getUserRecord(session.uid);
  }

  setAuthUser({ uid: session.uid, backend: "local" });
  setProfile(profile);
  syncCookies(session.uid, profile?.role ?? session.role);
  setLoading(false);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<UserRecord | null>(null);
  const [backend, setBackend] = useState<"firebase" | "local">(
    firebaseReady() ? "firebase" : getBackendMode() === "local" ? "local" : "firebase"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseReady()) {
      void loadLocalSessionState(setAuthUser, setProfile, setLoading);
      const timer = window.setTimeout(() => setBackend("local"), 0);
      return () => window.clearTimeout(timer);
    }

    clearBackendMode();
    clearLocalSession();
    const { auth } = getFirebaseServices();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthUser(null);
        setProfile(null);
        syncCookies();
        setLoading(false);
        return;
      }

      setBackend("firebase");
      setBackendMode("firebase");
      let nextProfile = await getUserRecord(user.uid);

      if (!nextProfile) {
        const fallbackRole =
          readCookie("pluto_role") === "startup" ? "startup" : "freelancer";
        const displayName =
          user.displayName ??
          (fallbackRole === "startup" ? "Pluttoe Startup" : "Pluttoe Freelancer");
        const email = user.email ?? "local@pluto.dev";
        await bootstrapUser({
          uid: user.uid,
          role: fallbackRole,
          displayName,
          email,
        });
        nextProfile = await getUserRecord(user.uid);
        setAuthUser({ uid: user.uid, backend: "firebase" });
        setProfile(nextProfile);
        setBackend("firebase");
        syncCookies(user.uid, nextProfile?.role ?? fallbackRole);
        setLoading(false);
        return;
      }

      setAuthUser({ uid: user.uid, backend: "firebase" });
      setProfile(nextProfile);
      syncCookies(user.uid, nextProfile?.role);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authUser,
      profile,
      loading,
      backend,
      async signInWithRole(params) {
        if (firebaseReady()) {
          try {
            if (params.mode === "signup") {
              document.cookie = `pluto_role=${params.role}; Max-Age=600; path=/; SameSite=Lax`;
            }

            const { auth } = getFirebaseServices();
            const result =
              params.method === "google"
                ? await signInWithPopup(auth, new GoogleAuthProvider())
                : params.mode === "signup"
                  ? await createUserWithEmailAndPassword(
                      auth,
                      params.email,
                      params.password ?? ""
                    )
                  : await signInWithEmailAndPassword(
                      auth,
                      params.email,
                      params.password ?? ""
                    );

            if (
              params.mode === "signup" &&
              params.method === "email" &&
              params.displayName.trim()
            ) {
              await updateProfile(result.user, {
                displayName: params.displayName.trim(),
              });
            }

            setBackendMode("firebase");
            clearLocalSession();
            const existingProfile = await getUserRecord(result.user.uid);
            const displayName =
              result.user.displayName ||
              params.displayName ||
              (params.role === "startup" ? "Pluttoe Startup" : "Pluttoe Freelancer");
            const email = result.user.email || params.email;

            await bootstrapUser({
              uid: result.user.uid,
              role:
                params.mode === "signup"
                  ? params.role
                  : existingProfile?.role ?? params.role,
              displayName: existingProfile?.displayName ?? displayName,
              email: existingProfile?.email ?? email,
            });
            const nextProfile = await getUserRecord(result.user.uid);

            if (getBackendMode() === "local") {
              await signOut(auth);
              const localProfile = await startLocalSession(
                params,
                setAuthUser,
                setProfile,
                setBackend
              );
              return {
                message:
                  "Firebase data writes are restricted, so Pluttoe switched to local persisted mode.",
                profile: localProfile,
              };
            }

            setAuthUser({ uid: result.user.uid, backend: "firebase" });
            setProfile(nextProfile);
            setBackend("firebase");
            syncCookies(result.user.uid, nextProfile?.role ?? params.role);
            return { message: null, profile: nextProfile };
          } catch (error) {
            throw error;
          }
        }

        const localProfile = await startLocalSession(
          params,
          setAuthUser,
          setProfile,
          setBackend
        );
        return {
          message: "Firebase is unavailable, so Pluttoe is running in local persisted mode.",
          profile: localProfile,
        };
      },
      async signOutUser() {
        if (firebaseReady()) {
          const { auth } = getFirebaseServices();
          await signOut(auth);
        }
        clearLocalSession();
        clearBackendMode();
        setAuthUser(null);
        setProfile(null);
        setBackend(firebaseReady() ? "firebase" : "local");
        syncCookies();
      },
    }),
    [authUser, backend, loading, profile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
