"use client";

/* global Map, Set */

import Link from "next/link";
import { React, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import renderStars from "@/src/components/Stars.jsx";
import { getRestaurantsSnapshot } from "@/src/lib/firebase/firestore.js";
import Filters from "@/src/components/Filters.jsx";
import {
  mergeRestaurantPhoto,
  resolveRestaurantPhoto,
} from "@/src/lib/restaurants/placeholders";

// -------------------------------
// Item individual de restaurante
// -------------------------------
const RestaurantItem = ({ restaurant }) => {
  const imageSrc = resolveRestaurantPhoto(restaurant);
  const fallbackAlt =
    "https://codelab-friendlyeats-web--funcionarioslistaapp2025.us-central1.hosted.app/fallbackfood.png";
  const fallbackAltF =
    "/fallbackfood.png";
  const name = restaurant?.name ?? "Restaurant";

  return (
    <li key={restaurant.id}>
      <Link href={`/restaurant/${restaurant.id}`}>
        <div>
          <div className="image-cover">
            <img src={imageSrc} alt={fallbackAltF} />
          </div>

          <div className="restaurant__details">
            <h2>{name}</h2>
            <div className="restaurant__rating">
              <ul>{renderStars(restaurant.avgRating)}</ul>
              <span>({restaurant.numRatings})</span>
            </div>
          </div>

          <p>
            {restaurant.category} | {restaurant.city}, {restaurant.country}
          </p>
        </div>
      </Link>
    </li>
  );
};

// -------------------------------
// Geração dinâmica de filtros
// -------------------------------
function deriveAvailableFilters(restaurants = []) {
  const keywords_food = [
    "Food", "Restaurant", "Pizza", "Coffee", "Tea", "Bars", "Burgers", "Breakfast", "Brunch",
    "Italian", "Chinese", "Japanese", "Mexican", "Indian", "Mediterranean", "Caribbean",
    "Cajun", "German", "Russian", "Cuban", "Organic", "Tapas", "Bowls", "Sushi", "Fast Food",
    "Sandwiches", "Salad", "Vegan", "Vegetarian", "Desserts", "Juice", "Smoothies", "Cafes",
    "Diners", "Seafood", "Steakhouse", "Poke", "Buffets", "Ramen", "Greek", "Korean"
  ];

  const keywords_others = [
    "Home", "Technology", "Accessories", "Arcades", "Art", "Business", "Consulting",
    "Club", "School", "Tree", "Work", "House", "Drug", "Medical", "Assistant", "Education",
    "Health", "Cleaning", "Entertainment", "Spa", "Travel", "Bank", "Hotel", "Market",
    "Shop", "Car", "Service", "Pet", "Doctor", "Museum", "Park"
  ];

  const categories = new Set();
  const citiesByCountry = {};
  const countries = new Set();

  restaurants.forEach((restaurant) => {
    if (Array.isArray(restaurant.categories)) {
      restaurant.categories.forEach((c) => categories.add(c));
    } else if (restaurant.category) {
      categories.add(restaurant.category);
    }

    if (restaurant.country) {
      countries.add(restaurant.country);
      if (!citiesByCountry[restaurant.country]) {
        citiesByCountry[restaurant.country] = new Set();
      }
      if (restaurant.city) {
        citiesByCountry[restaurant.country].add(restaurant.city);
      }
    }
  });

  const allCategories = Array.from(categories).sort();
  const foodCategories = allCategories.filter((cat) =>
    keywords_food.some((keyword) =>
      cat.toLowerCase().includes(keyword.toLowerCase())
    )
  );
  const otherCategories = allCategories.filter((cat) =>
    keywords_others.some((keyword) =>
      cat.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  return {
    foodCategories,
    otherCategories,
    categories: allCategories,
    countries: Array.from(countries).sort(),
    citiesByCountry: Object.fromEntries(
      Object.entries(citiesByCountry).map(([k, v]) => [k, Array.from(v).sort()])
    ),
  };
}

// -------------------------------
// Componente principal
// -------------------------------
export default function RestaurantListings({ initialRestaurants, searchParams }) {
  const router = useRouter();

  const initialFilters = {
    mainType: searchParams.mainType || "",
    category: searchParams.category || "",
    country: searchParams.country || "",
    city: searchParams.city || "",
    sort: searchParams.sort || "rating",
  };

  const initialRestaurantsWithPhotos = useMemo(
    () =>
      (initialRestaurants || []).map((restaurant) =>
        mergeRestaurantPhoto(restaurant)
      ),
    [initialRestaurants]
  );

  const [restaurants, setRestaurants] = useState(initialRestaurantsWithPhotos);
  const [filters, setFilters] = useState(initialFilters);
  const [availableFilters, setAvailableFilters] = useState(() =>
    deriveAvailableFilters(initialRestaurants)
  );

  // Atualiza lista inicial com fotos
  useEffect(() => {
    setRestaurants(initialRestaurantsWithPhotos);
  }, [initialRestaurantsWithPhotos]);

  // Atualiza URL ao alterar filtros
  useEffect(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.append(key, value);
    }
    router.push(`?${params.toString()}`);
  }, [filters, router]);

  // Atualiza lista de restaurantes em tempo real
  useEffect(() => {
    return getRestaurantsSnapshot((data) => {
      setRestaurants((previousRestaurants = []) => {
        const previousPhotos = new Map(
          previousRestaurants.map((restaurant) => [restaurant.id, restaurant.photo])
        );

        return data.map((restaurant) =>
          mergeRestaurantPhoto(restaurant, previousPhotos.get(restaurant.id))
        );
      });
    }, filters);
  }, [filters]);

  // Atualiza lista de filtros disponíveis conforme dados
  useEffect(() => {
    setAvailableFilters(deriveAvailableFilters(restaurants));
  }, [restaurants]);

  const foodOptions = availableFilters?.foodCategories || [""];
  const otherOptions = availableFilters?.otherCategories || [""];
  const countryOptions = ["", ...availableFilters.countries];
  const cityOptions =
    filters.country && availableFilters.citiesByCountry[filters.country]
      ? ["", ...availableFilters.citiesByCountry[filters.country]]
      : [""];

  return (
    <article>
      <Filters
        filters={filters}
        setFilters={setFilters}
        foodOptions={foodOptions}
        otherOptions={otherOptions}
        countryOptions={countryOptions}
        cityOptions={cityOptions}
      />

      <ul className="restaurants">
        {restaurants
          .filter((r) => {
            const matchCountry =
              !filters.country || r.country === filters.country;
            const matchCity =
              !filters.city || r.city === filters.city;
            const matchCategory =
              !filters.category ||
              (r.categories?.includes(filters.category) ||
                r.category === filters.category);
            return matchCountry && matchCity && matchCategory;
          })
          .sort((a, b) =>
            filters.sort === "review"
              ? b.review_count - a.review_count
              : b.stars - a.stars
          )
          .map((restaurant) => (
            <RestaurantItem key={restaurant.id} restaurant={restaurant} />
          ))}
      </ul>
    </article>
  );
}
