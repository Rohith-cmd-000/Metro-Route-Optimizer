// Simulated timetable data for the Hyderabad Metro.
//
// The HMRL GTFS feed is behind a request form (see dataProvenance.ts), so we
// do NOT have verified schedule data. This module provides a clearly-labelled
// SIMULATED timetable with realistic operating hours and headways based on
// publicly known HMRL service patterns:
//
//   - Operating hours: ~06:30 to 22:00 (publicly stated)
//   - Peak headway: ~3–4 min; off-peak: ~6–8 min
//
// Every departure time returned here is labelled 'simulated'. The UI must not
// present these as official HMRL schedule times.
//
// Data source: HMRL publicly stated operating hours and approximate headways.
// Specific departure times are SIMULATED, not verified.

import type { LineId, LineTimetable, ScheduledDeparture } from '@/types/metro';
import { LINE_ORDER } from '@/data/metroData';

export const LINE_TIMETABLES: Record<LineId, LineTimetable> = {
  red: {
    line: 'red',
    firstDeparture: '06:30',
    lastDeparture: '22:00',
    headwayMin: 6,
    source: 'simulated',
  },
  blue: {
    line: 'blue',
    firstDeparture: '06:30',
    lastDeparture: '22:00',
    headwayMin: 5,
    source: 'simulated',
  },
  green: {
    line: 'green',
    firstDeparture: '06:30',
    lastDeparture: '22:00',
    headwayMin: 8,
    source: 'simulated',
  },
};

export const TIMETABLE_PROVENANCE = {
  status: 'simulated' as const,
  description:
    'Operating hours (06:30–22:00) are based on publicly stated HMRL service times. ' +
    'Specific departure times and headways are SIMULATED estimates, not verified ' +
    'against the official HMRL GTFS feed (which requires a data request form).',
  sources: ['HMRL publicly stated operating hours', 'Estimated headways'],
};

/** All line timetables are simulated — no verified GTFS data is loaded. */
export function isTimetableVerified(): boolean {
  return LINE_ORDER.every((line) => LINE_TIMETABLES[line].source === 'verified');
}

/**
 * Find the next simulated departure after `afterTime` (inclusive) from a given
 * station on a given line. Returns null if the time is outside operating hours.
 *
 * The timetable is generated from headway: departures run from firstDeparture
 * to lastDeparture at headwayMin intervals.
 */
export function nextDeparture(
  line: LineId,
  stationId: string,
  afterTime: string
): ScheduledDeparture | null {
  const tt = LINE_TIMETABLES[line];

  const afterMin = timeToMinutes(afterTime);
  const firstMin = timeToMinutes(tt.firstDeparture);
  const lastMin = timeToMinutes(tt.lastDeparture);

  if (afterMin > lastMin) return null;
  if (afterMin < firstMin) {
    // Before operating hours — first train of the day.
    return {
      line,
      stationId,
      time: tt.firstDeparture,
      source: 'simulated',
    };
  }

  // Find the next headway-aligned slot at or after afterMin.
  const elapsed = afterMin - firstMin;
  const slotsSinceStart = Math.floor(elapsed / tt.headwayMin);
  const candidateMin = firstMin + slotsSinceStart * tt.headwayMin;
  const departureMin = candidateMin >= afterMin ? candidateMin : candidateMin + tt.headwayMin;

  if (departureMin > lastMin) return null;

  return {
    line,
    stationId,
    time: minutesToTime(departureMin),
    source: 'simulated',
  };
}

/** Check if a given "HH:MM" time falls within operating hours. */
export function withinOperatingHours(time: string): boolean {
  const t = timeToMinutes(time);
  for (const line of LINE_ORDER) {
    const tt = LINE_TIMETABLES[line];
    const first = timeToMinutes(tt.firstDeparture);
    const last = timeToMinutes(tt.lastDeparture);
    if (t >= first && t <= last) return true;
  }
  return false;
}

/** Convert "HH:MM" to minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Convert minutes since midnight to "HH:MM". */
export function minutesToTime(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Add minutes to a "HH:MM" time, returning "HH:MM" (wraps past midnight). */
export function addMinutes(time: string, addMin: number): string {
  return minutesToTime(timeToMinutes(time) + addMin);
}

/** Difference in minutes between two "HH:MM" times (b - a, can be negative). */
export function timeDiffMin(a: string, b: string): number {
  return timeToMinutes(b) - timeToMinutes(a);
}
