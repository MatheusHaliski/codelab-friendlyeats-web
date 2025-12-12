"use client";

import React, { useState, useEffect } from "react";
import renderStars from "@/src/components/Stars.jsx";
import { addReview, getReviewsSnapshotByRestaurantId } from "@/src/lib/firebase/firestore.js";
import { updateRestaurantImage } from "@/src/lib/firebase/storage.js";

const FALLBACK_IMAGE =
  "https://codelab-friendlyeats-web--funcionarioslistaapp2025.us-central1.hosted.app/fallbackfood.png";

export default function RestaurantProfile({
  restaurant,
  user,
  userId,
  onPhotoUpdated,
}) {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [isUploading, setIsUploading] = useState(false);

  // -------------------------
  // Load reviews in real-time
  // -------------------------
  useEffect(() => {
    return getReviewsSnapshotByRestaurantId(restaurant.id, (data) => {
      setReviews(data);
    });
  }, [restaurant.id]);

  // -------------------------
  // Upload new image
  // -------------------------
  async function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file || isUploading) return;

    try {
      setIsUploading(true);
      const url = await updateRestaurantImage(restaurant.id, file);
      onPhotoUpdated?.(url);
    } catch (error) {
      console.error("Failed to update restaurant image", error);
      alert("We couldn't update the photo. Please try again.");
    } finally {
      setIsUploading(false);
      // Allow re-selecting the same file after an attempt
      if (event.target) {
        event.target.value = "";
      }
    }
  }

  // -------------------------
  // Add review
  // -------------------------
  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!reviewText.trim()) return;

    await addReview(restaurant.id, {
      userId,
      userEmail: user?.email,
      userPhoto: user?.photoURL,
      userDisplayName: user?.displayName,
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
      <div className="restaurant-header__image">
        <img src={imageSrc} alt={restaurant.name} />

        {userId && (
          <label className="upload-label">
            <input
              type="file"
              className="hidden"
              onChange={handleImageUpload}
              accept="image/*"
            />
            <span className="upload-btn">
              {isUploading ? "Updating..." : "Update Photo"}
            </span>
          </label>
        )}
      </div>

      <div className="restaurant-header__content">
        <p className="restaurant-header__eyebrow">
          {restaurant.type ?? "Restaurant"}
        </p>
        <h1>{restaurant.name}</h1>

        <div className="rating-row">
          <ul>{renderStars(restaurant.avgRating)}</ul>
          <span>
            {restaurant.avgRating?.toFixed(1) ?? "N/A"} (
            {restaurant.numRatings || 0} reviews)
          </span>
        </div>

        <div className="restaurant-header__tags">
          {restaurant.city && <span className="pill">{restaurant.city}</span>}
          {restaurant.state && <span className="pill">{restaurant.state}</span>}
          {restaurant.country && (
            <span className="pill pill--muted">{restaurant.country}</span>
          )}
          {restaurant.price && (
            <span className="pill pill--muted">{"💲".repeat(restaurant.price)}</span>
          )}
        </div>
      </div>
    </section>
  );

  // -------------------------
  // UI - Tabs Content
  // -------------------------

  const tabs = {
    overview: (
      <div className="panel-grid">
        <div className="panel-card">
          <h3>Overview</h3>
          <p className="panel-copy">
            A quick glance at this spot. Check the highlights, see how guests
            rate it, and decide if it fits your next outing.
          </p>
        </div>

        <div className="panel-card">
          <h4>Quick facts</h4>
          <div className="fact-grid">
            <div>
              <p className="fact-label">Category</p>
              <p className="fact-value">
                {Array.isArray(restaurant.categories)
                  ? restaurant.categories.join(", ")
                  : restaurant.category || "Not listed"}
              </p>
            </div>
            <div>
              <p className="fact-label">Average Rating</p>
              <p className="fact-value">
                {restaurant.avgRating?.toFixed(1) ?? "N/A"}
              </p>
            </div>
            <div>
              <p className="fact-label">Total Reviews</p>
              <p className="fact-value">{restaurant.numRatings || 0}</p>
            </div>
          </div>
        </div>
      </div>
    ),

    location: (
      <div className="info-grid">
        <div>
          <span className="info-label">Address</span>
          <p className="info-value">{restaurant.address || "Not provided"}</p>
        </div>
        <div>
          <span className="info-label">City</span>
          <p className="info-value">{restaurant.city || "Not provided"}</p>
        </div>
        <div>
          <span className="info-label">State</span>
          <p className="info-value">{restaurant.state || "Not provided"}</p>
        </div>
        <div>
          <span className="info-label">Country</span>
          <p className="info-value">{restaurant.country || "Not provided"}</p>
        </div>
      </div>
    ),

    categories: (
      <div className="panel-card">
        <h3>Categories</h3>
        <p className="panel-copy">
          {Array.isArray(restaurant.categories)
            ? restaurant.categories.join(", ")
            : restaurant.category || "No categories listed"}
        </p>
      </div>
    ),

    metadata: (
      <div className="info-grid">
        {Object.entries(restaurant)
          .filter(([k]) =>
            !["id", "categories", "photo", "avgRating", "numRatings"].includes(k)
          )
          .map(([key, value]) => (
            <div key={key}>
              <span className="info-label">
                {key.replace(/_/g, " ").toUpperCase()}
              </span>
              <p className="info-value">{JSON.stringify(value)}</p>
            </div>
          ))}
      </div>
    ),
  };

  // -------------------------
  // UI - Tab Buttons
  // -------------------------
  const tabButtons = (
    <div className="segmented-control" role="tablist" aria-label="Restaurant sections">
      {["overview", "location", "categories", "metadata"].map((t) => (
        <button
          key={t}
          role="tab"
          className={
            selectedTab === t
              ? "segmented-control__button is-active"
              : "segmented-control__button"
          }
          onClick={() => setSelectedTab(t)}
        >
          {t.replace(/^(.)/, (c) => c.toUpperCase())}
        </button>
      ))}
    </div>
  );

  // -------------------------
  // UI - Review Form (BOTTOM)
  // -------------------------
  const reviewSection = (
    <section className="commentary">
      <div className="commentary__header">
        <div>
          <p className="eyebrow">Commentary</p>
          <h3>What people are saying</h3>
        </div>
        <span className="commentary__count">{reviews.length} reviews</span>
      </div>

      <div className="commentary__form">
        <h4>Add your review</h4>

        {!userId ? (
          <p className="muted">You must be logged in to review.</p>
        ) : (
          <form onSubmit={handleSubmitReview} className="review-form">
            <label className="review-form__rating">
              <span>Rating</span>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <label className="review-form__comment">
              <span>Commentary</span>
              <textarea
                placeholder="Share a short take on your visit"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
            </label>

            <button type="submit" disabled={!reviewText.trim()}>
              Submit review
            </button>
          </form>
        )}
      </div>

      <div className="commentary__latest">
        <h4>Latest comments</h4>
        <div className="commentary__list">
          {reviews.length === 0 ? (
            <p className="muted">Be the first to leave a comment.</p>
          ) : (
            <ul>
              {reviews.map((r) => {
                const avatarSrc = r.userPhoto || "/profile.svg";
                const nameOrEmail =
                  r.userDisplayName || r.userEmail || "Anonymous";

                return (
                  <li key={r.id} className="commentary__item">
                    <div className="commentary__item-head">
                      <img
                        src={avatarSrc}
                        alt={nameOrEmail}
                        className="commentary__avatar"
                      />
                      <div>
                        <strong>{nameOrEmail}</strong>
                        {r.rating && (
                          <span className="pill pill--muted">{r.rating} ★</span>
                        )}
                      </div>
                    </div>
                    <p className="commentary__text">{r.text}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
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
