export type BackendMode = "firebase" | "local";

const BACKEND_KEY = "pluto_backend_mode";
const SESSION_KEY = "pluto_local_session";

export interface LocalSessionRecord {
  uid: string;
  role: "freelancer" | "startup";
  email: string;
  displayName: string;
}

export function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getBackendMode(): BackendMode {
  if (!canUseBrowserStorage()) return "firebase";
  return (window.localStorage.getItem(BACKEND_KEY) as BackendMode) ?? "firebase";
}

export function setBackendMode(mode: BackendMode) {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(BACKEND_KEY, mode);
}

export function clearBackendMode() {
  if (!canUseBrowserStorage()) return;
  window.localStorage.removeItem(BACKEND_KEY);
}

export function getLocalSession() {
  if (!canUseBrowserStorage()) return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as LocalSessionRecord;
  } catch {
    return null;
  }
}

export function setLocalSession(session: LocalSessionRecord) {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearLocalSession() {
  if (!canUseBrowserStorage()) return;
  window.localStorage.removeItem(SESSION_KEY);
}
