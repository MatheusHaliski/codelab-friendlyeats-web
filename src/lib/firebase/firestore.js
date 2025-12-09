// 🔹 Imports principais do Firebase
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

function resolveFirestoreInstance(possibleDb) {
  return possibleDb ?? db;
}

function isFirestoreInstance(value) {
  if (!value || typeof value !== "object") return false;
  return (
    typeof value._delegate === "object" ||
    typeof value._databaseId === "object" ||
    value.type === "firestore"
  );
}

// ✅ Corrigido: remover duplicação da referência
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

// 🔹 Atualiza média e contadores de reviews
async function updateWithRating(transaction, docRef, newRatingDocument, review) {
  const restaurantSnapshot = await transaction.get(docRef);
  if (!restaurantSnapshot.exists()) {
    throw new Error("Restaurant not found");
  }

  const data = restaurantSnapshot.data();
  const currentNumRatings = data.numRatings || 0;
  const currentSumRating = data.sumRating || 0;
  const currentReviewCount = data.review_count ?? data.numRatings ?? 0;
  const currentAverageRating = data.stars ?? data.avgRating ?? 0;

  const updatedNumRatings = currentNumRatings + 1;
  const updatedSumRating = currentSumRating + review.rating;
  const updatedAvgRating =
    updatedNumRatings > 0 ? updatedSumRating / updatedNumRatings : 0;
  const updatedReviewCount = currentReviewCount + 1;
  const updatedAverageRating =
    updatedReviewCount > 0
      ? (currentAverageRating * currentReviewCount + review.rating) /
        updatedReviewCount
      : 0;

  transaction.set(newRatingDocument, review);
  transaction.update(docRef, {
    numRatings: updatedNumRatings,
    sumRating: updatedSumRating,
    avgRating: updatedAvgRating,
    review_count: updatedReviewCount,
    stars: updatedAverageRating,
  });
}

