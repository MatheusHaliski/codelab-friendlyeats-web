import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getCredential() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountJson) {
    return cert(JSON.parse(serviceAccountJson));
  }

  return undefined;
}

export function getFirebaseAdminApp() {
  if (getApps().length) {
    return getApps()[0];
  }

  const credential = getCredential();

  if (credential) {
    return initializeApp({ credential });
  }

  return initializeApp();
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(getFirebaseAdminApp());
}
