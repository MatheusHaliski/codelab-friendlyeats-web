import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

// ========================================================
// 🔑 Inicialização Firebase
// ========================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_ACCOUNT_PATH = path.resolve("ServiceKey.json");

try {
  admin.initializeApp({
    credential: admin.credential.cert(SERVICE_ACCOUNT_PATH),
  });
  console.log("🔥 Firebase Admin conectado!");
} catch (err) {
  console.error("❌ Erro ao inicializar Firebase Admin:", err);
  process.exit(1);
}

const db = admin.firestore();

// ========================================================
// 🧠 Funções auxiliares
// ========================================================

// Detecta se é uma URL que parece ser imagem (extensão típica)
function isValidImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase().trim();
  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".avif") ||
    lower.endsWith(".bmp") ||
    lower.endsWith(".tiff") ||
    lower.endsWith(".svg")
  );
}

// ========================================================
// 🚀 Contagem principal
// ========================================================
async function countImages() {
  console.log("📦 Lendo coleção 'restaurants' do Firestore...");

  const snapshot = await db.collection("restaurants").get();
  console.log(`📊 Total de documentos: ${snapshot.size}`);

  let withImage = 0;
  let withoutImage = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const photoUrl =
      data.photo ||
      data.photoUrl ||
      data.photoURL ||
      data.image ||
      data.imageUrl ||
      data.imageURL ||
      null;

    if (isValidImageUrl(photoUrl)) {
      withImage++;
    } else {
      withoutImage++;
    }
  }

  console.log("\n✅ RESULTADO FINAL:");
  console.log(`🖼️ Com imagem válida (.jpg, .png, etc.): ${withImage}`);
  console.log(`🚫 Sem imagem ou inválida: ${withoutImage}`);
  console.log(`📁 Total processado: ${withImage + withoutImage}`);
}

// ========================================================
// ▶️ Execução
// ========================================================
countImages()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Erro:", err);
    process.exit(1);
  });
