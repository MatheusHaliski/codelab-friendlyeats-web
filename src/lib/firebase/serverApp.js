import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";


import { cookies } from "next/headers";
import { initializeServerApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyA_pHu5ASG9PAhmcEwxcckXGovRWYW0Mic",
  authDomain: "funcionarioslistaapp2025.firebaseapp.com",
  projectId: "funcionarioslistaapp2025",
  storageBucket: "funcionarioslistaapp2025.firebasestorage.app",
  messagingSenderId: "457209482063",
  appId: "1:457209482063:web:a6c1bf1224842970be133a",
  measurementId: "G-HF0RYXCWZN"
};


let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export async function getAuthenticatedAppForUser() {

  const authCookie = cookies().get("firebaseAuthToken");
  const options = authCookie?.value
    ? { authIdToken: authCookie.value }
    : undefined;

  const firebaseServerApp = initializeServerApp(undefined, options);
  const auth = getAuth(firebaseServerApp);
  await auth.authStateReady();

  return {
    firebaseServerApp,
    currentUser: auth.currentUser,
  };

  // autenticação básica (pode ajustar conforme necessidade)
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  return { app, auth, firestore };

}

