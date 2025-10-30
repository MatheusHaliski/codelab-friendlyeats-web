import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { cookies } from "next/headers";
import { initializeServerApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyA_pHu5ASG9PAhmcEwxcckXGovRWYW0Mic",
  authDomain: "funcionarioslistaapp2025.firebaseapp.com",
  projectId: "funcionarioslistaapp2025",
  storageBucket: "funcionarioslistaapp2025.firebasestorage.app",
  messagingSenderId: "457209482063",
  appId: "1:457209482063:web:a6c1bf1224842970be133a",
  measurementId: "G-HF0RYXCWZN",
};
let cachedServerApp;

function getOrInitializeDefaultApp() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

function ensureServerApp(options) {
  if (options) {
    return initializeServerApp(firebaseConfig, options);
  }
  if (!cachedServerApp) {
    cachedServerApp = getOrInitializeDefaultApp();
  }
  return cachedServerApp;
}

export async function getAuthenticatedAppForUser() {
  const authCookie = cookies().get("firebaseAuthToken");
  const options = authCookie?.value
    ? { authIdToken: authCookie.value }
    : undefined;

  const firebaseServerApp = ensureServerApp(options);
  const auth = getAuth(firebaseServerApp);

  if (typeof auth.authStateReady === "function") {
    await auth.authStateReady();
  }

  return {
    firebaseServerApp,
    currentUser: auth.currentUser ?? null,
  };
}

export function getServerFirestore() {
  const app = ensureServerApp();
  return getFirestore(app);
}
