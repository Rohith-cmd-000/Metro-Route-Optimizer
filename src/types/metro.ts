// Shared TypeScript model for the Smart Hyderabad Metro Route Optimizer.
// Kept deliberately free of UI concerns so it can be reused by the routing
// engine, the graph explorer, and any future test harness without change.

/** Operational metro lines in the Hyderabad network. */
export type LineId = 'red' | 'blue' | 'green';

/** Human-readable metadata for a metro line. */
export interface MetroLine {
  id: LineId;
  name: string;
  /** Hex used across the UI and graph explorer. */
  color: string;
  /** Terminal-to-terminal description, e.g. "Miyapur ↔ LB Nagar". */
  route: string;
  stationCount: number;
  lengthKm: number;
}

/** A physical metro station. One station id may be served by multiple lines. */
export interface Station {
  /** Stable lowercase id, e.g. "ameerpet". */
  id: string;
  /** Display name, e.g. "Ameerpet". */
  name: string;
  /** Lines that serve this station; >1 means it is an interchange. */
  lines: LineId[];
  /** Whether this station is an interchange between two or more lines. */
  isInterchange: boolean;
}

// ---------------------------------------------------------------------------
// Graph model — line-specific vertices + typed, weighted edges.
// ---------------------------------------------------------------------------

/**
 * A graph vertex represents a station *on a particular line*. A station served
 * by N lines yields N vertices, connected by explicit interchange edges. This
 * lets the routing engine count line changes correctly instead of guessing from
 * name matches.
 *
 * The id is `${stationId}:${lineId}` (e.g. "ameerpet:red").
 */
export interface GraphVertex {
  /** Composite id: `${stationId}:${lineId}`. */
  id: string;
  stationId: string;
  line: LineId;
}

/** Categorises how two vertices are connected. */
export type EdgeType =
  /** Two adjacent stations on the same line. */
  | 'adjacent'
  /** Same physical station, different line — a paid interchange transfer. */
  | 'interchange'
  /** A short out-of-station walking transfer between nearby stations. */
  | 'walking';

/** A weighted, directed-pair edge in the metro graph. */
export interface GraphEdge {
  from: string;
  to: string;
  type: EdgeType;
  /** Line this edge belongs to. For interchanges/walking, the origin line. */
  line: LineId;
  /** Estimated distance in kilometres (0 for same-station interchanges). */
  distanceKm: number;
  /** Estimated travel time in minutes, including any transfer penalty. */
  timeMin: number;
  /** Free-form metadata for the graph explorer (e.g. transfer note). */
  note?: string;
}

/** Neighbour entry in the adjacency list: the edge plus the target vertex. */
export interface AdjacencyEntry {
  vertex: GraphVertex;
  edge: GraphEdge;
}

/** The complete, validated, ready-to-route graph. */
export interface GraphData {
  vertices: GraphVertex[];
  edges: GraphEdge[];
  /** `adjacencyList.get(vertexId)` → list of neighbour entries. */
  adjacencyList: Map<string, AdjacencyEntry[]>;
  vertexCount: number;
  edgeCount: number;
  stationCount: number;
  lineCount: number;
}

/** Where the network data came from and how reliable it is. */
export type DataStatus = 'verified' | 'mixed' | 'simulated';

export interface DataProvenance {
  /** Overall reliability classification shown in the UI. */
  status: DataStatus;
  /** What is verified (station names, line assignments, interchanges). */
  verified: string[];
  /** What is simulated/estimated (distances, times, transfer penalties). */
  simulated: string[];
  /** Human-readable source attribution. */
  sources: string[];
  /** Detailed notes shown in the graph explorer. */
  notes: string;
}

