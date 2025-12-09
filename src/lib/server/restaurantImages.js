"use server";

import { fetchRestaurantImage } from "@/src/lib/google/customSearch";
import { resolveRestaurantPhoto } from "@/src/lib/server/resolvePhoto";
import { updateDoc, doc } from "firebase/firestore";

export async function ensureRestaurantPhotos(restaurants, firestore) {
  const updated = [];

  for (const restaurant of restaurants) {
    const existing = await resolveRestaurantPhoto(restaurant, null);

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
