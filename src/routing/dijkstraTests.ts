// Test suite for the Dijkstra implementation.
//
// Each test builds a small, hand-checkable graph, runs dijkstra(), and compares
// the result against an independently calculated expected answer. The tests are
// self-contained — they do not depend on the full Hyderabad Metro graph, so a
// failure points squarely at the algorithm, not the data.
//
// Test coverage (per the Phase 3 spec):
//   1. A graph where the direct route is more expensive than a two-edge route.
//   2. Source equals destination.
//   3. Unreachable destination.
//   4. Invalid station selection.
//   5. A route with multiple edges.
//   6. A test where a distance update improves a previously discovered distance.

import type {
  AdjacencyEntry,
  GraphData,
  GraphEdge,
  GraphVertex,
} from '@/types/metro';
import { dijkstra, type WeightMode } from '@/routing/dijkstra';

// --- Test graph builder (local, independent of the metro data) -------------

function makeGraph(
  vertexIds: string[],
  edgeSpecs: [string, string, number, number][]
): GraphData {
  const vertices: GraphVertex[] = vertexIds.map((id) => {
    const [stationId, line] = id.includes(':') ? id.split(':') : [id, 'x'];
    return {
      id,
      stationId,
      line: (line as GraphVertex['line']) ?? 'red',
    };
  });

  const edges: GraphEdge[] = edgeSpecs.map(([from, to, dist, time]) => ({
    from,
    to,
    type: 'adjacent',
    line: 'red',
    distanceKm: dist,
    timeMin: time,
  }));

  // Build bidirectional adjacency list.
  const adjacencyList = new Map<string, AdjacencyEntry[]>();
  const vmap = new Map(vertices.map((v) => [v.id, v]));
  for (const v of vertices) adjacencyList.set(v.id, []);

  for (const e of edges) {
    const fromV = vmap.get(e.from)!;
    const toV = vmap.get(e.to)!;
    adjacencyList.get(e.from)!.push({ vertex: toV, edge: e });
    adjacencyList.get(e.to)!.push({
      vertex: fromV,
      edge: { ...e, from: e.to, to: e.from },
    });
  }

  return {
    vertices,
    edges,
    adjacencyList,
    vertexCount: vertices.length,
    edgeCount: edges.length,
    stationCount: new Set(vertices.map((v) => v.stationId)).size,
    lineCount: 1,
  };
}

// --- Test runner ------------------------------------------------------------

export interface TestResult {
  name: string;
  passed: boolean;
  detail: string;
}

function runDijkstra(
  graph: GraphData,
  src: string,
  dst: string,
  mode: WeightMode
) {
  return dijkstra(src, dst, mode, graph);
}

// --- Individual tests -------------------------------------------------------

function testDirectVsTwoEdge(): TestResult {
  // A: direct edge costs 10; A→B→C costs 4+4=8. The two-edge route should win.
  const g = makeGraph(
    ['a:red', 'b:red', 'c:red'],
    [
      ['a:red', 'c:red', 10, 10],
      ['a:red', 'b:red', 4, 4],
      ['b:red', 'c:red', 4, 4],
    ]
  );
  const r = runDijkstra(g, 'a:red', 'c:red', 'time');
  if ('error' in r) return { name: 'Direct vs two-edge', passed: false, detail: `Error: ${r.error}` };
  const expectedCost = 8;
  const expectedPath = ['a:red', 'b:red', 'c:red'];
  const passed =
    r.reached &&
    r.totalCost === expectedCost &&
    JSON.stringify(r.path) === JSON.stringify(expectedPath);
  return {
    name: 'Direct route (10) more expensive than two-edge (4+4=8)',
    passed,
    detail: passed
      ? `Path ${r.path.join(' → ')} cost ${r.totalCost}`
      : `Expected ${expectedPath.join(' → ')} cost ${expectedCost}, got ${r.path.join(' → ')} cost ${r.totalCost}`,
  };
}

function testSourceEqualsDestination(): TestResult {
  const g = makeGraph(
    ['a:red', 'b:red'],
    [['a:red', 'b:red', 3, 3]]
  );
  const r = runDijkstra(g, 'a:red', 'a:red', 'time');
  if ('error' in r) return { name: 'Source equals destination', passed: false, detail: `Error: ${r.error}` };
  const passed = r.reached && r.totalCost === 0 && r.path.length === 1 && r.hopCount === 0;
  return {
    name: 'Source equals destination',
    passed,
    detail: passed
      ? 'Cost 0, path is just the source vertex.'
      : `Expected cost 0 / single-vertex path, got cost ${r.totalCost} / path ${r.path.join(' → ')}`,
  };
}

