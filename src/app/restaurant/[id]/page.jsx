import Restaurant from "@/src/components/Restaurant.jsx";
import { Suspense } from "react";
import { getRestaurantById } from "@/src/lib/firebase/firestore.js";
import {
  getAuthenticatedAppForUser,
  getAuthenticatedAppForUser as getUser,
} from "@/src/lib/firebase/serverApp.js";
import ReviewsList, {
  ReviewsListSkeleton,
} from "@/src/components/Reviews/ReviewsList";
import {
  GeminiSummary,
  GeminiSummarySkeleton,
} from "@/src/components/Reviews/ReviewSummary";
import { getFirestore } from "firebase/firestore";
import { ensureRestaurantPhoto } from "@/src/lib/server/restaurantImages";

export default async function Home(props) {
  // This is a server component, we can access URL
  // parameters via Next.js and download the data
  // we need for this page
  const params = await props.params;
  const { currentUser } = await getUser();
  const { firebaseServerApp } = await getAuthenticatedAppForUser();
  const restaurant = await getRestaurantById(
    getFirestore(firebaseServerApp),
    params.id
  const firestore = getFirestore(firebaseServerApp);
  const restaurant = await ensureRestaurantPhoto(
    await getRestaurantById(firestore, params.id),
    firestore
  );

  return (
    <main className="main__restaurant">
      <Restaurant
        id={params.id}
        initialRestaurant={restaurant}
        initialUserId={currentUser?.uid || ""}
      >
        <Suspense fallback={<GeminiSummarySkeleton />}>
          <GeminiSummary restaurantId={params.id} />
        </Suspense>
      </Restaurant>
      <Suspense
        fallback={<ReviewsListSkeleton numReviews={restaurant.numRatings} />}
        fallback={<ReviewsListSkeleton numReviews={restaurant?.numRatings} />}
      >
        <ReviewsList restaurantId={params.id} userId={currentUser?.uid || ""} />
      </Suspense>
    </main>
  );
}
