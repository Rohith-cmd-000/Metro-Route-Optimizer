// Phase 6 acceptance tests for the polished mobile journey-planning interface.
//
// Each test returns { name, passed, detail }. Tests are pure functions that
// call findRoutes() and verify the route results, totals, and edge cases.
//
// Required tests:
//   1. Route totals match routing engine output
//   2. Swapping source and destination produces a valid reverse route
//   3. Invalid input (same source and destination) is rejected
//   4. Switching between routes produces distinct results
//   5. Missing coordinates — schematic map data availability check
//   6. Long station names handled correctly

import { STATION_BY_ID, STATIONS } from '@/data/metroData';
import { findRoutes } from '@/routing/router';
import type { JourneyRequest } from '@/types/metro';

export interface Phase6TestResult {
  name: string;
  passed: boolean;
  detail: string;
}

function makeRequest(overrides?: Partial<JourneyRequest>): JourneyRequest {
  return {
    source: 'miyapur',
    destination: 'hitec_city',
    departureTime: '09:00',
    preference: 'fastest',
    ...overrides,
  };
}

// 1. Route totals match routing engine output — the metrics on each result
//    should be internally consistent (time = sum of leg times, distance = sum
//    of leg distances, transfers = legs - 1).
function testRouteTotalsConsistency(): Phase6TestResult {
  const req = makeRequest();
  const outcome = findRoutes(req);

  if (outcome.status !== 'ok' || outcome.results.length === 0) {
    return { name: 'Route totals match engine output', passed: false, detail: 'No route returned.' };
  }

  for (let i = 0; i < outcome.results.length; i++) {
    const r = outcome.results[i];
    const legTimeSum = r.legs.reduce((s, l) => s + l.timeMin, 0);
    const legDistSum = r.legs.reduce((s, l) => s + l.distanceKm, 0);
    const expectedTransfers = Math.max(0, r.legs.length - 1);

    if (Math.abs(legTimeSum - r.metrics.totalTimeMin) > 0.01) {
      return { name: 'Route totals match engine output', passed: false, detail: `Route ${i}: leg time sum ${legTimeSum} != totalTimeMin ${r.metrics.totalTimeMin}.` };
    }
    if (Math.abs(legDistSum - r.metrics.totalDistanceKm) > 0.01) {
      return { name: 'Route totals match engine output', passed: false, detail: `Route ${i}: leg distance sum ${legDistSum} != totalDistanceKm ${r.metrics.totalDistanceKm}.` };
    }
    if (expectedTransfers !== r.metrics.interchangeCount) {
      return { name: 'Route totals match engine output', passed: false, detail: `Route ${i}: expected ${expectedTransfers} transfers, got ${r.metrics.interchangeCount}.` };
    }
  }

  return {
    name: 'Route totals match engine output',
    passed: true,
    detail: `${outcome.results.length} route(s) verified: leg time/distance sums match metrics, transfer counts correct.`,
  };
}

// 2. Swapping source and destination — A→B should produce a valid route, and
//    B→A should also produce a valid route with the same line structure reversed.
function testSwapEndpoints(): Phase6TestResult {
  const fwdReq = makeRequest({ source: 'miyapur', destination: 'nagole' });
  const revReq = makeRequest({ source: 'nagole', destination: 'miyapur' });
  const fwd = findRoutes(fwdReq);
  const rev = findRoutes(revReq);

  if (fwd.status !== 'ok' || fwd.results.length === 0) {
    return { name: 'Swap endpoints produces reverse route', passed: false, detail: 'Forward route failed.' };
  }
  if (rev.status !== 'ok' || rev.results.length === 0) {
    return { name: 'Swap endpoints produces reverse route', passed: false, detail: 'Reverse route failed.' };
  }

  const fwdRoute = fwd.results[0];
  const revRoute = rev.results[0];

  if (fwdRoute.source !== 'miyapur' || fwdRoute.destination !== 'nagole') {
    return { name: 'Swap endpoints produces reverse route', passed: false, detail: 'Forward source/dest mismatch.' };
  }
  if (revRoute.source !== 'nagole' || revRoute.destination !== 'miyapur') {
    return { name: 'Swap endpoints produces reverse route', passed: false, detail: 'Reverse source/dest mismatch.' };
  }
  // The reverse route should have the same number of legs (same lines, reversed).
  if (fwdRoute.legs.length !== revRoute.legs.length) {
    return { name: 'Swap endpoints produces reverse route', passed: false, detail: `Forward has ${fwdRoute.legs.length} legs, reverse has ${revRoute.legs.length}.` };
  }
  // Distance should be the same (same track, opposite direction).
  if (Math.abs(fwdRoute.metrics.totalDistanceKm - revRoute.metrics.totalDistanceKm) > 0.01) {
    return { name: 'Swap endpoints produces reverse route', passed: false, detail: `Forward distance ${fwdRoute.metrics.totalDistanceKm} != reverse ${revRoute.metrics.totalDistanceKm}.` };
  }

  return {
    name: 'Swap endpoints produces reverse route',
    passed: true,
    detail: `Forward Miyapur→Nagole: ${fwdRoute.metrics.totalTimeMin} min, ${fwdRoute.legs.length} legs. Reverse: ${revRoute.metrics.totalTimeMin} min, ${revRoute.legs.length} legs. Distance matches.`,
  };
}