function testUnreachable(): TestResult {
  // Two disconnected components.
  const g = makeGraph(
    ['a:red', 'b:red', 'c:red', 'd:red'],
    [
      ['a:red', 'b:red', 2, 2],
      ['c:red', 'd:red', 2, 2],
    ]
  );
  const r = runDijkstra(g, 'a:red', 'd:red', 'time');
  if ('error' in r) return { name: 'Unreachable destination', passed: false, detail: `Error: ${r.error}` };
  const passed = !r.reached && r.path.length === 0 && r.totalCost === 0;
  return {
    name: 'Unreachable destination',
    passed,
    detail: passed
      ? 'Correctly reported unreachable with empty path.'
      : `Expected unreachable, got reached=${r.reached} path=${r.path.join(' → ')}`,
  };
}

function testInvalidStation(): TestResult {
  const g = makeGraph(['a:red', 'b:red'], [['a:red', 'b:red', 1, 1]]);
  const r1 = runDijkstra(g, 'zzz:red', 'a:red', 'time');
  const r2 = runDijkstra(g, 'a:red', 'zzz:red', 'time');
  const passed =
    'error' in r1 &&
    'error' in r2 &&
    r1.error.includes('Invalid source') &&
    r2.error.includes('Invalid destination');
  return {
    name: 'Invalid station selection',
    passed,
    detail: passed
      ? 'Both invalid source and invalid destination correctly rejected.'
      : `Expected error objects for both; got src=${JSON.stringify(r1).slice(0, 60)}, dst=${JSON.stringify(r2).slice(0, 60)}`,
  };
}

function testMultipleEdges(): TestResult {
  // A→B→C→D→E, each edge cost 2, total 8.
  const g = makeGraph(
    ['a:red', 'b:red', 'c:red', 'd:red', 'e:red'],
    [
      ['a:red', 'b:red', 2, 2],
      ['b:red', 'c:red', 2, 2],
      ['c:red', 'd:red', 2, 2],
      ['d:red', 'e:red', 2, 2],
    ]
  );
  const r = runDijkstra(g, 'a:red', 'e:red', 'distance');
  if ('error' in r) return { name: 'Multi-edge route', passed: false, detail: `Error: ${r.error}` };
  const expectedCost = 8;
  const expectedPath = ['a:red', 'b:red', 'c:red', 'd:red', 'e:red'];
  const passed =
    r.reached &&
    r.totalCost === expectedCost &&
    JSON.stringify(r.path) === JSON.stringify(expectedPath) &&
    r.hopCount === 4;
  return {
    name: 'Route with multiple edges (4 hops)',
    passed,
    detail: passed
      ? `Path ${r.path.join(' → ')} cost ${r.totalCost} hops ${r.hopCount}`
      : `Expected ${expectedPath.join(' → ')} cost ${expectedCost}, got ${r.path.join(' → ')} cost ${r.totalCost}`,
  };
}

function testDistanceUpdate(): TestResult {
  // A→C direct = 10. A→B = 2, B→C = 2 (total 4).
  // When A is settled, C gets dist 10. When B is settled (dist 2), C is
  // relaxed to 2+2=4, improving the previously discovered distance of 10.
  // This tests the decrease-key / update path.
  const g = makeGraph(
    ['a:red', 'b:red', 'c:red'],
    [
      ['a:red', 'c:red', 10, 10],
      ['a:red', 'b:red', 2, 2],
      ['b:red', 'c:red', 2, 2],
    ]
  );
  const r = runDijkstra(g, 'a:red', 'c:red', 'distance');
  if ('error' in r) return { name: 'Distance update improves prior', passed: false, detail: `Error: ${r.error}` };

  // Verify a relaxation event exists where C's distance improved from 10 to 4.
  const relaxEvents = r.trace.filter(
    (e) => e.kind === 'relax' && e.neighbour === 'c:red' && e.relaxed
  );
  const hasImprovement = relaxEvents.some(
    (e) => e.kind === 'relax' && e.neighbourPrevDist === 10 && e.candidateDist === 4
  );

  const expectedCost = 4;
  const expectedPath = ['a:red', 'b:red', 'c:red'];
  const passed =
    r.reached &&
    r.totalCost === expectedCost &&
    JSON.stringify(r.path) === JSON.stringify(expectedPath) &&
    hasImprovement;
  return {
    name: 'Distance update improves a previously discovered distance (10 → 4)',
    passed,
    detail: passed
      ? `C relaxed from 10 to 4 via B. Final path ${r.path.join(' → ')} cost ${r.totalCost}.`
      : `Expected C updated 10→4 via B, path a→b→c cost 4. Got cost ${r.totalCost}, improvement=${hasImprovement}`,
  };
}

// --- Run all tests ----------------------------------------------------------

export function runAllTests(): TestResult[] {
  return [
    testDirectVsTwoEdge(),
    testSourceEqualsDestination(),
    testUnreachable(),
    testInvalidStation(),
    testMultipleEdges(),
    testDistanceUpdate(),
  ];
}

export const DIJKSTRA_COMPLEXITY =
  'O((V + E) log V) — binary-heap min-priority queue with adjacency list';
