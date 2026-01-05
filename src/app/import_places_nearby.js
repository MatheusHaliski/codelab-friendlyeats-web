/**
 * Places (New) → searchNearby (Curitiba/Ahú) → salva no Firestore
 * e tenta obter uma imagem:
 *   1) usa a melhor foto do places.photos (gera URL /media)
 *   2) se falhar, faz fallback para Google Images (Custom Search) e salva
 *
 * Requisitos:
 *  - Node 18+ (ou node-fetch instalado, já está no seu projeto)
 *  - .env com:
 *      GOOGLE_PLACES_API_KEY=...
 *      (opcional) GOOGLE_CSE_API_KEY=...
 *      (opcional) GOOGLE_CSE_SEARCH_ENGINE_ID=...
 *  - ServiceKey.json (Firebase Admin)
 *
 * Executar:
 *   node scripts/places/import_places_nearby.js
 */

import fetch from "node-fetch";
import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// 🧭 Caminho base
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔐 Carrega variáveis do .env (ajuste o path se necessário)
dotenv.config({ path: path.join(__dirname, "../../..", ".env") });

// 🔑 Caminho para a chave do Firebase Admin
const SERVICE_ACCOUNT_PATH = path.resolve("ServiceKey.json");

// 🔥 Inicializa Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(SERVICE_ACCOUNT_PATH),
  });
  console.log("🔥 Firebase Admin inicializado com sucesso!");
} catch (err) {
  console.error("❌ Erro ao inicializar Firebase Admin:", err);
  process.exit(1);
}

const db = admin.firestore();

// ========================================================
// ✅ CONFIG PLACES (NEW) - searchNearby
// ========================================================
const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;
if (!PLACES_API_KEY) {
  console.error("❌ Defina GOOGLE_PLACES_API_KEY (ou GOOGLE_API_KEY) no .env");
  process.exit(1);
}

const PLACES_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.types",
  "places.formattedAddress",
  "places.rating",
  "places.websiteUri",
  "places.userRatingCount",
  "places.photos",
].join(",");

const NEARBY_BODY = {
  includedTypes: ["restaurant"],
  maxResultCount: 10,
  locationRestriction: {
    circle: {
      center: {
        latitude: -25.4044332,
        longitude: -49.2653621,
      },
      radius: 1500.0,
    },
  },
};

// ========================================================
// 🔎 Funções auxiliares para montar a query do Google Images
// ========================================================
function sanitizeQuery(s) {
  if (!s) return "";
  return String(s)
    .replace(/[’“”]/g, (ch) => ({ "’": "'", "“": '"', "”": '"' }[ch] || ch))
    .replace(/\s+/g, " ")
    .trim();
}

function buildQueryVariants(r) {
  const name = sanitizeQuery(r?.name);
  const city = sanitizeQuery(r?.city);
  const country = sanitizeQuery(r?.country);
  const cat =
    Array.isArray(r?.categories) && r.categories.length
      ? sanitizeQuery(r.categories[0])
      : sanitizeQuery(r?.category);

  const base = [name, "restaurant"].filter(Boolean).join(" ");
  const variants = [
    base,
    [base, city].filter(Boolean).join(" "),
    [base, city, country].filter(Boolean).join(" "),
    [name, cat].filter(Boolean).join(" "),
    [name, "food"].filter(Boolean).join(" "),
    name,
  ];

  return [...new Set(variants.filter(Boolean))];
}

// ========================================================
// ⚡ Google Images (Custom Search JSON API) - fallback
// ========================================================
async function fetchRestaurantImages(restaurant, {
  apiKey = process.env.GOOGLE_CSE_API_KEY,         // ✅ preferir .env
  cx = process.env.GOOGLE_CSE_SEARCH_ENGINE_ID,    // ✅ preferir .env
  num = 5,
  safe = "off",
  country = "br",
  lang = "pt",
} = {}) {
  if (!apiKey || !cx) {
    // sem CSE configurado, só não tenta
    return null;
  }

  const variants = buildQueryVariants(restaurant);

  for (const q of variants) {
    const url =
      `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(q)}` +
      `&cx=${encodeURIComponent(cx)}&key=${encodeURIComponent(apiKey)}` +
      `&searchType=image&num=${num}&safe=${safe}&gl=${country}&hl=${lang}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data?.error) {
        console.error("❌ Google CSE error:", data.error);
        continue;
      }

      const link = data?.items?.[0]?.link || null;
      if (link) return link;
    } catch (e) {
      console.error(`❌ Falha na consulta "${q}":`, e.message);
    }
  }

  return null;
}

// ========================================================
// 🖼️ Places photos → escolher a melhor foto (heurística)
// ========================================================
function pickBestPlacePhoto(place) {
  const photos = Array.isArray(place?.photos) ? place.photos : [];
  if (!photos.length) return null;

  const placeName = (place?.displayName?.text || "").trim().toLowerCase();

  function score(p) {
    const w = Number(p?.widthPx || 0);
    const h = Number(p?.heightPx || 0);
    const area = w * h;

    const author = (p?.authorAttributions?.[0]?.displayName || "")
      .trim()
      .toLowerCase();

    const isOfficial = author && placeName && author === placeName;

    const ratio = w && h ? w / h : 0;
    const squarePenalty = ratio ? Math.abs(1 - ratio) : 1; // 0 = perfeito

    let s = 0;
    if (isOfficial) s += 1000; // pesa muito se autor = nome
    s += Math.max(0, 200 - squarePenalty * 200); // +200 se quadrada
    s += Math.min(300, area / 20000); // bônus por resolução (limitado)
    return s;
  }

  return photos
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => b.s - a.s)[0].p;
}

function placePhotoToMediaUrl(photoName, { maxWidthPx = 800 } = {}) {
  // photoName vem como: places/{placeId}/photos/{photoId}
  // URL final: https://places.googleapis.com/v1/{photoName}/media?maxWidthPx=...&key=...
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${encodeURIComponent(
    maxWidthPx
  )}&key=${encodeURIComponent(PLACES_API_KEY)}`;
}

// ========================================================
// 🔎 Places (new) - searchNearby
// ========================================================
async function searchNearbyPlaces() {
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_API_KEY,
      "X-Goog-FieldMask": PLACES_FIELD_MASK,
    },
    body: JSON.stringify(NEARBY_BODY),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("❌ Places error:", data);
    throw new Error(`Places API failed: ${res.status}`);
  }

  return data?.places || [];
}

