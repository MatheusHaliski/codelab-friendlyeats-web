import RestaurantListings from "@/src/components/RestaurantListings.jsx";
import { getRestaurants } from "@/src/lib/firebase/firestore.js";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }) {
  const restaurants = await getRestaurants(searchParams ?? {});

  return (
    <main className="main__home">
      <RestaurantListings
        searchParams={searchParams}
        initialRestaurants={restaurants}
      />
    </main>
  );
}
