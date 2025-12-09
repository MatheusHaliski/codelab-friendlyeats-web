// ✅ clientApp.js — versão corrigida
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA_pHu5ASG9PAhmcEwxcckXGovRWYW0Mic",
  authDomain: "funcionarioslistaapp2025.firebaseapp.com",
  projectId: "funcionarioslistaapp2025",
  storageBucket: "funcionarioslistaapp2025.firebasestorage.app",
  messagingSenderId: "457209482063",
  appId: "1:457209482063:web:a6c1bf1224842970be133a",
  measurementId: "G-HF0RYXCWZN"
};

// 🔹 Garante que só inicializa 1 vez
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const firebaseApp = app;
export const auth = getAuth(app);
export const db = getFirestore(app);
