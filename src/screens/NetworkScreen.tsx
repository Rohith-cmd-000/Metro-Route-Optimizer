import {
  ArrowRight,
  CheckCircle2,
  GitBranch,
  MapPinned,
  Search,
  TriangleAlert,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import { OriginalRouteMap } from '@/components/EnglishRouteMap';
import { ScreenHeader } from '@/components/ScreenHeader';
import {
  GRAPH,
  GRAPH_VALIDATION,
  PROVENANCE,
  getNeighbours,
  getVerticesForStation,
} from '@/data/graphBuilder';
import {
  INTERCHANGE_STATIONS,
  LINE_ORDER,
  METRO_LINES,
  STATION_BY_ID,
  STATIONS,
} from '@/data/metroData';
import type { AdjacencyEntry, DataStatus } from '@/types/metro';

const STATUS_BADGE: Record<
  DataStatus,
  { label: string; cls: string }
> = {
  verified: { label: 'Verified', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  mixed: { label: 'Mixed', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  simulated: { label: 'Simulated', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
};

function EdgeTypeBadge({ type }: { type: AdjacencyEntry['edge']['type'] }) {
  const map = {
    adjacent: 'bg-blue-50 text-blue-700',
    interchange: 'bg-amber-50 text-amber-700',
    walking: 'bg-purple-50 text-purple-700',
  };
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[type]}`}>
      {type}
    </span>
  );
}

export function NetworkScreen() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredStations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STATIONS;
    return STATIONS.filter((s) => s.name.toLowerCase().includes(q));
  }, [query]);

  const selected = selectedId ? STATION_BY_ID[selectedId] ?? null : null;
  const selectedVertices = selectedId ? getVerticesForStation(selectedId) : [];
  const badge = STATUS_BADGE[PROVENANCE.status];

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader
        title="Graph Explorer"
        subtitle="The actual graph the routing engine uses — vertices, edges, and interchanges."
        icon={<MapPinned className="h-5 w-5" />}
      />

      {/* Graph stats + data status */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Graph Summary
          </h3>
          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>
            <span className="inline-block h-2 w-2 rounded-full bg-current" />
            Data: {badge.label}
          </span>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <dt className="text-xs text-slate-500">Stations</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900">{GRAPH.stationCount}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <dt className="text-xs text-slate-500">Vertices</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900">{GRAPH.vertexCount}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <dt className="text-xs text-slate-500">Edges</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900">{GRAPH.edgeCount}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <dt className="text-xs text-slate-500">Lines</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900">{GRAPH.lineCount}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-400">
          Counts are derived from the loaded graph data at runtime, not hardcoded.
          Each station-on-a-line is a vertex; interchanges add explicit edges.
        </p>
      </Card>

      {/* Lines */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Operational Lines
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {LINE_ORDER.map((id) => {
            const line = METRO_LINES[id];
            return (
              <div
                key={id}
                className="rounded-xl border border-slate-200 p-4"
                style={{ borderLeftColor: line.color, borderLeftWidth: 4 }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: line.color }}
                  />
                  <span className="font-semibold text-slate-900">{line.name}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{line.route}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {line.stationCount} stations · {line.lengthKm} km
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Station search + detail */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Search a Station
        </h3>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/40">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a station name…"
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {/* Station list */}
          <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-100 pr-1">
            <ul className="divide-y divide-slate-50">
              {filteredStations.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => setSelectedId(s.id)}
                    className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition ${
                      selectedId === s.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {s.lines.map((l) => (
                        <span
                          key={l}
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: METRO_LINES[l].color }}
                        />
                      ))}
                      <span className="text-slate-800">{s.name}</span>
                    </span>
                    {s.isInterchange && (
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                        Interchange
                      </span>
                    )}
                  </button>
                </li>
              ))}
              {filteredStations.length === 0 && (
                <li className="px-3 py-4 text-sm text-slate-400">
                  No stations match “{query}”.
                </li>
              )}
            </ul>
          </div>

          {/* Station detail */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            {!selected && (
              <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                <GitBranch className="h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-400">
                  Select a station to see its vertex IDs, lines, and neighbouring edges.
                </p>
              </div>
            )}

            {selected && (
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">{selected.name}</h4>
                    {selected.isInterchange && (
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                        Interchange
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-slate-400">
                    Station ID: <span className="text-slate-600">{selected.id}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Lines: {selected.lines.map((l) => METRO_LINES[l].name).join(', ')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Vertices: {selectedVertices.length} ({selectedVertices.map((v) => v.id).join(', ')})
                  </p>
                </div>

                <div>
                  <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Neighbouring Edges
                  </h5>
                  <ul className="flex flex-col gap-2">
                    {selectedVertices.flatMap((v) =>
                      getNeighbours(v.id).map((entry, i) => (
                        <li
                          key={`${v.id}-${i}`}
                          className="rounded-lg border border-slate-200 bg-white p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-sm text-slate-700">
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: METRO_LINES[v.line].color }}
                              />
                              <span className="font-mono text-xs text-slate-400">{v.id}</span>
                              <ArrowRight className="h-3 w-3 text-slate-300" />
                              <span className="font-mono text-xs text-slate-600">
                                {entry.vertex.id}
                              </span>
                            </div>
                            <EdgeTypeBadge type={entry.edge.type} />
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                            <span>Line: {METRO_LINES[entry.edge.line].name}</span>
                            <span>Distance: {entry.edge.distanceKm} km</span>
                            <span>Time: {entry.edge.timeMin} min</span>
                          </div>
                          {entry.edge.note && (
                            <p className="mt-1 text-xs italic text-slate-400">
                              {entry.edge.note}
                            </p>
                          )}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Interchanges */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Explicit Interchange Connections
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {INTERCHANGE_STATIONS.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800"
            >
              {s.name}
              <span className="text-xs text-amber-500">
                ({s.lines.map((l) => METRO_LINES[l].name.replace(' Line', '')).join(' + ')})
              </span>
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Each interchange is modelled as explicit bidirectional edges between the
          station&rsquo;s line-specific vertices — never inferred from name matches.
        </p>
      </Card>

      {/* Validation report */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Graph Validation
          </h3>
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
              GRAPH_VALIDATION.ok
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {GRAPH_VALIDATION.ok ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <TriangleAlert className="h-3.5 w-3.5" />
            )}
            {GRAPH_VALIDATION.ok ? 'All checks passed' : 'Issues found'}
          </span>
        </div>
        {GRAPH_VALIDATION.issues.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {GRAPH_VALIDATION.issues.map((issue, i) => (
              <li
                key={i}
                className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                  issue.level === 'error'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                <span className="font-mono text-xs uppercase">{issue.level}</span>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Every edge endpoint refers to a valid vertex.</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> No duplicate station IDs within a line.</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Every interchange station has explicit interchange edges.</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> No isolated vertices — the graph is fully connected.</li>
          </ul>
        )}
      </Card>

      {/* Provenance / data sources */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Data Source &amp; Attribution
        </h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Verified</p>
            <ul className="mt-1.5 space-y-1 text-sm text-slate-600">
              {PROVENANCE.verified.map((v) => (
                <li key={v} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  {v}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">Simulated</p>
            <ul className="mt-1.5 space-y-1 text-sm text-slate-600">
              {PROVENANCE.simulated.map((v) => (
                <li key={v} className="flex gap-2">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
                  {v}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <p className="text-sm text-slate-600">{PROVENANCE.notes}</p>
        </div>
        <ul className="mt-3 space-y-1 text-xs text-slate-400">
          {PROVENANCE.sources.map((s) => (
            <li key={s} className="flex gap-1.5">
              <span className="text-slate-300">•</span>
              {s}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs italic text-slate-400">
          Attribution: &ldquo;Contains data provided by Hyderabad Metro Rail Ltd.&rdquo;
        </p>
      </Card>

      <OriginalRouteMap />
    </div>
  );
}
