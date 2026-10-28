// Section A — Graph Inspector: shows the real graph loaded by the routing
// engine, with station selection and its actual adjacency list.

import { GitBranch, Network } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import { StationSelect } from '@/components/StationSelect';
import {
  GRAPH,
  parseVertexId,
  getVerticesForStation,
} from '@/data/graphBuilder';
import { METRO_LINES, STATION_BY_ID, STATIONS } from '@/data/metroData';
import type { EdgeType } from '@/types/metro';

const EDGE_TYPE_STYLES: Record<EdgeType, { label: string; bg: string; text: string }> = {
  adjacent: { label: 'Adjacent', bg: 'bg-blue-100', text: 'text-blue-700' },
  interchange: { label: 'Interchange', bg: 'bg-amber-100', text: 'text-amber-700' },
  walking: { label: 'Walking', bg: 'bg-rose-100', text: 'text-rose-700' },
};

export function GraphInspector() {
  const [selectedStation, setSelectedStation] = useState<string | null>('ameerpet');

  const vertices = useMemo(
    () => (selectedStation ? getVerticesForStation(selectedStation) : []),
    [selectedStation]
  );

  const adjacencyData = useMemo(() => {
    if (vertices.length === 0) return [];
    return vertices.map((v) => {
      const neighbours = GRAPH.adjacencyList.get(v.id) ?? [];
      return { vertex: v, neighbours };
    });
  }, [vertices]);

  // Count edge types across the whole graph.
  const edgeTypeCounts = useMemo(() => {
    const counts = { adjacent: 0, interchange: 0, walking: 0 };
    for (const e of GRAPH.edges) counts[e.type]++;
    return counts;
  }, []);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Network className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Graph Inspector
        </h3>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        The same graph instance ({GRAPH.vertexCount} vertices, {GRAPH.edgeCount} edges)
        used by the routing engine. Select a station to inspect its actual adjacency list.
      </p>

      {/* Edge type summary */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-blue-50 p-2">
          <span className="block text-blue-600">Adjacent</span>
          <span className="font-bold text-slate-700">{edgeTypeCounts.adjacent}</span>
        </div>
        <div className="rounded-lg bg-amber-50 p-2">
          <span className="block text-amber-600">Interchange</span>
          <span className="font-bold text-slate-700">{edgeTypeCounts.interchange}</span>
        </div>
        <div className="rounded-lg bg-rose-50 p-2">
          <span className="block text-rose-600">Walking</span>
          <span className="font-bold text-slate-700">{edgeTypeCounts.walking}</span>
        </div>
      </div>

      <div className="mt-4">
        <StationSelect
          label="Select a station to inspect"
          value={selectedStation}
          onChange={setSelectedStation}
          placeholder="Choose any station"
        />
      </div>

      {adjacencyData.map(({ vertex, neighbours }) => {
        const stationName = STATION_BY_ID[vertex.stationId]?.name ?? vertex.stationId;
        const lineInfo = METRO_LINES[vertex.line];
        return (
          <div key={vertex.id} className="mt-4 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: lineInfo.color }}
              />
              <span className="font-semibold text-slate-800">{stationName}</span>
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-500">
                {vertex.id}
              </span>
              <span className="text-xs text-slate-400">({lineInfo.name})</span>
            </div>

            {neighbours.length === 0 ? (
              <p className="mt-2 text-xs text-slate-400">No outgoing edges (isolated vertex).</p>
            ) : (
              <table className="mt-3 w-full text-left text-xs">
                <thead className="text-slate-400">
                  <tr>
                    <th className="px-2 py-1 font-medium">Neighbour</th>
                    <th className="px-2 py-1 font-medium">Type</th>
                    <th className="px-2 py-1 font-medium">Line</th>
                    <th className="px-2 py-1 text-right font-medium">Distance</th>
                    <th className="px-2 py-1 text-right font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {neighbours.map((n, i) => {
                    const nStation = parseVertexId(n.vertex.id).stationId;
                    const nName = STATION_BY_ID[nStation]?.name ?? nStation;
                    const ts = EDGE_TYPE_STYLES[n.edge.type];
                    return (
                      <tr key={i} className="text-slate-600">
                        <td className="px-2 py-1.5">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: METRO_LINES[n.vertex.line].color }}
                            />
                            {nName}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${ts.bg} ${ts.text}`}>
                            {ts.label}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">{METRO_LINES[n.edge.line].name.replace(' Line', '')}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{n.edge.distanceKm} km</td>
                        <td className="px-2 py-1.5 text-right font-mono">{n.edge.timeMin} min</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <GitBranch className="h-3.5 w-3.5" />
        {STATIONS.filter((s) => s.isInterchange).length} interchange stations
        have multiple vertices connected by interchange edges.
      </div>
    </Card>
  );
}
