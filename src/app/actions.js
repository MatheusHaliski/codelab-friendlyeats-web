

import { addReviewToRestaurant } from "@/src/lib/firebase/firestore.js";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
import { getFirestore } from "firebase/firestore";


export async function handleReviewFormSubmission(data) {
  const restaurantId = data.get("restaurantId");
  const userId = data.get("userId");
   const ratingValue = Number(data.get("rating"));
   const text = data.get("text")?.toString().trim() ?? "";
   if (
      !restaurantId ||
        !userId ||
        !text ||
        Number.isNaN(ratingValue) ||
        ratingValue <= 0
      ) {
        console.error("Invalid review submission", {
            restaurantId,
            userId,
            ratingValue,
            text,
          });
        return;
      }

      const { firebaseServerApp } = await getAuthenticatedAppForUser();
    const firestore = getFirestore(firebaseServerApp);

      await addReviewToRestaurant(firestore, restaurantId, {
          rating: ratingValue,
        text,
        userId,
      });
  }
