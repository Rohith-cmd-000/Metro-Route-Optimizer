// Door-to-door journey planner.
//
// Takes a metro JourneyResult (from the Phase 4 routing engine) and wraps it
// with access walking, timetable-based waiting, interchange timing, and exit
// walking to produce a full ItineraryStep[] timeline.
//
// Time calculation:
//   - Total duration = access walk + waiting + metro ride + interchange walks + exit walk
//   - If timetable data is available (simulated), we compute the next departure
//     after the user arrives at the boarding station, including waiting time.
//   - If timetable data is unavailable, we label departure/arrival as simulated
//     estimates and use the user's departure time + travel time directly.
//   - We do NOT claim that average edge durations guarantee a real train
//     connection. The notes field explicitly states this.
//
// All times are deterministic — no randomness. Walking estimates come from
// walkingModel.ts. Timetable data comes from timetable.ts (simulated).

import { METRO_LINES, STATION_BY_ID } from '@/data/metroData';
import type {
  DoorToDoorItinerary,
  ItineraryStep,
  JourneyRequest,
  JourneyResult,
  RoutingOutcome,
} from '@/types/metro';
import { findRoutes } from '@/routing/router';
import {
  addMinutes,
  nextDeparture,
  timeDiffMin,
  withinOperatingHours,
} from '@/routing/timetable';
import {
  estimateWalkingFromAddress,
  walkingDistanceFromTime,
} from '@/routing/walkingModel';

/**
 * Plan a door-to-door journey. This wraps findRoutes() with access/exit
 * walking, timetable-based waiting, and a full timeline.
 */
export function planDoorToDoorJourney(
  request: JourneyRequest
): { outcome: RoutingOutcome; itineraries: DoorToDoorItinerary[] } {
  const outcome = findRoutes(request);

  if (outcome.status !== 'ok') {
    return { outcome, itineraries: [] };
  }

  const itineraries = outcome.results.map((route) =>
    buildItinerary(request, route)
  );

  return { outcome, itineraries };
}

