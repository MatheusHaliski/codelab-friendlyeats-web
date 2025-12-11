import "server-only";

const API_ENDPOINT = "https://www.googleapis.com/customsearch/v1";
const API_KEY = process.env.GOOGLE_CSE_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_CSE_SEARCH_ENGINE_ID;

function buildQueryParams(query, options = {}) {
  const params = new URLSearchParams({
    key: API_KEY ?? "",
    cx: SEARCH_ENGINE_ID ?? "",
    searchType: "image",
    num: "3",
    safe: "active",
    q: query,
  });

  if (options.language) {
    params.set("lr", options.language);
  }

  if (options.country) {
    params.set("cr", options.country);
  }

  return params;
}

export function isCustomSearchConfigured() {
  return Boolean(API_KEY && SEARCH_ENGINE_ID);
}

export async function searchImageForRestaurant(query, options = {}) {
  if (!query || !isCustomSearchConfigured()) {
    return null;
  }

  try {
    const params = buildQueryParams(query, options);
    const response = await fetch(`${API_ENDPOINT}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      console.error(
        "Custom Search API request failed",
        response.status,
        response.statusText
      );
      return null;
    }

    const payload = await response.json();
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return null;
    }

    const imageResult = payload.items.find((item) =>
      item?.mime?.startsWith("image/")
    );

    return imageResult?.link ?? payload.items[0]?.link ?? null;
  } catch (error) {
    console.error("Unable to fetch image from Custom Search API", error);
    return null;
  }
}
