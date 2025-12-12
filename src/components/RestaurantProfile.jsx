"use client";

import React, { useState, useEffect, useMemo } from "react";
import renderStars from "@/src/components/Stars.jsx";
import {
  addReview,
  getReviewsSnapshotByRestaurantId,
} from "@/src/lib/firebase/firestore.js";
import { updateRestaurantImage } from "@/src/lib/firebase/storage.js";

const FALLBACK_IMAGE =
  "https://codelab-friendlyeats-web--funcionarioslistaapp2025.us-central1.hosted.app/fallbackfood.png";

export default function RestaurantProfile({
  restaurant,
  user,
  userId,
  onPhotoUpdated,
}) {
  // -----------------------------------
  // STATE
  // -----------------------------------
  const [selectedTab, setSelectedTab] = useState("overview");
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [isUploading, setIsUploading] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // -----------------------------------
  // REALTIME REVIEWS
  // -----------------------------------
  useEffect(() => {
    return getReviewsSnapshotByRestaurantId(restaurant.id, (data) => {
      setReviews(data);
    });
  }, [restaurant.id]);

  // -----------------------------------
  // SORT + LIMIT REVIEWS
  // -----------------------------------
  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      const da = a.createdAt?.seconds || 0;
      const db = b.createdAt?.seconds || 0;
      return db - da;
    });
  }, [reviews]);

  const visibleReviews = showAllReviews
    ? sortedReviews
    : sortedReviews.slice(0, 5);

  // -----------------------------------
  // IMAGE UPLOAD
  // -----------------------------------
  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file || isUploading) return;

    try {
      setIsUploading(true);
      const url = await updateRestaurantImage(restaurant.id, file);
      onPhotoUpdated?.(url);
    } catch (err) {
      console.error(err);
      alert("We couldn't update the photo. Please try again.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  // -----------------------------------
  // SUBMIT REVIEW
  // -----------------------------------
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
    setRating(5);
  }

  const imageSrc = restaurant.photo || FALLBACK_IMAGE;

  // -----------------------------------
  // HEADER
  // -----------------------------------
  const header = (
    <section className="restaurant-header">
      <div className="restaurant-header__image">
        <img src={imageSrc} alt={restaurant.name} />

        {userId && (
          <label className="upload-label">
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageUpload}
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
            <span className="pill pill--muted">
              {"💲".repeat(restaurant.price)}
            </span>
          )}
        </div>
      </div>
    </section>
  );

  // -----------------------------------
  // TABS
  // -----------------------------------
  const tabs = {
    overview: (
      <div className="panel-card">
        <h3>Overview</h3>
        <p className="panel-copy">
          A quick snapshot of this restaurant and what people think about it.
        </p>
      </div>
    ),

    location: (
      <div className="info-grid">
        {["address", "city", "state", "country"].map((f) => (
          <div key={f}>
            <span className="info-label">{f.toUpperCase()}</span>
            <p className="info-value">{restaurant[f] || "Not provided"}</p>
          </div>
        ))}
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
  };

  // -----------------------------------
  // COMMENTS + FORM (FINAL)
  // -----------------------------------
  const reviewSection = (
    <section className="commentary">
      <div className="commentary__header">
        <div>
          <p className="eyebrow">Commentary</p>
          <h3>What people are saying</h3>
        </div>
        <span className="commentary__count">
          {reviews.length} reviews
        </span>
      </div>

      {/* CARD BRANCO */}
      <div className="commentary__form">
        <h4>Add your review</h4>

        {!userId ? (
          <p className="muted">You must be logged in to review.</p>
        ) : (
          <form onSubmit={handleSubmitReview} className="review-form">
            <label>
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

            <label>
              <span>Commentary</span>
              <textarea
                placeholder="Share your experience"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
            </label>

            <button type="submit" disabled={!reviewText.trim()}>
              Submit review
            </button>
          </form>
        )}

        {/* ⭐ LATEST COMMENTS */}
        <div className="commentary__latest">
          <h4>Latest comments</h4>

          {visibleReviews.length === 0 ? (
            <p className="muted">Be the first to leave a comment.</p>
          ) : (
            <ul className="commentary__list">
              {visibleReviews.map((r) => (
                <li key={r.id} className="commentary__item animate-in">
                  <div className="commentary__item-head">
                    <img
                      src={r.userPhoto || "/profile.svg"}
                      alt={r.userDisplayName || r.userEmail}
                      className="commentary__avatar"
                    />
                    <div>
                      <strong>
                        {r.userDisplayName || r.userEmail || "Anonymous"}
                      </strong>
                      {typeof r.rating === "number" && (
                        <ul className="rating-stars">
                          {renderStars(r.rating)}
                        </ul>
                      )}
                    </div>
                  </div>

                  <p className="commentary__text">{r.text}</p>
                </li>
              ))}
            </ul>
          )}

          {sortedReviews.length > 5 && (
            <button
              type="button"
              className="view-all-btn"
              onClick={() => setShowAllReviews((v) => !v)}
            >
              {showAllReviews ? "Show less" : "View all reviews"}
            </button>
          )}
        </div>
      </div>
    </section>
  );

  // -----------------------------------
  // RENDER
  // -----------------------------------
  return (
    <div className="restaurant-profile">
      {header}

      <div className="segmented-control">
        {Object.keys(tabs).map((t) => (
          <button
            key={t}
            className={
              selectedTab === t
                ? "segmented-control__button is-active"
                : "segmented-control__button"
            }
            onClick={() => setSelectedTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <section className="tab-content">{tabs[selectedTab]}</section>

      {reviewSection}
    </div>
  );
}
