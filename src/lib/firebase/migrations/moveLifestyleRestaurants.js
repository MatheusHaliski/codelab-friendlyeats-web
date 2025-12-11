import {
  collection,
  getDocs,
  writeBatch,
  doc,
} from "firebase/firestore";



const specifickeywords =
  ["bar","bars","hotels","hotel"]

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

const keywordsfix = [
  "restaurants", "sandwiches", "puerto rican","caribbean","ethnic food","greek","food","latin american","french","breakfast & brunch","specialty food","juice bars & smoothies","italian","burguers","puerto rican","pizza","mexican","ice cream & frozen yogurt","cuban","bagels",
  "ethnic food","american(new)","american(traditional)","food delivery services","chicken wings","cheese shops","macarons","pasta shops","pizza","filipino","specialty food","seafood","irish","vegetarian","vietnamese","indian"
]


/**
 * Returns true if any category matches FOOD keywords.
 */
function hasFoodCategory(categories = []) {
  if (!Array.isArray(categories)) return false;

  return categories.some((cat) => {
    const lower = cat.toLowerCase();
    return keywordsfix.some((kw) => lower.includes(kw.toLowerCase()));
  });
}

/**
 * Returns true if any category matches LIFESTYLE keywords.
 */
function hasLifestyleCategory(categories = []) {
  if (!Array.isArray(categories)) return false;

  return categories.some((cat) => {
    const lower = cat.toLowerCase();
    return specifickeywords.some((kw) => lower.includes(kw));
  });
}

/* -------------------------------------------------------
   MOVE lifestyle → restaurants
-------------------------------------------------------- */
export async function moveLifestyleRestaurants(db) {
  console.log("🔍 Iniciando verificação: lifestyle → restaurants");

  const restaurantsRef = collection(db, "restaurants");
  const snapshot = await getDocs(restaurantsRef);

  if (snapshot.empty) {
    console.log("⚠️ Nenhum documento encontrado em 'lifestyle'.");
    return;
  }

  const batch = writeBatch(db);

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const categories = data.categories || [];

    console.log(`📄 Analisando lifestyle/${docSnap.id}`);
    console.log("   Categorias:", categories);

    if (hasLifestyleCategory(categories)) {
      console.log(`   ✅ MOVENDO → restaurants/${docSnap.id}`);

      const newRef = doc(db, "lifestyle", docSnap.id);
      batch.set(newRef, data);
      batch.delete(docSnap.ref);
    } else {
      console.log("   ⏭️ Ignorado — não contém lifestyle keywords.");
    }
  });

  await batch.commit();
  console.log("🚀 Concluído: lifestyle → restaurants");
}


/* -------------------------------------------------------
   MOVE restaurants → food (especificamente food keywords)
-------------------------------------------------------- */
export async function moveFoodBackToRestaurants(db) {
  console.log("🔍 Iniciando verificação: lifestyle → restaurants (food)");

  const lifestyleRef = collection(db, "lifestyle");
  const snapshot = await getDocs(lifestyleRef);

  if (snapshot.empty) {
    console.log("⚠️ Nenhum documento encontrado em 'lifestyle'.");
    return;
  }

  const batch = writeBatch(db);

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const categories = data.categories || [];

    console.log(`📄 Analisando lifestyle/${docSnap.id}`);
    console.log("   Categorias:", categories);

    if (hasFoodCategory(categories)) {
      console.log(`   🍕 MOVENDO PARA restaurants/${docSnap.id} (type=food)`);

      const updatedData = {
        ...data,
        type: "food",
      };

      const newRef = doc(db, "restaurants", docSnap.id);
      batch.set(newRef, updatedData);
      batch.delete(docSnap.ref);
    } else {
      console.log("   ⏭️ Ignorado — não contém food keywords.");
    }
  });

  await batch.commit();
  console.log("🚀 Concluído: lifestyle → restaurants (food)");
}
