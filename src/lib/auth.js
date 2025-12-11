import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
  onIdTokenChanged as _onIdTokenChanged,
  signOut as _signOut,
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
  return signInWithPopup(auth, provider);
}

export async function signOut() {
  return _signOut(auth);
}
