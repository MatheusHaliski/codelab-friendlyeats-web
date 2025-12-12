"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import renderStars from "@/src/components/Stars.jsx";
import { getRestaurantsSnapshot } from "@/src/lib/firebase/firestore.js";
import Filters from "@/src/components/Filters.jsx";
import { CATEGORY_OPTIONS } from "@/src/lib/categoryOptions.js";

// Fallback global
const FALLBACK_IMAGE =
  "https://codelab-friendlyeats-web--funcionarioslistaapp2025.us-central1.hosted.app/fallbackfood.png";

// ------------------------------
// SUBCOMPONENTES
// ------------------------------

const ImageCover = ({ photo, name }) => {
  const imageSrc = photo || FALLBACK_IMAGE;

  const handleImageError = (event) => {
    if (event.target.src !== FALLBACK_IMAGE) {
      event.target.src = FALLBACK_IMAGE;
    }
  };

  return (
    <div className="image-cover">
      <img src={imageSrc} alt={name} onError={handleImageError} />
    </div>
  );
};

const resolveReviewCount = (restaurant) => {
  const candidates = [
    restaurant.review_count,
    restaurant.numRatings,
    restaurant.reviews_count,
    restaurant.reviewCount,
    restaurant.reviewsCount,
  ];

  const resolved = candidates.find((value) => value !== undefined && value !== null);
  if (resolved !== undefined) return resolved;

  if (Array.isArray(restaurant.reviews)) return restaurant.reviews.length;
  if (Array.isArray(restaurant.commentary)) return restaurant.commentary.length;

  return 0;
};

const RestaurantRating = ({ restaurant }) => {
  const reviewCount = resolveReviewCount(restaurant);

  return (
    <div className="restaurant__rating">
      <ul>{renderStars(restaurant.avgRating)}</ul>
      <span>({reviewCount})</span>
    </div>
  );
};

const RestaurantMetadata = ({ restaurant }) => (
  <div className="restaurant__meta">
    <p>
      {restaurant.category} | {restaurant.city} ({restaurant.state})
    </p>
  </div>
);

const RestaurantDetails = ({ restaurant }) => (
  <div className="restaurant__details">
    <h2>{restaurant.name}</h2>
    <RestaurantRating restaurant={restaurant} />
    <RestaurantMetadata restaurant={restaurant} />
  </div>
);

const ActiveRestaurant = ({ restaurant }) => (
  <div>
    <ImageCover photo={restaurant.photo} name={restaurant.name} />
    <RestaurantDetails restaurant={restaurant} />
  </div>
);

const RestaurantItem = ({ restaurant }) => (
  <li key={restaurant.id}>
    <Link href={`/restaurant/${restaurant.id}`}>
      <ActiveRestaurant restaurant={restaurant} />
    </Link>
  </li>
);

// ------------------------------
// COMPONENTE PRINCIPAL
// ------------------------------

export default function RestaurantListings({ initialRestaurants, searchParams }) {
  const router = useRouter();

  const initialFilters = {
    city: searchParams.city || "",
    category: searchParams.category || "",
    country: searchParams.country || "",
    name: searchParams.name || "",
    state: searchParams.state || "",
    type: searchParams.type || "food",
    sort: searchParams.sort || "rating",
  };

  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [allRestaurants, setAllRestaurants] = useState(initialRestaurants);
  const [filters, setFilters] = useState(initialFilters);

  // ------------------------------
  // AGRUPAMENTO POR PAÍS → ESTADO → CIDADE
  // ------------------------------
  const locationOptions = allRestaurants.reduce((acc, restaurant) => {
    const country = restaurant.country || "";
    const state = restaurant.state || "";
    const city = restaurant.city || "";

    if (!acc[country]) acc[country] = {};
    if (!acc[country][state]) acc[country][state] = new Set();
    if (city) acc[country][state].add(city);

    return acc;
  }, {});

  const countryOptions = ["", ...Object.keys(locationOptions).sort()];
  const stateOptions = [
    "",
    ...Object.keys(locationOptions[filters.country] || {}).sort(),
  ];
  const cityOptions = [
    "",
    ...Array.from(locationOptions[filters.country]?.[filters.state] || new Set()).sort(),
  ];

  // ------------------------------
  // Atualiza URL com filtros
  // ------------------------------
  useEffect(() => {
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== "") queryParams.append(key, value);
    }
    router.push(`?${queryParams.toString()}`);
  }, [filters]);

  // ------------------------------
  // Firestore: Lista filtrada
  // ------------------------------
  useEffect(() => {
    return getRestaurantsSnapshot((data) => {
      setRestaurants(data);
    }, filters);
  }, [filters]);

  // ------------------------------
  // Firestore: Todas categorias (para montar selects)
  // ------------------------------
  useEffect(() => {
    const unsub = getRestaurantsSnapshot(
      (data) => setAllRestaurants(data),
      { type: filters.type }
    );
    return unsub;
  }, [filters.type]);

  // ------------------------------
  // RENDER
  // ------------------------------

  return (
    <article>
      <Filters
        filters={filters}
        setFilters={setFilters}
        categoryOptions={CATEGORY_OPTIONS}
        countryOptions={countryOptions}
        stateOptions={stateOptions}
        cityOptions={cityOptions}
      />

      <ul className="restaurants">
        {restaurants
          .sort((a, b) => {
            if (filters.sort === "review")
              return resolveReviewCount(b) - resolveReviewCount(a);
            return b.avgRating - a.avgRating;
          })

          .filter((r) => {
            const normalizeCategory = (value) =>
              typeof value === "string"
                ? value.toLowerCase()
                : (value ?? "").toString().toLowerCase();

            const matchCity = !filters.city || r.city === filters.city;
            const matchCategory =
              !filters.category ||
              (() => {
                const selectedCategory = normalizeCategory(filters.category);
                const restaurantCategories = Array.isArray(r.categories)
                  ? r.categories
                  : [r.category];

                return restaurantCategories.some(
                  (category) => normalizeCategory(category) === selectedCategory
                );
              })();

            const matchCountry = !filters.country || r.country === filters.country;
            const matchState = !filters.state || r.state === filters.state;
            const matchName =
              !filters.name ||
              r.name?.toLowerCase().includes(filters.name.toLowerCase());

            return matchCity && matchCategory && matchCountry && matchName && matchState;
          })

          .map((restaurant) => (
            <RestaurantItem key={restaurant.id} restaurant={restaurant} />
          ))}
      </ul>
    </article>
  );
}
