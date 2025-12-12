import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

// ========================================================
// 🔥 Inicializa Firebase Admin
// ========================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVICE_ACCOUNT_PATH = path.resolve("ServiceKey.json");

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
// 🖼️ Fallback padrão
// ========================================================
const FALLBACK_URL =
  "https://codelab-friendlyeats-web--funcionarioslistaapp2025.us-central1.hosted.app/fallbackfood.png";

// ========================================================
// 📋 Lista de nomes alvo
// ========================================================
const TARGET_NAMES = [
  "Kriscroix Restaurant",
  "Un Caffé Italian Bistro",
  "Sushi Sho Rexley",
  "5 Points Market & Restaurant",
  "Oaklyes Bistro",
  "Lou Malnati’s Pizzeria - Now Open!",
  "LesbiVeggies",
  "Five Guys Burgers and Fries",
  "PrimoHoagies",
  "Santa Barbara Shellfish Company",
  "Little Octopus",
  "The Set Table",
  "Maynards",
  "Vicent’s Pizza",
  "Piree’s Piri Piri Grill",
  "Sakura Japanese Restaurant",
  "Benjamin’s On 10th",
  "R&M Tropical SNO",
  "Washy’s Pub",
  "Caviar & Bananas",
  "Taqueria del Sol",
  "Oh So Good",
  "Ray’s Subs",
  "SC Damn Good Food"
];

// ========================================================
// 🚀 Atualiza imagem fallback nos restaurantes da lista
// ========================================================
async function updateRestaurants() {
  console.log("📦 Buscando todos os restaurantes...");
  const snapshot = await db.collection("restaurants").get();

  let updatedCount = 0;
  let processed = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    processed++;

    const name = data.name?.trim();
    if (!name) continue;

    // Normaliza aspas e capitalização
    const normalized = name.replace(/[’']/g, "'").toLowerCase();
    const match = TARGET_NAMES.some(
      (n) => n.replace(/[’']/g, "'").toLowerCase() === normalized
    );

    if (match) {
      try {
        await doc.ref.update({
          photo: FALLBACK_URL,
          fallbackApplied: true,
          fallbackReason: "manual_update_batch_2",
        });
        updatedCount++;
        console.log(`✅ ${name} → imagem fallback aplicada.`);
      } catch (err) {
        console.error(`❌ Erro ao atualizar ${name}:`, err.message);
      }
    }
  }

  console.log(`\n🎯 Concluído! ${updatedCount} restaurantes atualizados de ${processed} verificados.`);
  console.log("✅ Todos receberam a imagem fallback padrão.");
}

// ========================================================
// ▶️ Execução
// ========================================================
updateRestaurants()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Erro fatal:", err);
    process.exit(1);
  });
