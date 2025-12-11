import fetch from "node-fetch";

const FALLBACK_IMAGE_PATH =
  "https://codelab-friendlyeats-web--funcionarioslistaapp2025.us-central1.hosted.app/fallbackfood.png";

// ========================================================
// 🔍 Função auxiliar: valida formato e remove espaços
// ========================================================
function coercePhoto(candidate) {
  if (typeof candidate !== "string") return null;
  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// ========================================================
// ⚠️ Detecta URLs conhecidas de CAPTCHA/bloqueio
// ========================================================
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

// ========================================================
// 🌐 Verifica o status HTTP da imagem (HEAD request)
// ========================================================
async function isHttpError(url) {
  if (!url) return true;

  try {
    const res = await fetch(url, { method: "HEAD", timeout: 4000 });
    // Se retornar 4xx, 5xx → imagem inválida
    return res.status >= 400;
  } catch (err) {
    return true; // qualquer erro de rede também é inválido
  }
}

// ========================================================
// 🖼️ Resolve a imagem do restaurante
// ========================================================
export async function resolveRestaurantPhoto(restaurant, fallback) {
  const fallbackToUse =
    fallback === undefined ? FALLBACK_IMAGE_PATH : fallback ?? null;

  if (!restaurant) {
    return fallbackToUse;
  }

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

    // 🚫 CAPTCHA ou fontes bloqueadas → usa fallback
    if (isCaptchaOrBlocked(resolved)) {
      return FALLBACK_IMAGE_PATH;
    }

    // 🌐 Testa a imagem (HEAD)
    const hasHttpError = await isHttpError(resolved);
    if (hasHttpError) {
      console.warn(`⚠️ Erro HTTP detectado para imagem: ${resolved}`);
      return FALLBACK_IMAGE_PATH;
    }

    // ✅ Se passou por tudo, imagem válida
    return resolved;
  }

  // 🔁 Nenhuma imagem válida encontrada
  return fallbackToUse;
}

// ========================================================
// 🧩 Merge padrão com foto preservada/fallback
// ========================================================
export async function mergeRestaurantPhoto(restaurant, previousPhoto, fallback) {
  const fallbackToUse =
    fallback === undefined ? FALLBACK_IMAGE_PATH : fallback ?? null;

  if (!restaurant) {
    return restaurant;
  }

  const explicitPhoto = await resolveRestaurantPhoto(restaurant, null);
  if (explicitPhoto) {
    return { ...restaurant, photo: explicitPhoto };
  }

  const preservedPhoto = coercePhoto(previousPhoto);
  if (preservedPhoto) {
    return { ...restaurant, photo: preservedPhoto };
  }

  return { ...restaurant, photo: fallbackToUse };
}
