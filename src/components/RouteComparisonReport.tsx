// Section C — Route Objective Comparison: runs the actual routing engine for
// fastest, shortest distance, and fewest transfers, and displays results
// side-by-side.
// Section D — Execution Report: structured summary of the last Dijkstra run.

import {
  ArrowRight,
  Clock,
  FileText,
  Gauge,
  Ruler,
  Shuffle,
  TrainFront,
  Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import { StationSelect } from '@/components/StationSelect';
import { METRO_LINES, STATION_BY_ID } from '@/data/metroData';
import { GRAPH, parseVertexId } from '@/data/graphBuilder';
import { PROVENANCE } from '@/data/graphBuilder';
import { findRoutes, DIJKSTRA_COMPLEXITY } from '@/routing/router';
import type { DijkstraResult, WeightMode } from '@/routing/dijkstra';
import type { JourneyRequest, JourneyResult, RouteObjective } from '@/types/metro';

// ---------------------------------------------------------------------------
// Section C: Route Objective Comparison
// ---------------------------------------------------------------------------

const COMPARISON_OBJECTIVES: { value: RouteObjective; label: string; icon: React.ReactNode }[] = [
  { value: 'fastest', label: 'Fastest', icon: <Clock className="h-3.5 w-3.5" /> },
  { value: 'shortest_distance', label: 'Shortest Distance', icon: <Ruler className="h-3.5 w-3.5" /> },
  { value: 'fewest_interchanges', label: 'Fewest Transfers', icon: <Shuffle className="h-3.5 w-3.5" /> },
];

export function RouteObjectiveComparison() {
  const [source, setSource] = useState<string | null>('miyapur');
  const [destination, setDestination] = useState<string | null>('nagole');

  const results = useMemo(() => {
    if (!source || !destination || source === destination) return [];
    return COMPARISON_OBJECTIVES.map((obj) => {
      const req: JourneyRequest = {
        source,
        destination,
        departureTime: '09:00',
        preference: obj.value,
      };
      const outcome = findRoutes(req);
      if (outcome.status === 'ok' && outcome.results.length > 0) {
        return { objective: obj, result: outcome.results[0], allResults: outcome.results };
      }
      return { objective: obj, result: null, allResults: [] as JourneyResult[] };
    });
  }, [source, destination]);

  // Deduplicate: if two objectives produce the same vertex path, note it.
  const uniquePaths = useMemo(() => {
    const seen = new Set<string>();
    for (const r of results) {
      if (r.result) seen.add(r.result.vertexPath.join(','));
    }
    return seen.size;
  }, [results]);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Gauge className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Route Objective Comparison
        </h3>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Runs the actual routing engine for three objectives and compares the computed paths.
        {uniquePaths < results.filter((r) => r.result).length && uniquePaths > 0 && (
          <span className="mt-1 block font-medium text-amber-600">
            Only {uniquePaths} distinct path{uniquePaths !== 1 ? 's' : ''} exist —
            some objectives produce the same route.
          </span>
        )}
      </p>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <StationSelect
          label="Source"
          value={source}
          onChange={setSource}
          excludeId={destination}
        />
        <StationSelect
          label="Destination"
          value={destination}
          onChange={setDestination}
          excludeId={source}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {results.map(({ objective, result }) => (
          <div
            key={objective.value}
            className="rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                {objective.icon}
                {objective.label}
              </span>
            </div>

            {!result ? (
              <p className="mt-2 text-xs text-slate-400">No route found for this objective.</p>
            ) : (
              <>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {result.metrics.totalTimeMin} min
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <TrainFront className="h-3.5 w-3.5" />
                    {result.metrics.totalDistanceKm} km
                  </span>
                  {result.metrics.fareINR !== null && (
                    <span className="inline-flex items-center gap-1">
                      <Wallet className="h-3.5 w-3.5" />
                      Rs. {result.metrics.fareINR}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Shuffle className="h-3.5 w-3.5" />
                    {result.metrics.interchangeCount} transfer{result.metrics.interchangeCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Path */}
                <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
                  {result.vertexPath.map((vid, i) => {
                    const sid = parseVertexId(vid).stationId;
                    const name = STATION_BY_ID[sid]?.name ?? sid;
                    const line = parseVertexId(vid).line;
                    return (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && <ArrowRight className="h-3 w-3 text-slate-300" />}
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600">
                          <span
                            className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
                            style={{ backgroundColor: METRO_LINES[line as keyof typeof METRO_LINES]?.color ?? '#999' }}
                          />
                          {name}
                        </span>
                      </span>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-500">{result.explanation.reason}</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    Algorithm: {result.explanation.algorithm}
                  </p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section D: Execution Report
// ---------------------------------------------------------------------------

interface ExecutionReportProps {
  sourceStation: string;
  destStation: string;
  mode: WeightMode;
  dijkstraResult: DijkstraResult | null;
}

export function ExecutionReport({ sourceStation, destStation, mode, dijkstraResult }: ExecutionReportProps) {
  if (!dijkstraResult) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Execution Report
          </h3>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Run Dijkstra above to generate the execution report.
        </p>
      </Card>
    );
  }

  const sourceName = STATION_BY_ID[sourceStation]?.name ?? sourceStation;
  const destName = STATION_BY_ID[destStation]?.name ?? destStation;

  // Count examined edges from trace (relax events).
  const examinedEdges = dijkstraResult.trace.filter((e) => e.kind === 'relax').length;

  // Recompute total cost from the path's edges.
  let recomputedCost = 0;
  for (let i = 0; i < dijkstraResult.path.length - 1; i++) {
    const neighbours = GRAPH.adjacencyList.get(dijkstraResult.path[i]) ?? [];
    const entry = neighbours.find((n) => n.vertex.id === dijkstraResult.path[i + 1]);
    if (entry) {
      recomputedCost += mode === 'time' ? entry.edge.timeMin : entry.edge.distanceKm;
    }
  }

  const reportRows: { label: string; value: string }[] = [
    { label: 'Source', value: `${sourceName} (${sourceStation})` },
    { label: 'Destination', value: `${destName} (${destStation})` },
    { label: 'Algorithm', value: "Dijkstra's shortest-path (JavaScript/TypeScript)" },
    { label: 'Objective', value: mode === 'time' ? 'Minimise travel time (minutes)' : 'Minimise track distance (km)' },
    { label: 'Graph vertices', value: String(GRAPH.vertexCount) },
    { label: 'Graph edges', value: String(GRAPH.edgeCount) },
    { label: 'Settled vertices', value: String(dijkstraResult.settledCount) },
    { label: 'Examined edges (relaxations)', value: String(examinedEdges) },
    { label: 'Final path length', value: `${dijkstraResult.hopCount} hops (${dijkstraResult.path.length} vertices)` },
    { label: 'Total cost (algorithm)', value: `${dijkstraResult.totalCost} ${mode === 'time' ? 'min' : 'km'}` },
    { label: 'Recomputed cost (from edges)', value: `${recomputedCost} ${mode === 'time' ? 'min' : 'km'}` },
    { label: 'Cost match', value: recomputedCost === dijkstraResult.totalCost ? 'Yes — verified' : 'Mismatch!' },
    { label: 'Complexity', value: DIJKSTRA_COMPLEXITY },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Execution Report
        </h3>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Structured summary of the last Dijkstra run. All values are from the actual
        algorithm output — the recomputed cost is independently verified by summing
        edge weights along the final path.
      </p>

      <table className="mt-3 w-full text-left text-xs">
        <tbody className="divide-y divide-slate-50">
          {reportRows.map((row, i) => (
            <tr key={i} className={row.label === 'Cost match' && row.value.startsWith('Mismatch') ? 'bg-red-50' : ''}>
              <td className="py-2 pr-4 font-medium text-slate-500">{row.label}</td>
              <td className="py-2 text-slate-700">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Final path */}
      <div className="mt-3">
        <p className="text-xs font-semibold text-slate-500">Final path (vertex sequence)</p>
        <div className="mt-1 flex flex-wrap items-center gap-1 text-xs">
          {dijkstraResult.path.map((vid, i) => {
            const sid = parseVertexId(vid).stationId;
            const name = STATION_BY_ID[sid]?.name ?? sid;
            const line = parseVertexId(vid).line;
            return (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ArrowRight className="h-3 w-3 text-slate-300" />}
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600">
                  <span
                    className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
                    style={{ backgroundColor: METRO_LINES[line as keyof typeof METRO_LINES]?.color ?? '#999' }}
                  />
                  {name}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Data provenance */}
      <div className="mt-4 rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-600">Data Provenance</p>
        <p className="mt-1 text-xs text-slate-500">{PROVENANCE.notes}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            Status: {PROVENANCE.status}
          </span>
          {PROVENANCE.simulated.map((s, i) => (
            <span key={i} className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              Simulated: {s}
            </span>
          ))}
        </div>
        <div className="mt-2">
          <p className="text-[10px] font-semibold text-slate-400">Sources:</p>
          <ul className="mt-0.5 space-y-0.5">
            {PROVENANCE.sources.map((src, i) => (
              <li key={i} className="text-[10px] text-slate-400">{src}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
