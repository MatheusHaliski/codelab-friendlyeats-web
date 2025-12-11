export function resolveRestaurantPhotoSync(restaurant) {
  const candidates = [
    restaurant.photo,
    restaurant.photoUrl,
    restaurant.image,
  ];

  for (const c of candidates) {
    if (c && typeof c === "string" && c.length > 4) {
      return c;
    }
  }

  return "/fallbackfood.png"; // /public/fallbackfood.png
}
