import { getAdminFirestore } from "@/src/lib/firebase/adminApp";
import {
  inferTypeFromCategories,
  restaurantMatchesType,
} from "@/src/lib/firebase/categoryKeywords";

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
  const address = data.address ?? data.address;
  const state = data.state ?? "";
  const country = data.country ?? "";
  const inferredType = inferTypeFromCategories(categories);
  const type =
    data.type ?? inferredType ??
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

function applyQueryFilters(baseRef, { category, city, country, state, sort }) {
  let queryRef = baseRef;

  if (category) queryRef = queryRef.where("categories", "array-contains", category);
  if (city) queryRef = queryRef.where("city", "==", city);
  if (country) queryRef = queryRef.where("country", "==", country);
  if (state) queryRef = queryRef.where("state", "==", state);

  const sortField = sort === "review" ? "review_count" : "stars";
  return queryRef.orderBy(sortField, "desc");
}

function getCollectionForType(database, type) {
  const collectionName = type === "lifestyle" ? "lifestyle" : "restaurants";
  return database.collection(collectionName);
}

export async function getRestaurantsAdmin(filters = {}) {
  const firestore = getAdminFirestore();
  const restaurantsRef = getCollectionForType(firestore, filters.type);
  const restaurantsQuery = applyQueryFilters(restaurantsRef, {
    ...filters,
    type: filters.type ?? "food",
  });
  const results = await restaurantsQuery.get();

  return results.docs
    .map(normalizeRestaurantSnapshot)
    .filter((restaurant) => restaurantMatchesType(restaurant, filters.type));
}
