"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import renderStars from "@/src/components/Stars.jsx";
import {
  getReviewCount,
  reviewCountFe,
} from "@/src/components/RestaurantProfile.jsx";
import { getRestaurantsSnapshot } from "@/src/lib/firebase/firestore.js";
import { onAuthStateChanged } from "@/src/lib/firebase/auth.js";
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

const RestaurantRatings = ({ restaurant }) => {
  const frontendReviewCount = reviewCountFe(restaurant.reviews ?? []);
  const reviewCount = getReviewCount(restaurant.reviews ?? [], restaurant);
  const displayReviewCount = frontendReviewCount || reviewCount;

  return (
    <div className="restaurant__rating">
      <ul>{renderStars(restaurant.avgRating)}</ul>
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
    <RestaurantRatings restaurant={restaurant} />
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

export default function RestaurantListings({
  searchParams = {},
  initialRestaurants = [],
}) {
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
  const [filters, setFilters] = useState(initialFilters);
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged((user) => {
      setCurrentUser(user ?? null);
      setAuthReady(true);
    });
  }, []);

  const filteredRestaurants = restaurants
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
    .sort((a, b) => {
      if (filters.sort === "review")
        return (
          getReviewCount(b.reviews ?? [], b) -
          getReviewCount(a.reviews ?? [], a)
        );
      return b.avgRating - a.avgRating;
    });

  // ------------------------------
  // AGRUPAMENTO POR PAÍS → ESTADO → CIDADE
  // ------------------------------
  const locationOptions = filteredRestaurants.reduce((acc, restaurant) => {
    const country = (restaurant.country ?? "").trim();
    const state = (restaurant.state ?? "").trim();
    const city = (restaurant.city ?? "").trim();

    if (!country) return acc;

    if (!acc[country]) acc[country] = {};
    if (!acc[country][state]) acc[country][state] = new Set();
    if (city) acc[country][state].add(city);

    return acc;
  }, {});

  const countryOptions = ["", ...Object.keys(locationOptions).sort()];
  const stateOptionsSet = new Set(
    filters.country
      ? Object.keys(locationOptions[filters.country] || {})
      : Object.values(locationOptions).flatMap((states) => Object.keys(states))
  );
  const stateOptions = ["", ...Array.from(stateOptionsSet).sort()];
  const cityOptionsSet = new Set(
    filters.country && filters.state
      ? Array.from(locationOptions[filters.country]?.[filters.state] || new Set())
      : filters.country
        ? Object.values(locationOptions[filters.country] || {}).flatMap((cities) =>
          Array.from(cities)
        )
        : filters.state
          ? Object.values(locationOptions).flatMap((states) =>
            Array.from(states[filters.state] || new Set())
          )
          : []
  );
  const cityOptions = ["", ...Array.from(cityOptionsSet).sort()];

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
    if (!authReady) return undefined;
    return getRestaurantsSnapshot((data) => {
      setRestaurants(data);
    }, filters);
  }, [authReady, filters]);

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
        {filteredRestaurants.map((restaurant) => (
          <RestaurantItem key={restaurant.id} restaurant={restaurant} />
        ))}
      </ul>
    </article>
  );
}
