import "server-only";
import { cookies } from "next/headers";
import { getAdminAuth, getFirebaseAdminApp } from "@/src/lib/firebase/adminApp";
import { getAdminFirestore } from "@/src/lib/firebase/adminApp";

export async function getAuthenticatedAppForUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let app = null;
  let auth = null;
  let firestore = null;
  let currentUser = null;

  try {
    app = getFirebaseAdminApp();
    auth = getAdminAuth();
    firestore = getAdminFirestore();

    if (token) {
      currentUser = await auth.verifyIdToken(token).catch(() => null);
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK.", error);
  }

  return {
    app,
    firebaseServerApp: app,
    auth,
    firestore,
    currentUser,
  };
}
