// src/lib/server/restaurantImages.js
import { fetchRestaurantImage } from "@/src/lib/google/customSearch";
import { resolveRestaurantPhoto } from "@/src/lib/restaurants/placeholder";
import { updateDoc, doc } from "firebase/firestore";

export async function ensureRestaurantPhotos(restaurants, firestore) {
  const updated = [];

  for (const restaurant of restaurants) {
  const existingPhoto = resolveRestaurantPhoto(restaurant, null);

    if (existingPhoto) {
      // Normalise the photo field so downstream consumers have a predictable key.
      updated.push({ ...restaurant, photo: existingPhoto });
      continue;
    }

    // Busca imagem via Google Custom Search
    const imageUrl = await fetchRestaurantImage(restaurant.name);

    if (imageUrl) {
      // Atualiza no Firestore (opcional)
      try {
        await updateDoc(doc(firestore, "restaurants", restaurant.id), {
          photo: imageUrl,
        });
      } catch (err) {
        console.error("⚠️ Firestore update failed:", err);
      }

      updated.push({ ...restaurant, photo: imageUrl });
    } else {
      updated.push(restaurant);
    }
  }

  return updated;
}
