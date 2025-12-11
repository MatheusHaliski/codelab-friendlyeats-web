import { getReviewsByRestaurantId } from "@/src/lib/firebase/firestore.js";
import ReviewsListClient from "@/src/components/Reviews/ReviewsListClient";
import { getFirestore } from "firebase/firestore";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp";

export default async function ReviewsList({ restaurantId }) {
  const { firebaseServerApp } = await getAuthenticatedAppForUser();

  const reviews = await getReviewsByRestaurantId(
    getFirestore(firebaseServerApp),
    restaurantId
  );

  return (
    <ReviewsListClient
      initialReviews={reviews}
      restaurantId={restaurantId}
    />
  );
}
