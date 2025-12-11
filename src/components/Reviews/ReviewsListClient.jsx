"use client";

import React, { useState, useEffect } from "react";
import { getReviewsSnapshotByRestaurantId } from "@/src/lib/firebase/firestore.js";
import { Review } from "@/src/components/Reviews/Review";
import { useUser } from "@/src/lib/getUser";
import RatingPicker from "@/src/components/RatingPicker.jsx";
import { handleReviewFormSubmission } from "@/src/app/actions.js";

export default function ReviewsListClient({
  initialReviews,
  restaurantId,
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const currentUser = useUser();

  useEffect(() => {
    return getReviewsSnapshotByRestaurantId(restaurantId, (data) => {
      setReviews(data);
    });
  }, [restaurantId]);

  return (
    <article className="reviews-panel">
      <div className="review-form__container">
        <h3>Share your experience</h3>
        <p>
          Reviews are tied to your Google sign-in. Add a star rating and a short comment to help other diners.
        </p>
        <form
          className="review-form"
          action={handleReviewFormSubmission}
          aria-label="Create review"
        >
          <input type="hidden" name="restaurantId" value={restaurantId} />
          <input type="hidden" name="email" value={currentUser?.email ?? ""} />
          <div className="review-form__rating">
            <label htmlFor="rating">Your grade</label>
            <RatingPicker name="grade" defaultValue={5} />
          </div>
          <label className="review-form__comment">
            Comment
            <textarea
              name="comment"
              placeholder="What stood out about this place?"
              required
              disabled={!currentUser}
            />
          </label>
          {!currentUser && (
            <p className="review-form__helper">Please sign in with Google to post a review.</p>
          )}
          <button type="submit" disabled={!currentUser}>
            Publish review
          </button>
        </form>
      </div>

      {reviews.length > 0 ? (
        <ul className="reviews">
          {reviews.map((review) => (
            <Review
              key={review.id}
              grade={review.grade}
              comment={review.comment}
              email={review.email}
              timestamp={review.timestamp}
            />
          ))}
        </ul>
      ) : (
        <p className="review-empty">Be the first to leave a review for this restaurant.</p>
      )}
    </article>
  );
}
