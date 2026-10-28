// Graph construction for the Hyderabad Metro network.
//
// This module turns the raw line-ordered station lists in metroData.ts into a
// weighted, validated graph:
//
//   - Each vertex is a (station, line) pair, so a station served by N lines
//     produces N vertices. Vertex ids are `${stationId}:${lineId}`.
//   - "adjacent" edges connect consecutive stations on the same line.
//   - "interchange" edges explicitly connect the vertices of the same physical
//     station across different lines — never implied by a name match.
//   - "walking" edges are reserved for out-of-station transfers (none in the
//     Phase 1 network, but the type is ready for Phase 2 extensions).
//
// The adjacency list, validation, and counts are all derived from the loaded
// data — nothing is hardcoded in the UI.

import {
  LINE_ORDER,
  LINE_STATION_IDS,
  METRO_LINES,
  STATION_BY_ID,
  STATIONS,
} from '@/data/metroData';
import type {
  AdjacencyEntry,
  DataProvenance,
  GraphData,
  GraphEdge,
  GraphVertex,
  ValidationIssue,
  ValidationResult,
} from '@/types/metro';
import { DATA_PROVENANCE } from '@/data/dataProvenance';

// --- Weight estimates (simulated — see dataProvenance.ts) -------------------

const AVG_DISTANCE_KM = 1.1; // uniform inter-station estimate
const AVG_TIME_MIN = 2.4; // ~1.8 min/km + dwell
const INTERCHANGE_PENALTY_MIN = 5; // platform change + waiting
const INTERCHANGE_DISTANCE_KM = 0; // same physical station

// --- Vertex id helpers ------------------------------------------------------

export function vertexId(stationId: string, line: string): string {
  return `${stationId}:${line}`;
}

export function parseVertexId(id: string): { stationId: string; line: string } {
  const idx = id.indexOf(':');
  if (idx < 0) return { stationId: id, line: '' };
  return { stationId: id.slice(0, idx), line: id.slice(idx + 1) };
}

// --- Build vertices ---------------------------------------------------------

function buildVertices(): GraphVertex[] {
  const vertices: GraphVertex[] = [];
  for (const line of LINE_ORDER) {
    for (const stationId of LINE_STATION_IDS[line]) {
      vertices.push({ id: vertexId(stationId, line), stationId, line });
    }
  }
  return vertices;
}

// --- Build edges ------------------------------------------------------------

function buildAdjacentEdges(): GraphEdge[] {
  const edges: GraphEdge[] = [];
  for (const line of LINE_ORDER) {
    const ids = LINE_STATION_IDS[line];
    for (let i = 0; i < ids.length - 1; i++) {
      const from = vertexId(ids[i], line);
      const to = vertexId(ids[i + 1], line);
      edges.push({
        from,
        to,
        type: 'adjacent',
        line,
        distanceKm: AVG_DISTANCE_KM,
        timeMin: AVG_TIME_MIN,
      });
    }
  }
  return edges;
}

// Explicit interchange edges: for every station served by >1 line, connect all
// pairs of its vertices. These are bidirectional (added in both directions in
// the adjacency list).
function buildInterchangeEdges(): GraphEdge[] {
  const edges: GraphEdge[] = [];
  for (const station of STATIONS) {
    if (station.lines.length < 2) continue;
    for (let i = 0; i < station.lines.length; i++) {
      for (let j = i + 1; j < station.lines.length; j++) {
        const a = vertexId(station.id, station.lines[i]);
        const b = vertexId(station.id, station.lines[j]);
        const note = `Transfer at ${station.name} (${METRO_LINES[station.lines[i]].name} ↔ ${METRO_LINES[station.lines[j]].name})`;
        edges.push({
          from: a,
          to: b,
          type: 'interchange',
          line: station.lines[i],
          distanceKm: INTERCHANGE_DISTANCE_KM,
          timeMin: INTERCHANGE_PENALTY_MIN,
          note,
        });
        edges.push({
          from: b,
          to: a,
          type: 'interchange',
          line: station.lines[j],
          distanceKm: INTERCHANGE_DISTANCE_KM,
          timeMin: INTERCHANGE_PENALTY_MIN,
          note,
        });
      }
    }
  }
  return edges;
}

// --- Adjacency list (bidirectional for adjacent edges) ----------------------

function buildAdjacencyList(
  vertices: GraphVertex[],
  edges: GraphEdge[]
): Map<string, AdjacencyEntry[]> {
  const map = new Map<string, AdjacencyEntry[]>();
  for (const v of vertices) map.set(v.id, []);

  const addEntry = (from: string, to: string, edge: GraphEdge) => {
    const target = vertices.find((v) => v.id === to);
    if (!target) return;
    const list = map.get(from);
    if (list) list.push({ vertex: target, edge });
  };

  for (const e of edges) {
    if (e.type === 'adjacent') {
      // bidirectional
      addEntry(e.from, e.to, e);
      addEntry(e.to, e.from, { ...e, from: e.to, to: e.from });
    } else {
      // interchange / walking are already directed pairs (both added above)
      addEntry(e.from, e.to, e);
    }
  }

  return map;
}

