"use client";

import { useState, useEffect } from "react";
import { getRestaurantSnapshotById } from "@/src/lib/firebase/firestore.js";
import { useUser } from "@/src/lib/getUser";
import RestaurantProfile from "@/src/components/RestaurantProfile.jsx";
import { updateRestaurantImage } from "@/src/lib/firebase/storage.js";

export default function Restaurant({
  id,
  initialRestaurant,
  initialUserId,
}) {
  const [restaurantDetails, setRestaurantDetails] = useState(initialRestaurant);
  const user = useUser();
  const userId = user?.uid || initialUserId;

  async function handleRestaurantImage(target) {
    const image = target.files?.[0];
    if (!image) return;

    const imageURL = await updateRestaurantImage(id, image);
    setRestaurantDetails({ ...restaurantDetails, photo: imageURL });
  }

  useEffect(() => {
    return getRestaurantSnapshotById(id, (data) => {
      setRestaurantDetails(data ?? null);
    });
  }, [id]);

  if (!restaurantDetails) {
    return <h1>Restaurant not found</h1>;
  }

  return (
    <RestaurantProfile
      restaurant={restaurantDetails}
      user={user ?? undefined}
      userId={userId}
      onPhotoUpdated={(photoUrl) =>
        setRestaurantDetails((prev) => ({ ...prev, photo: photoUrl }))
      }
    />
  );
}
