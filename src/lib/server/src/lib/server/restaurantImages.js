import "server-only";

import {
  searchImageForRestaurant,
  isCustomSearchConfigured,
} from "@/src/lib/google/customSearch";
import { updateRestaurantImageReference } from "@/src/lib/firebase/firestore";

function buildSearchQuery(restaurant) {
  const location = [restaurant.city, restaurant.country]
    .filter(Boolean)
    .join(" ");

  const category = restaurant.category ?? restaurant.categories?.[0] ?? "";

  return [restaurant.name, category, location, "restaurant"]
    .filter(Boolean)
    .join(" ");
}

async function tryUpdateRestaurantPhoto(restaurant, firestoreInstance) {
  const query = buildSearchQuery(restaurant);
  const imageUrl = await searchImageForRestaurant(query);

  if (!imageUrl) {
    return restaurant;
  }

  try {
    await updateRestaurantImageReference(
      restaurant.id,
      imageUrl,
      firestoreInstance
    );
  } catch (error) {
    console.error("Failed to persist restaurant image", {
      restaurantId: restaurant.id,
      error,
    });
    return restaurant;
  }

  return { ...restaurant, photo: imageUrl };
}

export async function ensureRestaurantPhoto(restaurant, firestoreInstance) {
  if (!restaurant || restaurant.photo || !isCustomSearchConfigured()) {
    return restaurant;
  }

  return tryUpdateRestaurantPhoto(restaurant, firestoreInstance);
}

export async function ensureRestaurantPhotos(restaurants, firestoreInstance) {
  if (!Array.isArray(restaurants) || restaurants.length === 0) {
    return restaurants;
  }

  if (!isCustomSearchConfigured()) {
    return restaurants;
  }

  const updatedRestaurants = [];

  for (const restaurant of restaurants) {
    if (!restaurant?.photo) {
      updatedRestaurants.push(
        await tryUpdateRestaurantPhoto(restaurant, firestoreInstance)
      );
    } else {
      updatedRestaurants.push(restaurant);
    }
  }

  return updatedRestaurants;
}
