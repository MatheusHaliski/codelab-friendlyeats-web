import "server-only";
import { cookies } from "next/headers";
import { getAdminAuth, getFirebaseAdminApp } from "@/src/lib/firebase/adminApp";
import { getAdminFirestore } from "@/src/lib/firebase/adminApp";

export async function getAuthenticatedAppForUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const auth = getAdminAuth();
  const firestore = getAdminFirestore();
  let currentUser = null;

  if (token) {
    currentUser = await auth.verifyIdToken(token).catch(() => null);
  }

  return {
    app: getFirebaseAdminApp(),
    firebaseServerApp: getFirebaseAdminApp(),
    auth,
    firestore,
    currentUser,
  };
}
