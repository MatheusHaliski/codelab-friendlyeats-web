import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccount() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    return null;
  }

  return JSON.parse(serviceAccountJson);
}

function getProjectId(serviceAccount) {
  return (
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    process.env.GCLOUD_PROJECT ??
    serviceAccount?.project_id
  );
}

export function getFirebaseAdminApp() {
  if (getApps().length) {
    return getApps()[0];
  }

  const serviceAccount = getServiceAccount();
  const credential = serviceAccount ? cert(serviceAccount) : undefined;
  const projectId = getProjectId(serviceAccount);

  if (credential || projectId) {
    return initializeApp({
      ...(credential ? { credential } : {}),
      ...(projectId ? { projectId } : {}),
    });
  }

  return initializeApp();
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(getFirebaseAdminApp());
}
