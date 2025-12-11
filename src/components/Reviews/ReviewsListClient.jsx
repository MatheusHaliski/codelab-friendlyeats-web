"use client";

import { useEffect, useState } from "react";
import { getReviewsSnapshotByRestaurantId } from "@/src/lib/firebase/firestore.js";

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
    <ul className="reviews">
      {reviews.map((r) => (
        <li key={r.id}>{r.text}</li>
      ))}
    </ul>
  );
}
