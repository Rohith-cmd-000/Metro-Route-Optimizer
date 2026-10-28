import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FlaskConical,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Route,
  TriangleAlert,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlgorithmState } from '@/components/AlgorithmState';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { GraphInspector } from '@/components/GraphInspector';
import { RouteObjectiveComparison, ExecutionReport } from '@/components/RouteComparisonReport';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StationSelect } from '@/components/StationSelect';
import { GRAPH, parseVertexId } from '@/data/graphBuilder';
import { METRO_LINES, STATION_BY_ID, SAMPLE_JOURNEY } from '@/data/metroData';
import {
  dijkstraBetweenStations,
  DIJKSTRA_COMPLEXITY,
  runAllTests,
  type DijkstraResult,
  type TestResult,
  type TraceEvent,
  type WeightMode,
} from '@/routing/router';
import { runPhase5Tests, type Phase5TestResult } from '@/routing/phase5Tests';
import { runPhase6Tests, type Phase6TestResult } from '@/routing/phase6Tests';

export function DsaScreen() {
  // --- Trace viewer state ---
  const [source, setSource] = useState<string | null>(SAMPLE_JOURNEY.source);
  const [destination, setDestination] = useState<string | null>(SAMPLE_JOURNEY.destination);
  const [mode, setMode] = useState<WeightMode>('time');
  const [result, setResult] = useState<DijkstraResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Test results (run once on mount) ---
  const [testResults] = useState<TestResult[]>(() => runAllTests());
  const allTestsPassed = testResults.every((t) => t.passed);

  // --- Phase 5 door-to-door tests ---
  const [phase5Results] = useState<Phase5TestResult[]>(() => runPhase5Tests());
  const phase5AllPassed = phase5Results.every((t) => t.passed);

  // --- Phase 6 mobile UI tests ---
  const [phase6Results] = useState<Phase6TestResult[]>(() => runPhase6Tests());
  const phase6AllPassed = phase6Results.every((t) => t.passed);

  function runTrace() {
    if (!source || !destination) return;
    setPlaying(false);
    const outcome = dijkstraBetweenStations(source, destination, mode);
    if ('error' in outcome) {
      setError(outcome.error);
      setResult(null);
      setStepIdx(0);
      return;
    }
    if ('error' in outcome.result) {
      setError(outcome.result.error);
      setResult(null);
      setStepIdx(0);
      return;
    }
    setError(null);
    setResult(outcome.result);
    setStepIdx(0);
  }

  // Run once on mount with the sample journey.
  useEffect(() => {
    runTrace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play / pause animation.
  useEffect(() => {
    if (!playing || !result) return;
    if (stepIdx >= result.trace.length - 1) {
      setPlaying(false);
      return;
    }
    timerRef.current = setInterval(() => {
      setStepIdx((i) => {
        if (i >= (result?.trace.length ?? 1) - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, result]);

  const trace: TraceEvent[] = useMemo(() => result?.trace ?? [], [result]);
  const currentEvent = trace[stepIdx];
  const isLastStep = stepIdx >= trace.length - 1;

  // Collect settled vertices up to the current step for highlighting.
  const settledSoFar = useMemo(() => {
    const s = new Set<string>();
    for (let i = 0; i <= stepIdx && i < trace.length; i++) {
      const e = trace[i];
      if (e.kind === 'settle') s.add(e.vertex);
    }
    return s;
  }, [trace, stepIdx]);

  const sourceName = source ? STATION_BY_ID[source]?.name ?? source : '—';
  const destName = destination ? STATION_BY_ID[destination]?.name ?? destination : '—';

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader
        title="DSA Proof Lab"
        subtitle="Dijkstra's algorithm with a binary-heap min-priority queue — real trace, real weights."
        icon={<FlaskConical className="h-5 w-5" />}
      />

      {/* Complexity badge */}
      <Card className="p-4">
        <div className="flex items-center gap-2.5">
          <Gauge className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Dijkstra complexity (binary heap + adjacency list)
            </p>
            <p className="font-mono text-xs text-slate-500">{DIJKSTRA_COMPLEXITY}</p>
          </div>
        </div>
      </Card>

      {/* Graph stats */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Graph feeding the algorithm
        </h3>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <dt className="text-xs text-slate-500">Stations</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900">{GRAPH.stationCount}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <dt className="text-xs text-slate-500">Vertices</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900">{GRAPH.vertexCount}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <dt className="text-xs text-slate-500">Edges</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900">{GRAPH.edgeCount}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <dt className="text-xs text-slate-500">Lines</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900">{GRAPH.lineCount}</dd>
          </div>
        </dl>
      </Card>

      {/* Section A: Graph Inspector */}
      <GraphInspector />

      {/* Trace controls */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Execution Trace Controls
        </h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <StationSelect
            label="Source station"
            value={source}
            onChange={setSource}
            excludeId={destination}
          />
          <StationSelect
            label="Destination station"
            value={destination}
            onChange={setDestination}
            excludeId={source}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-slate-300 p-0.5">
            <button
              onClick={() => setMode('time')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${mode === 'time' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Clock className="mr-1 inline h-3.5 w-3.5" /> Time
            </button>
            <button
              onClick={() => setMode('distance')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${mode === 'distance' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Route className="mr-1 inline h-3.5 w-3.5" /> Distance
            </button>
          </div>
          <Button onClick={runTrace} disabled={!source || !destination || source === destination}>
            <FlaskConical className="h-4 w-4" /> Run Dijkstra
          </Button>
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            {error}
          </div>
        )}

        {/* Playback controls */}
        {result && trace.length > 0 && (
          <>
            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => { setPlaying(false); setStepIdx((i) => Math.max(0, i - 1)); }}
                  disabled={stepIdx === 0}
                  className="px-2.5"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (isLastStep) { setStepIdx(0); setPlaying(true); }
                    else setPlaying((p) => !p);
                  }}
                  className="px-3"
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {playing ? 'Pause' : isLastStep ? 'Replay' : 'Play'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => { setPlaying(false); setStepIdx((i) => Math.min(trace.length - 1, i + 1)); }}
                  disabled={isLastStep}
                  className="px-2.5"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setPlaying(false); setStepIdx(0); }}
                  className="px-2.5"
                >
                  <RotateCcw className="h-4 w-4" /> Reset
                </Button>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Step {stepIdx + 1} / {trace.length}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${((stepIdx + 1) / trace.length) * 100}%` }}
              />
            </div>
          </>
        )}
      </Card>

      {/* Trace event detail + path */}
      {result && currentEvent && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Current event detail */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Current Step
            </h3>
            <TraceEventDetail event={currentEvent} />
          </Card>

          {/* Path + result summary */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Result Summary
            </h3>
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                  {sourceName} → {destName}
                </span>
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-medium capitalize text-blue-700">
                  {mode === 'time' ? 'Time' : 'Distance'}
                </span>
              </div>

              {result.reached ? (
                <>
                  <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <CheckCircle2 className="mr-1.5 inline h-4 w-4" />
                    Reached — total cost: <strong>{result.totalCost}</strong> {mode === 'time' ? 'min' : 'km'}
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Reconstructed path ({result.hopCount} hops)
                    </p>
                    <div className="flex flex-wrap items-center gap-1 text-xs">
                      {result.path.map((vid, i) => {
                        const sid = parseVertexId(vid).stationId;
                        const name = STATION_BY_ID[sid]?.name ?? sid;
                        const line = parseVertexId(vid).line;
                        const settled = settledSoFar.has(vid);
                        return (
                          <span key={i} className="flex items-center gap-1">
                            {i > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                            <span
                              className={`rounded-md px-1.5 py-0.5 font-mono ${
                                settled ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                              }`}
                              title={vid}
                            >
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
                </>
              ) : (
                <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <TriangleAlert className="mr-1.5 inline h-4 w-4" />
                  Destination not reachable from source in this graph.
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-lg bg-slate-50 p-2">
                  <span className="block text-slate-400">Settled</span>
                  <span className="font-bold text-slate-700">{result.settledCount}</span>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <span className="block text-slate-400">Trace events</span>
                  <span className="font-bold text-slate-700">{trace.length}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Section B: Algorithm State */}
      {result && trace.length > 0 && (
        <AlgorithmState result={result} trace={trace} stepIdx={stepIdx} />
      )}

      {/* Full trace log */}
      {result && trace.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Execution Trace Log
          </h3>
          <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Event</th>
                  <th className="px-3 py-2 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {trace.map((e, i) => (
                  <tr
                    key={i}
                    className={`cursor-pointer transition ${i === stepIdx ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                    onClick={() => { setPlaying(false); setStepIdx(i); }}
                  >
                    <td className="px-3 py-2 font-mono text-slate-400">{e.step}</td>
                    <td className="px-3 py-2">
                      <EventBadge kind={e.kind} />
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      <TraceSummary event={e} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Section D: Execution Report */}
      <ExecutionReport
        sourceStation={source ?? ''}
        destStation={destination ?? ''}
        mode={mode}
        dijkstraResult={result}
      />

      {/* Section C: Route Objective Comparison */}
      <RouteObjectiveComparison />

      {/* Test results */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Algorithm Tests
          </h3>
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
              allTestsPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {allTestsPassed ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            {allTestsPassed ? 'All 6 tests passed' : 'Some tests failed'}
          </span>
        </div>
        <ul className="mt-3 space-y-2">
          {testResults.map((t, i) => (
            <li
              key={i}
              className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${
                t.passed ? 'bg-emerald-50/60' : 'bg-red-50'
              }`}
            >
              {t.passed ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              )}
              <div>
                <p className={`font-medium ${t.passed ? 'text-slate-700' : 'text-red-700'}`}>
                  {t.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{t.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-400">
          Each test builds a small, hand-checkable graph and compares Dijkstra&rsquo;s
          output against an independently calculated expected answer — not the
          algorithm&rsquo;s own result.
        </p>
      </Card>

      {/* Phase 5 door-to-door tests */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Phase 5: Door-to-Door Journey Tests
          </h3>
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
              phase5AllPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {phase5AllPassed ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            {phase5AllPassed ? `All ${phase5Results.length} tests passed` : 'Some tests failed'}
          </span>
        </div>
        <ul className="mt-3 space-y-2">
          {phase5Results.map((t, i) => (
            <li
              key={i}
              className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${
                t.passed ? 'bg-emerald-50/60' : 'bg-red-50'
              }`}
            >
              {t.passed ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              )}
              <div>
                <p className={`font-medium ${t.passed ? 'text-slate-700' : 'text-red-700'}`}>
                  {t.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{t.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-400">
          Tests verify operating hours, transfer handling, walking legs, timetable
          unavailability, and that step durations sum to the total journey duration.
        </p>
      </Card>

      {/* Phase 6 mobile UI tests */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Phase 6: Mobile Interface Tests
          </h3>
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
              phase6AllPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {phase6AllPassed ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            {phase6AllPassed ? `All ${phase6Results.length} tests passed` : 'Some tests failed'}
          </span>
        </div>
        <ul className="mt-3 space-y-2">
          {phase6Results.map((t, i) => (
            <li
              key={i}
              className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${
                t.passed ? 'bg-emerald-50/60' : 'bg-red-50'
              }`}
            >
              {t.passed ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              )}
              <div>
                <p className={`font-medium ${t.passed ? 'text-slate-700' : 'text-red-700'}`}>
                  {t.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{t.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-400">
          Tests verify route total consistency, endpoint swapping, invalid input
          rejection, route switching, missing coordinates (schematic requirement),
          and long station name handling.
        </p>
      </Card>
    </div>
  );
}

// --- Sub-components ---------------------------------------------------------

function EventBadge({ kind }: { kind: TraceEvent['kind'] }) {
  const map: Record<string, string> = {
    init: 'bg-slate-100 text-slate-600',
    settle: 'bg-blue-100 text-blue-700',
    relax: 'bg-amber-100 text-amber-700',
    skip: 'bg-slate-100 text-slate-400',
    result: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[kind]}`}>
      {kind}
    </span>
  );
}

function TraceSummary({ event }: { event: TraceEvent }) {
  switch (event.kind) {
    case 'init':
      return <>Source: {event.source} · {event.vertexCount} vertices</>;
    case 'settle':
      return <>Settle {event.vertex} @ dist {event.dist} · PQ size after: {event.pqSizeAfter}</>;
    case 'relax': {
      const arrow = event.relaxed ? '→ relaxed' : '→ no change';
      return (
        <>
          {event.currentVertex} → {event.neighbour} · w={event.edgeWeight} ·
          cand={event.candidateDist} · prev={event.neighbourPrevDist ?? '∞'} {arrow}
        </>
      );
    }
    case 'skip':
      return <>Skip {event.vertex}: {event.reason}</>;
    case 'result':
      return event.reached
        ? <>Reached {event.destination} · cost {event.totalCost} · {event.hopCount} hops · path: {event.path.join(' → ')}</>
        : <>Unreachable: {event.destination}</>;
  }
}

function TraceEventDetail({ event }: { event: TraceEvent }) {
  if (event.kind === 'init') {
    return (
      <div className="mt-3 space-y-2 text-sm text-slate-600">
        <p><strong className="text-slate-800">Initialise:</strong> source vertex <code className="rounded bg-slate-100 px-1">{event.source}</code></p>
        <p>All distances set to ∞ except source (0). Priority queue seeded with source.</p>
        <p>Total vertices in graph: <strong>{event.vertexCount}</strong></p>
      </div>
    );
  }
  if (event.kind === 'settle') {
    return (
      <div className="mt-3 space-y-2 text-sm text-slate-600">
        <p><strong className="text-slate-800">Settle vertex:</strong> <code className="rounded bg-slate-100 px-1">{event.vertex}</code></p>
        <p>Extracted from PQ with distance <strong>{event.dist}</strong>. Marked as visited — its shortest distance is now final.</p>
        <p>Priority queue size after extract: <strong>{event.pqSizeAfter}</strong></p>
      </div>
    );
  }
  if (event.kind === 'relax') {
    return (
      <div className="mt-3 space-y-2 text-sm text-slate-600">
        <p><strong className="text-slate-800">Relax edge:</strong> <code className="rounded bg-slate-100 px-1">{event.currentVertex}</code> → <code className="rounded bg-slate-100 px-1">{event.neighbour}</code></p>
        <p>Edge weight: <strong>{event.edgeWeight}</strong></p>
        <p>Candidate distance: <strong>{event.candidateDist}</strong> (current {event.currentDist} + weight {event.edgeWeight})</p>
        <p>Neighbour&rsquo;s previous distance: <strong>{event.neighbourPrevDist ?? '∞'}</strong></p>
        {event.relaxed ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
            <CheckCircle2 className="mr-1 inline h-4 w-4" />
            Relaxation succeeded — distance and predecessor updated.
          </p>
        ) : (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-slate-500">
            No improvement — candidate ≥ existing distance. Skipped.
          </p>
        )}
      </div>
    );
  }
  if (event.kind === 'skip') {
    return (
      <div className="mt-3 space-y-2 text-sm text-slate-600">
        <p><strong className="text-slate-800">Skip stale entry:</strong> <code className="rounded bg-slate-100 px-1">{event.vertex}</code></p>
        <p>{event.reason}</p>
      </div>
    );
  }
  // result
  return (
    <div className="mt-3 space-y-2 text-sm text-slate-600">
      {event.reached ? (
        <>
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
            <CheckCircle2 className="mr-1 inline h-4 w-4" />
            Destination reached with total cost <strong>{event.totalCost}</strong>.
          </p>
          <p>Hops: <strong>{event.hopCount}</strong></p>
          <p>Path reconstructed from predecessor array:</p>
          <p className="font-mono text-xs text-slate-500">{event.path.join(' → ')}</p>
        </>
      ) : (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-700">
          <TriangleAlert className="mr-1 inline h-4 w-4" />
          Destination unreachable — no path exists.
        </p>
      )}
    </div>
  );
}
