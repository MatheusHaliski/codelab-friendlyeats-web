"use client";

import React, { useState, useEffect } from "react";
import { getReviewsSnapshotByRestaurantId } from "@/src/lib/firebase/firestore.js";
import { Review } from "@/src/components/Reviews/Review";

export default function ReviewsListClient({
  initialReviews,
  restaurantId,
  userId,
}) {
  const [reviews, setReviews] = useState(initialReviews);

  useEffect(() => {
    return getReviewsSnapshotByRestaurantId(restaurantId, (data) => {
      setReviews(data);
    });
  }, [restaurantId]);

  return (
    <article>
      {reviews.length > 0 ? (
        <ul className="reviews">
          {reviews.map((review) => (
            <Review
              key={review.id}
              rating={review.rating}
              text={review.text}
              timestamp={review.timestamp}
            />
          ))}
        </ul>
      ) : (
        <p>
          This restaurant has not been reviewed yet,{" "}
          {!userId ? "first login and then" : ""} add your own review!
        </p>
      )}
    </article>
  );
}
