const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Caminho da chave de serviço Firebase
const serviceAccountPath = path.resolve(
  "/Users/matheushaliski/codelab-friendlyeats-web/functions/servicekey.json"
);

// Caminho do dataset Yelp
const FILE = "/Users/matheushaliski/Downloads/Yelp/yelp_academic_dataset_business.json";

// 🔹 Validação da chave
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ servicekey.json não encontrado em:", serviceAccountPath);
  process.exit(1);
}

// 🔹 Inicializa Firebase
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
  projectId: "funcionarioslistaapp2025",
});

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// 🔹 Função principal
async function importRestaurants() {
  const START_LINE = 35000;
  const END_LINE = 40000;
  const BATCH_SIZE = 500;
  const fileStream = fs.createReadStream(FILE, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let batch = db.batch();
  let count = 0;
  let total = 0;
  let currentLine = 0;

  for await (const line of rl) {
    currentLine++;

    if (currentLine < START_LINE) continue; // 🔸 pula as primeiras 35 000 linhas
    if (currentLine > END_LINE) {
      console.log(`🛑 Parando na linha ${END_LINE}.`);
      break;
    }

    if (!line.trim()) continue;
    let data;
    try {
      data = JSON.parse(line);
    } catch (err) {
      console.error(`⚠️ Erro ao parsear linha ${currentLine}:`, err.message);
      continue;
    }

    if (!data.categories || !data.categories.toLowerCase().includes("restaurant")) continue;

    // Inferência simples de país
    const inferCountry = (state) => {
      const canada = ["ON", "QC", "BC", "AB", "MB"];
      const uk = ["EDH", "GLG", "LND", "MAN"];
      if (canada.includes(state)) return "Canada";
      if (uk.includes(state)) return "UK";
      return "USA";
    };

    const docRef = db.collection("restaurants").doc(data.business_id);
    const country = data.country == undefined || data.country !== "USA" ?  inferCountry(data.state): data.country ;
    batch.set(docRef, {
      name: data.name,
      city: data.city,
      state: data.state,
      country: country,
      stars: data.stars,
      review_count: data.review_count,
      categories: data.categories ? data.categories.split(",").map((c) => c.trim()) : [],
      address: data.address,
    });
    console.log(country)
    count++;
    total++;
    if (count === BATCH_SIZE) {
      await batch.commit();
      console.log(`✅ Subidos ${total} restaurantes até a linha ${currentLine}...`);
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) await batch.commit();
  console.log(`🎯 Upload finalizado (${total} documentos entre as linhas ${START_LINE}-${END_LINE}).`);
}

// Executa
importRestaurants().catch(console.error);