// ========================================================
// 🧠 SALVAR / ATUALIZAR NO FIRESTORE (restaurants)
// ========================================================
function normalizePlace(place) {
  const displayName = place?.displayName?.text || "";
  const formattedAddress = place?.formattedAddress || "";

  // tentar extrair cidade/estado/país do formattedAddress (heurística simples)
  // ex: "Av. X, 123 - Bairro, Curitiba - PR, Brasil"
  const cityGuess = "Curitiba";
  const stateGuess = "PR";
  const countryGuess = "Brasil";

  return {
    source: "google_places_new",
    placeId: place?.id || null,
    name: displayName,
    address: formattedAddress,
    rating: typeof place?.rating === "number" ? place.rating : null,
    userRatingCount:
      typeof place?.userRatingCount === "number" ? place.userRatingCount : null,
    website: place?.websiteUri || null,
    types: Array.isArray(place?.types) ? place.types : [],
    city: cityGuess,
    state: stateGuess,
    country: countryGuess,
    // Guardar as fotos brutas para referência/debug:
    photos: Array.isArray(place?.photos) ? place.photos : [],
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

async function upsertRestaurantFromPlace(place) {
  const normalized = normalizePlace(place);

  if (!normalized.placeId || !normalized.name) {
    return { skipped: true, reason: "missing placeId/name" };
  }

  // id fixo pelo placeId para não duplicar
  const ref = db.collection("restaurants").doc(normalized.placeId);

  const snap = await ref.get();
  const existing = snap.exists ? snap.data() : null;

  // Se já existe e tem foto, não mexe (você pode mudar isso)
  const hasPhoto = existing?.photo || existing?.image || existing?.photoUrl;

  // 1) tenta foto do Places (melhor foto)
  let photoUrl = null;
  if (!hasPhoto) {
    const best = pickBestPlacePhoto(place);
    if (best?.name) {
      photoUrl = placePhotoToMediaUrl(best.name, { maxWidthPx: 900 });
    }
  }

  // 2) fallback: Google Images (Custom Search)
  if (!hasPhoto && !photoUrl) {
    photoUrl = await fetchRestaurantImages({
      name: normalized.name,
      city: normalized.city,
      country: normalized.country,
      category: "restaurant",
      categories: ["restaurant"],
    }, {
      safe: "off",
      country: "br",
      lang: "pt",
      num: 5,
    });
  }

  const payload = {
    ...normalized,
    // mapeie para seus campos atuais:
    avgRating: normalized.rating, // se seu app usa avgRating
    numRatings: normalized.userRatingCount, // opcional (você disse que quer evitar, mas pode guardar)
  };

  if (!hasPhoto && photoUrl) {
    payload.photo = photoUrl;
  }

  // merge true para não apagar campos que já existem
  await ref.set(payload, { merge: true });

  return { skipped: false, placeId: normalized.placeId, name: normalized.name, savedPhoto: !!payload.photo };
}

// ========================================================
// 🚀 Execução principal
// ========================================================
async function run() {
  console.log("🔎 Buscando restaurantes via Places (New) searchNearby...");
  const places = await searchNearbyPlaces();

  console.log(`✅ Encontrados ${places.length} lugares. Salvando no Firestore...`);

  let saved = 0;
  let withPhoto = 0;

  for (let i = 0; i < places.length; i++) {
    const p = places[i];
    const name = p?.displayName?.text || "(sem nome)";
    console.log(`\n(${i + 1}/${places.length}) ${name}`);

    try {
      const result = await upsertRestaurantFromPlace(p);
      if (!result.skipped) {
        saved++;
        if (result.savedPhoto) withPhoto++;
        console.log(`✅ Salvo: ${result.placeId} | foto: ${result.savedPhoto ? "sim" : "não"}`);
      } else {
        console.log(`⏭️ Pulado: ${result.reason}`);
      }
    } catch (e) {
      console.error("❌ Erro ao salvar:", e.message);
    }

    // pequena pausa para não estressar quotas
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n🎯 Concluído! Salvos/atualizados: ${saved}. Com foto: ${withPhoto}.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
