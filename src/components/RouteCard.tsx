import {
  ArrowRight,
  Check,
  Clock,
  Footprints,
  GitBranch,
  MapPin,
  Scale,
  Shuffle,
  Sparkles,
  TrainFront,
  Wallet,
} from 'lucide-react';
import { METRO_LINES, STATION_BY_ID } from '@/data/metroData';
import type { JourneyResult, RouteObjective } from '@/types/metro';

interface RouteCardProps {
  result: JourneyResult;
  index?: number;
  selected?: boolean;
  onSelect?: () => void;
}

const OBJECTIVE_LABELS: Record<RouteObjective, string> = {
  fastest: 'Fastest',
  cheapest: 'Cheapest',
  fewest_interchanges: 'Fewest Interchanges',
  least_walking: 'Least Walking',
  shortest_distance: 'Shortest Distance',
  balanced: 'Balanced',
};

const OBJECTIVE_ICONS: Record<RouteObjective, React.ReactNode> = {
  fastest: <Clock className="h-3.5 w-3.5" />,
  cheapest: <Wallet className="h-3.5 w-3.5" />,
  fewest_interchanges: <Shuffle className="h-3.5 w-3.5" />,
  least_walking: <Footprints className="h-3.5 w-3.5" />,
  shortest_distance: <TrainFront className="h-3.5 w-3.5" />,
  balanced: <Scale className="h-3.5 w-3.5" />,
};

function LineBadge({ line }: { line: JourneyResult['legs'][number]['line'] }) {
  const ml = METRO_LINES[line];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-semibold text-white"
      style={{ backgroundColor: ml.color }}
    >
      {ml.name}
    </span>
  );
}

export function RouteCard({ result, index, selected, onSelect }: RouteCardProps) {
  const sourceName = STATION_BY_ID[result.source]?.name ?? result.source;
  const destName = STATION_BY_ID[result.destination]?.name ?? result.destination;
  const { metrics, explanation } = result;
  const objLabel = OBJECTIVE_LABELS[explanation.objective];
  const isSelectable = Boolean(onSelect);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!isSelectable}
      aria-pressed={selected}
      className={`w-full rounded-2xl border p-5 text-left shadow-sm transition ${
        selected
          ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/30'
          : isSelectable
          ? 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
          : 'border-slate-200 bg-white'
      } ${isSelectable ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {/* Objective badge */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          {OBJECTIVE_ICONS[explanation.objective]}
          {objLabel}
        </span>
        {typeof index === 'number' && (
          <span className="text-xs font-medium text-slate-400">
            Route {index + 1}
          </span>
        )}
        {metrics.balancedScore !== null && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <Sparkles className="h-3 w-3" />
            Score {metrics.balancedScore}/100
          </span>
        )}
        {selected && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
            <Check className="h-3 w-3" />
            Selected
          </span>
        )}
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 pt-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <MapPin className="h-4 w-4 text-blue-500" />
          <span className="truncate">{sourceName}</span>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{destName}</span>
        </div>
        <div className="ml-auto flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {metrics.totalTimeMin} min
          </span>
          <span className="inline-flex items-center gap-1">
            <TrainFront className="h-3.5 w-3.5" />
            {metrics.totalDistanceKm} km
          </span>
          {metrics.fareINR !== null && (
            <span className="inline-flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5" />
              Rs. {metrics.fareINR}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Shuffle className="h-3.5 w-3.5" />
            {metrics.interchangeCount} change{metrics.interchangeCount !== 1 ? 's' : ''}
          </span>
          {metrics.totalWalkingKm > 0 && (
            <span className="inline-flex items-center gap-1">
              <Footprints className="h-3.5 w-3.5" />
              {metrics.totalWalkingKm} km walk
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <GitBranch className="h-3.5 w-3.5" />
            {metrics.hopCount} hops
          </span>
        </div>
      </div>

      {/* Legs */}
      <div className="mt-4 flex flex-col gap-3">
        {result.legs.map((leg, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center pt-1">
              <span
                className="inline-block h-3 w-3 rounded-full ring-2 ring-white"
                style={{ backgroundColor: METRO_LINES[leg.line].color }}
              />
              {i < result.legs.length - 1 && (
                <span className="mt-1 h-full w-px bg-slate-200" style={{ minHeight: 24 }} />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <LineBadge line={leg.line} />
                <span className="text-sm font-medium text-slate-700">
                  {STATION_BY_ID[leg.boardingStation]?.name ?? leg.boardingStation}
                  <ArrowRight className="mx-1 inline h-3 w-3 text-slate-400" />
                  {STATION_BY_ID[leg.alightingStation]?.name ?? leg.alightingStation}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                {leg.stationCount} stop{leg.stationCount !== 1 ? 's' : ''} · {leg.distanceKm} km · {leg.timeMin} min
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Selection reason */}
      <div className="mt-4 rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-600">
          Why this route?
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{explanation.reason}</p>
        <p className="mt-1.5 text-xs font-medium text-slate-400">
          Algorithm: {explanation.algorithm}
        </p>
      </div>
    </button>
  );
}
