import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { storage } from "@/src/lib/firebase/clientApp";

import { updateRestaurantImageReference } from "@/src/lib/firebase/firestore";

export async function updateRestaurantImage(restaurantId, image) {
  if (!restaurantId || !image) {
    throw new Error("A restaurantId and image file are required");
  }

  const publicImageUrl = await uploadImage(restaurantId, image);
  await updateRestaurantImageReference(restaurantId, publicImageUrl);
  return publicImageUrl;
}

async function uploadImage(restaurantId, image) {
  const imageRef = ref(
    storage,
    `restaurants/${restaurantId}/${Date.now()}-${image.name}`
  );

  await uploadBytes(imageRef, image);

  return getDownloadURL(imageRef);
}
