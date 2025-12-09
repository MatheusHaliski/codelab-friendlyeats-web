"use server";

import fetch from "node-fetch";
import { fetchRestaurantImage } from "@/src/lib/google/customSearch";
import { updateDoc, doc } from "firebase/firestore";

// ==========================================
// CONSTANTES
// ==========================================
export const FALLBACK_IMAGE =
  "https://codelab-friendlyeats-web--funcionarioslistaapp2025.us-central1.hosted.app/fallbackfood.png";

// ==========================================
// HELPERS
// ==========================================
function coerce(str) {
  if (!str || typeof str !== "string") return null;
  const t = str.trim();
  return t.length ? t : null;
}

function isBlocked(url) {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.includes("captcha") ||
    u.includes("lookaside.fbsbx.com") ||
    u.includes("tripadvisor") ||
    u.includes("yelp") ||
    u.includes("facebook.com") ||
    u.includes("googleusercontent.com")
  );
}

async function isBad(url) {
  try {
    const res = await fetch(url, { method: "HEAD", timeout: 4000 });
    return res.status >= 400;
  } catch {
    return true;
  }
}

// ==========================================
// resolveRestaurantPhoto — versão server
// ==========================================
export async function resolveRestaurantPhoto(restaurant, fallback = FALLBACK_IMAGE) {
  if (!restaurant) return fallback;

  const candidates = [
    restaurant.photo,
    restaurant.photoUrl,
    restaurant.photoURL,
    restaurant.image,
    restaurant.imageUrl,
    restaurant.imageURL,
    restaurant.coverPhoto,
  ];

  for (const c of candidates) {
    const p = coerce(c);
    if (!p) continue;
    if (p === fallback) continue;
    if (isBlocked(p)) return fallback;
    if (await isBad(p)) continue;
    return p;
  }

  return fallback;
}

// ==========================================
// ensureRestaurantPhotos — em lote
// ==========================================
export async function ensureRestaurantPhotos(restaurants, firestore) {
  const updated = [];

  for (const restaurant of restaurants) {
    const existing = await resolveRestaurantPhoto(restaurant);

    if (existing) {
      updated.push({ ...restaurant, photo: existing });
      continue;
    }

    const imageUrl = await fetchRestaurantImage(restaurant.name);

    if (imageUrl) {
      try {
        await updateDoc(doc(firestore, "restaurants", restaurant.id), {
          photo: imageUrl,
        });
      } catch (err) {
        console.error("Firestore update failed:", err);
      }
      updated.push({ ...restaurant, photo: imageUrl });
    } else {
      updated.push(restaurant);
    }
  }

  return updated;
}

// ==========================================
// ensureRestaurantPhoto — versão singular
// ==========================================
export async function ensureRestaurantPhoto(restaurant, firestore) {
  const list = await ensureRestaurantPhotos([restaurant], firestore);
  return list[0];
}
