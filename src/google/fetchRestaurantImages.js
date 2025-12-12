import fetch from "node-fetch";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 🧭 Caminho base
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔑 Caminho para o arquivo JSON com os restaurantes fallback
const FALLBACK_FILE_PATH = path.resolve(__dirname, "fallback_restaurants.json");

// 🔑 Caminho para a chave do Firebase Admin
const SERVICE_ACCOUNT_PATH = path.resolve("ServiceKey.json");

// ========================================================
// 🔥 Inicializa Firebase Admin
// ========================================================
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
// 🧾 Lê o JSON com os restaurantes fallback
// ========================================================
let fallbackRestaurants = [];

try {
  const jsonData = fs.readFileSync(FALLBACK_FILE_PATH, "utf-8");
  fallbackRestaurants = JSON.parse(jsonData);
  console.log(`📂 Restaurantes carregados do JSON: ${fallbackRestaurants.length}`);
} catch (err) {
  console.error("❌ Erro ao ler fallback_restaurants.json:", err);
  process.exit(1);
}

// ========================================================
// 🔍 Funções auxiliares
// ========================================================
function sanitizeQuery(s) {
  if (!s) return "";
  return String(s)
    .replace(/[’“”]/g, ch => ({ "’": "'", "“": '"', "”": '"' }[ch] || ch))
    .replace(/\s+/g, " ")
    .trim();
}

function buildQueryVariants(r) {
  const name = sanitizeQuery(r?.name);
  const base = [name, "restaurant"].filter(Boolean).join(" ");
  return [base, name, `${name} food`, `${name} restaurant photo`].filter(Boolean);
}

// ========================================================
// ⚡ Busca no Google Imagens (Custom Search)
// ========================================================
async function fetchRestaurantImages(restaurant, {
  apiKey = "AIzaSyClWAmMXQGN3v_Dwn1lIcQuPWU3ZsA4p50",
  cx = "f09c8e40b75164424",
  num = 3,
  safe = "off",
  country = "us",
  lang = "en",
} = {}) {
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
// 🚀 Atualiza imagens com base no fallback JSON
// ========================================================
async function updateFallbackImages() {
  console.log(`\n📦 Iniciando atualização de ${fallbackRestaurants.length} restaurantes...`);

  let updatedCount = 0;
  let processed = 0;

  for (const restaurant of fallbackRestaurants) {
    processed++;
    const { id, name } = restaurant;

    console.log(`\n(${processed}/${fallbackRestaurants.length}) 🔍 Buscando imagem para: ${name}`);

    const imageUrl = await fetchRestaurantImages(restaurant);

    if (imageUrl) {
      try {
        await db.collection("restaurants").doc(id).update({ photo: imageUrl });
        console.log(`🖼️ ${name}: imagem salva -> ${imageUrl}`);
        updatedCount++;
      } catch (err) {
        console.error(`❌ Erro ao atualizar Firestore para ${name}:`, err.message);
      }
    } else {
      console.log(`⚠️ ${name}: nenhuma imagem encontrada.`);
    }

    // Aguarda 1 segundo entre cada requisição
    await new Promise(res => setTimeout(res, 1000));
  }

  console.log(`\n🎯 Processo concluído! ${updatedCount} imagens atualizadas de ${fallbackRestaurants.length}.`);
}

// ========================================================
// 🧠 Execução principal
// ========================================================
updateFallbackImages()
  .then(() => {
    console.log("\n✅ Script finalizado com sucesso!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Erro fatal no script:", err);
    process.exit(1);
  });
