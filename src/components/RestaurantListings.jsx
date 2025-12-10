"use client";

import Link from "next/link";
import { React, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import renderStars from "@/src/components/Stars.jsx";
import { getRestaurantsSnapshot } from "@/src/lib/firebase/firestore.js";
import Filters from "@/src/components/Filters.jsx";

const FALLBACK_IMAGE =
  "https://codelab-friendlyeats-web--funcionarioslistaapp2025.us-central1.hosted.app/fallbackfood.png";

const RestaurantItem = ({ restaurant }) => (
  <li key={restaurant.id}>
    <Link href={`/restaurant/${restaurant.id}`}>
      <ActiveResturant restaurant={restaurant} />
    </Link>
  </li>
);

const ActiveResturant = ({ restaurant }) => (
  <div>
    <ImageCover photo={restaurant.photo} name={restaurant.name} />
    <ResturantDetails restaurant={restaurant} />
  </div>
);

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

const ResturantDetails = ({ restaurant }) => (
  <div className="restaurant__details">
    <h2>{restaurant.name}</h2>
    <RestaurantRating restaurant={restaurant} />
    <RestaurantMetadata restaurant={restaurant} />
  </div>
);

const RestaurantRating = ({ restaurant }) => (
  <div className="restaurant__rating">
    <ul>{renderStars(restaurant.avgRating)}</ul>
    <span>({restaurant.numRatings})</span>
  </div>
);

const RestaurantMetadata = ({ restaurant }) => (
  <div className="restaurant__meta">
    <p>
      {restaurant.category} | {restaurant.city} ({restaurant.state})
    </p>
  </div>
);

export default function RestaurantListings({ initialRestaurants, searchParams }) {
  const router = useRouter();

  const initialFilters = {
    city: searchParams.city || "",
    category: searchParams.category || "",
    country: searchParams.country || "",
    state: searchParams.state || "",
    sort: searchParams.sort || "rating",
  };

  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [allRestaurants, setAllRestaurants] = useState(initialRestaurants);
  const [filters, setFilters] = useState(initialFilters);

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
    ...Array.from(
      locationOptions[filters.country]?.[filters.state] || new Set()
    ).sort(),
  ];

  useEffect(() => {
    routerWithFilters(router, filters);
  }, [router, filters]);

  useEffect(() => {
    return getRestaurantsSnapshot((data) => {
      setRestaurants(data);
    }, filters);
  }, [filters]);

  useEffect(() => {
    const unsubscribe = getRestaurantsSnapshot((data) => {
      setAllRestaurants(data);
    });

    return unsubscribe;
  }, []);

  return (
    <article>
      <Filters
        filters={filters}
        setFilters={setFilters}
        cityOptions={cityOptions}
        countryOptions={countryOptions}
        stateOptions={stateOptions}
      />

      <ul className="restaurants">
        {restaurants
          .sort((a, b) => {
            if (filters.sort === "review") return b.numRatings - a.numRatings;
            return b.avgRating - a.avgRating;
          })
          .filter((r) => {
            const matchCity = !filters.city || r.city === filters.city;
            const matchCategory =
              !filters.category ||
              (Array.isArray(r.categories)
                ? r.categories.includes(filters.category)
                : r.category === filters.category);
            const matchCountry =
              !filters.country || r.country === filters.country;
            const matchState = !filters.state || r.state === filters.state;

            return matchCity && matchCategory && matchCountry && matchState;
          })
          .map((restaurant) => (
            <RestaurantItem key={restaurant.id} restaurant={restaurant} />
          ))}
      </ul>
    </article>
  );
}

function routerWithFilters(router, filters) {
  const queryParams = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") {
      queryParams.append(key, value);
    }
  }

  const queryString = queryParams.toString();
  router.push(`?${queryString}`);
}
