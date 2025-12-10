// This component shows restaurant metadata, and offers some actions to the user like uploading a new restaurant image, and adding a review.

import React from "react";

const FALLBACK_IMAGE =
  "https://codelab-friendlyeats-web--funcionarioslistaapp2025.us-central1.hosted.app/fallbackfood.png";
import renderStars from "@/src/components/Stars.jsx";

const RestaurantDetails = ({
  restaurant,
  userId,
  handleRestaurantImage,
  setIsOpen,
  isOpen,
  children,
}) => {
  const imageSrc = restaurant.photo || FALLBACK_IMAGE;

  const handleImageError = (event) => {
    if (event.target.src !== FALLBACK_IMAGE) {
      event.target.src = FALLBACK_IMAGE;
    }
  };

  return (
    <section className="img__section">
      <img src={imageSrc} alt={restaurant.name} onError={handleImageError} />

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
          <h2>{restaurant.name}</h2>

          <div className="restaurant__rating">
            <ul>{renderStars(restaurant.avgRating)}</ul>

            <span>({restaurant.numRatings})</span>
          </div>

          <p>
            {restaurant.category} | {restaurant.city}
          </p>
          <p>{"$".repeat(restaurant.price)}</p>
          {children}
        </div>
      </div>
    </section>
  );
};

export default RestaurantDetails;
