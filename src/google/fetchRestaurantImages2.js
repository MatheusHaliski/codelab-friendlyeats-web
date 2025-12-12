import fetch from "node-fetch";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FALLBACK_FILE_PATH = path.resolve(__dirname, "fallback_restaurants.json");
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
// 🧩 Funções auxiliares
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

function isInvalidImage(url) {
  if (!url) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes("lookaside.fbsbx.com") ||
    lower.includes("facebook.com") ||
    lower.includes("undefined") ||
    lower.includes("null") ||
    lower.trim() === "" ||
    !lower.startsWith("http")
  );
}

// ========================================================
// 🔎 Busca imagem no Google Custom Search
// ========================================================
async function fetchRestaurantImages(restaurant, {
  apiKey = process.env.GOOGLE_CSE_API_KEY || "AIzaSyClWAmMXQGN3v_Dwn1lIcQuPWU3ZsA4p50",
  cx = process.env.GOOGLE_CSE_SEARCH_ENGINE_ID || "f09c8e40b75164424",
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
// 🚀 Atualiza imagens inválidas ou ausentes
// ========================================================
async function updateInvalidImages() {
  console.log(`\n📦 Iniciando verificação de ${fallbackRestaurants.length} restaurantes...`);

  let updatedCount = 0;
  let processed = 0;

  for (const restaurant of fallbackRestaurants) {
    processed++;
    const { id, name } = restaurant;

    try {
      const docRef = db.collection("restaurants").doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        console.log(`⚠️ ${name}: restaurante não encontrado no Firestore.`);
        continue;
      }

      const currentPhoto = docSnap.data().photo || "";
      const invalid = isInvalidImage(currentPhoto);

      if (invalid) {
        console.log(`\n(${processed}) 🔄 Atualizando imagem inválida de: ${name}`);
        const newImageUrl = await fetchRestaurantImages(restaurant);

        if (newImageUrl) {
          await docRef.update({ photo: newImageUrl });
          console.log(`✅ ${name}: imagem substituída -> ${newImageUrl}`);
          updatedCount++;
        } else {
          console.log(`⚠️ ${name}: nenhuma imagem válida encontrada.`);
        }

        // Pausa entre requisições (1s)
        await new Promise(res => setTimeout(res, 1000));
      } else {
        console.log(`(${processed}) ✅ ${name}: imagem válida mantida.`);
      }
    } catch (err) {
      console.error(`❌ Erro ao processar ${name}:`, err.message);
    }
  }

  console.log(`\n🎯 Processo concluído! ${updatedCount} imagens atualizadas de ${fallbackRestaurants.length}.`);
}

// ========================================================
// 🧠 Execução principal
// ========================================================
updateInvalidImages()
  .then(() => {
    console.log("\n✅ Script finalizado com sucesso!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Erro fatal no script:", err);
    process.exit(1);
  });
