import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

import { getFirebaseConfig, hasFirebaseEnv } from "@/lib/env-validation";

let appInitialized = false;

function getFirebaseApp() {
  if (!hasFirebaseEnv()) {
    throw new Error("Firebase environment variables are missing.");
  }

  if (!getApps().length) {
    initializeApp(getFirebaseConfig());
    appInitialized = true;
  }

  return getApps()[0];
}

export function firebaseReady() {
  return hasFirebaseEnv();
}

export function getFirebaseServices() {
  const app = getFirebaseApp();

  return {
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };
}

export function wasFirebaseInitialized() {
  return appInitialized;
}
