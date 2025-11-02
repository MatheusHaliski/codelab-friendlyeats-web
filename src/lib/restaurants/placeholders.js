const FALLBACK_IMAGE_PATH = "/fallbackfood.png";

function coercePhoto(candidate) {
  if (typeof candidate !== "string") {
    return null;
  }

  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveRestaurantPhoto(restaurant, fallback) {
  const fallbackToUse =
    fallback === undefined ? FALLBACK_IMAGE_PATH : fallback ?? null;

  if (!restaurant) {
    return fallbackToUse;
  }

  // Only include fields that are expected to contain usable image URLs. Adding
  // non-image properties (like the restaurant name) would break image
  // resolution, so keep this list limited to known photo keys.
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
    if (!resolved) {
      continue;
    }

    // Skip any previously stored fallback URLs so the resolver keeps looking
    // for a real image.
    if (resolved === FALLBACK_IMAGE_PATH) {
      continue;
    }

    if (fallbackToUse && resolved === fallbackToUse) {
      continue;
    }

    return resolved;
  }

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
