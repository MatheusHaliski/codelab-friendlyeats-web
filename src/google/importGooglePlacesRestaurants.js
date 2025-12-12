import admin from "firebase-admin";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { searchRestaurantsByCity } from "./googlePlaces.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FALLBACK_PHOTO =
  "https://codelab-friendlyeats-web--funcionarioslistaapp2025.us-central1.hosted.app/fallbackfood.png";
const SERVICE_ACCOUNT_PATH = path.resolve(
  process.env.SERVICE_ACCOUNT_PATH ?? "ServiceKey.json"
);
const CITY_DATA_PATH = path.resolve(
  process.env.US_CITIES_FILE ?? path.join(__dirname, "usCitiesTemplate.json")
);
const MAX_RESULT_COUNT = Number(process.env.PLACES_MAX_RESULTS ?? 100);
const SEARCH_RADIUS = Number(process.env.PLACES_RADIUS_METERS ?? 3000);

function initializeFirebase() {
  if (admin.apps.length) return admin.firestore();

  try {
    admin.initializeApp({
      credential: admin.credential.cert(SERVICE_ACCOUNT_PATH),
    });
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase Admin:", error.message);
    throw error;
  }

  const db = admin.firestore();
  db.settings({ ignoreUndefinedProperties: true });
  return db;
}

function loadCities() {
  if (!fs.existsSync(CITY_DATA_PATH)) {
    throw new Error(
      `Arquivo de cidades não encontrado em ${CITY_DATA_PATH}. Crie um JSON contendo "city" e "state".`
    );
  }

  const raw = fs.readFileSync(CITY_DATA_PATH, "utf-8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("O arquivo de cidades deve ser um array JSON.");
  }

  return parsed.map((entry) => ({
    city: entry.city,
    state: entry.state,
    country: entry.country ?? "USA",
    radius: entry.radius,
    maxResultCount: entry.maxResultCount,
  }));
}

function extractAddressComponent(place, types = []) {
  return (
    place.addressComponents?.find((component) =>
      types.some((type) => component.types?.includes(type))
    )?.longText ?? null
  );
}

async function resolvePhotoUrl(place) {
  const photoName = place.photos?.[0]?.name;
  if (!photoName) return FALLBACK_PHOTO;

  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1600&key=${process.env.GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": process.env.GOOGLE_API_KEY,
      },
      redirect: "follow",
    });

    if (response.ok) {
      return response.url || FALLBACK_PHOTO;
    }
  } catch (error) {
    console.error("⚠️ Erro ao buscar foto:", error.message);
  }

  return FALLBACK_PHOTO;
}

function normalizePlaceToRestaurant(place, { city, state, country }) {
  const cityFromAddress =
    extractAddressComponent(place, ["locality"]) ?? city ?? null;
  const stateFromAddress =
    extractAddressComponent(place, ["administrative_area_level_1"]) ??
    state ??
    null;
  const countryFromAddress =
    extractAddressComponent(place, ["country"]) ?? country ?? null;

  return {
    id: place.id,
    name: place.displayName?.text ?? place.displayName ?? place.name,
    address: place.formattedAddress ?? null,
    city: cityFromAddress,
    state: stateFromAddress,
    country: countryFromAddress,
    location: place.location ?? null,
    plusCode: place.plusCode ?? null,
    viewport: place.viewport ?? null,
    googleMapsUri: place.googleMapsUri ?? null,
    websiteUri: place.websiteUri ?? null,
    internationalPhoneNumber: place.internationalPhoneNumber ?? null,
    nationalPhoneNumber: place.nationalPhoneNumber ?? null,
    rating: place.rating ?? null,
    review_count: place.userRatingCount ?? null,
    price: place.priceLevel ?? null,
    categories: place.types ?? [],
    type: "food",
  };
}

async function savePlaces(db, places = [], locationContext) {
  if (!places.length) return;

  const batch = db.batch();

  for (const place of places) {
    const restaurantData = normalizePlaceToRestaurant(place, locationContext);
    const photo = await resolvePhotoUrl(place);

    const docRef = db.collection("restaurants").doc(place.id);
    batch.set(docRef, { ...restaurantData, photo }, { merge: true });
  }

  await batch.commit();
}

async function importRestaurantsForCity(db, { city, state, country, radius, maxResultCount, }) {
  console.log(`\n🏙️ Buscando restaurantes para ${city}, ${state}`);

  const places = await searchRestaurantsByCity({
    cidade: city,
    estado: state,
    pais: country,
    radius: radius ?? SEARCH_RADIUS,
    maxResultCount: maxResultCount ?? MAX_RESULT_COUNT,
  });

  console.log(`📍 Encontrados ${places.length} lugares em ${city}, ${state}`);
  await savePlaces(db, places, { city, state, country });
}

export async function importAllUsRestaurants() {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("A variável GOOGLE_API_KEY é obrigatória para usar o Places API.");
  }

  const db = initializeFirebase();
  const cities = loadCities();

  for (const cityInfo of cities) {
    await importRestaurantsForCity(db, cityInfo);
  }

  console.log("✅ Importação concluída!");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  importAllUsRestaurants().catch((error) => {
    console.error("❌ Erro durante importação:", error.message);
    process.exit(1);
  });
}
