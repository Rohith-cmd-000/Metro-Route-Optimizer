import {
  ArrowLeftRight,
  Clock,
  Compass,
  Footprints,
  Gauge,
  MapPin,
  Plus,
  RotateCcw,
  Route as RouteIcon,
  Ruler,
  Scale,
  Search,
  Shuffle,
  SlidersHorizontal,
  Wallet,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DataDisclaimer } from '@/components/DataDisclaimer';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StationSelect } from '@/components/StationSelect';
import { SAMPLE_JOURNEY } from '@/data/metroData';
import type {
  BalancedWeights,
  JourneyRequest,
  RouteObjective,
} from '@/types/metro';

interface HomeScreenProps {
  onFindRoutes: (request: JourneyRequest) => void;
  onNavigateResults: () => void;
}

interface ObjectiveOption {
  value: RouteObjective;
  label: string;
  hint: string;
  icon: React.ReactNode;
}

const OBJECTIVES: ObjectiveOption[] = [
  { value: 'fastest', label: 'Fastest', hint: 'Minimise total travel time using Dijkstra with time weights.', icon: <Gauge className="h-4 w-4" /> },
  { value: 'cheapest', label: 'Cheapest', hint: 'Minimise estimated fare using distance-based slab pricing.', icon: <Wallet className="h-4 w-4" /> },
  { value: 'fewest_interchanges', label: 'Fewest Changes', hint: 'Minimise line changes first, then time — lexicographic search.', icon: <Shuffle className="h-4 w-4" /> },
  { value: 'least_walking', label: 'Least Walking', hint: 'Minimise walking distance across access and interchange legs.', icon: <Footprints className="h-4 w-4" /> },
  { value: 'shortest_distance', label: 'Shortest', hint: 'Minimise total metro track distance.', icon: <Ruler className="h-4 w-4" /> },
  { value: 'balanced', label: 'Balanced', hint: 'Normalised weighted score across time, cost, transfers, walking.', icon: <Scale className="h-4 w-4" /> },
];

const DEFAULT_WEIGHTS: BalancedWeights = {
  time: 0.35,
  cost: 0.25,
  transfers: 0.25,
  walking: 0.15,
};