/** Problems found during graph validation. */
export interface ValidationIssue {
  level: 'error' | 'warning';
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

// ---------------------------------------------------------------------------
// Legacy edge shape (kept for the simple station list in the UI).
// ---------------------------------------------------------------------------

/** A weighted edge connecting two stations on a single line (simple form). */
export interface StationEdge {
  from: string;
  to: string;
  line: LineId;
  distanceKm: number;
  timeMin: number;
}

// ---------------------------------------------------------------------------
// Routing types — Phase 4: six route objectives.
// ---------------------------------------------------------------------------

/** The six route optimization objectives. */
export type RouteObjective =
  | 'fastest'
  | 'cheapest'
  | 'fewest_interchanges'
  | 'least_walking'
  | 'shortest_distance'
  | 'balanced';

/** Backward-compatible alias for older code that references RoutePreference. */
export type RoutePreference = RouteObjective;

/** Full journey metrics recomputed from the chosen path's edges. */
export interface RouteMetrics {
  totalTimeMin: number;
  totalDistanceKm: number;
  totalWalkingKm: number;
  interchangeCount: number;
  hopCount: number;
  /** Estimated metro fare in INR, or null if unavailable. */
  fareINR: number | null;
  /** Balanced score (0–100, lower is better) if computed. */
  balancedScore: number | null;
}

/** Why a particular route was selected for a given objective. */
export interface RouteExplanation {
  objective: RouteObjective;
  /** One-line human reason shown on the route card. */
  reason: string;
  /** The algorithm that produced this route. */
  algorithm: string;
}

/** A single hop between two adjacent stations. */
export interface RouteSegment {
  from: string;
  to: string;
  line: LineId;
  distanceKm: number;
  timeMin: number;
}

/** A contiguous run of segments on the same line (used for leg summaries). */
export interface RouteLeg {
  line: LineId;
  boardingStation: string;
  alightingStation: string;
  stationCount: number;
  distanceKm: number;
  timeMin: number;
  segments: RouteSegment[];
}

/** A complete journey result produced by the routing engine. */
export interface JourneyResult {
  source: string;
  destination: string;
  /** Ordered vertex ids (stationId:line) from source to destination. */
  vertexPath: string[];
  legs: RouteLeg[];
  metrics: RouteMetrics;
  explanation: RouteExplanation;
  /** Original preference name — kept for backward compatibility. */
  preference: RouteObjective;
  departureTime: string;
  // Legacy fields kept for backward compat with Phase 3 components.
  totalDistanceKm: number;
  totalTimeMin: number;
  interchangeCount: number;
  hopCount: number;
}

/** Weights for the balanced objective, editable in the UI. */
export interface BalancedWeights {
  time: number;
  cost: number;
  transfers: number;
  walking: number;
}

/** Inputs that fully describe a journey request from the plan screen. */
export interface JourneyRequest {
  source: string;
  destination: string;
  departureTime: string;
  preference: RouteObjective;
  balancedWeights?: BalancedWeights;
  // Phase 5: optional door-to-door inputs
  startAddress?: string;
  endAddress?: string;
  startWalkingMin?: number;
  endWalkingMin?: number;
  firstMileCostINR?: number;
  lastMileCostINR?: number;
}

/** Result of a routing attempt. */
export type RoutingOutcome =
  | { status: 'ok'; results: JourneyResult[] }
  | { status: 'empty'; reason: string }
  | { status: 'error'; message: string };

// ---------------------------------------------------------------------------
// Phase 5: Door-to-door itinerary & timetable types.
// ---------------------------------------------------------------------------

/** A single scheduled train departure from a station on a line. */
export interface ScheduledDeparture {
  line: LineId;
  stationId: string;
  /** "HH:MM" format departure time. */
  time: string;
  /** Simulated or verified label. */
  source: 'verified' | 'simulated';
}

/** Timetable data for a line: operating hours + departure times. */
export interface LineTimetable {
  line: LineId;
  /** First train departure "HH:MM". */
  firstDeparture: string;
  /** Last train departure "HH:MM". */
  lastDeparture: string;
  /** Headway between trains in minutes. */
  headwayMin: number;
  /** Whether this timetable is verified or simulated. */
  source: 'verified' | 'simulated';
}

/** A typed leg in a door-to-door itinerary. */
export type ItineraryLegType =
  | 'access_walk'
  | 'board'
  | 'ride'
  | 'interchange_walk'
  | 'wait'
  | 'exit_walk';

/** One step in the detailed door-to-door itinerary timeline. */
export interface ItineraryStep {
  type: ItineraryLegType;
  /** "HH:MM" when this step starts, or null if not time-bound. */
  startTime: string | null;
  /** "HH:MM" when this step ends, or null if not time-bound. */
  endTime: string | null;
  /** Duration in minutes (0 for instantaneous). */
  durationMin: number;
  /** Human-readable description. */
  description: string;
  /** Station id if relevant, else null. */
  stationId: string | null;
  /** Line id if relevant, else null. */
  line: LineId | null;
  /** Walking distance in km for this step, if any. */
  walkingKm: number;
}

/** Full door-to-door itinerary wrapping a JourneyResult. */
export interface DoorToDoorItinerary {
  /** The underlying metro route result. */
  route: JourneyResult;
  /** Ordered timeline steps from leaving the start to arriving at the end. */
  steps: ItineraryStep[];
  /** "HH:MM" — when the user should leave their start location. */
  leaveTime: string;
  /** "HH:MM" — when the user boards the first train. */
  boardTime: string;
  /** "HH:MM" — estimated final arrival time. */
  arrivalTime: string;
  /** Total door-to-door duration in minutes. */
  totalDurationMin: number;
  /** Total walking distance in km (access + interchange + exit). */
  totalWalkingKm: number;
  /** Metro fare in INR, or null. */
  metroFareINR: number | null;
  /** Optional first-mile transport cost in INR, or null. */
  firstMileCostINR: number | null;
  /** Optional last-mile transport cost in INR, or null. */
  lastMileCostINR: number | null;
  /** Total estimated cost (metro + first/last mile). */
  totalCostINR: number | null;
  /** Waiting time at the first station in minutes. */
  waitingMin: number;
  /** Whether the timetable used is verified or simulated. */
  timetableSource: 'verified' | 'simulated' | 'unavailable';
  /** True if the requested departure is outside operating hours. */
  outsideOperatingHours: boolean;
  /** Human-readable notes/warnings. */
  notes: string[];
}
