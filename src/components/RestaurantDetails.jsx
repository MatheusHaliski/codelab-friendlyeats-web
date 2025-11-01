// This component shows restaurant metadata, and offers some actions to the user like uploading a new restaurant image, and adding a review.

import React from "react";
import renderStars from "@/src/components/Stars.jsx";
import { resolveRestaurantPhoto } from "@/src/lib/restaurants/placeholders";

const RestaurantDetails = ({
  restaurant,
  userId,
  handleRestaurantImage,
  setIsOpen,
  isOpen,
  children,
}) => {
  const details = restaurant ?? {};
  const imageSrc = resolveRestaurantPhoto(details);
  const name = details.name ?? "Restaurant";
  const category = details.category ?? "";
  const city = details.city ?? "";
  const rating = Number(details.avgRating ?? details.stars ?? 0);
  const reviewCount = Number(details.numRatings ?? details.review_count ?? 0);
  const priceLevelRaw =
    typeof details.price === "number"
      ? details.price
      : Number.parseInt(details.price, 10);
  const priceLevel = Number.isFinite(priceLevelRaw) && priceLevelRaw > 0 ? priceLevelRaw : 0;

  return (
    <section className="img__section">
      <img src={imageSrc} alt={name} />

      <div className="actions">
        {userId && (
          <img
            alt="review"
            className="review"
            onClick={() => {
              setIsOpen(!isOpen);
            }}
            src="/review.svg"
          />
        )}
        <label
          onChange={(event) => handleRestaurantImage(event.target)}
          htmlFor="upload-image"
          className="add"
        >
          <input
            name=""
            type="file"
            id="upload-image"
            className="file-input hidden w-full h-full"
          />

          <img className="add-image" src="/add.svg" alt="Add image" />
        </label>
      </div>

      <div className="details__container">
        <div className="details">
          <h2>{name}</h2>

          <div className="restaurant__rating">
            <ul>{renderStars(rating)}</ul>
            <span>({reviewCount})</span>
          </div>

          <p>
            {category} | {city}
          </p>
          <p>{"$".repeat(priceLevel)}</p>
          {children}
        </div>
      </div>
    </section>
  );
};

export default RestaurantDetails;
