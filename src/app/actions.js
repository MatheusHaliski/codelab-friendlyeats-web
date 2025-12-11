

import { addReviewToRestaurant } from "@/src/lib/firebase/firestore.js";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
import { getFirestore } from "firebase/firestore";

export async function handleReviewFormSubmission(data) {
  const restaurantId = data.get("restaurantId");
  const email = data.get("email");
  const gradeValue = Number(data.get("grade"));
  const comment = data.get("comment")?.toString().trim() ?? "";

  if (
    !restaurantId ||
    !email ||
    !comment ||
    Number.isNaN(gradeValue) ||
    gradeValue < 0 ||
    gradeValue > 5
  ) {
    console.error("Invalid review submission", {
      restaurantId,
      email,
      gradeValue,
      comment,
    });
    return;
  }

  const { firebaseServerApp } = await getAuthenticatedAppForUser();
  const firestore = getFirestore(firebaseServerApp);

  await addReviewToRestaurant(firestore, restaurantId, {
    grade: gradeValue,
    comment,
    email,
  });
}
