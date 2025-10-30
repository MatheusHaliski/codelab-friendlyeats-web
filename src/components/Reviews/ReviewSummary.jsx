import { getReviewsByRestaurantId } from "@/src/lib/firebase/firestore.js";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp";
import { getFirestore } from "firebase/firestore";

export async function GeminiSummary({ restaurantId }) {
  if (!restaurantId) {
    return (
      <div className="restaurant__review_summary">
        <p>We couldn't load a summary for this restaurant.</p>
      </div>
    );
  }

  try {
    const { firebaseServerApp } = await getAuthenticatedAppForUser();
    const firestore = getFirestore(firebaseServerApp);
    const reviews = await getReviewsByRestaurantId(firestore, restaurantId);

    if (!reviews || reviews.length === 0) {
      return (
        <div className="restaurant__review_summary">
          <p>No reviews yet. Be the first to share your experience!</p>
        </div>
      );
    }

    const totalRatings = reviews.reduce(
      (accumulator, currentReview) =>
        accumulator + Number(currentReview.rating || 0),
      0
    );
    const averageRating = totalRatings / reviews.length;

    const positiveCount = reviews.filter(
      (review) => Number(review.rating) >= 4
    ).length;
    const neutralCount = reviews.filter(
      (review) => Number(review.rating) === 3
    ).length;
    const negativeCount = reviews.length - positiveCount - neutralCount;

    const highlightReview = reviews.reduce((highlight, currentReview) => {
      const currentText =
        typeof currentReview.text === "string" ? currentReview.text.trim() : "";
      const highlightText =
        typeof highlight?.text === "string" ? highlight.text.trim() : "";

      if (!highlight || currentText.length > highlightText.length) {
        return {
          ...currentReview,
          text: currentText,
        };
      }

      return highlight;
    }, null);

    return (
      <div className="restaurant__review_summary">
        <p>
          Diners give this restaurant an average rating of{" "}
          <strong>{averageRating.toFixed(1)}</strong> based on {reviews.length}{" "}
          review
          {reviews.length > 1 ? "s" : ""}.
        </p>
        <p>
          {positiveCount} said their visit was great, {neutralCount} felt it was
          okay, and {negativeCount} left less impressed.
        </p>
        {highlightReview?.text ? (
          <blockquote>
            <p>&ldquo;{highlightReview.text}&rdquo;</p>
          </blockquote>
        ) : null}
      </div>
    );
  } catch (error) {
    console.error("Failed to summarise reviews", error);
    return (
      <div className="restaurant__review_summary">
        <p>
          We had trouble summarizing the latest reviews. Please try again later.
        </p>
      </div>
    );
  }
}

export function GeminiSummarySkeleton() {
  return (
    <div className="restaurant__review_summary">
      <p>✨ Summarizing reviews with Gemini...</p>
    </div>
  );
}