// 🔹 Adiciona review ao restaurante
export async function addReviewToRestaurant(
  firestoreOrRestaurantId,
  maybeRestaurantId,
  maybeReview
) {
  const isRestaurantIdFirstArg = typeof firestoreOrRestaurantId === "string";
  const database = resolveFirestoreInstance(
    isRestaurantIdFirstArg ? undefined : firestoreOrRestaurantId
  );
  const restaurantId = isRestaurantIdFirstArg
    ? firestoreOrRestaurantId
    : maybeRestaurantId;
  const review = isRestaurantIdFirstArg ? maybeRestaurantId : maybeReview;

  if (!restaurantId) throw new Error("A restaurantId is required");
  if (!review || typeof review.rating !== "number")
    throw new Error("A numeric rating is required");

  const restaurantRef = doc(database, "restaurants", restaurantId);
  const ratingsCollection = collection(
    database,
    "restaurants",
    restaurantId,
    "ratings"
  );
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

function applyQueryFilters(baseRef, { category, city, price, sort }) {
  const constraints = [];

  // Filtro por categoria (funciona com array-contains)
  if (category) constraints.push(where("categories", "array-contains", category));

  // Filtro por cidade
  if (city) constraints.push(where("city", "==", city));

  // 🔹 Corrigido: ignora preço se o campo não existir
  if (price && !isNaN(Number(price))) {
    constraints.push(where("price", "==", Number(price)));
  }

  // 🔹 Ordenação
  const sortField =
    sort?.toLowerCase() === "review" ? "review_count" : "stars";
  constraints.push(orderBy(sortField, "desc"));

  console.log("📡 Firestore query filters =>", { category, city, price, sort, sortField });
  return query(baseRef, ...constraints);
}


// 🔹 Retorna lista única (promessa)
export async function getRestaurants(possibleDbOrFilters = {}, maybeFilters) {
  const hasExplicitDb = isFirestoreInstance(possibleDbOrFilters);
  const filters = (hasExplicitDb ? maybeFilters : possibleDbOrFilters) ?? {};
  const database = resolveFirestoreInstance(
    hasExplicitDb ? possibleDbOrFilters : undefined
  );

  const restaurantsRef = collection(database, "restaurants");
  const restaurantsQuery = applyQueryFilters(restaurantsRef, filters);
  const results = await getDocs(restaurantsQuery);

  return results.docs.map(normalizeRestaurantSnapshot);
}

export function getRestaurantsSnapshot(cbOrFirestore, maybeCallback, maybeFilters = {}) {
  const hasExplicitDb = isFirestoreInstance(cbOrFirestore);
  const callback = hasExplicitDb ? maybeCallback : cbOrFirestore;
  const filters = (hasExplicitDb ? maybeFilters : maybeCallback) ?? {};

  if (typeof callback !== "function") {
    throw new Error("A callback function is required for getRestaurantsSnapshot");
  }

  const database = resolveFirestoreInstance(hasExplicitDb ? cbOrFirestore : undefined);
  const restaurantsRef = collection(database, "restaurants");
  const restaurantsQuery = applyQueryFilters(restaurantsRef, filters);

  try {
    return onSnapshot(restaurantsQuery, (querySnapshot) => {
      const results = querySnapshot.docs.map(normalizeRestaurantSnapshot);
      callback(results);
    });
  } catch (error) {
    console.error("🔥 Firestore snapshot error:", error);
  }
}


export async function getRestaurantById(
  possibleDbOrRestaurantId,
  maybeRestaurantId
) {
  const hasExplicitDb = isFirestoreInstance(possibleDbOrRestaurantId);
  const database = resolveFirestoreInstance(
    hasExplicitDb ? possibleDbOrRestaurantId : undefined
  );

  const restaurantId = hasExplicitDb
    ? maybeRestaurantId
    : possibleDbOrRestaurantId;

 if (!restaurantId) return null;
const docRef = doc(database, "restaurants", restaurantId);
const docSnap = await getDoc(docRef);
if (!docSnap.exists()) return null;

  return normalizeRestaurantSnapshot(docSnap);
}
// 🔹 Normaliza snapshot do Firestore
function normalizeRestaurantSnapshot(docSnapshot) {
  const data = docSnapshot.data();
  const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : null;
  const hasPhotoField = Object.prototype.hasOwnProperty.call(data, "photo");
  const normalizedPhoto = hasPhotoField ? data.photo ?? null : null;

  const categories = Array.isArray(data.categories)
    ? data.categories
    : data.category
    ? [data.category]
    : [];
  const primaryCategory = data.category ?? categories[0] ?? "";

  const reviewCount = data.review_count ?? data.numRatings ?? 0;
  const averageRating = data.stars ?? data.avgRating ?? 0;
  const price = Number.isFinite(data.price) ? data.price : 0;
  const city = data.city ?? data.location?.city ?? "";

  return {
    id: docSnapshot.id,
    ...data,
    categories,
    category: primaryCategory,
    city,
    review_count: reviewCount,
    stars: averageRating,
    numRatings: reviewCount,
    avgRating: averageRating,
    price,
    timestamp,
    photo: normalizedPhoto,
  };
}

// 🔹 Busca reviews de um restaurante
export async function getReviewsByRestaurantId(restaurantId) {
  if (!restaurantId) return [];
  const q = query(
    collection(db, "restaurants", restaurantId, "ratings"),
    orderBy("timestamp", "desc")
  );
  const results = await getDocs(q);

  return results.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp.toDate(),
  }));
}
// ==========================================
// 🔥 Adiciona suporte ao snapshot por ID
// ==========================================
export function getRestaurantSnapshotById(restaurantId, callback, firestoreInstance) {
  if (!restaurantId || typeof callback !== "function") return;

  const database = resolveFirestoreInstance(firestoreInstance);
  const docRef = doc(database, "restaurants", restaurantId);

  return onSnapshot(docRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback(normalizeRestaurantSnapshot(snapshot));
  });
}

// ==========================================
// 🔥 Snapshot para reviews (por restaurante)
// ==========================================
export function getReviewsSnapshotByRestaurantId(restaurantId, callback, firestoreInstance) {
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
