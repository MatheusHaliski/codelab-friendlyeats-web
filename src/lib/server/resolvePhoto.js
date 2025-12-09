"use server";

import fetch from "node-fetch";

const FALLBACK_IMAGE =
  "https://codelab-friendlyeats-web--funcionarioslistaapp2025.us-central1.hosted.app/fallbackfood.png";

function coerce(str) {
  if (!str || typeof str !== "string") return null;
  const t = str.trim();
  return t.length ? t : null;
}

function blocked(url) {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.includes("captcha") ||
    u.includes("lookaside.fbsbx.com") ||
    u.includes("tripadvisor") ||
    u.includes("yelp")
  );
}

async function isBad(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.status >= 400;
  } catch {
    return true;
  }
}

export async function resolveRestaurantPhotoServer(restaurant) {
  if (!restaurant) return FALLBACK_IMAGE;

  const candidates = [
    restaurant.photo,
    restaurant.photoUrl,
    restaurant.photoURL,
    restaurant.image,
    restaurant.imageUrl,
    restaurant.imageURL,
  ];

  for (const c of candidates) {
    const p = coerce(c);
    if (!p) continue;
    if (blocked(p)) continue;
    if (await isBad(p)) continue;
    return p;
  }

  return FALLBACK_IMAGE;
}
