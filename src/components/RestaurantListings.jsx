"use client";

import Link from "next/link";
import { React, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import renderStars from "@/src/components/Stars.jsx";
import { getRestaurantsSnapshot } from "@/src/lib/firebase/firestore.js";
import Filters from "@/src/components/Filters.jsx";

const RestaurantItem = ({ restaurant }) => (
  <li key={restaurant.id}>
    <Link href={`/restaurant/${restaurant.id}`}>
      <div className="restaurant-card">
        <div className="image-cover">
          <img src={restaurant.photo} alt={restaurant.name} />
        </div>
        <div className="restaurant__details">
          <h2>{restaurant.name}</h2>
          <div className="restaurant__rating">
            <ul>{renderStars(restaurant.avgRating)}</ul>
            <span>({restaurant.numRatings})</span>
          </div>
          <div className="restaurant__meta">
            <p>
              {restaurant.category} | {restaurant.city}
            </p>
            <p>{"$".repeat(restaurant.price)}</p>
          </div>
        </div>
      </div>
    </Link>
  </li>
);

// -------------------------------
// Funções auxiliares
// -------------------------------
function deriveAvailableFilters(restaurants = []) {
  const categories = new Set();
  const cities = new Set();
  const prices = new Set();

  restaurants.forEach((restaurant) => {
    if (Array.isArray(restaurant.categories)) {
      restaurant.categories.forEach((category) => {
        if (category) categories.add(category);
      });
    } else if (restaurant.category) {
      categories.add(restaurant.category);
    }

    if (restaurant.city) cities.add(restaurant.city);
    if (restaurant.price) prices.add(restaurant.price);
  });

  return {
    categories: Array.from(categories).sort((a, b) => a.localeCompare(b)),
    cities: Array.from(cities).sort((a, b) => a.localeCompare(b)),
    prices: Array.from(prices).sort((a, b) => a - b),
  };
}

function mergeAvailableFilters(previous, next) {
  const unique = (values) => Array.from(new Set(values));

  return {
    categories: unique([...previous.categories, ...next.categories]).sort((a, b) =>
      a.localeCompare(b)
    ),
    cities: unique([...previous.cities, ...next.cities]).sort((a, b) =>
      a.localeCompare(b)
    ),
    prices: unique([...previous.prices, ...next.prices]).sort((a, b) => a - b),
  };
}

// -------------------------------
// Componente principal
// -------------------------------
export default function RestaurantListings({ initialRestaurants = [], searchParams = {} }) {
  const router = useRouter();

  // 🔹 Filtros iniciais vindos da URL
  const initialFilters = {
    city: searchParams.city || "",
    category: searchParams.category || "",
    price: searchParams.price || "",
    sort: searchParams.sort || "rating", // padrão
  };

  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [filters, setFilters] = useState(initialFilters);
  const [availableFilters, setAvailableFilters] = useState(() =>
    deriveAvailableFilters(initialRestaurants)
  );

  // 🔹 Atualiza URL ao mudar filtros
  useEffect(() => {
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) queryParams.append(key, value);
    }
    router.push(`?${queryParams.toString()}`);
  }, [filters, router]);

  // 🔹 Atualiza dados Firestore em tempo real
  useEffect(() => {
    const unsubscribe = getRestaurantsSnapshot((data) => {
      setRestaurants(data);
    }, filters);

    return () => unsubscribe && unsubscribe();
  }, [filters]);

  // 🔹 Atualiza filtros disponíveis quando lista muda
  useEffect(() => {
    const derived = deriveAvailableFilters(restaurants);
    setAvailableFilters((previous) => mergeAvailableFilters(previous, derived));
  }, [restaurants]);

  // 🔹 Opções para selects
  const categoryOptions = useMemo(
    () => ["", ...availableFilters.categories],
    [availableFilters.categories]
  );
  const cityOptions = useMemo(
    () => ["", ...availableFilters.cities],
    [availableFilters.cities]
  );
  const priceOptions = useMemo(
    () => ["", ...availableFilters.prices],
    [availableFilters.prices]
  );

  // 🔹 Renderização final
  return (
    <article>
      <Filters
        filters={filters}
        setFilters={setFilters}
        categoryOptions={categoryOptions}
        cityOptions={cityOptions}
        priceOptions={priceOptions}
        sortOptions={[
          { value: "rating", label: "Rating" },
          { value: "review", label: "Reviews" },
        ]}
      />

      <ul className="restaurants">
        {restaurants
          .filter((r) => {
            const matchCity = !filters.city || r.city === filters.city;
            const matchCategory =
              !filters.category ||
              (Array.isArray(r.categories)
                ? r.categories.includes(filters.category)
                : r.category === filters.category);
            const matchPrice =
              !filters.price || String(r.price) === String(filters.price);

            return matchCity && matchCategory && matchPrice;
          })
          .sort((a, b) =>
            filters.sort === "review"
              ? b.numRatings - a.numRatings
              : b.avgRating - a.avgRating
          )
          .map((restaurant) => (
            <RestaurantItem key={restaurant.id} restaurant={restaurant} />
          ))}
      </ul>
    </article>
  );
}
