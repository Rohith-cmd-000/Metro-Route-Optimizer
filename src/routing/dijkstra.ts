// Dijkstra's shortest-path algorithm with a structured execution trace.
//
// This is the real routing engine. It operates on the same GraphData instance
// shown in the Graph Explorer (src/data/graphBuilder.ts → GRAPH). Results are
// computed from edge weights — nothing is hardcoded or randomised.
//
// Two weight modes:
//   - 'time':    optimise estimated travel time (edge.timeMin)
//   - 'distance': optimise estimated distance (edge.distanceKm)
//
// Data structures used (as required by the Phase 3 spec):
//   - Adjacency-list graph          → GRAPH.adjacencyList
//   - Min-priority queue            → MinPriorityQueue (binary heap)
//   - Distance / cost array         → dist Map<vertexId, number>
//   - Predecessor / parent array    → prev Map<vertexId, string | null>
//   - Visited / settled set         → settled Set<vertexId>
//   - Path reconstruction           → walk prev from destination to source
//
// We do NOT stop early when the destination is settled — that would be safe for
// a single-target query but the trace is more instructive with the full run,
// and correctness is unaffected. (For pure single-target use, early exit is an
// optimisation, not a correctness requirement.)

import { GRAPH, parseVertexId } from '@/data/graphBuilder';
import type { AdjacencyEntry, GraphData } from '@/types/metro';
import { MinPriorityQueue } from '@/routing/minPriorityQueue';

export type WeightMode = 'time' | 'distance';

// --- Trace event types ------------------------------------------------------

export interface TraceEventRelax {
  kind: 'relax';
  step: number;
  currentVertex: string;
  currentDist: number;
  neighbour: string;
  edgeWeight: number;
  candidateDist: number;
  neighbourPrevDist: number | null;
  relaxed: boolean;
}

export interface TraceEventSettle {
  kind: 'settle';
  step: number;
  vertex: string;
  dist: number;
  pqSizeAfter: number;
}

export interface TraceEventInit {
  kind: 'init';
  step: number;
  source: string;
  vertexCount: number;
}

export interface TraceEventResult {
  kind: 'result';
  step: number;
  destination: string;
  reached: boolean;
  path: string[];
  totalCost: number;
  hopCount: number;
}

export interface TraceEventSkip {
  kind: 'skip';
  step: number;
  vertex: string;
  reason: string;
}

export type TraceEvent =
  | TraceEventInit
  | TraceEventSettle
  | TraceEventRelax
  | TraceEventSkip
  | TraceEventResult;

// --- Result -----------------------------------------------------------------

export interface DijkstraResult {
  source: string;
  destination: string;
  mode: WeightMode;
  reached: boolean;
  /** Total cost along the path (time in minutes or distance in km). */
  totalCost: number;
  /** Ordered vertex ids from source to destination. */
  path: string[];
  hopCount: number;
  /** Per-vertex final distances. */
  dist: Map<string, number>;
  /** Per-vertex predecessor for path reconstruction. */
  prev: Map<string, string | null>;
  /** Ordered execution trace for the DSA viewer. */
  trace: TraceEvent[];
  /** Number of vertices settled during the run. */
  settledCount: number;
}

export interface DijkstraError {
  error: string;
}

// --- Weight selector --------------------------------------------------------

function edgeWeight(entry: AdjacencyEntry, mode: WeightMode): number {
  return mode === 'time' ? entry.edge.timeMin : entry.edge.distanceKm;
}

// --- Main algorithm ---------------------------------------------------------

/**
 * Run Dijkstra from `sourceVertexId` to `destinationVertexId` on `graph`
 * (defaults to the shared GRAPH instance). Returns a full result with trace,
 * or an error object for invalid inputs.
 */
