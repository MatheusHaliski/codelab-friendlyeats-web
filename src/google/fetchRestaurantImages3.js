import admin from "firebase-admin";
import { fileURLToPath } from "url";
import path from "path";
import fetch from "node-fetch";

// ========================================================
// 🧭 Caminhos e inicialização
// ========================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_ACCOUNT_PATH = path.resolve("ServiceKey.json");
const PUBLIC_BASE_URL = "https://codelab-friendlyeats-web--funcionarioslistaapp2025.us-central1.hosted.app";

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
// 🧩 Funções auxiliares
// ========================================================

// Verifica se a URL é válida (do domínio público)
function isPublicImage(url) {
  return url?.toLowerCase().startsWith(PUBLIC_BASE_URL.toLowerCase());
}

// Detecta origens conhecidas que geram CAPTCHA
function isCaptchaSource(url) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("lookaside.fbsbx.com") ||
    lower.includes("facebook.com") ||
    lower.includes("tripadvisor") ||
    lower.includes("yelp") ||
    lower.includes("captcha") ||
    lower.includes("googleusercontent.com")
  );
}

// Faz uma requisição HEAD e detecta bloqueio (403/429)
async function isCaptchaOrBlocked(url) {
  if (!url) return true;
  try {
    const res = await fetch(url, { method: "HEAD", timeout: 5000 });
    return res.status === 403 || res.status === 429;
  } catch {
    return true; // erro de rede → provável bloqueio
  }
}

// Extrai tokens da categoria e capitaliza
function extractCategoryTokensFromDoc(data = {}) {
  const candidates = [];

  ["category", "type", "cuisine", "categories"].forEach((k) => {
    const v = data[k];
    if (typeof v === "string" && v.trim()) candidates.push(v);
    else if (Array.isArray(v)) candidates.push(...v.map((x) => String(x)));
  });

  return candidates.map((s) => {
    const trimmed = s.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  });
}

// Retorna URL pública de fallback conforme categoria
function getPublicFallbackFromDoc(docData = {}) {
  const tokens = extractCategoryTokensFromDoc(docData);
  const url = (file) => `${PUBLIC_BASE_URL}/${file}`;

  if (tokens.some((t) => t.includes("Sushi") || t.includes("Japanese"))) return url("fallbacksushi.png");
  if (tokens.some((t) => t.includes("Chinese"))) return url("fallbackchinese.png");
  if (tokens.some((t) => t.includes("Dessert") || t.includes("Sweet") || t.includes("Bakery"))) return url("fallbackdessert.png");
  if (tokens.some((t) => t.includes("Caffe") || t.includes("Coffee") || t.includes("Cafe"))) return url("fallbackcafe.png");
  if (tokens.some((t) => t.includes("Vegan") || t.includes("Vegetarian"))) return url("fallbackvegan.png");
  if (tokens.some((t) => t.includes("Pizza") || t.includes("Burger") || t.includes("Fast"))) return url("fallbackfood.png");

  return url("fallbackfood.png");
}

// ========================================================
// 🚀 Atualiza imagens com CAPTCHA/bloqueadas
// ========================================================
async function updateCaptchaImages() {
  console.log("\n📦 Buscando todos os restaurantes no Firestore...");

  const snapshot = await db.collection("restaurants").get();
  console.log(`📊 Total de documentos encontrados: ${snapshot.size}`);

  let updatedCount = 0;
  let captchaCount = 0;
  let processed = 0;

  for (const doc of snapshot.docs) {
    processed++;

    const data = doc.data();
    const id = doc.id;
    const name = data.name || "(sem nome)";
    const photoUrl = data.photo || "";

    // pula imagens válidas (do domínio público)
    if (isPublicImage(photoUrl)) {
      console.log(`(${processed}) ✅ ${name}: imagem válida.`);
      continue;
    }

    // verifica se é CAPTCHA
    if (isCaptchaSource(photoUrl) || (await isCaptchaOrBlocked(photoUrl))) {
      captchaCount++;

      const fallbackUrl = getPublicFallbackFromDoc(data);
      try {
        await doc.ref.update({
          photo: fallbackUrl,
          fallbackApplied: true,
          fallbackType:
            extractCategoryTokensFromDoc(data)[0] ||
            data.category ||
            data.type ||
            "Unknown",
        });

        updatedCount++;
        console.log(`\n(${processed}) 🔄 ${name}: substituída (CAPTCHA detectado) -> ${fallbackUrl}`);
      } catch (err) {
        console.error(`❌ Erro ao atualizar ${name}:`, err.message);
      }

      // eslint-disable-next-line no-undef
      await new Promise((r) => setTimeout(r, 400)); // evita rate limit
    } else {
      console.log(`(${processed}) ⚪ ${name}: imagem mantida.`);
    }
  }

  console.log(`\n🎯 Concluído! ${updatedCount} imagens substituídas (${captchaCount} eram CAPTCHA).`);
  console.log("✅ Atualização finalizada com sucesso!");
}

// ========================================================
// 🧠 Execução principal
// ========================================================
updateCaptchaImages()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Erro fatal:", err);
    process.exit(1);
  });
