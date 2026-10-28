// Transfer-aware shortest path: minimises line changes first, then travel time.
//
// Instead of adding an arbitrary penalty for transfers (which can distort the
// time-optimal path), this algorithm uses a lexicographic cost:
//   cost = (transferCount, totalTimeMin)
// The search state tracks the current line, so a state is (vertexId, lineId).
// When traversing an interchange edge, the transfer count increases by 1 and
// the line changes. When traversing an adjacent edge on the same line, neither
// changes. This correctly finds the path with the fewest line changes, and
// among equally-few-change paths, the fastest one.
//
// Uses a modified Dijkstra with lexicographic comparison on the PQ. This is
// the correct approach — not a penalty hack.

import { GRAPH, parseVertexId } from '@/data/graphBuilder';
import type { GraphData } from '@/types/metro';
import { MinPriorityQueue } from '@/routing/minPriorityQueue';

export interface TransferAwareResult {
  source: string;
  destination: string;
  reached: boolean;
  path: string[];
  transferCount: number;
  totalTimeMin: number;
  hopCount: number;
}

export interface TransferAwareError {
  error: string;
}

/** Lexicographic key: (transfers, time). Compared as a composite number. */
function makeKey(transfers: number, time: number): number {
  // Transfers dominate: multiply by a large constant so time never overflows.
  return transfers * 1_000_000 + time;
}

export function transferAwareShortestPath(
  sourceStationId: string,
  destinationStationId: string,
  graph: GraphData = GRAPH
): TransferAwareResult | TransferAwareError {
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

  const destSet = new Set(destVertices.map((v) => v.id));

  // State key: vertexId (the line is embedded in the vertex id).
  const dist = new Map<string, number>(); // lexicographic key
  const prev = new Map<string, string | null>();
  const transfersMap = new Map<string, number>();
  const timeMap = new Map<string, number>();
  const settled = new Set<string>();
  const pq = new MinPriorityQueue();

  for (const sv of sourceVertices) {
    const key = makeKey(0, 0);
    dist.set(sv.id, key);
    prev.set(sv.id, null);
    transfersMap.set(sv.id, 0);
    timeMap.set(sv.id, 0);
    pq.insert(sv.id, key);
  }

  let bestDest: string | null = null;
  let bestKey = Infinity;

  while (!pq.isEmpty()) {
    const entry = pq.extractMin()!;
    const u = entry.id;

    if (settled.has(u)) continue;
    settled.add(u);

    const uKey = dist.get(u) ?? Infinity;
    if (uKey > bestKey) continue; // can't improve

    if (destSet.has(u)) {
      const k = dist.get(u) ?? Infinity;
      if (k < bestKey) {
        bestKey = k;
        bestDest = u;
      }
      continue; // don't expand past destination
    }

    const uTransfers = transfersMap.get(u) ?? 0;
    const uTime = timeMap.get(u) ?? 0;

    const neighbours = graph.adjacencyList.get(u) ?? [];
    for (const entry of neighbours) {
      const v = entry.vertex.id;
      if (settled.has(v)) continue;

      // An interchange edge means a line change.
      const isInterchange = entry.edge.type === 'interchange';
      const newTransfers = uTransfers + (isInterchange ? 1 : 0);
      const newTime = uTime + entry.edge.timeMin;
      const newKey = makeKey(newTransfers, newTime);

      const vPrev = dist.get(v) ?? Infinity;
      if (newKey < vPrev) {
        dist.set(v, newKey);
        prev.set(v, u);
        transfersMap.set(v, newTransfers);
        timeMap.set(v, newTime);
        pq.insert(v, newKey);
      }
    }
  }

  if (!bestDest) {
    return {
      source: sourceStationId,
      destination: destinationStationId,
      reached: false,
      path: [],
      transferCount: 0,
      totalTimeMin: 0,
      hopCount: 0,
    };
  }

  // Reconstruct path.
  const path: string[] = [];
  let cur: string | null = bestDest;
  while (cur !== null) {
    path.push(cur);
    cur = prev.get(cur) ?? null;
  }
  path.reverse();

  return {
    source: sourceStationId,
    destination: destinationStationId,
    reached: true,
    path,
    transferCount: transfersMap.get(bestDest) ?? 0,
    totalTimeMin: timeMap.get(bestDest) ?? 0,
    hopCount: Math.max(0, path.length - 1),
  };
}

export { parseVertexId };