export function HomeScreen({ onFindRoutes, onNavigateResults }: HomeScreenProps) {
  const [source, setSource] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [departureTime, setDepartureTime] = useState('09:00');
  const [objective, setObjective] = useState<RouteObjective>('fastest');
  const [weights, setWeights] = useState<BalancedWeights>(DEFAULT_WEIGHTS);

  // Phase 5: door-to-door optional inputs
  const [showDoorToDoor, setShowDoorToDoor] = useState(false);
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [startWalkingMin, setStartWalkingMin] = useState('');
  const [endWalkingMin, setEndWalkingMin] = useState('');
  const [firstMileCost, setFirstMileCost] = useState('');
  const [lastMileCost, setLastMileCost] = useState('');

  function swap() {
    setSource(destination);
    setDestination(source);
  }

  function clear() {
    setSource(null);
    setDestination(null);
    setDepartureTime('09:00');
    setObjective('fastest');
    setWeights(DEFAULT_WEIGHTS);
    setStartAddress('');
    setEndAddress('');
    setStartWalkingMin('');
    setEndWalkingMin('');
    setFirstMileCost('');
    setLastMileCost('');
  }

  function loadSample() {
    setSource(SAMPLE_JOURNEY.source);
    setDestination(SAMPLE_JOURNEY.destination);
    setDepartureTime(SAMPLE_JOURNEY.departureTime);
    setObjective(SAMPLE_JOURNEY.preference);
  }

  function handleFind() {
    if (!source || !destination) return;
    const request: JourneyRequest = {
      source,
      destination,
      departureTime,
      preference: objective,
    };
    if (objective === 'balanced') {
      request.balancedWeights = weights;
    }
    if (showDoorToDoor) {
      if (startAddress.trim()) request.startAddress = startAddress.trim();
      if (endAddress.trim()) request.endAddress = endAddress.trim();
      if (startWalkingMin) request.startWalkingMin = parseInt(startWalkingMin, 10);
      if (endWalkingMin) request.endWalkingMin = parseInt(endWalkingMin, 10);
      if (firstMileCost) request.firstMileCostINR = parseInt(firstMileCost, 10);
      if (lastMileCost) request.lastMileCostINR = parseInt(lastMileCost, 10);
    }
    onFindRoutes(request);
    onNavigateResults();
  }

  const canFind = Boolean(source && destination && source !== destination);
  const activeObjective = OBJECTIVES.find((o) => o.value === objective)!;

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader
        title="Plan Your Journey"
        subtitle="Pick your stations, departure time, and route objective. Optional door-to-door planning with walking and cost estimates."
        icon={<Compass className="h-5 w-5" />}
      />

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="relative grid gap-4 sm:grid-cols-2">
            <StationSelect
              label="From (Source Station)"
              value={source}
              onChange={setSource}
              placeholder="Where are you starting?"
              excludeId={destination}
            />
            <StationSelect
              label="To (Destination Station)"
              value={destination}
              onChange={setDestination}
              placeholder="Where do you want to go?"
              excludeId={source}
            />
            <button
              type="button"
              onClick={swap}
              disabled={!source && !destination}
              className="absolute left-1/2 top-1/2 z-10 hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 sm:flex"
              aria-label="Swap source and destination"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>

          <Button
            variant="secondary"
            className="sm:hidden"
            onClick={swap}
            disabled={!source && !destination}
          >
            <ArrowLeftRight className="h-4 w-4" />
            Swap source &amp; destination
          </Button>

          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {OBJECTIVES.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setObjective(o.value)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                    objective === o.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {o.icon}
                  {o.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">{activeObjective.hint}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                Departure time
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/40">
                <Clock className="h-4 w-4 text-slate-400" />
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {objective === 'balanced' && (
            <BalancedWeightsEditor weights={weights} onChange={setWeights} />
          )}

          {/* Phase 5: Door-to-door toggle */}
          <button
            type="button"
            onClick={() => setShowDoorToDoor((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            {showDoorToDoor ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showDoorToDoor ? 'Hide door-to-door options' : 'Add door-to-door walking & cost'}
          </button>

          {showDoorToDoor && (
            <DoorToDoorEditor
              startAddress={startAddress}
              endAddress={endAddress}
              startWalkingMin={startWalkingMin}
              endWalkingMin={endWalkingMin}
              firstMileCost={firstMileCost}
              lastMileCost={lastMileCost}
              onStartAddressChange={setStartAddress}
              onEndAddressChange={setEndAddress}
              onStartWalkingChange={setStartWalkingMin}
              onEndWalkingChange={setEndWalkingMin}
              onFirstMileCostChange={setFirstMileCost}
              onLastMileCostChange={setLastMileCost}
            />
          )}

          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:items-center">
            <Button
              onClick={handleFind}
              disabled={!canFind}
              className="sm:flex-1"
            >
              <Search className="h-4 w-4" />
              Find Routes
            </Button>
            <Button variant="secondary" onClick={loadSample}>
              <RouteIcon className="h-4 w-4" />
              Sample Journey
            </Button>
            <Button variant="ghost" onClick={clear}>
              <RotateCcw className="h-4 w-4" />
              Clear
            </Button>
          </div>

          {!canFind && (source || destination) && (
            <p className="text-xs text-amber-600">
              Select both a source and a different destination to find routes.
            </p>
          )}
        </div>
      </Card>

      <DataDisclaimer />
    </div>
  );
}

// --- Door-to-door editor ----------------------------------------------------

function DoorToDoorEditor(props: {
  startAddress: string;
  endAddress: string;
  startWalkingMin: string;
  endWalkingMin: string;
  firstMileCost: string;
  lastMileCost: string;
  onStartAddressChange: (v: string) => void;
  onEndAddressChange: (v: string) => void;
  onStartWalkingChange: (v: string) => void;
  onEndWalkingChange: (v: string) => void;
  onFirstMileCostChange: (v: string) => void;
  onLastMileCostChange: (v: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <MapPin className="h-4 w-4 text-slate-400" />
        Door-to-door options
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Optional. Add your start/end address or walking time for a full itinerary
        with access/exit walking. Walking estimates are simulated (no GPS or map API).
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">
            Start address (optional)
          </label>
          <input
            type="text"
            value={props.startAddress}
            onChange={(e) => props.onStartAddressChange(e.target.value)}
            placeholder="e.g. Kukatpally Housing Board"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">
            End address (optional)
          </label>
          <input
            type="text"
            value={props.endAddress}
            onChange={(e) => props.onEndAddressChange(e.target.value)}
            placeholder="e.g. Hitech City Rd"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">
            Walking to source station (min)
          </label>
          <input
            type="number"
            min={0}
            value={props.startWalkingMin}
            onChange={(e) => props.onStartWalkingChange(e.target.value)}
            placeholder="Auto-estimate from address"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">
            Walking from dest station (min)
          </label>
          <input
            type="number"
            min={0}
            value={props.endWalkingMin}
            onChange={(e) => props.onEndWalkingChange(e.target.value)}
            placeholder="Auto-estimate from address"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">
            First-mile transport cost (Rs.)
          </label>
          <input
            type="number"
            min={0}
            value={props.firstMileCost}
            onChange={(e) => props.onFirstMileCostChange(e.target.value)}
            placeholder="e.g. 50 for auto-rickshaw"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">
            Last-mile transport cost (Rs.)
          </label>
          <input
            type="number"
            min={0}
            value={props.lastMileCost}
            onChange={(e) => props.onLastMileCostChange(e.target.value)}
            placeholder="e.g. 40 for auto-rickshaw"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>
    </div>
  );
}

// --- Balanced weights editor ------------------------------------------------

function BalancedWeightsEditor({
  weights,
  onChange,
}: {
  weights: BalancedWeights;
  onChange: (w: BalancedWeights) => void;
}) {
  const total = weights.time + weights.cost + weights.transfers + weights.walking;

  const update = (key: keyof BalancedWeights, value: number) => {
    onChange({ ...weights, [key]: value });
  };

  const sliders: { key: keyof BalancedWeights; label: string; color: string }[] = [
    { key: 'time', label: 'Time', color: 'accent-blue-600' },
    { key: 'cost', label: 'Cost', color: 'accent-emerald-600' },
    { key: 'transfers', label: 'Transfers', color: 'accent-amber-600' },
    { key: 'walking', label: 'Walking', color: 'accent-rose-600' },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <SlidersHorizontal className="h-4 w-4 text-slate-400" />
        Balanced scoring weights
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Each candidate route is scored on four normalised metrics. Lower score wins.
        Weights are relative — they need not sum to 1.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {sliders.map((s) => (
          <div key={s.key} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">{s.label}</span>
              <span className="font-semibold text-slate-800">
                {weights[s.key].toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={weights[s.key]}
              onChange={(e) => update(s.key, parseFloat(e.target.value))}
              className={`h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 ${s.color}`}
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-xs">
        <span className="text-slate-500">Sum of weights</span>
        <span className={`font-semibold ${Math.abs(total - 1) < 0.01 ? 'text-emerald-600' : 'text-slate-700'}`}>
          {total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
