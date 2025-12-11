import RestaurantListings from "@/src/components/RestaurantListings.jsx";
import { getRestaurants } from "@/src/lib/firebase/firestore.js";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
import { getFirestore } from "firebase/firestore";
import { moveFoodBackToRestaurants,moveLifestyleRestaurants,migrateLifestyleRestaurants } from "@/src/lib/firebase/migrations/moveLifestyleRestaurants";
import { fixLifestyleTypeField } from "@/src/lib/firebase/migrations/fixLifestyleTypeField";

export const dynamic = "force-dynamic";

export default async function Home(props) {
  const searchParams = await props.searchParams;

  const { firebaseServerApp } = await getAuthenticatedAppForUser();
  const db = getFirestore(firebaseServerApp);

  const normalizedFilters = {
    ...searchParams,
    type: searchParams.type || "food",
  };

  const restaurants = await getRestaurants(db, normalizedFilters);

  return (
    <main className="main__home">
      <RestaurantListings
        initialRestaurants={restaurants}
        searchParams={searchParams}
      />
    </main>
  );
}
