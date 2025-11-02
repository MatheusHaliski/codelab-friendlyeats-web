const FALLBACK_IMAGE_PATH =
  "https://codelab-friendlyeats-web--funcionarioslistaapp2025.us-central1.hosted.app/fallbackfood.png";

function coercePhoto(candidate) {
  if (typeof candidate !== "string") return null;
  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// 🔍 Detecta se a URL é de CAPTCHA/bloqueio
function isCaptchaOrBlocked(url) {
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

export function resolveRestaurantPhoto(restaurant, fallback) {
  const fallbackToUse =
    fallback === undefined ? FALLBACK_IMAGE_PATH : fallback ?? null;

  if (!restaurant) {
    return fallbackToUse;
  }

  // 🔹 Lista de possíveis campos com URLs de imagem
  const candidates = [
    restaurant.photo,
    restaurant.photoUrl,
    restaurant.photoURL,
    restaurant.image,
    restaurant.imageUrl,
    restaurant.imageURL,
    restaurant.coverPhoto,
  ];

  for (const candidate of candidates) {
    const resolved = coercePhoto(candidate);
    if (!resolved) continue;

    // Ignora fallbacks já armazenados
    if (resolved === FALLBACK_IMAGE_PATH) continue;
    if (fallbackToUse && resolved === fallbackToUse) continue;

    // 🚫 Se detectar CAPTCHA ou domínio bloqueado → usa fallback
    if (isCaptchaOrBlocked(resolved)) {
      return FALLBACK_IMAGE_PATH;
    }

    // ✅ Retorna imagem válida
    return resolved;
  }

  // 🔁 Se nenhuma imagem válida encontrada, retorna fallback padrão
  return fallbackToUse;
}

export function mergeRestaurantPhoto(restaurant, previousPhoto, fallback) {
  const fallbackToUse =
    fallback === undefined ? FALLBACK_IMAGE_PATH : fallback ?? null;

  if (!restaurant) {
    return restaurant;
  }

  const explicitPhoto = resolveRestaurantPhoto(restaurant, null);
  if (explicitPhoto) {
    return { ...restaurant, photo: explicitPhoto };
  }

  const preservedPhoto = coercePhoto(previousPhoto);
  if (preservedPhoto) {
    return { ...restaurant, photo: preservedPhoto };
  }

  return { ...restaurant, photo: fallbackToUse };
}
