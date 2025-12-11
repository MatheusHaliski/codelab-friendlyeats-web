import {
  collection,
  getDocs,
  writeBatch,
  doc,
} from "firebase/firestore";



const specifickeywords =
  ["bar","bars"]

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

export async function migrateLifestyleRestaurants() {
  const restaurantsRef = collection(db, "restaurants");
  const snapshot = await getDocs(restaurantsRef);

  if (snapshot.empty) {
    console.log("Nenhum documento encontrado na coleção restaurants.");
    return;
  }

  console.log(`Verificando ${snapshot.docs.length} documentos...`);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const id = docSnap.id;

    // Só move se o campo existir E for lifestyle
    if (data.type !== "lifestyle") {
      console.log(`Ignorando ${id} (type = ${data.type})`);
      continue;
    }

    const lifestyleRef = doc(db, "lifestyle", id);

    console.log(`Movendo ${id} → coleção lifestyle...`);

    // Copia o documento inteiro
    await setDoc(lifestyleRef, data);

    // Opcional: deletar da coleção "restaurants"
    // ❗ Atenção: isso remove o doc original permanentemente
    await deleteDoc(doc(db, "restaurants", id));
  }

  console.log("Migração concluída!");
}

/**
 * Returns true if any category matches at least one lifestyle keyword.
 */
function hasLifestyleCategory(categories = []) {
  if (!Array.isArray(categories)) return false;

  return categories.some((cat) => {
    const lower = cat.toLowerCase();

    // separa por espaço, remove pontuações, filtra strings vazias
    const words = lower
      .replace(/[^\w\s]/g, "") // remove ".", ",", etc
      .split(/\s+/)
      .filter(Boolean);

    return lifestyleKeywords.some((kw) => {
      const keyword = kw.toLowerCase();
      return words.includes(keyword); // 🔥 palavra inteira
    });
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
/**
 * Returns true if any category matches at least one FOOD keyword (keywordsfix).
 */
function hasFoodCategory(categories = []) {
  if (!Array.isArray(categories)) return false;

  return categories.some((cat) => {
    const lower = cat.toLowerCase();
    return keywordsfix.some((kw) => lower.includes(kw.toLowerCase()));
  });
}

/**
 * Moves restaurants that contain FOOD keywords
 * from "lifestyle" → "restaurants", and also updates type → "food".
 */
export async function moveFoodBackToRestaurants(db) {
  const lifestyleRef = collection(db, "lifestyle");
  const snapshot = await getDocs(lifestyleRef);

  if (snapshot.empty) return;

  const batch = writeBatch(db);

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const categories = data.categories || [];

    if (hasFoodCategory(categories)) {

      const updatedData = {
        ...data,
        type: "food",  // 🔥 Define o tipo correto
      };

      // NEW location
      const newRef = doc(db, "restaurants", docSnap.id);

      batch.set(newRef, updatedData);  // copy + update type
      batch.delete(docSnap.ref);       // remove from lifestyle
    }
  });

  await batch.commit();
}