// --- Validation -------------------------------------------------------------

function validateGraph(
  vertices: GraphVertex[],
  edges: GraphEdge[],
  adjacency: Map<string, AdjacencyEntry[]>
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const vertexIds = new Set(vertices.map((v) => v.id));

  // 1. Duplicate vertex ids.
  const seenV = new Set<string>();
  for (const v of vertices) {
    if (seenV.has(v.id)) {
      issues.push({ level: 'error', message: `Duplicate vertex id: ${v.id}` });
    }
    seenV.add(v.id);
  }

  // 2. Duplicate station ids within a line.
  for (const line of LINE_ORDER) {
    const ids = LINE_STATION_IDS[line];
    const s = new Set<string>();
    for (const id of ids) {
      if (s.has(id)) {
        issues.push({
          level: 'error',
          message: `Duplicate station id "${id}" on ${METRO_LINES[line].name}`,
        });
      }
      s.add(id);
    }
  }

  // 3. Every edge endpoint must refer to a valid vertex.
  for (const e of edges) {
    if (!vertexIds.has(e.from)) {
      issues.push({
        level: 'error',
        message: `Edge from unknown vertex: ${e.from}`,
      });
    }
    if (!vertexIds.has(e.to)) {
      issues.push({
        level: 'error',
        message: `Edge to unknown vertex: ${e.to}`,
      });
    }
  }

  // 4. Station ids referenced by vertices must exist in STATION_BY_ID.
  for (const v of vertices) {
    if (!STATION_BY_ID[v.stationId]) {
      issues.push({
        level: 'error',
        message: `Vertex ${v.id} references unknown station ${v.stationId}`,
      });
    }
  }

  // 5. Station count from line lists must match MetroLine.stationCount.
  for (const line of LINE_ORDER) {
    const declared = METRO_LINES[line].stationCount;
    // Unique stations on this line (a station could appear once per line).
    const unique = new Set(LINE_STATION_IDS[line]).size;
    if (unique !== declared) {
      issues.push({
        level: 'warning',
        message: `${METRO_LINES[line].name}: ${unique} unique stations in data vs ${declared} declared`,
      });
    }
  }

  // 6. Connectivity: every vertex must have at least one neighbour.
  for (const [vid, neighbours] of adjacency) {
    if (neighbours.length === 0) {
      issues.push({
        level: 'error',
        message: `Isolated vertex (no edges): ${vid}`,
      });
    }
  }

  // 7. Interchange vertices must have at least one interchange edge.
  for (const station of STATIONS.filter((s) => s.isInterchange)) {
    for (const line of station.lines) {
      const vid = vertexId(station.id, line);
      const neighbours = adjacency.get(vid) ?? [];
      const hasInterchange = neighbours.some(
        (n) => n.edge.type === 'interchange'
      );
      if (!hasInterchange) {
        issues.push({
          level: 'error',
          message: `Interchange station ${station.name} (${vid}) has no interchange edge`,
        });
      }
    }
  }

  return { ok: issues.filter((i) => i.level === 'error').length === 0, issues };
}

// --- Build the final graph (runs once at module load) ----------------------

const _vertices = buildVertices();
const _edges = [...buildAdjacentEdges(), ...buildInterchangeEdges()];
const _adjacency = buildAdjacencyList(_vertices, _edges);
const _validation = validateGraph(_vertices, _edges, _adjacency);

if (!_validation.ok) {
  // Surface validation errors immediately in development.
  console.error('[graphBuilder] Graph validation failed:', _validation.issues);
}

export const GRAPH: GraphData = {
  vertices: _vertices,
  edges: _edges,
  adjacencyList: _adjacency,
  vertexCount: _vertices.length,
  edgeCount: _edges.length,
  stationCount: STATIONS.length,
  lineCount: LINE_ORDER.length,
};

export const GRAPH_VALIDATION: ValidationResult = _validation;

export function getNeighbours(vertexId: string): AdjacencyEntry[] {
  return GRAPH.adjacencyList.get(vertexId) ?? [];
}

export function getVertex(vertexId: string): GraphVertex | undefined {
  return GRAPH.vertices.find((v) => v.id === vertexId);
}

export function getVerticesForStation(stationId: string): GraphVertex[] {
  return GRAPH.vertices.filter((v) => v.stationId === stationId);
}

export const PROVENANCE: DataProvenance = DATA_PROVENANCE;
