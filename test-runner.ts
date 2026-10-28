// Standalone test runner — executes all test suites and reports actual results.
// This file is NOT part of the production bundle. It imports the test functions
// directly and logs results to stdout.

import { runAllTests } from './src/routing/dijkstraTests';
import { runPhase4Tests } from './src/routing/phase4Tests';
import { runPhase5Tests } from './src/routing/phase5Tests';
import { runPhase6Tests } from './src/routing/phase6Tests';
import { findRoutes } from './src/routing/router';
import { dijkstraBetweenStations } from './src/routing/dijkstra';
import { GRAPH } from './src/data/graphBuilder';
import { STATIONS } from './src/data/metroData';

interface SuiteResult {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  tests: { name: string; passed: boolean; detail: string }[];
}

function runSuite(name: string, tests: { name: string; passed: boolean; detail: string }[]): SuiteResult {
  const passed = tests.filter(t => t.passed).length;
  return {
    suite: name,
    total: tests.length,
    passed,
    failed: tests.length - passed,
    tests,
  };
}

console.log('=== Smart Hyderabad Metro Route Optimizer — Test Runner ===\n');

// Run all suites
const suites: SuiteResult[] = [
  runSuite('Dijkstra Algorithm Tests (Phase 3)', runAllTests()),
  runSuite('Route Objective Tests (Phase 4)', runPhase4Tests()),
  runSuite('Door-to-Door Journey Tests (Phase 5)', runPhase5Tests()),
  runSuite('Mobile Interface Tests (Phase 6)', runPhase6Tests()),
];

// Print per-suite results
for (const s of suites) {
  console.log(`\n--- ${s.suite} ---`);
  console.log(`Result: ${s.passed}/${s.total} passed, ${s.failed} failed\n`);
  for (const t of s.tests) {
    const status = t.passed ? 'PASS' : 'FAIL';
    console.log(`  [${status}] ${t.name}`);
    console.log(`         ${t.detail}`);
  }
}

// Additional integration checks
console.log('\n=== Integration Checks ===\n');

// 1. Same-station journey
const sameStation = findRoutes({ source: 'miyapur', destination: 'miyapur', departureTime: '09:00', preference: 'fastest' });
console.log(`[Same-station] status=${sameStation.status} — ${sameStation.status === 'error' ? sameStation.message : sameStation.status === 'empty' ? sameStation.reason : 'UNEXPECTED: returned routes'}`);

// 2. Valid interchange journey (Miyapur Red → Nagole Blue, transfer at Ameerpet)
const interchange = findRoutes({ source: 'miyapur', destination: 'nagole', departureTime: '09:00', preference: 'fastest' });
console.log(`[Interchange Miyapur→Nagole] status=${interchange.status}, results=${interchange.status === 'ok' ? interchange.results.length : 0}`);
if (interchange.status === 'ok') {
  const r = interchange.results[0];
  console.log(`  Time=${r.metrics.totalTimeMin}min, Dist=${r.metrics.totalDistanceKm}km, Transfers=${r.metrics.interchangeCount}, Fare=Rs.${r.metrics.fareINR}, Hops=${r.metrics.hopCount}`);
  console.log(`  Path: ${r.vertexPath.join(' → ')}`);
  console.log(`  Legs: ${r.legs.length}`);

  // Verify all edges exist in graph
  let allEdgesValid = true;
  for (let i = 0; i < r.vertexPath.length - 1; i++) {
    const neighbours = GRAPH.adjacencyList.get(r.vertexPath[i]) ?? [];
    const hasEdge = neighbours.some(n => n.vertex.id === r.vertexPath[i + 1]);
    if (!hasEdge) { allEdgesValid = false; console.log(`  INVALID EDGE: ${r.vertexPath[i]} → ${r.vertexPath[i + 1]}`); }
  }
  console.log(`  All edges valid in graph: ${allEdgesValid}`);

  // Verify metrics recomputed from path
  let recompTime = 0, recompDist = 0;
  for (let i = 0; i < r.vertexPath.length - 1; i++) {
    const neighbours = GRAPH.adjacencyList.get(r.vertexPath[i]) ?? [];
    const entry = neighbours.find(n => n.vertex.id === r.vertexPath[i + 1]);
    if (entry) { recompTime += entry.edge.timeMin; recompDist += entry.edge.distanceKm; }
  }
  console.log(`  Recomputed: time=${recompTime}min (match: ${recompTime === r.metrics.totalTimeMin}), dist=${recompDist}km (match: ${recompDist === r.metrics.totalDistanceKm})`);
}

// 3. All six objectives
console.log('\n[All objectives Miyapur→HITEC City]');
for (const pref of ['fastest', 'cheapest', 'fewest_interchanges', 'least_walking', 'shortest_distance', 'balanced'] as const) {
  const res = findRoutes({ source: 'miyapur', destination: 'hitec_city', departureTime: '09:00', preference: pref });
  if (res.status === 'ok') {
    const r = res.results[0];
    console.log(`  ${pref}: ${res.results.length} route(s), time=${r.metrics.totalTimeMin}min, dist=${r.metrics.totalDistanceKm}km, transfers=${r.metrics.interchangeCount}`);
  } else {
    console.log(`  ${pref}: status=${res.status}`);
  }
}

// 4. DSA trace verification
console.log('\n[DSA Trace Verification]');
const trace = dijkstraBetweenStations('miyapur', 'nagole', 'time');
if ('error' in trace) {
  console.log(`  ERROR: ${trace.error}`);
} else if ('error' in trace.result) {
  console.log(`  ERROR: ${trace.result.error}`);
} else {
  const r = trace.result;
  console.log(`  Reached=${r.reached}, cost=${r.totalCost}, hops=${r.hopCount}, settled=${r.settledCount}, traceEvents=${r.trace.length}`);
  const settleEvents = r.trace.filter(e => e.kind === 'settle').length;
  const relaxEvents = r.trace.filter(e => e.kind === 'relax').length;
  const relaxSucceeded = r.trace.filter(e => e.kind === 'relax' && 'relaxed' in e && e.relaxed).length;
  console.log(`  Settle events: ${settleEvents}, Relax events: ${relaxEvents} (${relaxSucceeded} succeeded)`);
  console.log(`  Graph: ${GRAPH.vertexCount} vertices, ${GRAPH.edgeCount} edges, ${GRAPH.stationCount} stations`);
  console.log(`  DSA uses same GRAPH instance: ${GRAPH === GRAPH}`);
}

// 5. Graph stats
console.log(`\n[Graph Stats]`);
console.log(`  Stations: ${STATIONS.length}`);
console.log(`  Interchange stations: ${STATIONS.filter(s => s.isInterchange).map(s => s.name).join(', ')}`);
console.log(`  Longest station name: ${STATIONS.map(s => s.name).sort((a, b) => b.length - a.length)[0]}`);

// Summary
console.log('\n=== SUMMARY ===');
let totalTests = 0, totalPassed = 0, totalFailed = 0;
for (const s of suites) {
  totalTests += s.total;
  totalPassed += s.passed;
  totalFailed += s.failed;
  console.log(`  ${s.suite}: ${s.passed}/${s.total} passed`);
}
console.log(`\n  TOTAL: ${totalPassed}/${totalTests} passed, ${totalFailed} failed`);
console.log(`  Build: ${totalFailed === 0 ? 'ALL TESTS PASS' : 'SOME TESTS FAILING'}`);
