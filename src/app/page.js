import RestaurantListings from "@/src/components/RestaurantListings.jsx";
import { getRestaurants } from "@/src/lib/firebase/firestore.js";
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
import { getFirestore } from "firebase/firestore";

// Garante SSR — evita páginas estáticas no build
export const dynamic = "force-dynamic";

export default async function Home(props) {
  // ----- 1) PEGAR QUERY DA URL (ex: /?q=pizza) -----
  const search = props.searchParams?.q?.toLowerCase() || "";

  // ----- 2) FIREBASE APP + FIRESTORE (SERVIDOR) -----
  const firebaseApp = await getAuthenticatedAppForUser();
  const db = getFirestore(firebaseApp);

  // ----- 3) BUSCAR RESTAURANTES NO FIRESTORE -----
  const restaurants = await getRestaurants(db);

  // ----- 4) FILTRAR POR TEXTO (nome, bairro, etc.) -----
  const filtered = restaurants.filter((r) => {
    const safe = (v) => (v || "").toLowerCase();
    return (
      safe(r.nome).includes(search) ||
      safe(r.bairro).includes(search) ||
      safe(r.cidade).includes(search)
    );
  });

  // ----- 5) UI -----
  return (
    <main style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}>
        Restaurantes
      </h1>

      {/* Campo de busca — envia via query parameter */}
      <form method="GET" style={{ marginBottom: "20px" }}>
        <input
          type="text"
          name="q"
          placeholder="Buscar restaurante, bairro, cidade..."
          defaultValue={search}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
      </form>

      {/* Cards filtrados */}
      <RestaurantListings restaurants={filtered} />
    </main>
  );
}