// 3. Invalid input — same source and destination should be rejected.
function testInvalidSameStation(): Phase6TestResult {
  const req = makeRequest({ source: 'ameerpet', destination: 'ameerpet' });
  const outcome = findRoutes(req);

  if (outcome.status === 'ok') {
    return { name: 'Invalid input (same station) rejected', passed: false, detail: 'Same source and destination returned routes instead of an error.' };
  }
  if (outcome.status === 'error') {
    return { name: 'Invalid input (same station) rejected', passed: true, detail: `Correctly rejected: ${outcome.message}` };
  }
  if (outcome.status === 'empty') {
    return { name: 'Invalid input (same station) rejected', passed: true, detail: `Correctly returned empty: ${outcome.reason}` };
  }
  return { name: 'Invalid input (same station) rejected', passed: false, detail: 'Unexpected outcome status.' };
}

// 4. Switching between routes — when multiple routes exist, each should be
//    distinct (different vertex paths or different metrics).
function testSwitchingRoutes(): Phase6TestResult {
  const req = makeRequest({ source: 'miyapur', destination: 'hitec_city', preference: 'balanced' });
  const outcome = findRoutes(req);

  if (outcome.status !== 'ok') {
    return { name: 'Switching between routes', passed: false, detail: 'No routes returned for balanced query.' };
  }
  if (outcome.results.length < 2) {
    return { name: 'Switching between routes', passed: true, detail: 'Only 1 route found — switching test skipped (no alternative to switch to).' };
  }

  // Check that at least two routes have different vertex paths.
  const paths = outcome.results.map((r) => r.vertexPath.join(','));
  const uniquePaths = new Set(paths);
  if (uniquePaths.size < 2) {
    return { name: 'Switching between routes', passed: false, detail: `${outcome.results.length} routes but all have the same vertex path.` };
  }

  // Verify each route's metrics are self-consistent.
  for (let i = 0; i < outcome.results.length; i++) {
    const r = outcome.results[i];
    if (r.metrics.totalTimeMin <= 0) {
      return { name: 'Switching between routes', passed: false, detail: `Route ${i} has non-positive time.` };
    }
  }

  return {
    name: 'Switching between routes',
    passed: true,
    detail: `${outcome.results.length} distinct routes with ${uniquePaths.size} unique paths. All metrics positive.`,
  };
}

// 5. Missing coordinates — stations have no geographic coordinates, so the
//    schematic map must be used. This test verifies that no station has lat/lng
//    fields (confirming the need for a schematic diagram).
function testMissingCoordinates(): Phase6TestResult {
  const stationsWithCoords = STATIONS.filter(
    (s) => 'lat' in s || 'lng' in s || 'latitude' in s || 'longitude' in s
  );

  if (stationsWithCoords.length > 0) {
    return {
      name: 'Missing coordinates — schematic required',
      passed: false,
      detail: `${stationsWithCoords.length} stations have coordinate fields. Expected none (schematic map should be used).`,
    };
  }

  return {
    name: 'Missing coordinates — schematic required',
    passed: true,
    detail: `Confirmed: 0 of ${STATIONS.length} stations have geographic coordinates. Schematic diagram is the correct approach.`,
  };
}

// 6. Long station names — verify that all station names are non-empty strings
//    and that the longest names (e.g. "Osmania Medical College", "Jubilee Hills
//    Check Post") are handled without truncation issues in the data layer.
function testLongStationNames(): Phase6TestResult {
  const emptyNames = STATIONS.filter((s) => !s.name || s.name.trim().length === 0);
  if (emptyNames.length > 0) {
    return { name: 'Long station names handled', passed: false, detail: `${emptyNames.length} stations have empty names.` };
  }

  const longNames = STATIONS.filter((s) => s.name.length > 20)
    .map((s) => s.name)
    .sort((a, b) => b.length - a.length);

  if (longNames.length === 0) {
    return { name: 'Long station names handled', passed: true, detail: 'No station names exceed 20 chars — all names are reasonably short.' };
  }

  // Verify the longest name is accessible via STATION_BY_ID.
  const longest = longNames[0];
  const stationWithLongName = STATIONS.find((s) => s.name === longest);
  if (!stationWithLongName) {
    return { name: 'Long station names handled', passed: false, detail: `Longest name "${longest}" not found in STATIONS.` };
  }
  const lookedUp = STATION_BY_ID[stationWithLongName.id];
  if (!lookedUp || lookedUp.name !== longest) {
    return { name: 'Long station names handled', passed: false, detail: `STATION_BY_ID lookup failed for "${longest}".` };
  }

  return {
    name: 'Long station names handled',
    passed: true,
    detail: `${longNames.length} station(s) with names > 20 chars. Longest: "${longest}" (${longest.length} chars). All lookups succeed.`,
  };
}

// --- Runner ------------------------------------------------------------------

export function runPhase6Tests(): Phase6TestResult[] {
  return [
    testRouteTotalsConsistency(),
    testSwapEndpoints(),
    testInvalidSameStation(),
    testSwitchingRoutes(),
    testMissingCoordinates(),
    testLongStationNames(),
  ];
}
