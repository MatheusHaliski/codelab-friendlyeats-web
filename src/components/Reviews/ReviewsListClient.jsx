"use client";

import { useEffect, useState } from "react";
import { getReviewsSnapshotByRestaurantId } from "@/src/lib/firebase/firestore.js";
import { Review } from "@/src/components/Reviews/Review";

export default function ReviewsListClient({ initialReviews, restaurantId }) {
  const [reviews, setReviews] = useState(initialReviews);

  useEffect(() => {
    const unsub = getReviewsSnapshotByRestaurantId(
      restaurantId,
      setReviews
    );
    return () => unsub();
  }, [restaurantId]);

  return (
    <div className="reviews-panel">
      <h3>Latest comments</h3>
      <ul className="reviews">
        {reviews.map((r) => (
          <Review
            key={r.id}
            grade={r.grade || r.rating}
            comment={r.text || r.comment}
            email={r.userDisplayName || r.userEmail || r.email || "Anonymous"}
            timestamp={
              r.timestamp?.toDate
                ? r.timestamp.toDate()
                : r.timestamp || new Date()
            }
          />
        ))}
      </ul>
    </div>
  );
}
