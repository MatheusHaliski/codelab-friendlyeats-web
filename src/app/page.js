import RestaurantListings from "@/src/components/RestaurantListings.jsx";

export const dynamic = "force-dynamic";

export default function Home({ searchParams }) {
  return (
    <main className="main__home">
      <RestaurantListings searchParams={searchParams} />
    </main>
  );
}
