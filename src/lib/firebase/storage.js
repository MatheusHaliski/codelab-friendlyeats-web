import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

import { storage } from "@/src/lib/firebase/clientApp";

import { updateRestaurantImageReference } from "@/src/lib/firebase/firestore";

export async function updateRestaurantImage(restaurantId, image) {
  if (!restaurantId) {
    throw new Error("A restaurantId is required to update an image.");
  }

  if (!image) {
    throw new Error("An image file is required to update the restaurant photo.");
  }

  const downloadUrl = await uploadImage(restaurantId, image);

  await updateRestaurantImageReference(restaurantId, downloadUrl);

  return downloadUrl;
}

async function uploadImage(restaurantId, image) {
  const storageRef = ref(
    storage,
    `restaurants/${restaurantId}/${encodeURIComponent(image.name)}`
  );

  const uploadTask = uploadBytesResumable(storageRef, image);

  const snapshot = await new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      () => {},
      reject,
      () => resolve(uploadTask.snapshot)
    );
  });

  return getDownloadURL(snapshot.ref);
}
