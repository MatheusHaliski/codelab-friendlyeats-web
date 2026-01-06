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
const PLACES_API_KEY =
  process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;

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
// 🔎 Funções auxiliares para montar query do Google Images
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
async function fetchRestaurantImages(
  restaurant,
  {
    apiKey = process.env.GOOGLE_CSE_API_KEY,
    cx = process.env.GOOGLE_CSE_SEARCH_ENGINE_ID,
    num = 5,
    safe = "off",
    country = "br",
    lang = "pt",
  } = {}
) {
  if (!apiKey || !cx) return null;

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
    const squarePenalty = ratio ? Math.abs(1 - ratio) : 1;

    let s = 0;
    if (isOfficial) s += 1000;
    s += Math.max(0, 200 - squarePenalty * 200);
    s += Math.min(300, area / 20000);
    return s;
  }

  return photos.map((p) => ({ p, s: score(p) })).sort((a, b) => b.s - a.s)[0].p;
}

function placePhotoToMediaUrl(photoName, { maxWidthPx = 900 } = {}) {
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
// 🧠 NORMALIZAÇÃO → exatamente os campos desejados
// ========================================================
function normalizePlace(place) {
  const name = place?.displayName?.text || "";
  const address = place?.formattedAddress || "";

  // Mantive como fixo (igual ao seu script original)
  const city = "Curitiba";
  const state = "PR";
  const country = "Brasil";

  // Categories: aqui usamos "types" do Google como base (você pode trocar depois)
  const categories = Array.isArray(place?.types) ? place.types : [];

  // type do seu app (food/lifestyle). Para "restaurant" faz sentido ser food:
  const type = "food";

  const stars = typeof place?.rating === "number" ? place.rating : null;
  const review_count =
    typeof place?.userRatingCount === "number" ? place.userRatingCount : 0;

  return {
    placeId: place?.id || null,

    // ✅ campos exigidos
    address,
    categories,
    city,
    country,
    name,
    review_count,
    stars,
    state,
    type,
  };
}

// ========================================================
// 🧠 UPSERT NO FIRESTORE (docId = placeId)
// ========================================================
async function upsertRestaurantFromPlace(place) {
  const base = normalizePlace(place);

  if (!base.placeId || !base.name) {
    return { skipped: true, reason: "missing placeId/name" };
  }

  const ref = db.collection("restaurants").doc(base.placeId);

  const snap = await ref.get();
  const existing = snap.exists ? snap.data() : null;

  const alreadyHasPhoto =
    !!(existing?.photo && String(existing.photo).trim().length > 0);

  // Foto + fallback flags
  let photo = alreadyHasPhoto ? existing.photo : null;
  let fallbackApplied = false;
  let fallbackType = "none"; // "places" | "google_images" | "none"

  // 1) tenta foto do Places (se ainda não tem foto)
  if (!photo) {
    const best = pickBestPlacePhoto(place);
    if (best?.name) {
      photo = placePhotoToMediaUrl(best.name, { maxWidthPx: 900 });
      fallbackApplied = false;
      fallbackType = "places";
    }
  }

  // 2) fallback Google Images (Custom Search)
  if (!photo) {
    const imageUrl = await fetchRestaurantImages(
      {
        name: base.name,
        city: base.city,
        country: base.country,
        categories: base.categories,
        category: "restaurant",
      },
      { safe: "off", country: "br", lang: "pt", num: 5 }
    );

    if (imageUrl) {
      photo = imageUrl;
      fallbackApplied = true;
      fallbackType = "google_images";
    }
  }

  // Se não achou foto em lugar nenhum:
  if (!photo) {
    fallbackApplied = false;
    fallbackType = "none";
  }

  // ✅ Payload FINAL com os campos exatos que você pediu
  const payload = {
    address: base.address,
    categories: base.categories,
    city: base.city,
    country: base.country,
    fallbackApplied,
    fallbackType,
    name: base.name,
    ...(photo ? { photo } : {}),
    review_count: base.review_count,
    stars: base.stars,
    state: base.state,
    type: base.type,
  };

  // Upsert (cria ou atualiza sem apagar outros campos existentes)
  await ref.set(payload, { merge: true });

  return {
    skipped: false,
    placeId: base.placeId,
    name: base.name,
    photoSaved: !!photo && !alreadyHasPhoto,
    fallbackType,
  };
}

// ========================================================
// 🚀 Execução principal
// ========================================================
async function run() {
  console.log("🔎 Buscando restaurantes via Places (New) searchNearby...");
  const places = await searchNearbyPlaces();
  console.log(`✅ Encontrados ${places.length} lugares. Salvando no Firestore...`);

  let upserted = 0;
  let withPhoto = 0;

  for (let i = 0; i < places.length; i++) {
    const p = places[i];
    const name = p?.displayName?.text || "(sem nome)";
    console.log(`\n(${i + 1}/${places.length}) ${name}`);

    try {
      const result = await upsertRestaurantFromPlace(p);

      if (!result.skipped) {
        upserted++;
        if (result.photoSaved) withPhoto++;
        console.log(
          `✅ Upsert: ${result.placeId} | fotoNova: ${result.photoSaved ? "sim" : "não"} | fallbackType: ${result.fallbackType}`
        );
      } else {
        console.log(`⏭️ Pulado: ${result.reason}`);
      }
    } catch (e) {
      console.error("❌ Erro ao salvar:", e.message);
    }

    // pequena pausa para não estressar quotas
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n🎯 Concluído! Upserts: ${upserted}. Fotos novas: ${withPhoto}.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
