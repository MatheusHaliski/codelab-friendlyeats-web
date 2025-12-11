// This component shows restaurant metadata, and offers some actions to the user like uploading a new restaurant image, and adding a review.

import React from "react";

const FALLBACK_IMAGE =
  "https://codelab-friendlyeats-web--funcionarioslistaapp2025.us-central1.hosted.app/fallbackfood.png";
import renderStars from "@/src/components/Stars.jsx";

const RestaurantDetails = ({ restaurant, userId, handleRestaurantImage, children }) => {
  const imageSrc = restaurant.photo || FALLBACK_IMAGE;

  const handleImageError = (event) => {
    if (event.target.src !== FALLBACK_IMAGE) {
      event.target.src = FALLBACK_IMAGE;
    }
  };

  const featureChips = [
    restaurant.category,
    restaurant.type,
    restaurant.city,
    restaurant.state,
    restaurant.country,
  ].filter(Boolean);

  const detailEntries = Object.entries(restaurant)
    .filter(([key]) => !["id", "photo", "categories", "avgRating", "numRatings"].includes(key))
    .map(([key, value]) => ({
      label: key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()),
      value:
        typeof value === "object" && value !== null
          ? JSON.stringify(value)
          : value?.toString?.() ?? "",
    }))
    .filter(({ value }) => value !== "");

  const priceLabel = restaurant.price ? "💲".repeat(restaurant.price) : "Not listed";

  return (
    <section className="restaurant-hero">
      <div className="restaurant-hero__media">
        <img src={imageSrc} alt={restaurant.name} onError={handleImageError} />
        {userId && (
          <label
            onChange={(event) => handleRestaurantImage(event.target)}
            htmlFor="upload-image"
            className="hero__upload"
          >
            <input
              name=""
              type="file"
              id="upload-image"
              className="file-input hidden w-full h-full"
            />

            <img className="add-image" src="/add.svg" alt="Add image" />
            <span>Update cover</span>
          </label>
        )}
      </div>

      <div className="restaurant-hero__body">
        <div>
          <p className="restaurant-hero__eyebrow">{restaurant.type ?? "Restaurant"}</p>
          <h1>{restaurant.name}</h1>
          <div className="hero__rating-row">
            <div className="restaurant__rating">
              <ul>{renderStars(restaurant.avgRating)}</ul>
              <span>
                {restaurant.avgRating?.toFixed?.(1) ?? "N/A"} ({restaurant.numRatings || 0} reviews)
              </span>
            </div>
            <div className="hero__price">{priceLabel}</div>
          </div>
          {featureChips.length > 0 && (
            <div className="hero__chips">
              {featureChips.map((chip) => (
                <span key={chip} className="hero__chip">
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="hero__quick-facts">
          {[
            { label: "Address", value: restaurant.address },
            { label: "City", value: restaurant.city },
            { label: "State", value: restaurant.state },
            { label: "Country", value: restaurant.country },
          ]
            .filter(({ value }) => Boolean(value))
            .map(({ label, value }) => (
              <div key={label} className="hero__fact-card">
                <p className="hero__fact-label">{label}</p>
                <p className="hero__fact-value">{value}</p>
              </div>
            ))}
        </div>
      </div>

      <div className="restaurant__segments">
        <div className="segment">
          <h3>Overview</h3>
          <p className="segment__copy">
            Discover menu inspiration, location, and crowd-sourced ratings at a glance — a compact view inspired by the Google search cards you see for popular spots.
          </p>
          {children}
        </div>

        <div className="segment">
          <h3>Restaurant Details</h3>
          <dl className="segment__grid">
            {detailEntries.map(({ label, value }) => (
              <div key={label} className="segment__grid-item">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
};

export default RestaurantDetails;
