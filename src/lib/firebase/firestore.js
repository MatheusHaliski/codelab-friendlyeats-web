import { generateFakeRestaurantsAndReviews } from "@/src/lib/fakeRestaurants.js";

import {
  collection,
  onSnapshot,
  query,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  orderBy,
  Timestamp,
  runTransaction,
  where,
  addDoc,
  getFirestore,
} from "firebase/firestore";

import { db } from "@/src/lib/firebase/clientApp";

export async function updateRestaurantImageReference(
  restaurantId,
  publicImageUrl
) {
  const restaurantRef = doc(collection(db, "restaurants"), restaurantId);
  if (restaurantRef) {
    await updateDoc(restaurantRef, { photo: publicImageUrl });
  }
}

const updateWithRating = async (
  transaction,
  docRef,
  newRatingDocument,
  review
) => {
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
};

export async function addReviewToRestaurant(db, restaurantId, review) {
  if (!restaurantId) {
    throw new Error("A restaurantId is required to add a review");
  }

  if (!review || typeof review.rating !== "number") {
    throw new Error("A numeric rating is required to add a review");
  }

  const restaurantRef = doc(db, "restaurants", restaurantId);
  const ratingsCollection = collection(db, "restaurants", restaurantId, "ratings");
  const newRatingDocument = doc(ratingsCollection);

  const reviewWithMetadata = {
    ...review,
    rating: Number(review.rating),
    timestamp: Timestamp.now(),
  };

  await runTransaction(db, async (transaction) => {
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

  if (category) {
    constraints.push(where("category", "==", category));
  }

  if (city) {
    constraints.push(where("city", "==", city));
  }

  if (price) {
    let priceValue = price;
    if (typeof price === "string") {
      priceValue = price.startsWith("$") ? price.length : Number(price);
    }
    const numericPrice = Number(priceValue);
    if (!Number.isFinite(numericPrice)) {
      console.warn("Ignoring invalid price filter", price);
    } else {
      constraints.push(where("price", "==", numericPrice));
    }
  }

  const sortField = sort === "Review" ? "numRatings" : "avgRating";
  constraints.push(orderBy(sortField, "desc"));

  return query(baseRef, ...constraints);
}

export async function getRestaurants(database = db, filters = {}) {
  const restaurantsRef = collection(database, "restaurants");
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

export async function getRestaurantById(db, restaurantId) {
  if (!restaurantId) {
    console.log("Error: Invalid ID received: ", restaurantId);
    return;
  }
  const docRef = doc(db, "restaurants", restaurantId);
  const docSnap = await getDoc(docRef);
  return {
    ...docSnap.data(),
    timestamp: docSnap.data().timestamp.toDate(),
  };
}

export function getRestaurantSnapshotById(restaurantId, cb) {
  if (!restaurantId) {
    console.log("Error: Invalid restaurantId received: ", restaurantId);
    return;
  }

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

export async function getReviewsByRestaurantId(db, restaurantId) {
  if (!restaurantId) {
    console.log("Error: Invalid restaurantId received: ", restaurantId);
    return;
  }

  const q = query(
    collection(db, "restaurants", restaurantId, "ratings"),
    orderBy("timestamp", "desc")
  );

  const results = await getDocs(q);
  return results.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
      // Only plain objects can be passed to Client Components from Server Components
      timestamp: doc.data().timestamp.toDate(),
    };
  });
}

export function getReviewsSnapshotByRestaurantId(restaurantId, cb) {
  if (!restaurantId) {
    console.log("Error: Invalid restaurantId received: ", restaurantId);
    return;
  }

  const q = query(
    collection(db, "restaurants", restaurantId, "ratings"),
    orderBy("timestamp", "desc")
  );
  return onSnapshot(q, (querySnapshot) => {
    const results = querySnapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
        // Only plain objects can be passed to Client Components from Server Components
        timestamp: doc.data().timestamp.toDate(),
      };
    });
    cb(results);
  });
}

export async function addFakeRestaurantsAndReviews() {
  const data = await generateFakeRestaurantsAndReviews();
  for (const { restaurantData, ratingsData } of data) {
    try {
      const docRef = await addDoc(
        collection(db, "restaurants"),
        restaurantData
      );

      for (const ratingData of ratingsData) {
        await addDoc(
          collection(db, "restaurants", docRef.id, "ratings"),
          ratingData
        );
      }
    } catch (e) {
      console.log("There was an error adding the document");
      console.error("Error adding document: ", e);
    }
  }
}
