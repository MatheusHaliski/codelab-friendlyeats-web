// -------------------------------------------------------------
// Firebase Imports
// -------------------------------------------------------------
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  runTransaction,
  Timestamp,
  where,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

import { db } from "@/src/lib/firebase/clientApp";

// -------------------------------------------------------------
// Utility Helpers
// -------------------------------------------------------------
function resolveFirestoreInstance(possibleDb) {
  return possibleDb ?? db;
}

function isFirestoreInstance(value) {
  return (
    value &&
    typeof value === "object" &&
    (typeof value._delegate === "object" || typeof value._databaseId === "object")
  );
}

// -------------------------------------------------------------
// Update image reference in Firestore
// -------------------------------------------------------------
export async function updateRestaurantImageReference(
  restaurantId,
  publicImageUrl,
  firestoreInstance
) {
  if (!restaurantId || !publicImageUrl) return;
  const database = resolveFirestoreInstance(firestoreInstance);
  const restaurantRef = doc(database, "restaurants", restaurantId);
  await updateDoc(restaurantRef, { photo: publicImageUrl });
}

// -------------------------------------------------------------
// INTERNAL: Rating aggregation
// -------------------------------------------------------------
async function updateWithRating(transaction, docRef, newRatingDocument, review) {
  const restaurantSnapshot = await transaction.get(docRef);
  if (!restaurantSnapshot.exists()) throw new Error("Restaurant not found");

  const data = restaurantSnapshot.data();
  const currentNumRatings = data.numRatings || 0;
  const currentSumRating = data.sumRating || 0;
  const currentReviewCount = data.review_count ?? currentNumRatings;
  const currentAverageRating = data.stars ?? data.avgRating ?? 0;

  const updatedNumRatings = currentNumRatings + 1;
  const updatedSumRating = currentSumRating + review.rating;
  const updatedAvgRating = updatedSumRating / updatedNumRatings;

  const updatedReviewCount = currentReviewCount + 1;
  const updatedAverageRating =
    (currentAverageRating * currentReviewCount + review.rating) /
    updatedReviewCount;

  transaction.set(newRatingDocument, review);
  transaction.update(docRef, {
    numRatings: updatedNumRatings,
    sumRating: updatedSumRating,
    avgRating: updatedAvgRating,
    review_count: updatedReviewCount,
    stars: updatedAverageRating,
  });
}

// -------------------------------------------------------------
// Add review
// -------------------------------------------------------------
export async function addReviewToRestaurant(
  firestoreOrRestaurantId,
  maybeRestaurantId,
  maybeReview
) {
  const isIdFirst = typeof firestoreOrRestaurantId === "string";
  const database = resolveFirestoreInstance(isIdFirst ? undefined : firestoreOrRestaurantId);
  const restaurantId = isIdFirst ? firestoreOrRestaurantId : maybeRestaurantId;
  const review = isIdFirst ? maybeRestaurantId : maybeReview;

  if (!restaurantId) throw new Error("restaurantId required");
  if (!review || typeof review.rating !== "number")
    throw new Error("Valid numeric rating required");

  const restaurantRef = doc(database, "restaurants", restaurantId);
  const ratingsCollection = collection(database, "restaurants", restaurantId, "ratings");
  const newRatingDocument = doc(ratingsCollection);

  const reviewWithMetadata = {
    ...review,
    rating: Number(review.rating),
    timestamp: Timestamp.now(),
  };

  await runTransaction(database, async (transaction) => {
    await updateWithRating(
      transaction,
      restaurantRef,
      newRatingDocument,
      reviewWithMetadata
    );
  });
}

// -------------------------------------------------------------
// Query filtering
// -------------------------------------------------------------
function applyQueryFilters(baseRef, { category, city, price, sort }) {
  const constraints = [];

  if (category) constraints.push(where("categories", "array-contains", category));
  if (city) constraints.push(where("city", "==", city));
  if (price && !isNaN(Number(price))) constraints.push(where("price", "==", Number(price)));

  const sortField = sort?.toLowerCase() === "review" ? "review_count" : "stars";
  constraints.push(orderBy(sortField, "desc"));

  return query(baseRef, ...constraints);
}

