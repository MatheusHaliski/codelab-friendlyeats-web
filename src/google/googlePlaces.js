import fetch from "node-fetch";

async function geocodeCity({ cidade, estado, pais }) {
  const address = encodeURIComponent(`${cidade}, ${estado}, ${pais}`);

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.GOOGLE_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.results?.length) {
    throw new Error("Geocoding não encontrou localização");
  }

  const location = data.results[0].geometry.location;

  return {
    latitude: location.lat,
    longitude: location.lng,
  };
}

/**
 * Busca restaurantes próximos usando Google Places API (NEW)
 */
export async function searchRestaurantsByCity({
                                                cidade,
                                                estado,
                                                pais,
                                                radius = 1000,
                                                maxResultCount = 100,
                                              }) {
  // 1️⃣ Geocoding
  const { latitude, longitude } = await geocodeCity({
    cidade,
    estado,
    pais,
  });

  // 2️⃣ Corpo da requisição (igual ao curl)
  const body = {
    includedTypes: ["restaurant"],
    maxResultCount,
    locationRestriction: {
      circle: {
        center: { latitude, longitude },
        radius,
      },
    },
    regionCode: pais === "Brazil" || pais === "BR" ? "BR" : undefined,
  };

  // 3️⃣ Places API (Nearby Search)
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_API_KEY,
        "X-Goog-FieldMask":
          [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.addressComponents",
            "places.plusCode",
            "places.location",
            "places.viewport",
            "places.types",
            "places.rating",
            "places.userRatingCount",
            "places.priceLevel",
            "places.websiteUri",
            "places.googleMapsUri",
            "places.regularOpeningHours",
            "places.internationalPhoneNumber",
            "places.nationalPhoneNumber",
            "places.photos",
          ].join(","),
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  return data.places || [];
}
