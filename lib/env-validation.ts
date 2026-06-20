export type FirebaseEnvKey =
  | "NEXT_PUBLIC_FIREBASE_API_KEY"
  | "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
  | "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
  | "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
  | "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
  | "NEXT_PUBLIC_FIREBASE_APP_ID";

const firebaseEnvEntries = [
  ["NEXT_PUBLIC_FIREBASE_API_KEY", process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? ""],
  [
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  ],
  [
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  ],
  [
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  ],
  [
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  ],
  ["NEXT_PUBLIC_FIREBASE_APP_ID", process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? ""],
] as const satisfies ReadonlyArray<readonly [FirebaseEnvKey, string]>;

export function getMissingFirebaseEnv() {
  return firebaseEnvEntries
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

export function hasFirebaseEnv() {
  return firebaseEnvEntries.every(([, value]) => Boolean(value));
}

export function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };
}
