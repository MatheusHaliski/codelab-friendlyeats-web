"use client";

// This components shows one individual restaurant
// It receives data from src/app/restaurant/[id]/page.jsx

import { React, useState, useEffect, Suspense } from "react";
import { React, useState, useEffect, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { getRestaurantSnapshotById } from "@/src/lib/firebase/firestore.js";
import { useUser } from "@/src/lib/getUser";
import RestaurantDetails from "@/src/components/RestaurantDetails.jsx";
import { updateRestaurantImage } from "@/src/lib/firebase/storage.js";
import {
  mergeRestaurantPhoto,
  resolveRestaurantPhoto,
} from "@/src/lib/restaurants/placeholders";

const ReviewDialog = dynamic(() => import("@/src/components/ReviewDialog.jsx"));

export default function Restaurant({
  id,
  initialRestaurant,
  initialUserId,
  children,
}) {
  const [restaurantDetails, setRestaurantDetails] = useState(initialRestaurant);
  const [restaurantDetails, setRestaurantDetails] = useState(() =>
    initialRestaurant
      ? mergeRestaurantPhoto(initialRestaurant)
      : initialRestaurant
  );
  const [isOpen, setIsOpen] = useState(false);

  // The only reason this component needs to know the user ID is to associate a review with the user, and to know whether to show the review dialog
  const userId = useUser()?.uid || initialUserId;
  const [review, setReview] = useState({
    rating: 0,
    text: "",
  });

  const onChange = (value, name) => {
    setReview({ ...review, [name]: value });
  };

  async function handleRestaurantImage(target) {
    const image = target.files ? target.files[0] : null;
    if (!image) {
      return;
    }

    const imageURL = await updateRestaurantImage(id, image);
    setRestaurantDetails({ ...restaurantDetails, photo: imageURL });
    setRestaurantDetails((current = {}) => ({
      ...current,
      photo: imageURL,
    }));
  }

  const handleClose = () => {
    setIsOpen(false);
    setReview({ rating: 0, text: "" });
  };

  useEffect(() => {
    setRestaurantDetails((previous = {}) =>
      initialRestaurant
        ? mergeRestaurantPhoto(initialRestaurant, previous.photo)
        : initialRestaurant
    );
  }, [initialRestaurant]);

  useEffect(() => {
    return getRestaurantSnapshotById(id, (data) => {
      setRestaurantDetails(data);
      if (!data) {
        setRestaurantDetails(undefined);
        return;
      }

      setRestaurantDetails((previous = {}) =>
        mergeRestaurantPhoto(data, previous.photo)
      );
    });
  }, [id]);

  const normalizedRestaurantDetails = useMemo(() => {
    const details = restaurantDetails ?? {};

    return {
      ...details,
      photo: resolveRestaurantPhoto(details),
    };
  }, [restaurantDetails]);

  return (
    <>
      <RestaurantDetails
        restaurant={restaurantDetails}
        restaurant={normalizedRestaurantDetails}
        userId={userId}
        handleRestaurantImage={handleRestaurantImage}
        setIsOpen={setIsOpen}
        isOpen={isOpen}
      >
        {children}
      </RestaurantDetails>
      {userId && (
        <Suspense fallback={<p>Loading...</p>}>
          <ReviewDialog
            isOpen={isOpen}
            handleClose={handleClose}
            review={review}
            onChange={onChange}
            userId={userId}
            id={id}
          />
        </Suspense>
      )}
    </>
  );
}
