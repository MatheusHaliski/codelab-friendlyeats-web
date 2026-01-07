import "server-only";
import { getAdminFirestore } from "@/src/lib/firebase/adminApp";
import { inferTypeFromCategories } from "@/src/lib/firebase/categoryKeywords";

function normalizeRestaurantSnapshot(docSnapshot) {
  const data = docSnapshot.data() ?? {};
  const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : null;

  const categories = Array.isArray(data.categories)
    ? data.categories
    : data.category
      ? [data.category]
      : [];
  const primaryCategory = data.category ?? categories[0] ?? "";

  const frontendReviewCount = data.review_count_fe;
  const reviewCount = data.review_count ?? data.numRatings ?? frontendReviewCount ?? 0;
  const averageRating = data.stars ?? data.avgRating ?? 0;
  const price = Number.isFinite(data.price) ? data.price : 0;
  const city = data.city ?? "";
  const address = data.address ?? "";
  const state = data.state ?? "";
  const country = data.country ?? "";
  const inferredType = inferTypeFromCategories(categories);
  const type =
    data.type ??
    inferredType ??
    (docSnapshot.ref.parent.id === "lifestyle" ? "lifestyle" : "food");

  return {
    id: docSnapshot.id,
    ...data,
    categories,
    city,
    address,
    state,
    country,
    type,
    category: primaryCategory,
    review_count_fe: Number.isFinite(frontendReviewCount)
      ? frontendReviewCount
      : reviewCount,
    review_count: reviewCount,
    stars: averageRating,
    numRatings: reviewCount,
    avgRating: averageRating,
    price,
    timestamp,
  };
}

export async function getRestaurantById(restaurantId) {
  if (!restaurantId) return null;

  try {
    const firestore = getAdminFirestore();
    const docSnapshot = await firestore
      .collection("restaurants")
      .doc(restaurantId)
      .get();

    if (!docSnapshot.exists) return null;

    return normalizeRestaurantSnapshot(docSnapshot);
  } catch (error) {
    console.error("Failed to load restaurant with admin SDK.", error);
    return null;
  }
}
