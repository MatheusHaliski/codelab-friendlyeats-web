import fetch from "node-fetch";
import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// 🧭 Caminho base
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔐 Carrega variáveis do .env
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
// 🔎 Funções auxiliares para montar a query do Google
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
// ⚡ Busca agressiva no Google Images
// ========================================================
async function fetchRestaurantImages(restaurant, {
  apiKey = "AIzaSyClWAmMXQGN3v_Dwn1lIcQuPWU3ZsA4p50",
  cx = "f09c8e40b75164424",
  num = 5,
  safe = "off",
  country = "us",
  lang = "en",
} = {}) {
  if (!apiKey || !cx) {
    console.warn("⚠️ GOOGLE_CSE_API_KEY / GOOGLE_CSE_SEARCH_ENGINE_ID ausentes.");
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
// 🧠 Função principal: buscar e salvar imagens no Firestore
// ========================================================
async function updateRestaurantImages() {
  const snapshot = await db.collection("restaurants").get();
  const allDocs = snapshot.docs;

  const total = allDocs.length;
  const halfIndex = Math.floor(total / 4); // 🔹 começa da metade
  const docs = allDocs.slice(halfIndex); // 🔹 só da metade pra frente

  console.log(`📦 Total de restaurantes: ${total}`);
  console.log(`🚀 Processando a partir da metade (${halfIndex + 1}/${total}) → ${docs.length} documentos`);

  let updatedCount = 0;
  let processed = 0;

  for (const doc of docs) {
    processed++;
    const restaurant = doc.data();
    const name = restaurant.name || "(sem nome)";
    const hasPhoto =
      restaurant.photo || restaurant.image || restaurant.photoUrl;

    console.log(`\n(${processed}/${docs.length}) ${name}`);

    if (hasPhoto) {
      console.log(`✅ Já possui imagem. Pulando...`);
      continue;
    }

    console.log(`🔍 Buscando imagem para: ${name}`);
    const imageUrl = await fetchRestaurantImages(restaurant, {
      safe: "off",
      country: "us",
      lang: "en",
      num: 5,
    });

    if (imageUrl) {
      await doc.ref.update({ photo: imageUrl });
      console.log(`🖼️ Imagem salva -> ${imageUrl}`);
      updatedCount++;
    } else {
      console.log(`⚠️ Nenhuma imagem encontrada.`);
    }

    // Aguarda 1 segundo entre cada requisição
    await new Promise(res => setTimeout(res, 1000));
  }

  console.log(`\n🎯 Processo concluído! ${updatedCount} imagens atualizadas (de ${docs.length} processadas).`);
}

// ========================================================
// 🚀 Execução
// ========================================================
updateRestaurantImages()
  .then(() => {
    console.log("\n✅ Script finalizado com sucesso!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Erro fatal no script:", err);
    process.exit(1);
  });
