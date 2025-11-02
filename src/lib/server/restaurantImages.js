// src/lib/server/restaurantImages.js
import { fetchRestaurantImage } from "@/src/lib/google/customSearch";
import { updateDoc, doc } from "firebase/firestore";

export async function ensureRestaurantPhotos(restaurants, firestore) {
  const updated = [];

  for (const restaurant of restaurants) {
    // Se já tem imagem, ignora
    if (restaurant.photo || restaurant.image) {
      updated.push(restaurant);
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