export function dijkstra(
  sourceVertexId: string,
  destinationVertexId: string,
  mode: WeightMode = 'time',
  graph: GraphData = GRAPH
): DijkstraResult | DijkstraError {
  // --- Input validation ---
  if (!graph.adjacencyList.has(sourceVertexId)) {
    return {
      error: `Invalid source vertex: "${sourceVertexId}" does not exist in the graph.`,
    };
  }
  if (!graph.adjacencyList.has(destinationVertexId)) {
    return {
      error: `Invalid destination vertex: "${destinationVertexId}" does not exist in the graph.`,
    };
  }

  const trace: TraceEvent[] = [];
  let step = 0;

  trace.push({
    kind: 'init',
    step: step++,
    source: sourceVertexId,
    vertexCount: graph.vertexCount,
  });

  // --- Data structures ---
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const settled = new Set<string>();
  const pq = new MinPriorityQueue();

  for (const v of graph.vertices) {
    dist.set(v.id, Infinity);
    prev.set(v.id, null);
  }
  dist.set(sourceVertexId, 0);
  pq.insert(sourceVertexId, 0);

  // --- Main loop ---
  let settledCount = 0;

  while (!pq.isEmpty()) {
    const entry = pq.extractMin()!;
    const u = entry.id;
    const uDist = entry.dist;

    // Skip stale entries (a vertex may have multiple outdated PQ entries).
    if (settled.has(u)) {
      trace.push({
        kind: 'skip',
        step: step++,
        vertex: u,
        reason: 'Already settled — stale PQ entry skipped.',
      });
      continue;
    }

    settled.add(u);
    settledCount++;

    trace.push({
      kind: 'settle',
      step: step++,
      vertex: u,
      dist: uDist,
      pqSizeAfter: pq.size,
    });

    const neighbours = graph.adjacencyList.get(u) ?? [];

    for (const entry of neighbours) {
      const v = entry.vertex.id;
      if (settled.has(v)) continue;

      const weight = edgeWeight(entry, mode);
      const candidate = uDist + weight;
      const vPrev = dist.get(v) ?? Infinity;

      const relaxed = candidate < vPrev;

      trace.push({
        kind: 'relax',
        step: step++,
        currentVertex: u,
        currentDist: uDist,
        neighbour: v,
        edgeWeight: weight,
        candidateDist: candidate,
        neighbourPrevDist: vPrev === Infinity ? null : vPrev,
        relaxed,
      });

      if (relaxed) {
        dist.set(v, candidate);
        prev.set(v, u);
        pq.insert(v, candidate); // insert or decrease-key
      }
    }
  }

  // --- Path reconstruction (destination → source, then reverse) ---
  const destDist = dist.get(destinationVertexId) ?? Infinity;
  const reached = destDist !== Infinity;

  const path: string[] = [];
  if (reached) {
    let cur: string | null = destinationVertexId;
    while (cur !== null) {
      path.push(cur);
      cur = prev.get(cur) ?? null;
    }
    path.reverse();
  }

  const hopCount = reached ? Math.max(0, path.length - 1) : 0;

  trace.push({
    kind: 'result',
    step: step++,
    destination: destinationVertexId,
    reached,
    path,
    totalCost: reached ? destDist : 0,
    hopCount,
  });

  return {
    source: sourceVertexId,
    destination: destinationVertexId,
    mode,
    reached,
    totalCost: reached ? destDist : 0,
    path,
    hopCount,
    dist,
    prev,
    trace,
    settledCount,
  };
}

// --- Convenience: run on station ids (tries all source-line → dest-line pairs) ---

export interface StationDijkstraResult {
  result: DijkstraResult | DijkstraError;
  /** The specific source/destination vertex ids used. */
  sourceVertex: string;
  destinationVertex: string;
}

/**
 * Run Dijkstra between two *station* ids. Since a station may span multiple
 * line-vertices, we run the algorithm from each source vertex and pick the
 * result with the lowest cost to any destination vertex. The trace of the
 * winning run is returned.
 */
export function dijkstraBetweenStations(
  sourceStationId: string,
  destinationStationId: string,
  mode: WeightMode = 'time',
  graph: GraphData = GRAPH
): StationDijkstraResult | DijkstraError {
  const sourceVertices = graph.vertices.filter(
    (v) => v.stationId === sourceStationId
  );
  const destVertices = graph.vertices.filter(
    (v) => v.stationId === destinationStationId
  );

  if (sourceVertices.length === 0) {
    return { error: `Unknown source station: "${sourceStationId}".` };
  }
  if (destVertices.length === 0) {
    return { error: `Unknown destination station: "${destinationStationId}".` };
  }

  let best: DijkstraResult | null = null;
  let bestSrc = '';
  let bestDest = '';

  for (const src of sourceVertices) {
    // Run to a synthetic "super-sink": we run Dijkstra from src, then check
    // distances to all dest vertices. This avoids re-running per dest vertex.
    const result = dijkstra(src.id, destVertices[0].id, mode, graph);
    if ('error' in result) return result;

    // Check all destination vertices for the minimum distance from this source.
    for (const dv of destVertices) {
      const d = result.dist.get(dv.id) ?? Infinity;
      if (d < Infinity && (best === null || d < best.totalCost)) {
        // Reconstruct path for this specific dest vertex.
        const path: string[] = [];
        let cur: string | null = dv.id;
        while (cur !== null) {
          path.push(cur);
          cur = result.prev.get(cur) ?? null;
        }
        path.reverse();
        best = {
          ...result,
          destination: dv.id,
          totalCost: d,
          path,
          hopCount: Math.max(0, path.length - 1),
          trace: [
            ...result.trace.slice(0, -1), // drop the original result event
            {
              kind: 'result' as const,
              step: result.trace[result.trace.length - 1].step,
              destination: dv.id,
              reached: true,
              path,
              totalCost: d,
              hopCount: Math.max(0, path.length - 1),
            },
          ],
        };
        bestSrc = src.id;
        bestDest = dv.id;
      }
    }
  }

  if (!best) {
    // No path found — return the last run's trace with reached=false.
    const last = dijkstra(sourceVertices[0].id, destVertices[0].id, mode, graph);
    if ('error' in last) return last;
    return {
      result: { ...last, reached: false, path: [], totalCost: 0, hopCount: 0 },
      sourceVertex: sourceVertices[0].id,
      destinationVertex: destVertices[0].id,
    };
  }

  return { result: best, sourceVertex: bestSrc, destinationVertex: bestDest };
}

export { parseVertexId };
