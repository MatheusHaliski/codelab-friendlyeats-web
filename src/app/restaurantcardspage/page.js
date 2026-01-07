import RestaurantListings from "@/src/components/RestaurantListings.jsx";
import { getRestaurantsAdmin } from "@/src/lib/firebase/adminFirestore.js";

export const dynamic = "force-dynamic";

export default async function RestaurantCardsPage({ searchParams }) {
  const restaurants = await getRestaurantsAdmin(searchParams ?? {});

  return (
    <main className="main__home">
      <RestaurantListings
        searchParams={searchParams}
        initialRestaurants={restaurants}
      />
    </main>
  );
}
