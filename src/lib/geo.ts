/**
 * Small geography helpers — distance between two coordinates, and a friendly
 * way to print that distance.
 *
 * No external library needed: the standard "haversine" formula is a few lines
 * and is accurate to well under 0.5% for city-scale distances.
 */

/** Earth's mean radius in kilometres (the constant the haversine formula needs). */
const EARTH_RADIUS_KM = 6371;

/**
 * Distance "as the crow flies" between two lat/lng points, in kilometres.
 *
 * Note this is straight-line distance, not driving distance — good enough for
 * "which stores are near me", which is all the app needs.
 */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  // The haversine formula. `a` is the squared half-chord length between the
  // points; `c` is the angular distance in radians.
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/** "0.8 km" / "12 km" — rounded so it reads like a person wrote it. */
export function formatDistance(km: number): string {
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
