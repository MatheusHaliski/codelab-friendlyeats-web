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

// 🔹 Atualiza imagem de restaurante
export async function updateRestaurantImageReference(restaurantId, publicImageUrl) {
  if (!restaurantId || !publicImageUrl) return;

  const restaurantRef = doc(db, "restaurants", restaurantId);
  await updateDoc(restaurantRef, { photo: publicImageUrl });
}

// 🔹 Adiciona avaliação e atualiza médias
async function updateWithRating(transaction, docRef, newRatingDocument, review) {
  const restaurantSnapshot = await transaction.get(docRef);

  if (!restaurantSnapshot.exists()) {
    throw new Error("Restaurant not found");
  }

  const data = restaurantSnapshot.data();
  const currentNumRatings = data.numRatings || 0;
  const currentSumRating = data.sumRating || 0;

  const updatedNumRatings = currentNumRatings + 1;
  const updatedSumRating = currentSumRating + review.rating;
  const updatedAvgRating =
    updatedNumRatings > 0 ? updatedSumRating / updatedNumRatings : 0;

  transaction.set(newRatingDocument, review);
  transaction.update(docRef, {
    numRatings: updatedNumRatings,
    sumRating: updatedSumRating,
    avgRating: updatedAvgRating,
  });
}

// 🔹 Função pública para adicionar review
export async function addReviewToRestaurant(restaurantId, review) {
  if (!restaurantId) throw new Error("A restaurantId is required");
  if (!review || typeof review.rating !== "number")
    throw new Error("A numeric rating is required");

  const restaurantRef = doc(db, "restaurants", restaurantId);
  const ratingsCollection = collection(db, "restaurants", restaurantId, "ratings");
  const newRatingDocument = doc(ratingsCollection);

  const reviewWithMetadata = {
    ...review,
    rating: Number(review.rating),
    timestamp: Timestamp.now(),
  };

  await runTransaction(db, async (transaction) => {
    await updateWithRating(transaction, restaurantRef, newRatingDocument, reviewWithMetadata);
  });
}

// 🔹 Aplica filtros de consulta
function applyQueryFilters(baseRef, { category, city, price, sort }) {
  const constraints = [];

  if (category) constraints.push(where("category", "==", category));
  if (city) constraints.push(where("city", "==", city));

  if (price) {
    let priceValue = price;
    if (typeof price === "string") {
      priceValue = price.startsWith("$") ? price.length : Number(price);
    }
    const numericPrice = Number(priceValue);
    if (Number.isFinite(numericPrice)) {
      constraints.push(where("price", "==", numericPrice));
    } else {
      console.warn("Ignoring invalid price filter", price);
    }
  }

  const sortField = sort === "Review" ? "numRatings" : "avgRating";
  constraints.push(orderBy(sortField, "desc"));

  return query(baseRef, ...constraints);
}

// 🔹 Retorna lista de restaurantes
export async function getRestaurants(filters = {}) {
  const restaurantsRef = collection(db, "restaurants");
  const restaurantsQuery = applyQueryFilters(restaurantsRef, filters);
  const results = await getDocs(restaurantsQuery);

  return results.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      ...data,
      timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : null,
    };
  });
}

// 🔹 Escuta mudanças em tempo real
export function getRestaurantsSnapshot(cb, filters = {}) {
  const restaurantsRef = collection(db, "restaurants");
  const restaurantsQuery = applyQueryFilters(restaurantsRef, filters);

  return onSnapshot(restaurantsQuery, (querySnapshot) => {
    const results = querySnapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : null,
      };
    });
    cb(results);
  });
}

// 🔹 Busca restaurante por ID
export async function getRestaurantById(restaurantId) {
  if (!restaurantId) return null;
  const docRef = doc(db, "restaurants", restaurantId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  return {
    id: docSnap.id,
    ...docSnap.data(),
    timestamp: docSnap.data().timestamp?.toDate(),
  };
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
    cb({
      id: docSnapshot.id,
      ...data,
      timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : null,
    });
  });
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