/** Build a full door-to-door itinerary from a single metro route result. */
function buildItinerary(
  request: JourneyRequest,
  route: JourneyResult
): DoorToDoorItinerary {
  const steps: ItineraryStep[] = [];
  const notes: string[] = [];

  // --- Access walking ---
  let accessWalkMin = 0;
  let accessWalkKm = 0;
  if (request.startAddress?.trim()) {
    const walk = estimateWalkingFromAddress(request.startAddress, request.source);
    accessWalkMin = request.startWalkingMin ?? walk.timeMin;
    accessWalkKm = walkingDistanceFromTime(accessWalkMin);
  } else if (request.startWalkingMin && request.startWalkingMin > 0) {
    accessWalkMin = request.startWalkingMin;
    accessWalkKm = walkingDistanceFromTime(accessWalkMin);
  }

  // --- Exit walking ---
  let exitWalkMin = 0;
  let exitWalkKm = 0;
  if (request.endAddress?.trim()) {
    const walk = estimateWalkingFromAddress(request.endAddress, request.destination);
    exitWalkMin = request.endWalkingMin ?? walk.timeMin;
    exitWalkKm = walkingDistanceFromTime(exitWalkMin);
  } else if (request.endWalkingMin && request.endWalkingMin > 0) {
    exitWalkMin = request.endWalkingMin;
    exitWalkKm = walkingDistanceFromTime(exitWalkMin);
  }

  // --- Timeline computation ---
  const departureTime = request.departureTime;
  const sourceLine = route.legs.length > 0 ? route.legs[0].line : null;
  const outsideHours = !withinOperatingHours(departureTime);

  // 1. User leaves their start location.
  const leaveTime = departureTime;
  let currentTime = leaveTime;

  // 2. Access walk to the boarding station.
  if (accessWalkMin > 0) {
    const accessEnd = addMinutes(currentTime, accessWalkMin);
    steps.push({
      type: 'access_walk',
      startTime: currentTime,
      endTime: accessEnd,
      durationMin: accessWalkMin,
      description: `Walk to ${STATION_BY_ID[request.source]?.name ?? request.source} station`,
      stationId: request.source,
      line: null,
      walkingKm: accessWalkKm,
    });
    currentTime = accessEnd;
  }

  // 3. Wait for the next train (timetable-based or simulated).
  let waitingMin = 0;
  let boardTime = currentTime;
  let timetableSource: 'verified' | 'simulated' | 'unavailable' = 'simulated';

  if (sourceLine) {
    const dep = nextDeparture(sourceLine, request.source, currentTime);
    if (dep) {
      waitingMin = Math.max(0, timeDiffMin(currentTime, dep.time));
      boardTime = dep.time;

      if (waitingMin > 0) {
        steps.push({
          type: 'wait',
          startTime: currentTime,
          endTime: boardTime,
          durationMin: waitingMin,
          description: `Wait for ${METRO_LINES[sourceLine].name} train`,
          stationId: request.source,
          line: sourceLine,
          walkingKm: 0,
        });
      }
      currentTime = boardTime;
    } else {
      // Outside operating hours — no train available.
      timetableSource = 'unavailable';
      notes.push(
        `The requested departure (${departureTime}) is outside simulated operating hours ` +
        `(06:30–22:00). No train is available at this time.`
      );
    }
  }

  // 4. Ride legs with interchange walks.
  for (let i = 0; i < route.legs.length; i++) {
    const leg = route.legs[i];
    const boardStationName = STATION_BY_ID[leg.boardingStation]?.name ?? leg.boardingStation;
    const alightStationName = STATION_BY_ID[leg.alightingStation]?.name ?? leg.alightingStation;

    // Board step (only for the first leg; subsequent legs are interchanges).
    if (i === 0) {
      steps.push({
        type: 'board',
        startTime: boardTime,
        endTime: boardTime,
        durationMin: 0,
        description: `Board ${METRO_LINES[leg.line].name} at ${boardStationName}`,
        stationId: leg.boardingStation,
        line: leg.line,
        walkingKm: 0,
      });
    }

    // Ride step.
    const rideStart = currentTime;
    const rideEnd = addMinutes(rideStart, leg.timeMin);
    steps.push({
      type: 'ride',
      startTime: rideStart,
      endTime: rideEnd,
      durationMin: leg.timeMin,
      description: `Ride ${METRO_LINES[leg.line].name}: ${boardStationName} → ${alightStationName} (${leg.stationCount} stops)`,
      stationId: null,
      line: leg.line,
      walkingKm: 0,
    });
    currentTime = rideEnd;

    // Interchange to next leg (if there is one).
    if (i < route.legs.length - 1) {
      const nextLeg = route.legs[i + 1];
      // Interchange walking + waiting at the transfer station.
      const interchangeStart = currentTime;
      const interchangeEnd = addMinutes(interchangeStart, 5); // 5 min interchange penalty
      steps.push({
        type: 'interchange_walk',
        startTime: interchangeStart,
        endTime: interchangeEnd,
        durationMin: 5,
        description: `Transfer at ${alightStationName}: ${METRO_LINES[leg.line].name} → ${METRO_LINES[nextLeg.line].name}`,
        stationId: leg.alightingStation,
        line: nextLeg.line,
        walkingKm: 0,
      });
      currentTime = interchangeEnd;

      // Wait for the next line's train.
      const nextDep = nextDeparture(nextLeg.line, leg.alightingStation, currentTime);
      if (nextDep) {
        const transferWait = Math.max(0, timeDiffMin(currentTime, nextDep.time));
        if (transferWait > 0) {
          steps.push({
            type: 'wait',
            startTime: currentTime,
            endTime: nextDep.time,
            durationMin: transferWait,
            description: `Wait for ${METRO_LINES[nextLeg.line].name} train`,
            stationId: leg.alightingStation,
            line: nextLeg.line,
            walkingKm: 0,
          });
          currentTime = nextDep.time;
        }
      }

      // Board the next leg.
      steps.push({
        type: 'board',
        startTime: currentTime,
        endTime: currentTime,
        durationMin: 0,
        description: `Board ${METRO_LINES[nextLeg.line].name} at ${STATION_BY_ID[leg.alightingStation]?.name ?? leg.alightingStation}`,
        stationId: leg.alightingStation,
        line: nextLeg.line,
        walkingKm: 0,
      });
    }
  }

  // 5. Exit walk to final destination.
  if (exitWalkMin > 0) {
    const exitStart = currentTime;
    const exitEnd = addMinutes(exitStart, exitWalkMin);
    steps.push({
      type: 'exit_walk',
      startTime: exitStart,
      endTime: exitEnd,
      durationMin: exitWalkMin,
      description: `Walk to your destination${request.endAddress ? ` (${request.endAddress})` : ''}`,
      stationId: request.destination,
      line: null,
      walkingKm: exitWalkKm,
    });
    currentTime = exitEnd;
  }

  const arrivalTime = currentTime;
  const totalDurationMin = timeDiffMin(leaveTime, arrivalTime);
  const totalWalkingKm = accessWalkKm + exitWalkKm;

  // --- Cost ---
  const metroFareINR = route.metrics.fareINR;
  const firstMileCostINR = request.firstMileCostINR ?? null;
  const lastMileCostINR = request.lastMileCostINR ?? null;
  let totalCostINR = metroFareINR;
  if (totalCostINR !== null) {
    if (firstMileCostINR !== null) totalCostINR += firstMileCostINR;
    if (lastMileCostINR !== null) totalCostINR += lastMileCostINR;
  }

  // --- Notes ---
  notes.push(
    'Departure and arrival times are based on SIMULATED timetable estimates. ' +
    'Average edge durations do not guarantee a real train connection.'
  );
  if (timetableSource === 'simulated') {
    notes.push('Timetable: SIMULATED (HMRL GTFS data not publicly available).');
  }
  if (totalCostINR !== null && metroFareINR !== null) {
    if (firstMileCostINR || lastMileCostINR) {
      notes.push(
        `Total cost (Rs. ${totalCostINR}) = metro fare (Rs. ${metroFareINR})` +
        (firstMileCostINR ? ` + first-mile (Rs. ${firstMileCostINR})` : '') +
        (lastMileCostINR ? ` + last-mile (Rs. ${lastMileCostINR})` : '') +
        '. Metro fare is an estimate, not an official ticket price.'
      );
    } else {
      notes.push('Metro fare is an estimate based on distance slabs, not an official ticket price.');
    }
  }

  return {
    route,
    steps,
    leaveTime,
    boardTime,
    arrivalTime,
    totalDurationMin,
    totalWalkingKm,
    metroFareINR,
    firstMileCostINR,
    lastMileCostINR,
    totalCostINR,
    waitingMin,
    timetableSource,
    outsideOperatingHours: outsideHours,
    notes,
  };
}
