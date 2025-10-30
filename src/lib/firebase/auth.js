import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
  onIdTokenChanged as _onIdTokenChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";

import { auth } from "@/src/lib/firebase/clientApp";

export function onAuthStateChanged(cb) {
  return _onAuthStateChanged(auth, cb);
}

export function onIdTokenChanged(cb) {
  return _onIdTokenChanged(auth, cb);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithPopup(auth, provider);
}

export async function signOut() {
  await firebaseSignOut(auth);
}
