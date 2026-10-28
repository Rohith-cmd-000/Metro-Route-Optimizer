// Section B supplement — Algorithm State display for the Dijkstra visualizer.
// Shows the priority queue, distance array, predecessor array, and visited set
// as they exist at the current trace step.

import { Layers, ListOrdered, MapPin, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/Card';
import { METRO_LINES, STATION_BY_ID } from '@/data/metroData';
import { parseVertexId } from '@/data/graphBuilder';
import type { DijkstraResult, TraceEvent } from '@/routing/dijkstra';

interface AlgorithmStateProps {
  result: DijkstraResult;
  trace: TraceEvent[];
  stepIdx: number;
}

function vertexLabel(vid: string): string {
  const { stationId, line } = parseVertexId(vid);
  const name = STATION_BY_ID[stationId]?.name ?? stationId;
  return `${name} (${line})`;
}

export function AlgorithmState({ result, trace, stepIdx }: AlgorithmStateProps) {
  // Reconstruct algorithm state up to the current step.
  // We replay the trace events to build the PQ, dist, prev, and settled sets.
  const state = buildStateAtStep(result, trace, stepIdx);

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Algorithm State at Step {stepIdx + 1}
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        Data structures as they exist right now — reconstructed by replaying trace events.
        All values come from the actual Dijkstra run.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Priority queue */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Layers className="h-3.5 w-3.5 text-blue-500" />
            Priority Queue ({state.pq.length} entries)
          </div>
          {state.pq.length === 0 ? (
            <p className="mt-1.5 text-xs text-slate-400">Empty.</p>
          ) : (
            <ul className="mt-1.5 space-y-1">
              {state.pq.map((entry, i) => (
                <li key={i} className="flex items-center justify-between rounded-md bg-blue-50/60 px-2 py-1 text-xs">
                  <span className="text-slate-700">{vertexLabel(entry.id)}</span>
                  <span className="font-mono text-blue-700">{fmtDist(entry.dist)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Visited / settled */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Settled Vertices ({state.settled.size})
          </div>
          {state.settled.size === 0 ? (
            <p className="mt-1.5 text-xs text-slate-400">None yet.</p>
          ) : (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {Array.from(state.settled).map((vid) => {
                const { line } = parseVertexId(vid);
                return (
                  <span
                    key={vid}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700"
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: METRO_LINES[line as keyof typeof METRO_LINES]?.color ?? '#999' }}
                    />
                    {vertexLabel(vid)}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Distance array */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <ListOrdered className="h-3.5 w-3.5 text-amber-500" />
            Distance Array (finite only)
          </div>
          {state.dist.size === 0 ? (
            <p className="mt-1.5 text-xs text-slate-400">All distances are &infin;.</p>
          ) : (
            <table className="mt-1.5 w-full text-xs">
              <tbody className="divide-y divide-slate-50">
                {Array.from(state.dist.entries())
                  .sort((a, b) => a[1] - b[1])
                  .map(([vid, d]) => (
                    <tr key={vid} className="text-slate-600">
                      <td className="py-1 pr-2">{vertexLabel(vid)}</td>
                      <td className="py-1 text-right font-mono text-amber-700">{fmtDist(d)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Predecessor array */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <MapPin className="h-3.5 w-3.5 text-rose-500" />
            Predecessor Array
          </div>
          {state.prev.size === 0 ? (
            <p className="mt-1.5 text-xs text-slate-400">No predecessors set yet.</p>
          ) : (
            <table className="mt-1.5 w-full text-xs">
              <tbody className="divide-y divide-slate-50">
                {Array.from(state.prev.entries()).map(([vid, parent]) => (
                  <tr key={vid} className="text-slate-600">
                    <td className="py-1 pr-2">{vertexLabel(vid)}</td>
                    <td className="py-1 text-right">
                      <span className="text-slate-400">&larr; </span>
                      <span className="font-mono text-rose-700">{parent ? vertexLabel(parent) : '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Card>
  );
}

// --- Replay logic -----------------------------------------------------------

interface PQEntry { id: string; dist: number; }

interface StepState {
  pq: PQEntry[];
  dist: Map<string, number>;
  prev: Map<string, string | null>;
  settled: Set<string>;
}

function buildStateAtStep(result: DijkstraResult, trace: TraceEvent[], stepIdx: number): StepState {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const settled = new Set<string>();
  const pq: PQEntry[] = [];

  for (let i = 0; i <= stepIdx && i < trace.length; i++) {
    const e = trace[i];
    if (e.kind === 'init') {
      dist.set(e.source, 0);
      prev.set(e.source, null);
      pq.push({ id: e.source, dist: 0 });
    } else if (e.kind === 'settle') {
      settled.add(e.vertex);
      // Remove the settled vertex from PQ (it was just extracted).
      const idx = pq.findIndex((p) => p.id === e.vertex && p.dist === e.dist);
      if (idx >= 0) pq.splice(idx, 1);
    } else if (e.kind === 'relax' && e.relaxed) {
      dist.set(e.neighbour, e.candidateDist);
      prev.set(e.neighbour, e.currentVertex);
      // Add new PQ entry (decrease-key is simulated by insert).
      pq.push({ id: e.neighbour, dist: e.candidateDist });
    } else if (e.kind === 'skip') {
      // Stale entry — remove one matching entry.
      const idx = pq.findIndex((p) => p.id === e.vertex);
      if (idx >= 0) pq.splice(idx, 1);
    }
  }

  // Remove any PQ entries for settled vertices (they've been extracted).
  const filteredPq = pq.filter((p) => !settled.has(p.id));

  return { pq: filteredPq, dist, prev, settled };
}

function fmtDist(d: number): string {
  if (d === Infinity) return '∞';
  return Number.isInteger(d) ? String(d) : d.toFixed(1);
}
