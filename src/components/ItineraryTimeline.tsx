import {
  ArrowDown,
  Clock,
  Footprints,
  LogIn,
  LogOut,
  TrainFront,
  Hourglass as WaitIcon,
} from 'lucide-react';
import { METRO_LINES } from '@/data/metroData';
import type { DoorToDoorItinerary, ItineraryLegType, ItineraryStep } from '@/types/metro';

interface ItineraryTimelineProps {
  itinerary: DoorToDoorItinerary;
}

const STEP_ICONS: Record<ItineraryLegType, React.ReactNode> = {
  access_walk: <Footprints className="h-4 w-4" />,
  board: <LogIn className="h-4 w-4" />,
  ride: <TrainFront className="h-4 w-4" />,
  interchange_walk: <ArrowDown className="h-4 w-4" />,
  wait: <WaitIcon className="h-4 w-4" />,
  exit_walk: <LogOut className="h-4 w-4" />,
};

const STEP_COLORS: Record<ItineraryLegType, string> = {
  access_walk: 'bg-amber-100 text-amber-700',
  board: 'bg-blue-100 text-blue-700',
  ride: 'bg-slate-100 text-slate-700',
  interchange_walk: 'bg-orange-100 text-orange-700',
  wait: 'bg-slate-100 text-slate-500',
  exit_walk: 'bg-amber-100 text-amber-700',
};

export function ItineraryTimeline({ itinerary }: ItineraryTimelineProps) {
  const { steps, leaveTime, boardTime, arrivalTime, notes } = itinerary;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Timeline header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Clock className="h-4 w-4 text-blue-500" />
          Journey Timeline
        </div>
        <div className="ml-auto flex flex-wrap gap-3 text-xs">
          <TimeBadge label="Leave" time={leaveTime} color="text-slate-700 bg-slate-100" />
          <TimeBadge label="Board" time={boardTime} color="text-blue-700 bg-blue-50" />
          <TimeBadge label="Arrive" time={arrivalTime} color="text-emerald-700 bg-emerald-50" />
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {itinerary.totalDurationMin} min total
        </span>
        {itinerary.waitingMin > 0 && (
          <span className="inline-flex items-center gap-1">
            <WaitIcon className="h-3.5 w-3.5" />
            {itinerary.waitingMin} min waiting
          </span>
        )}
        {itinerary.totalWalkingKm > 0 && (
          <span className="inline-flex items-center gap-1">
            <Footprints className="h-3.5 w-3.5" />
            {itinerary.totalWalkingKm} km walking
          </span>
        )}
        {itinerary.totalCostINR !== null && (
          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
            Rs. {itinerary.totalCostINR}
          </span>
        )}
        {itinerary.outsideOperatingHours && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-0.5 font-medium text-red-600">
            Outside operating hours
          </span>
        )}
        <span className={`rounded-lg px-2 py-0.5 font-medium ${
          itinerary.timetableSource === 'verified'
            ? 'bg-emerald-50 text-emerald-600'
            : itinerary.timetableSource === 'simulated'
            ? 'bg-amber-50 text-amber-600'
            : 'bg-red-50 text-red-600'
        }`}>
          {itinerary.timetableSource === 'verified'
            ? 'Verified timetable'
            : itinerary.timetableSource === 'simulated'
            ? 'Simulated timetable'
            : 'No timetable'}
        </span>
      </div>

      {/* Timeline steps */}
      <div className="mt-4 flex flex-col">
        {steps.map((step, i) => (
          <TimelineStep
            key={i}
            step={step}
            isLast={i === steps.length - 1}
          />
        ))}
      </div>

      {/* Notes */}
      <div className="mt-4 rounded-xl bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-600">Notes</p>
        <ul className="mt-1 space-y-0.5">
          {notes.map((note, i) => (
            <li key={i} className="text-xs text-slate-500">
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TimeBadge({ label, time, color }: { label: string; time: string; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-semibold ${color}`}>
      {label}: {time}
    </span>
  );
}

function TimelineStep({ step, isLast }: { step: ItineraryStep; isLast: boolean }) {
  const lineColor = step.line ? METRO_LINES[step.line].color : null;

  return (
    <div className="flex gap-3">
      {/* Icon + connector */}
      <div className="flex flex-col items-center">
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${STEP_COLORS[step.type]}`}>
          {STEP_ICONS[step.type]}
        </span>
        {!isLast && (
          <span className="my-1 w-px flex-1 bg-slate-200" style={{ minHeight: 16 }} />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 ${isLast ? '' : 'pb-3'}`}>
        <div className="flex items-center gap-2">
          {lineColor && (
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: lineColor }}
            />
          )}
          <span className="text-sm font-medium text-slate-700">{step.description}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-slate-400">
          {step.startTime && step.endTime && step.startTime !== step.endTime && (
            <span className="font-mono">{step.startTime} → {step.endTime}</span>
          )}
          {step.startTime && step.endTime && step.startTime === step.endTime && (
            <span className="font-mono">{step.startTime}</span>
          )}
          {step.durationMin > 0 && (
            <span>{step.durationMin} min</span>
          )}
          {step.walkingKm > 0 && (
            <span>{step.walkingKm} km walk</span>
          )}
        </div>
      </div>
    </div>
  );
}