// -------------------------------------------------------------
// Get restaurants (promise)
// -------------------------------------------------------------
export async function getRestaurants(possibleDbOrFilters = {}, maybeFilters) {
  const hasExplicitDb = isFirestoreInstance(possibleDbOrFilters);
  const filters = hasExplicitDb ? maybeFilters : possibleDbOrFilters;
  const database = resolveFirestoreInstance(hasExplicitDb ? possibleDbOrFilters : undefined);

  const restaurantsRef = collection(database, "restaurants");
  const results = await getDocs(applyQueryFilters(restaurantsRef, filters));

  return results.docs.map(normalizeRestaurantSnapshot);
}

// -------------------------------------------------------------
// SNAPSHOT: Restaurants list
// -------------------------------------------------------------
export function getRestaurantsSnapshot(cbOrFirestore, maybeCallback, maybeFilters = {}) {
  const hasExplicitDb = isFirestoreInstance(cbOrFirestore);
  const callback = hasExplicitDb ? maybeCallback : cbOrFirestore;
  const filters = hasExplicitDb ? maybeFilters : maybeCallback;

  if (typeof callback !== "function")
    throw new Error("Callback required for snapshots");

  const database = resolveFirestoreInstance(hasExplicitDb ? cbOrFirestore : undefined);
  const restaurantsRef = collection(database, "restaurants");

  return onSnapshot(
    applyQueryFilters(restaurantsRef, filters),
    (querySnapshot) => {
      callback(querySnapshot.docs.map(normalizeRestaurantSnapshot));
    }
  );
}

// -------------------------------------------------------------
// Get restaurant by ID (promise)
// -------------------------------------------------------------
export async function getRestaurantById(possibleDbOrRestaurantId, maybeRestaurantId) {
  const hasExplicitDb = isFirestoreInstance(possibleDbOrRestaurantId);
  const database = resolveFirestoreInstance(
    hasExplicitDb ? possibleDbOrRestaurantId : undefined
  );

  const restaurantId = hasExplicitDb
    ? maybeRestaurantId
    : possibleDbOrRestaurantId;

  if (!restaurantId) return null;

  const docSnap = await getDoc(doc(database, "restaurants", restaurantId));
  return docSnap.exists() ? normalizeRestaurantSnapshot(docSnap) : null;
}

// -------------------------------------------------------------
// SNAPSHOT: Restaurant by ID (🔥 faltava no seu projeto)
// -------------------------------------------------------------
export function getRestaurantSnapshotById(restaurantId, callback, firestoreInstance) {
  if (!restaurantId || typeof callback !== "function") return;

  const database = resolveFirestoreInstance(firestoreInstance);
  const docRef = doc(database, "restaurants", restaurantId);

  return onSnapshot(docRef, (snapshot) => {
    callback(snapshot.exists() ? normalizeRestaurantSnapshot(snapshot) : null);
  });
}

// -------------------------------------------------------------
// SNAPSHOT: Reviews by restaurant ID (🔥 faltava também)
// -------------------------------------------------------------
export function getReviewsSnapshotByRestaurantId(
  restaurantId,
  callback,
  firestoreInstance
) {
  if (!restaurantId || typeof callback !== "function") return;

  const database = resolveFirestoreInstance(firestoreInstance);
  const ratingsRef = collection(database, "restaurants", restaurantId, "ratings");
  const q = query(ratingsRef, orderBy("timestamp", "desc"));

  return onSnapshot(q, (querySnapshot) => {
    const results = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() ?? null,
    }));
    callback(results);
  });
}

// -------------------------------------------------------------
// Normalize Firestore data
// -------------------------------------------------------------
function normalizeRestaurantSnapshot(docSnapshot) {
  const data = docSnapshot.data() ?? {};
  return {
    id: docSnapshot.id,
    ...data,
    categories: Array.isArray(data.categories)
      ? data.categories
      : data.category
      ? [data.category]
      : [],
    category: data.category ?? "",
    city: data.city ?? "",
    review_count: data.review_count ?? data.numRatings ?? 0,
    stars: data.stars ?? data.avgRating ?? 0,
    price: Number.isFinite(data.price) ? data.price : 0,
    timestamp: data.timestamp?.toDate?.() ?? null,
    photo: data.photo ?? null,
  };
}
