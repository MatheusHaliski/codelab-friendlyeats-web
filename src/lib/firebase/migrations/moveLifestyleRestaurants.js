import {
  collection,
  getDocs,
  writeBatch,
  doc,
} from "firebase/firestore";

const lifestyleKeywords  = [
  "life",
  "education",
  "entertainment",
  "parks",
  "appliances",
  "arcade",
  "crafts",
  "galleries",
  "auto",
  "battery",
  "business",
  "cinema",
  "clothing",
  "electronics",
  "motor",
  "vehicles",
  "school",
  "herbal",
  "comedy",
  "clubs",
  "gifts",
  "flowers",
  "equipment",
  "gas",
  "music",
  "museum",
  "laser",
  "tag",
  "golf",
  "lessons",
  "outdoor",
  "gear",
  "karts",
  "beaches",
  "accessories",
  "car",
  "dealers",
  "tours",
  "boating",
  "boat",
  "casinos",
  "classes",
  "cosmetics",
  "furniture",
  "fireworks",
  "fishing",
  "florists",
  "churches",
  "christmas trees",
  "crane",
  "clothing",
  "children",
  "spas",
  "heating",
  "air",
  "conditioning",
  "art",
  "galleries",
  "yoga",
  "DVD",
  "cleaning",
  "gun",
  "rifle",
  "ammo",
  "hair",
  "funeral",
  "furniture",
  "musicians",
  "motorcycles",
  "gear",
  "bath",
  "hotels",
  "health",
  "yelp events",
  "nail",
  "wear",
  "massage",
  "doctors",
  "repair",
  "pool",
  "pub",
  "race",
  "tracks",
  "fashion",
  "transportation",
  "financial",
  "educational",
  "books",
  "HVAC",
  "IT",
  "Computer",
  "hardware",
  "mental",
  "health",
  "counseling",
  "removal",
  "indoor",
  "playcenter",
  "care",
  "comedy",
  "country",
  "catonese",
  "car",
  "installation",
  "waxing",
  "drugstores",
  "banks",
];

/**
 * Returns true if any category matches at least one lifestyle keyword.
 */
function hasLifestyleCategory(categories = []) {
  if (!Array.isArray(categories)) return false;

  return categories.some((cat) => {
    const lower = cat.toLowerCase();
    return lifestyleKeywords.some((kw) => lower.includes(kw));
  });
}

/**
 * Moves restaurants that contain lifestyle keywords
 * from "restaurants" → "lifestyle"
 */
export async function moveLifestyleRestaurants(db) {
  const restaurantsRef = collection(db, "restaurants");
  const snapshot = await getDocs(restaurantsRef);

  if (snapshot.empty) return;

  const batch = writeBatch(db);

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const categories = data.categories || [];

    if (hasLifestyleCategory(categories)) {
      // NEW location
      const newRef = doc(db, "lifestyle", docSnap.id);

      batch.set(newRef, data);   // copy
      batch.delete(docSnap.ref); // delete original
    }
  });

  await batch.commit();
}
