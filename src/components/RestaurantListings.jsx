"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import renderStars from "@/src/components/Stars.jsx";
import Filters from "@/src/components/Filters.jsx";
import { getRestaurantsSnapshot } from "@/src/lib/firebase/firestore.js";

// CLIENT-SAFE fallback resolver
import { resolveRestaurantPhotoSync } from "@/src/lib/client/resolvePhoto.js";

// -------------------------
const RestaurantItem = ({ restaurant }) => {
  const imageSrc = resolveRestaurantPhotoSync(restaurant);
  const name = restaurant?.name ?? "Restaurant";

  return (
    <li>
      <Link href={`/restaurant/${restaurant.id}`}>
        <div>
          <img className="image-cover" src={imageSrc} alt={name} />

          <h2>{name}</h2>
          <div className="restaurant__rating">
            <ul>{renderStars(restaurant.avgRating)}</ul>
            <span>({restaurant.numRatings})</span>
          </div>

          <p>{restaurant.category} | {restaurant.city}, {restaurant.country}</p>
        </div>
      </Link>
    </li>
  );
};

// -------------------------
export default function RestaurantListings({ initialRestaurants, searchParams }) {
  const router = useRouter();

  const initialFilters = {
    category: searchParams.category || "",
    city: searchParams.city || "",
    sort: searchParams.sort || "rating",
  };

  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [filters, setFilters] = useState(initialFilters);

  // Update URL when filters apply
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    router.push(`?${params.toString()}`);
  }, [filters]);

  // Snapshot updates
  useEffect(() => {
    return getRestaurantsSnapshot((data) => {
      setRestaurants(data);
    }, filters);
  }, [filters]);

  const filtered = restaurants
    .filter((r) => {
      if (filters.city && r.city !== filters.city) return false;
      if (filters.category && !r.categories.includes(filters.category)) return false;
      return true;
    })
    .sort((a, b) =>
      filters.sort === "review"
        ? b.review_count - a.review_count
        : b.stars - a.stars
    );

  return (
    <article>
      <Filters filters={filters} onChange={setFilters} />

      <ul className="restaurants">
        {filtered.map((restaurant) => (
          <RestaurantItem key={restaurant.id} restaurant={restaurant} />
        ))}
      </ul>
    </article>
  );
}
