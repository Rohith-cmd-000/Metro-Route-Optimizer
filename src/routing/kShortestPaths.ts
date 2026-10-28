// Yen's K-shortest-loopless-paths algorithm.
//
// Finds up to K distinct simple paths (no repeated vertices) between two
// vertices, ranked by total weight. Used to generate alternative routes for the
// balanced objective and to provide multiple candidates across objectives.
//
// Reference: Yen, J. Y. (1971). "Finding the K Shortest Loopless Paths in a
// Network". Management Science.
//
// Implementation: uses Dijkstra (from dijkstra.ts) as the shortest-path
// subroutine. For each of the K-1 iterations, it spur from each node on the
// previous best path, temporarily removing edges/vertices to force divergence,
// and keeps the best candidate.

import { GRAPH, parseVertexId } from '@/data/graphBuilder';
import type { AdjacencyEntry, GraphData } from '@/types/metro';
import { dijkstra, type WeightMode } from '@/routing/dijkstra';

export interface KShortestPath {
  path: string[];
  totalCost: number;
}

/**
 * Find up to K shortest loopless paths from sourceStationId to destinationStationId.
 * Returns paths sorted by cost. Paths are vertex-id sequences (stationId:line).
 */
export function kShortestPaths(
  sourceStationId: string,
  destinationStationId: string,
  k: number,
  mode: WeightMode = 'time',
  graph: GraphData = GRAPH
): KShortestPath[] {
  const sourceVertices = graph.vertices.filter(
    (v) => v.stationId === sourceStationId
  );
  const destVertices = graph.vertices.filter(
    (v) => v.stationId === destinationStationId
  );

  if (sourceVertices.length === 0 || destVertices.length === 0) return [];

  const destSet = new Set(destVertices.map((v) => v.id));

  // Find the shortest path (try all source vertices, pick best).
  let bestFirst: KShortestPath | null = null;
  for (const sv of sourceVertices) {
    const result = dijkstra(sv.id, sv.id, mode, graph); // run full SSSP from sv
    if ('error' in result) continue;
    for (const dv of destVertices) {
      const d = result.dist.get(dv.id) ?? Infinity;
      if (d < Infinity) {
        const p: string[] = [];
        let cur: string | null = dv.id;
        while (cur !== null) {
          p.push(cur);
          cur = result.prev.get(cur) ?? null;
        }
        p.reverse();
        if (!bestFirst || d < bestFirst.totalCost) {
          bestFirst = { path: p, totalCost: d };
        }
      }
    }
  }

  if (!bestFirst) return [];

  const results: KShortestPath[] = [bestFirst];
  const seen = new Set<string>();
  seen.add(bestFirst.path.join('|'));

  const candidates: KShortestPath[] = [];

  for (let iter = 1; iter < k; iter++) {
    const prevPath = results[results.length - 1].path;

    for (let spurIndex = 0; spurIndex < prevPath.length - 1; spurIndex++) {
      const rootPath = prevPath.slice(0, spurIndex + 1);

      // Remove edges that share the same root path and diverge at spurIndex.
      const removedEdges: [string, string][] = [];
      for (const p of results) {
        if (p.path.length > spurIndex && p.path.slice(0, spurIndex + 1).join('|') === rootPath.join('|')) {
          if (spurIndex < p.path.length - 1) {
            removedEdges.push([p.path[spurIndex], p.path[spurIndex + 1]]);
          }
        }
      }

      // Remove root-path vertices (except spur node) from the graph.
      const removedVertices = new Set(rootPath.slice(0, -1));

      // Spur vertex.
      const spurVertex = prevPath[spurIndex];

      // Run Dijkstra from spurVertex on the modified graph.
      const spurResult = dijkstraOnModifiedGraph(
        spurVertex,
        destSet,
        mode,
        graph,
        removedEdges,
        removedVertices
      );

      if (spurResult && spurResult.path.length > 0) {
        const fullPath = [...rootPath.slice(0, -1), ...spurResult.path];
        const totalCost = computePathCost(fullPath, mode, graph);
        const key = fullPath.join('|');
        if (!seen.has(key) && totalCost < Infinity) {
          candidates.push({ path: fullPath, totalCost });
          seen.add(key);
        }
      }
    }

    if (candidates.length === 0) break;

    // Sort candidates by cost and pick the best.
    candidates.sort((a, b) => a.totalCost - b.totalCost);
    const next = candidates.shift()!;
    results.push(next);
  }

  return results;
}

/** Run Dijkstra from a source to any vertex in destSet on a modified graph. */
function dijkstraOnModifiedGraph(
  sourceVertexId: string,
  destSet: Set<string>,
  mode: WeightMode,
  graph: GraphData,
  removedEdges: [string, string][],
  removedVertices: Set<string>
): { path: string[]; cost: number } | null {
  const removedEdgeSet = new Set(removedEdges.map(([a, b]) => `${a}>${b}`));

  // Build a filtered adjacency list.
  const filteredAdj = new Map<string, AdjacencyEntry[]>();
  for (const [vid, neighbours] of graph.adjacencyList) {
    if (removedVertices.has(vid)) {
      filteredAdj.set(vid, []);
      continue;
    }
    filteredAdj.set(
      vid,
      neighbours.filter((n) => {
        if (removedVertices.has(n.vertex.id)) return false;
        if (removedEdgeSet.has(`${vid}>${n.vertex.id}`)) return false;
        return true;
      })
    );
  }

  const modifiedGraph: GraphData = {
    ...graph,
    adjacencyList: filteredAdj,
  };

  const result = dijkstra(sourceVertexId, sourceVertexId, mode, modifiedGraph);
  if ('error' in result) return null;

  // Find the closest destination vertex.
  let bestDest: string | null = null;
  let bestCost = Infinity;
  for (const dv of destSet) {
    if (removedVertices.has(dv)) continue;
    const d = result.dist.get(dv) ?? Infinity;
    if (d < bestCost) {
      bestCost = d;
      bestDest = dv;
    }
  }

  if (!bestDest || bestCost === Infinity) return null;

  const path: string[] = [];
  let cur: string | null = bestDest;
  while (cur !== null) {
    path.push(cur);
    cur = result.prev.get(cur) ?? null;
  }
  path.reverse();

  return { path, cost: bestCost };
}

/** Compute total cost of a path by summing edge weights. */
function computePathCost(
  path: string[],
  mode: WeightMode,
  graph: GraphData
): number {
  let cost = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const neighbours = graph.adjacencyList.get(path[i]) ?? [];
    const entry = neighbours.find((n) => n.vertex.id === path[i + 1]);
    if (!entry) return Infinity;
    cost += mode === 'time' ? entry.edge.timeMin : entry.edge.distanceKm;
  }
  return cost;
}

/** Remove duplicate paths (same station sequence, ignoring line). */
export function deduplicatePaths(paths: KShortestPath[]): KShortestPath[] {
  const seen = new Set<string>();
  const result: KShortestPath[] = [];
  for (const p of paths) {
    // Key: station sequence only (strip line from vertex id).
    const stationKey = p.path
      .map((vid) => parseVertexId(vid).stationId)
      .join('|');
    if (!seen.has(stationKey)) {
      seen.add(stationKey);
      result.push(p);
    }
  }
  return result;
}

export { parseVertexId };
