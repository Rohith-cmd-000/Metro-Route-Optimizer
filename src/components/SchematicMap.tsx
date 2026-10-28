// Schematic metro network map — SVG-based, not geographic.
//
// Stations have no verified geographic coordinates (HMRL GTFS is behind a
// request form), so we render a schematic (topological) diagram where each
// line is drawn as a straight polyline and stations are evenly spaced. This
// shows the correct line structure, interchange points, and the highlighted
// route without pretending to be a geographic map.
//
// The diagram is explicitly labelled as "Schematic" in the UI.

import { Info, Map as MapIcon } from 'lucide-react';
import { useMemo } from 'react';
import {
  LINE_ORDER,
  LINE_STATION_IDS,
  METRO_LINES,
  STATION_BY_ID,
} from '@/data/metroData';
import type { JourneyResult, LineId } from '@/types/metro';

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const STATION_SPACING = 38;
const STATION_RADIUS = 5;
const INTERCHANGE_RADIUS = 7.5;
const MARGIN = 40;
const LINE_GAP = 90; // vertical gap between line rows
const TOP_MARGIN = 50;

// Compute the bounding width from the longest line.
const MAX_STATIONS = Math.max(
  ...LINE_ORDER.map((l) => LINE_STATION_IDS[l].length)
);
const SVG_WIDTH = MARGIN * 2 + (MAX_STATIONS - 1) * STATION_SPACING;
const SVG_HEIGHT = TOP_MARGIN + LINE_ORDER.length * LINE_GAP + MARGIN;

// Assign each line a Y coordinate.
const LINE_Y: Record<LineId, number> = {
  red: TOP_MARGIN,
  blue: TOP_MARGIN + LINE_GAP,
  green: TOP_MARGIN + LINE_GAP * 2,
};

// Compute X for a station on a given line (evenly spaced).
function stationX(lineIndex: number): number {
  return MARGIN + lineIndex * STATION_SPACING;
}

// Pre-compute station positions per line.
interface StationPos {
  stationId: string;
  x: number;
  y: number;
  lineIndex: number;
}

const LINE_POSITIONS: Record<LineId, StationPos[]> = LINE_ORDER.reduce(
  (acc, line) => {
    acc[line] = LINE_STATION_IDS[line].map((sid, i) => ({
      stationId: sid,
      x: stationX(i),
      y: LINE_Y[line],
      lineIndex: i,
    }));
    return acc;
  },
  {} as Record<LineId, StationPos[]>
);

// Build a map from stationId → all positions (for interchange stations that
// appear on multiple lines).
const STATION_ALL_POSITIONS: Map<string, StationPos[]> = buildStationPositions();

