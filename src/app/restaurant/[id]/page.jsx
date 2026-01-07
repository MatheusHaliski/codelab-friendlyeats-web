import Restaurant from "@/src/components/Restaurant.jsx";
import { Suspense } from "react";
import { getRestaurantById } from "@/src/lib/firebase/adminFirestore.js";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
import {
  GeminiSummary,
  GeminiSummarySkeleton,
} from "@/src/components/Reviews/ReviewSummary";
import { notFound } from "next/navigation";

export default async function Home(props) {
  // This is a server component, we can access URL
  // parameters via Next.js and download the data
  // we need for this page
  const params = await props.params;
  const { currentUser } = await getAuthenticatedAppForUser();
  const restaurant = await getRestaurantById(params.id);

  if (!restaurant) {
    notFound();
  }

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
    </main>
  );
}
