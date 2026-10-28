import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  List,
  Loader2,
  Map as MapIcon,
  Search,
  TrainFront,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ItineraryTimeline } from '@/components/ItineraryTimeline';
import { RouteCard } from '@/components/RouteCard';
import { SchematicMap } from '@/components/SchematicMap';
import { ScreenHeader } from '@/components/ScreenHeader';
import { STATION_BY_ID } from '@/data/metroData';
import type { DoorToDoorItinerary, JourneyRequest, JourneyResult, RoutingOutcome } from '@/types/metro';

interface ResultsScreenProps {
  request: JourneyRequest | null;
  outcome: RoutingOutcome | null;
  itineraries: DoorToDoorItinerary[];
  onPlanAgain: () => void;
  loading?: boolean;
}

export function ResultsScreen({
  request,
  outcome,
  itineraries,
  onPlanAgain,
  loading = false,
}: ResultsScreenProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const sourceName = request
    ? STATION_BY_ID[request.source]?.name ?? request.source
    : null;
  const destName = request
    ? STATION_BY_ID[request.destination]?.name ?? request.destination
    : null;

  const hasDoorToDoor = Boolean(
    request?.startAddress || request?.endAddress ||
    request?.startWalkingMin || request?.endWalkingMin
  );

  const okResults = outcome?.status === 'ok' ? outcome.results : [];
  const selectedRoute = okResults[selectedIdx] ?? null;
  const selectedItinerary = itineraries[selectedIdx] ?? null;

  const toggleExpand = (i: number) => {
    setExpandedIdx(expandedIdx === i ? null : i);
  };

  // Selecting a route card updates the map.
  function selectRoute(i: number) {
    setSelectedIdx(i);
    setExpandedIdx(i);
  }

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader
        title="Route Results"
        subtitle={hasDoorToDoor
          ? 'Door-to-door itinerary with walking, timetable, and cost estimates.'
          : 'Computed on the weighted metro graph using the selected objective.'}
        icon={<TrainFront className="h-5 w-5" />}
      />

      {/* Loading state */}
      {loading && (
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium text-slate-600">Finding routes…</p>
        </Card>
      )}

      {!request && !loading && (
        <Card className="p-8 text-center">
          <Search className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-lg font-semibold text-slate-800">
            No journey planned yet
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Head to the Plan Journey screen, choose your source and destination,
            and tap Find Routes. Results will appear here.
          </p>
          <Button className="mt-4" onClick={onPlanAgain}>
            Plan a Journey
          </Button>
        </Card>
      )}

      {/* Journey summary */}
      {request && !loading && (
        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
              From: {sourceName}
            </span>
            <span className="text-slate-400">→</span>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
              To: {destName}
            </span>
            {request.departureTime && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                <Clock className="h-3 w-3" />
                {request.departureTime}
              </span>
            )}
            <span className="ml-auto rounded-lg bg-slate-100 px-2.5 py-1 font-medium capitalize text-slate-700">
              {request.preference.replace('_', ' ')}
            </span>
          </div>
          {outcome?.status === 'ok' && outcome.results.length > 1 && (
            <p className="mt-2 text-xs text-slate-500">
              {outcome.results.length} distinct route{outcome.results.length !== 1 ? 's' : ''} found.
              Tap a route card to view it on the map.
            </p>
          )}
        </Card>
      )}

      {/* Error state */}
      {request && outcome?.status === 'error' && (
        <Card className="border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-2.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <span>{outcome.message}</span>
          </div>
          <Button variant="secondary" className="mt-3" onClick={onPlanAgain}>
            Back to Plan Journey
          </Button>
        </Card>
      )}

      {/* Empty state */}
      {request && outcome?.status === 'empty' && (
        <Card className="p-8 text-center">
          <Search className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-lg font-semibold text-slate-800">
            No route found
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {outcome.reason}
          </p>
          <Button variant="secondary" className="mt-4" onClick={onPlanAgain}>
            Back to Plan Journey
          </Button>
        </Card>
      )}

      {/* Results: list + map toggle */}
      {request && outcome?.status === 'ok' && !loading && (
        <ResultsContent
          okResults={okResults}
          hasDoorToDoor={hasDoorToDoor}
          selectedIdx={selectedIdx}
          expandedIdx={expandedIdx}
          viewMode={viewMode}
          selectedRoute={selectedRoute}
          selectedItinerary={selectedItinerary}
          request={request}
          onSelectRoute={selectRoute}
          onToggleExpand={toggleExpand}
          onViewModeChange={setViewMode}
          onPlanAgain={onPlanAgain}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Results content (split out to keep the main component readable)
// ---------------------------------------------------------------------------

function ResultsContent({
  okResults,
  hasDoorToDoor,
  selectedIdx,
  expandedIdx,
  viewMode,
  selectedRoute,
  selectedItinerary,
  request,
  onSelectRoute,
  onToggleExpand,
  onViewModeChange,
  onPlanAgain,
}: {
  okResults: JourneyResult[];
  hasDoorToDoor: boolean;
  selectedIdx: number;
  expandedIdx: number | null;
  viewMode: 'list' | 'map';
  selectedRoute: JourneyResult | null;
  selectedItinerary: DoorToDoorItinerary | null;
  request: JourneyRequest;
  onSelectRoute: (i: number) => void;
  onToggleExpand: (i: number) => void;
  onViewModeChange: (m: 'list' | 'map') => void;
  onPlanAgain: () => void;
}) {
  return (
    <>
      {/* Map/List toggle */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-xl border border-slate-300 p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('map')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === 'map' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            Map
          </button>
        </div>
        <span className="text-xs text-slate-400">
          {okResults.length} route{okResults.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* List view: route cards + expandable itinerary */}
      {viewMode === 'list' && (
        <div className="flex flex-col gap-4">
          {okResults.map((r, i) => (
            <div key={i} className="flex flex-col gap-3">
              <RouteCard
                result={r}
                index={i}
                selected={selectedIdx === i}
                onSelect={() => onSelectRoute(i)}
              />
              {/* Expandable step-by-step itinerary */}
              {selectedIdx === i && (
                <div className="flex flex-col gap-3">
                  {hasDoorToDoor && selectedItinerary && (
                    <ItineraryTimeline itinerary={selectedItinerary} />
                  )}
                  {!hasDoorToDoor && (
                    <StepByStepExpandable
                      route={r}
                      expanded={expandedIdx === i}
                      onToggle={() => onToggleExpand(i)}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
          <div className="flex justify-center">
            <Button variant="secondary" onClick={onPlanAgain}>
              Plan Another Journey
            </Button>
          </div>
        </div>
      )}

      {/* Map view: schematic map + selected route details */}
      {viewMode === 'map' && (
        <div className="flex flex-col gap-4">
          <Card className="p-4 sm:p-5">
            <SchematicMap
              route={selectedRoute}
              sourceId={request.source}
              destId={request.destination}
            />
          </Card>

          {/* Selected route summary + itinerary */}
          {selectedRoute && (
            <div className="flex flex-col gap-3">
              <RouteCard
                result={selectedRoute}
                index={selectedIdx}
                selected={true}
              />
              {hasDoorToDoor && selectedItinerary && (
                <ItineraryTimeline itinerary={selectedItinerary} />
              )}
              {!hasDoorToDoor && (
                <StepByStepExpandable
                  route={selectedRoute}
                  expanded={true}
                  onToggle={() => {}}
                />
              )}
            </div>
          )}

          {/* Route selector pills */}
          {okResults.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {okResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelectRoute(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    selectedIdx === i
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Route {i + 1} · {r.metrics.totalTimeMin} min
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-center">
            <Button variant="secondary" onClick={onPlanAgain}>
              Plan Another Journey
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Expandable step-by-step itinerary (for non-door-to-door journeys)
// ---------------------------------------------------------------------------

function StepByStepExpandable({
  route,
  expanded,
  onToggle,
}: {
  route: JourneyResult;
  expanded: boolean;
  onToggle: () => void;
}) {
  const stationNames = useMemo(() => {
    const ids: string[] = [];
    for (const leg of route.legs) {
      if (ids.length === 0) ids.push(leg.boardingStation);
      ids.push(leg.alightingStation);
    }
    return ids.map((id) => STATION_BY_ID[id]?.name ?? id);
  }, [route]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-sm font-semibold text-slate-700"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          Step-by-step itinerary
        </span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="mt-3 flex flex-col">
          {stationNames.map((name, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="inline-block h-3 w-3 rounded-full bg-blue-500 ring-2 ring-white" />
                {i < stationNames.length - 1 && (
                  <span className="my-1 w-px flex-1 bg-slate-200" style={{ minHeight: 20 }} />
                )}
              </div>
              <div className="pb-2 text-sm text-slate-700">{name}</div>
            </div>
          ))}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {route.metrics.totalTimeMin} min total
            </span>
            <span className="inline-flex items-center gap-1">
              <TrainFront className="h-3.5 w-3.5" />
              {route.metrics.totalDistanceKm} km
            </span>
            {route.metrics.fareINR !== null && (
              <span className="inline-flex items-center gap-1">
                Rs. {route.metrics.fareINR}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              {route.metrics.interchangeCount} transfer{route.metrics.interchangeCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
