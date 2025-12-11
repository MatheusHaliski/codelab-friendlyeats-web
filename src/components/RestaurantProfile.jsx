"use client";

import React, { useState, useEffect } from "react";
import renderStars from "@/src/components/Stars.jsx";
import { addReview, getReviewsSnapshot } from "@/src/lib/firebase/firestore.js";
import { updateRestaurantImage } from "@/src/lib/firebase/storage.js";

const FALLBACK_IMAGE =
  "https://codelab-friendlyeats-web--funcionarioslistaapp2025.us-central1.hosted.app/fallbackfood.png";

export default function RestaurantProfile({ restaurant, userId }) {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);

  // -------------------------
  // Load reviews in real-time
  // -------------------------
  useEffect(() => {
    return getReviewsSnapshot(restaurant.id, (data) => {
      setReviews(data);
    });
  }, [restaurant.id]);

  // -------------------------
  // Upload new image
  // -------------------------
  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await updateRestaurantImage(restaurant.id, file);
    restaurant.photo = url;
  }

  // -------------------------
  // Add review
  // -------------------------
  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!reviewText.trim()) return;

    await addReview({
      restaurantId: restaurant.id,
      userId,
      text: reviewText.trim(),
      rating,
      createdAt: new Date(),
    });

    setReviewText("");
  }

  const imageSrc = restaurant.photo || FALLBACK_IMAGE;

  // -------------------------
  // UI - Header
  // -------------------------
  const header = (
    <section className="restaurant-header">
      <div className="header-image-wrapper">
        <img src={imageSrc} alt={restaurant.name} className="header-image" />

        {userId && (
          <label className="upload-label">
            <input
              type="file"
              className="hidden"
              onChange={handleImageUpload}
            />
            <span className="upload-btn">Update Photo</span>
          </label>
        )}
      </div>

      <h1>{restaurant.name}</h1>

      <div className="rating-row">
        <ul>{renderStars(restaurant.avgRating)}</ul>
        <span>
          {restaurant.avgRating?.toFixed(1)} ({restaurant.numRatings} reviews)
        </span>
      </div>
    </section>
  );

  // -------------------------
  // UI - Tabs Content
  // -------------------------

  const tabs = {
    overview: (
      <p>
        A quick overview inspired by Google Cards. Here you can check ratings,
        image, and general quick metadata.
      </p>
    ),

    location: (
      <div className="info-grid">
        <div><strong>Address:</strong> {restaurant.address}</div>
        <div><strong>City:</strong> {restaurant.city}</div>
        <div><strong>State:</strong> {restaurant.state}</div>
        <div><strong>Country:</strong> {restaurant.country}</div>
      </div>
    ),

    categories: (
      <div>
        <strong>Categories:</strong>
        <p>{Array.isArray(restaurant.categories) ? restaurant.categories.join(", ") : restaurant.category}</p>
      </div>
    ),

    metadata: (
      <div className="info-grid">
        {Object.entries(restaurant)
          .filter(([k, v]) =>
            !["id", "categories", "photo", "avgRating", "numRatings"].includes(k)
          )
          .map(([key, value]) => (
            <div key={key}>
              <strong>{key.replace(/_/g, " ").toUpperCase()}:</strong>{" "}
              {JSON.stringify(value)}
            </div>
          ))}
      </div>
    ),

    reviews: (
      <div>
        <h3>User Reviews</h3>
        {reviews.length === 0 && <p>No reviews yet.</p>}
        <ul className="review-list">
          {reviews.map((r) => (
            <li key={r.id} className="review-item">
              <strong>{r.userEmail}</strong> — {r.text}
            </li>
          ))}
        </ul>
      </div>
    ),
  };

  // -------------------------
  // UI - Tab Buttons
  // -------------------------
  const tabButtons = (
    <div className="tabs">
      {["overview", "location", "categories", "metadata", "reviews"].map((t) => (
        <button
          key={t}
          className={selectedTab === t ? "tab selected" : "tab"}
          onClick={() => setSelectedTab(t)}
        >
          {t.toUpperCase()}
        </button>
      ))}
    </div>
  );

  // -------------------------
  // UI - Review Form (BOTTOM)
  // -------------------------
  const reviewSection = (
    <section className="review-section">
      <h3>Add Your Review</h3>

      {!userId ? (
        <p>You must be logged in to review.</p>
      ) : (
        <form onSubmit={handleSubmitReview}>
          <label>
            Rating:
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5,4,3,2,1].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>

          <textarea
            placeholder="Write your thoughts..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />

          <button type="submit">Submit</button>
        </form>
      )}
    </section>
  );

  return (
    <div className="restaurant-profile">
      {header}
      {tabButtons}
      <section className="tab-content">{tabs[selectedTab]}</section>
      {reviewSection}
    </div>
  );
}
