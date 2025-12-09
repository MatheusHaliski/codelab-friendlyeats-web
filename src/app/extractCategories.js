// extractCategories.js
const fs = require("fs");
const readline = require("readline");

const FILE = "/Users/matheushaliski/Downloads/Yelp/yelp_academic_dataset_business.json";
// eslint-disable-next-line no-undef
const uniqueCategories = new Set();

// Lista de palavras-chave que indicam categorias relacionadas à comida
const FOOD_KEYWORDS = [
  "Food"
];

async function extractCategories() {
  const fileStream = fs.createReadStream(FILE, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let count = 0;
  let kept = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const data = JSON.parse(line);

      // ⚙️ Filtro 1: cidade dos EUA (ou estado americano)
      const isUSCity =
        data.country === "US" ||
        (typeof data.state === "string" && data.state.length === 2);

      // ⚙️ Filtro 2: categorias de comida
      const categories = data.categories?.split(",").map(c => c.trim());
      const isFoodBusiness =
        categories &&
        categories.some(c =>
          FOOD_KEYWORDS.some(keyword =>
            c.includes(keyword)
          )
        );

      if (isUSCity && isFoodBusiness && categories) {
        for (const c of categories) {
          if (c) uniqueCategories.add(c);
        }
        kept++;
      }

      count++;
      if (count % 10000 === 0)
        console.log(`📖 Processados ${count} registros... (${kept} mantidos)`);

      // opcional: para testes rápidos
      // if (count > 50000) break;
    } catch (err) {
      console.error("❌ Erro ao ler linha:", err.message);
    }
  }

  console.log(`✅ Total de categorias únicas (comida nos EUA): ${uniqueCategories.size}`);
  console.log([...uniqueCategories].sort());
}

extractCategories();
