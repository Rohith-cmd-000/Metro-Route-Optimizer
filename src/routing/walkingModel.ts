// Walking time estimation for door-to-door journey planning.
//
// Provides simple, clearly-labelled estimates for:
//   - Access walking: from a user-provided start address to the boarding station
//   - Exit walking: from the alighting station to a user-provided final address
//   - Interchange walking: already modelled in the graph (5 min penalty)
//
// We do NOT use GPS, maps APIs, or real-time data. The user provides either:
//   - A walking time in minutes directly, or
//   - An address string (from which we estimate walking time using a simple
//     heuristic — NOT a real geocoding/routing API).
//
// All walking estimates are labelled as simulated. Walking speed assumption:
// 5 km/h (average pedestrian).

export const WALKING_SPEED_KMH = 5;

/**
 * Estimate walking time in minutes from a distance in km.
 * Uses 5 km/h average walking speed.
 */
export function walkingTimeFromDistance(distanceKm: number): number {
  if (distanceKm <= 0) return 0;
  return Math.round((distanceKm / WALKING_SPEED_KMH) * 60);
}

/**
 * Estimate walking distance in km from a time in minutes.
 */
export function walkingDistanceFromTime(timeMin: number): number {
  if (timeMin <= 0) return 0;
  return Math.round(((timeMin / 60) * WALKING_SPEED_KMH) * 100) / 100;
}

/**
 * Estimate walking time to a station from a free-text address.
 *
 * This is a SIMULATED heuristic — we do NOT geocode the address or call a
 * routing API. The estimate is based on a simple model: assume the address is
 * within ~1–2 km of the station (typical for a metro catchment area) and
 * derive a walking time. If the user provides an explicit walking time, that
 * is used instead.
 *
 * The heuristic uses a hash of the address string to produce a deterministic
 * but varied estimate between 5 and 20 minutes. This ensures the same address
 * always yields the same estimate (no randomness on re-calculation).
 */
export function estimateWalkingFromAddress(
  address: string,
  stationId: string
): { timeMin: number; distanceKm: number; simulated: boolean } {
  if (!address.trim()) {
    return { timeMin: 0, distanceKm: 0, simulated: true };
  }

  // Deterministic hash from the address + stationId.
  const input = `${address}:${stationId}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  const absHash = Math.abs(hash);

  // Map hash to 5–20 minutes walking time.
  const timeMin = 5 + (absHash % 16);
  const distanceKm = walkingDistanceFromTime(timeMin);

  return { timeMin, distanceKm, simulated: true };
}

export const WALKING_MODEL_DESCRIPTION =
  'Walking estimates use a 5 km/h average speed. Address-to-station walking times are ' +
  'SIMULATED heuristics (no geocoding or map API). For accurate walking directions, use ' +
  'a maps application.';
