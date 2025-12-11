import {
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore";

/**
 * Força o campo `type` = "lifestyle" para todos os docs da coleção `lifestyle`.
 * Se o doc estiver com type "food" ou sem type, ele será corrigido.
 */
export async function fixLifestyleTypeField(db) {
  const lifestyleRef = collection(db, "lifestyle");
  const snapshot = await getDocs(lifestyleRef);

  if (snapshot.empty) {
    console.log("[fixLifestyleTypeField] Nenhum documento em 'lifestyle'.");
    return;
  }

  // Firestore limita ~500 writes por batch. Se tiver muito doc, é bom chunkar.
  let batch = writeBatch(db);
  let counter = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.type !== "lifestyle") {
      batch.update(docSnap.ref, { type: "lifestyle" });
      counter++;

      // Se chegar perto do limite, faz commit e abre outro batch
      if (counter % 450 === 0) {
        await batch.commit();
        batch = writeBatch(db);
      }
    }
  }

  // Commit final
  await batch.commit();
  console.log(
    `[fixLifestyleTypeField] Campo "type" atualizado para "lifestyle" em ${counter} documentos.`
  );
}
