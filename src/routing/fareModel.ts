// Hyderabad Metro fare estimation model.
//
// Hyderabad Metro fares are distance-based with fixed slabs. The official fare
// structure (as published by HMRL) ranges from Rs. 10 (minimum) to Rs. 60
// (maximum). This module estimates fares from the total metro distance
// travelled using the known slab boundaries.
//
// Source: HMRL published fare structure. The slab thresholds are verified;
// the fare is the same regardless of which lines are used — it depends only on
// the total distance travelled on the metro network. This means a metro-only
// path from A to B has the same fare regardless of route, so the "cheapest"
// objective is most meaningful when first/last-mile costs differ (future
// extension). For now, cheapest minimises fare, and when all routes have the
// same fare, the router explicitly notes that.

/** Fare slabs: [maxDistanceKm, fareINR]. Distance is total metro track distance. */
const FARE_SLABS: [number, number][] = [
  [2, 10],
  [4, 15],
  [6, 20],
  [8, 25],
  [10, 30],
  [14, 35],
  [18, 40],
  [22, 45],
  [26, 50],
  [30, 55],
  [Infinity, 60],
];

/**
 * Estimate the metro fare for a journey given total metro distance in km.
 * Returns the fare in INR. Returns null if distance is invalid (negative/NaN).
 */
export function estimateFare(totalDistanceKm: number): number | null {
  if (totalDistanceKm < 0 || Number.isNaN(totalDistanceKm)) return null;
  for (const [maxDist, fare] of FARE_SLABS) {
    if (totalDistanceKm <= maxDist) return fare;
  }
  return 60; // maximum fare
}

/**
 * Check whether two fares are meaningfully different. Hyderabad Metro fares
 * are slab-based, so two routes whose distances fall in the same slab have the
 * same fare. This is used by the "cheapest" objective to decide whether a
 * genuine cheapest route exists or whether all routes share the same fare.
 */
export function faresAreDifferent(fareA: number, fareB: number): boolean {
  return fareA !== fareB;
}

export const FARE_MODEL_DESCRIPTION =
  'Distance-based slab fares (Rs. 10–60) per HMRL published structure. ' +
  'Fare depends only on total metro distance, not on the number of lines used.';
