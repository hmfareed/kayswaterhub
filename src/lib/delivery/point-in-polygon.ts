/**
 * Point-in-polygon test using the ray-casting algorithm.
 * Used to check if a customer's GPS coordinates fall inside
 * a delivery zone polygon drawn by the admin.
 */

export interface Point {
  lat: number;
  lng: number;
}

/**
 * Returns true if the point is inside the polygon.
 * Polygon vertices should be in order (clockwise or counter-clockwise).
 * Works correctly for convex and concave polygons.
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;

  const { lat: py, lng: px } = point;
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const { lat: iy, lng: ix } = polygon[i];
    const { lat: jy, lng: jx } = polygon[j];

    const intersects =
      iy > py !== jy > py &&
      px < ((jx - ix) * (py - iy)) / (jy - iy) + ix;

    if (intersects) inside = !inside;
  }

  return inside;
}

/**
 * Calculates distance in km between two coordinates (Haversine formula).
 * Exported so the delivery engine can import from a single utils file.
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}
