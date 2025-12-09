import RestaurantListings from "@/src/components/RestaurantListings.jsx";
import { getRestaurants } from "@/src/lib/firebase/firestore.js";
import { resolveRestaurantPhotoServer } from "@/src/lib/server/resolvePhoto.js";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
import { getFirestore } from "firebase/firestore";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }) {
  const app = await getAuthenticatedAppForUser();
  const db = getFirestore(app);

  const restaurants = await getRestaurants(db);

  // Resolve fotos no servidor (seguro)
  const resolved = await Promise.all(
    restaurants.map(async (r) => ({
      ...r,
      photo: await resolveRestaurantPhotoServer(r)
    }))
  );

  return (
    <main>
      <RestaurantListings
        initialRestaurants={resolved}
        searchParams={searchParams}
      />
    </main>
  );
}
