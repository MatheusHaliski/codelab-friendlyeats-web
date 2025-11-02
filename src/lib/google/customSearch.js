
import fetch from "node-fetch";

export async function fetchRestaurantImage(query) {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const searchEngineId = process.env.GOOGLE_CSE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    console.warn("⚠️ Google CSE not configured, returning null image.");
    return null;
  }

  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
    query
  )}&cx=${searchEngineId}&key=${apiKey}&searchType=image&num=1`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data?.items?.length > 0) {
      return data.items[0].link;
    }

    return null;
  } catch (err) {
    console.error("❌ Error fetching image:", err);
    return null;
  }
}