function buildStationPositions(): Map<string, StationPos[]> {
  const map = new Map<string, StationPos[]>();
  for (const line of LINE_ORDER) {
    for (const pos of LINE_POSITIONS[line]) {
      const arr = map.get(pos.stationId) ?? [];
      arr.push(pos);
      map.set(pos.stationId, arr);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Route extraction
// ---------------------------------------------------------------------------

/** Extract the ordered set of station ids and line segments from a route. */
function extractRouteStations(route: JourneyResult | null): {
  stations: Set<string>;
  segments: Array<{ from: string; to: string; line: LineId }>;
} {
  if (!route) return { stations: new Set(), segments: [] };
  const stations = new Set<string>();
  const segments: Array<{ from: string; to: string; line: LineId }> = [];

  for (const leg of route.legs) {
    // Add all stations in this leg's segments.
    stations.add(leg.boardingStation);
    stations.add(leg.alightingStation);
    for (const seg of leg.segments) {
      stations.add(seg.from);
      stations.add(seg.to);
      segments.push({ from: seg.from, to: seg.to, line: seg.line });
    }
  }
  return { stations, segments };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SchematicMapProps {
  route: JourneyResult | null;
  sourceId?: string | null;
  destId?: string | null;
}

export function SchematicMap({ route, sourceId, destId }: SchematicMapProps) {
  const { stations: routeStations, segments: routeSegments } =
    extractRouteStations(route);

  // Build a quick lookup for highlighted segments.
  const routeSegSet = useMemo(() => {
    const s = new Set<string>();
    for (const seg of routeSegments) {
      s.add(`${seg.from}:${seg.to}:${seg.line}`);
      s.add(`${seg.to}:${seg.from}:${seg.line}`);
    }
    return s;
  }, [routeSegments]);

  return (
    <div className="flex flex-col">
      {/* Schematic label + attribution */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <MapIcon className="h-4 w-4 text-blue-600" />
          Network Map
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
          <Info className="h-3.5 w-3.5" />
          Schematic — not to scale
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="mx-auto block"
          role="img"
          aria-label="Schematic Hyderabad Metro network map showing Red, Blue, and Green lines with the selected route highlighted."
        >
          {/* Line polylines (background, dimmed) */}
          {LINE_ORDER.map((line) => {
            const positions = LINE_POSITIONS[line];
            const points = positions.map((p) => `${p.x},${p.y}`).join(' ');
            return (
              <polyline
                key={`bg-${line}`}
                points={points}
                fill="none"
                stroke={METRO_LINES[line].color}
                strokeWidth={4}
                strokeOpacity={route ? 0.2 : 0.7}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Highlighted route segments (drawn on top) */}
          {route && LINE_ORDER.map((line) => {
            const positions = LINE_POSITIONS[line];
            const highlightedPoints: string[] = [];
            for (let i = 0; i < positions.length - 1; i++) {
              const cur = positions[i];
              const next = positions[i + 1];
              const key1 = `${cur.stationId}:${next.stationId}:${line}`;
              const key2 = `${next.stationId}:${cur.stationId}:${line}`;
              if (routeSegSet.has(key1) || routeSegSet.has(key2)) {
                highlightedPoints.push(`${cur.x},${cur.y}`);
                highlightedPoints.push(`${next.x},${next.y}`);
              }
            }
            if (highlightedPoints.length === 0) return null;
            // Deduplicate consecutive points.
            const deduped = highlightedPoints.filter((p, i) =>
              i === 0 || p !== highlightedPoints[i - 1]
            );
            return (
              <polyline
                key={`route-${line}`}
                points={deduped.join(' ')}
                fill="none"
                stroke={METRO_LINES[line].color}
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Station dots */}
          {LINE_ORDER.map((line) =>
            LINE_POSITIONS[line].map((pos) => {
              const isOnRoute = routeStations.has(pos.stationId);
              const isInterchange =
                (STATION_ALL_POSITIONS.get(pos.stationId)?.length ?? 0) > 1;
              const isSource = sourceId === pos.stationId;
              const isDest = destId === pos.stationId;
              const isEndpoint = isSource || isDest;
              const r = isEndpoint
                ? INTERCHANGE_RADIUS + 2
                : isInterchange
                ? INTERCHANGE_RADIUS
                : STATION_RADIUS;

              return (
                <g key={`${line}-${pos.stationId}`}>
                  {/* White halo for endpoints */}
                  {isEndpoint && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={r + 3}
                      fill="white"
                      stroke={isSource ? '#2563eb' : '#059669'}
                      strokeWidth={2.5}
                    />
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r}
                    fill={isOnRoute ? METRO_LINES[line].color : 'white'}
                    stroke={METRO_LINES[line].color}
                    strokeWidth={isOnRoute ? 0 : 1.5}
                  />
                  {/* Station label — only for route stations or interchanges or endpoints */}
                  {(isOnRoute || isEndpoint || isInterchange) && (
                    <text
                      x={pos.x}
                      y={pos.y - r - 5}
                      textAnchor="middle"
                      className="fill-slate-700"
                      style={{
                        fontSize: 9,
                        fontFamily: 'system-ui, sans-serif',
                        fontWeight: isEndpoint ? 700 : 500,
                      }}
                    >
                      {truncate(STATION_BY_ID[pos.stationId]?.name ?? pos.stationId)}
                    </text>
                  )}
                  {/* Endpoint badges */}
                  {isSource && (
                    <text
                      x={pos.x}
                      y={pos.y + r + 12}
                      textAnchor="middle"
                      className="fill-blue-600"
                      style={{ fontSize: 8, fontWeight: 700, fontFamily: 'system-ui, sans-serif' }}
                    >
                      START
                    </text>
                  )}
                  {isDest && (
                    <text
                      x={pos.x}
                      y={pos.y + r + 12}
                      textAnchor="middle"
                      className="fill-emerald-600"
                      style={{ fontSize: 8, fontWeight: 700, fontFamily: 'system-ui, sans-serif' }}
                    >
                      END
                    </text>
                  )}
                </g>
              );
            })
          )}

          {/* Line labels */}
          {LINE_ORDER.map((line) => {
            const positions = LINE_POSITIONS[line];
            const firstPos = positions[0];
            if (!firstPos) return null;
            return (
              <text
                key={`label-${line}`}
                x={firstPos.x - 20}
                y={firstPos.y + 3}
                textAnchor="end"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: 'system-ui, sans-serif',
                  fill: METRO_LINES[line].color,
                }}
              >
                {METRO_LINES[line].name.replace(' Line', '')}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-2 text-xs text-slate-500">
        {LINE_ORDER.map((line) => (
          <span key={line} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-6 rounded-full"
              style={{ backgroundColor: METRO_LINES[line].color }}
            />
            {METRO_LINES[line].name}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-slate-400 bg-white" />
          Interchange
        </span>
      </div>

      {/* Attribution */}
      <p className="mt-2 text-[10px] text-slate-400">
        Station names and line structure verified from HMRL published data.
        This is a schematic (topological) diagram, not a geographic map.
        Map data: HMRL / L&amp;T Metro Rail (station list).
      </p>
    </div>
  );
}

function truncate(name: string, max = 14): string {
  return name.length > max ? name.slice(0, max - 1) + '…' : name;
}
