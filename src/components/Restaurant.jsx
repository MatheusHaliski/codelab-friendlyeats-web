"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";

import { getRestaurantSnapshotById } from "@/src/lib/firebase/firestore.js";
import { useUser } from "@/src/lib/getUser";
import RestaurantDetails from "@/src/components/RestaurantDetails.jsx";
import { updateRestaurantImage } from "@/src/lib/firebase/storage.js";

// 🚨 Agora importamos APENAS funções client-safe
import { mergeRestaurantPhoto } from "@/src/lib/server/resolvePhoto";
import { resolveRestaurantPhoto } from "@/src/lib/server/resolvePhoto";

const ReviewDialog = dynamic(() => import("@/src/components/ReviewDialog.jsx"));

export default function Restaurant({
  id,
  initialRestaurant,
  initialUserId,
  children,
}) {
  // 🔹 Estado principal do restaurante
  const [restaurantDetails, setRestaurantDetails] = useState(() =>
    initialRestaurant
      ? { ...initialRestaurant, photo: initialRestaurant.photo ?? null }
      : null
  );

  const [isOpen, setIsOpen] = useState(false);

  // 🔹 Identifica usuário (para habilitar reviews)
  const userId = useUser()?.uid || initialUserId;

  // 🔹 Para o formulário de reviews
  const [review, setReview] = useState({ rating: 0, text: "" });

  const onChange = (value, name) => {
    setReview({ ...review, [name]: value });
  };

  // ---------------------------------------------------------
  // 📸 UPLOAD DE FOTO DO RESTAURANTE
  // ---------------------------------------------------------
  async function handleRestaurantImage(target) {
    const image = target.files?.[0];
    if (!image) return;

    const imageURL = await updateRestaurantImage(id, image);

    setRestaurantDetails((current = {}) => ({
      ...current,
      photo: imageURL,
    }));
  }

  // ---------------------------------------------------------
  // 🔄 MERGE AUTOMÁTICO DA FOTO INICIAL
  // ---------------------------------------------------------
  useEffect(() => {
    setRestaurantDetails((previous = {}) =>
      initialRestaurant
        ? { ...initialRestaurant, photo: previous.photo ?? initialRestaurant.photo }
        : previous
    );
  }, [initialRestaurant]);

  // ---------------------------------------------------------
  // 🔥 SNAPSHOT TEMPO REAL DO RESTAURANTE
  // ---------------------------------------------------------
  useEffect(() => {
    if (!id) return;

    return getRestaurantSnapshotById(id, async (data) => {
      if (!data) {
        setRestaurantDetails(null);
        return;
      }

      setRestaurantDetails((previous = {}) => ({
        ...previous,
        ...data,
        // preserva foto existente se snapshot não tiver foto
        photo: data.photo ?? previous.photo ?? null,
      }));
    });
  }, [id]);

  // ---------------------------------------------------------
  // 🧠 NORMALIZAÇÃO FINAL (resolve fallback da foto)
  // ---------------------------------------------------------
  const normalizedRestaurantDetails = useMemo(() => {
    const details = restaurantDetails ?? {};

    return {
      ...details,
      // resolve fallback mas NÃO aciona node-fetch no client
      photo: details.photo,
    };
  }, [restaurantDetails]);

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  return (
    <>
      <RestaurantDetails
        restaurant={normalizedRestaurantDetails}
        userId={userId}
        handleRestaurantImage={handleRestaurantImage}
        setIsOpen={setIsOpen}
        isOpen={isOpen}
      >
        {children}
      </RestaurantDetails>

      {userId && (
        <Suspense fallback={<p>Loading review dialog...</p>}>
          <ReviewDialog
            isOpen={isOpen}
            handleClose={() => {
              setIsOpen(false);
              setReview({ rating: 0, text: "" });
            }}
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
