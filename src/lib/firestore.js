
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

// 🔹 Adiciona avaliação e atualiza médias
  async function updateWithRating(transaction, docRef, newRatingDocument, review) {
    const restaurantSnapshot = await transaction.get(docRef);

    if (!restaurantSnapshot.exists()) {
      throw new Error("Restaurant not found");
    }

    const data = restaurantSnapshot.data();
    const currentReviewCount = data.review_count ?? data.numRatings ?? 0;
    const currentAverageRating = data.stars ?? data.avgRating ?? 0;

    const updatedReviewCount = currentReviewCount + 1;
    const updatedAverageRating =
      updatedReviewCount > 0
        ? (currentAverageRating * currentReviewCount + review.rating) /
        updatedReviewCount
        : 0;

    transaction.set(newRatingDocument, review);
    transaction.update(docRef, {
      review_count: updatedReviewCount,
      stars: updatedAverageRating,
    });
  }

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

function applyQueryFilters(baseRef, { category, city, country, state, sort, type }) {
  const constraints = [];

  if (category) constraints.push(where("categories", "array-contains", category));
  if (city) constraints.push(where("city", "==", city));
  if (country) constraints.push(where("country", "==", country));
  if (state) constraints.push(where("state", "==", state));
  if (type) constraints.push(where("type", "==", type));

  const sortField = sort === "review" ? "review_count" : "stars";
  constraints.push(orderBy(sortField, "desc"));

  return query(baseRef, ...constraints);
}

function resolveGetRestaurantsArgs(possibleDbOrFilters = {}, maybeFilters = {}) {
  const looksLikeFirestore = Boolean(possibleDbOrFilters?._databaseId);

  return looksLikeFirestore
    ? { database: possibleDbOrFilters, filters: maybeFilters }
    : { database: db, filters: possibleDbOrFilters };
}

function getCollectionForType(database, type) {
  const collectionName = type === "lifestyle" ? "lifestyle" : "restaurants";
  return collection(database, collectionName);
}

// 🔹 Retorna lista de restaurantes
export async function getRestaurants(possibleDbOrFilters = {}, maybeFilters = {}) {
  const { database, filters } = resolveGetRestaurantsArgs(
    possibleDbOrFilters,
    maybeFilters
  );

  const restaurantsRef = getCollectionForType(database, filters.type);
  const restaurantsQuery = applyQueryFilters(restaurantsRef, {
    ...filters,
    type: filters.type ?? "food",
  });
  const results = await getDocs(restaurantsQuery);

  return results.docs.map(normalizeRestaurantSnapshot);
}

// 🔹 Escuta mudanças em tempo real
export function getRestaurantsSnapshot(cb, possibleDbOrFilters = {}, maybeFilters = {}) {
  const { database, filters } = resolveGetRestaurantsArgs(
    possibleDbOrFilters,
    maybeFilters
  );

  const restaurantsRef = getCollectionForType(database, filters.type);
  const restaurantsQuery = applyQueryFilters(restaurantsRef, {
    ...filters,
    type: filters.type ?? "food",
  });

  return onSnapshot(restaurantsQuery, (querySnapshot) => {

    const results = querySnapshot.docs.map(normalizeRestaurantSnapshot);
    cb(results);
  });
}

// 🔹 Busca restaurante por ID
      export async function getRestaurantById(restaurantId) {
        if (!restaurantId) return null;
        const docRef = doc(db, "restaurants", restaurantId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;

        return normalizeRestaurantSnapshot(docSnap);
      }

// 🔹 Escuta um restaurante específico
      export function getRestaurantSnapshotById(restaurantId, cb) {
        if (!restaurantId) return;
        const docRef = doc(db, "restaurants", restaurantId);

        return onSnapshot(docRef, (docSnapshot) => {
          const data = docSnapshot.data();
          if (!data) {
            cb(undefined);
            return;
          }
          cb(normalizeRestaurantSnapshot(docSnapshot));
        });
      }

      function normalizeRestaurantSnapshot(docSnapshot) {
        const data = docSnapshot.data();
        const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : null;

        const categories = Array.isArray(data.categories)
          ? data.categories
          : data.category
            ? [data.category]
            : [];
        const primaryCategory = data.category ?? categories[0] ?? "";

        const reviewCount = data.review_count ?? data.numRatings ?? 0;
        const averageRating = data.stars ?? data.avgRating ?? 0;
        const price = Number.isFinite(data.price) ? data.price : 0;
        const city =  data.city ?? "";
        const address = data.address ?? data.address;
        const state = data.state ?? "";
        const country = data.country ?? "";
        const type = data.type ??
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
          review_count: reviewCount,
          stars: averageRating,
          numRatings: reviewCount,
          avgRating: averageRating,
          price,
          timestamp,
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

// 🔹 Escuta reviews em tempo real
export function getReviewsSnapshotByRestaurantId(
  restaurantId,
  cb,
  firestoreInstance
) {
  if (!restaurantId || typeof cb !== "function") return () => {};

  const database = resolveFirestoreInstance(firestoreInstance);
  const reviewsQuery = query(
    collection(database, "restaurants", restaurantId, "ratings"),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(reviewsQuery, (querySnapshot) => {
    const results = querySnapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();

      return {
        id: docSnapshot.id,
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp,
      };
    });

    cb(results);
  });
}