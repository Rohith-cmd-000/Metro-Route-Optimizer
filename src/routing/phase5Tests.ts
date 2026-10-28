// Phase 5 acceptance tests for door-to-door journey planning.
//
// Each test returns { name, passed, detail }. Tests are pure functions that
// call planDoorToDoorJourney() and verify the itinerary properties.
//
// Required tests:
//   1. Journey within operating hours
//   2. Journey outside available scheduled service
//   3. A journey with a transfer
//   4. A journey with no timetable data
//   5. A journey with access and exit walking
//   6. Consistency between the leg durations and the total duration

import { planDoorToDoorJourney } from '@/routing/journeyPlanner';
import { timeDiffMin, timeToMinutes } from '@/routing/timetable';
import type { JourneyRequest } from '@/types/metro';

export interface Phase5TestResult {
  name: string;
  passed: boolean;
  detail: string;
}

function makeRequest(overrides: Partial<JourneyRequest>): JourneyRequest {
  return {
    source: 'miyapur',
    destination: 'hitec_city',
    departureTime: '09:00',
    preference: 'fastest',
    ...overrides,
  };
}

// 1. Journey within operating hours — departure should be within 06:30–22:00,
//    timetable source should be 'simulated', and a board time should exist.
function testWithinOperatingHours(): Phase5TestResult {
  const req = makeRequest({ departureTime: '09:00' });
  const { outcome, itineraries } = planDoorToDoorJourney(req);

  if (outcome.status !== 'ok' || itineraries.length === 0) {
    return { name: 'Journey within operating hours', passed: false, detail: 'No route returned.' };
  }
  const itin = itineraries[0];
  if (itin.outsideOperatingHours) {
    return { name: 'Journey within operating hours', passed: false, detail: 'Flagged as outside hours but 09:00 is within 06:30–22:00.' };
  }
  if (itin.timetableSource !== 'simulated') {
    return { name: 'Journey within operating hours', passed: false, detail: `Expected 'simulated' source, got '${itin.timetableSource}'.` };
  }
  if (!itin.boardTime || !itin.arrivalTime) {
    return { name: 'Journey within operating hours', passed: false, detail: 'Missing board or arrival time.' };
  }
  const arriveMin = timeToMinutes(itin.arrivalTime);
  const leaveMin = timeToMinutes(itin.leaveTime);
  if (arriveMin <= leaveMin) {
    return { name: 'Journey within operating hours', passed: false, detail: 'Arrival should be after departure.' };
  }
  return {
    name: 'Journey within operating hours',
    passed: true,
    detail: `Departure 09:00 is within hours. Leave ${itin.leaveTime}, board ${itin.boardTime}, arrive ${itin.arrivalTime}. Timetable: ${itin.timetableSource}.`,
  };
}

// 2. Journey outside available scheduled service — departure after 22:00 should
//    be flagged as outside operating hours with timetableSource 'unavailable'.
function testOutsideOperatingHours(): Phase5TestResult {
  const req = makeRequest({ departureTime: '23:30' });
  const { outcome, itineraries } = planDoorToDoorJourney(req);

  if (outcome.status !== 'ok' || itineraries.length === 0) {
    return { name: 'Journey outside operating hours', passed: false, detail: 'No route returned.' };
  }
  const itin = itineraries[0];
  if (!itin.outsideOperatingHours) {
    return { name: 'Journey outside operating hours', passed: false, detail: '23:30 should be flagged as outside operating hours.' };
  }
  if (itin.timetableSource !== 'unavailable') {
    return { name: 'Journey outside operating hours', passed: false, detail: `Expected 'unavailable' source, got '${itin.timetableSource}'.` };
  }
  const hasOutsideNote = itin.notes.some((n) => n.includes('outside'));
  if (!hasOutsideNote) {
    return { name: 'Journey outside operating hours', passed: false, detail: 'No note about being outside operating hours.' };
  }
  return {
    name: 'Journey outside operating hours',
    passed: true,
    detail: `23:30 correctly flagged as outside hours. Timetable: ${itin.timetableSource}. Note present.`,
  };
}

// 3. A journey with a transfer — Miyapur (Red) to Nagole (Blue) requires a
//    transfer at Ameerpet. The itinerary should have interchange_walk steps.
function testJourneyWithTransfer(): Phase5TestResult {
  const req = makeRequest({
    source: 'miyapur',
    destination: 'nagole',
    departureTime: '10:00',
  });
  const { outcome, itineraries } = planDoorToDoorJourney(req);

  if (outcome.status !== 'ok' || itineraries.length === 0) {
    return { name: 'Journey with a transfer', passed: false, detail: 'No route returned.' };
  }
  const itin = itineraries[0];
  const interchangeSteps = itin.steps.filter((s) => s.type === 'interchange_walk');
  if (interchangeSteps.length === 0) {
    return { name: 'Journey with a transfer', passed: false, detail: 'No interchange_walk steps found for a cross-line journey.' };
  }
  if (itin.route.legs.length < 2) {
    return { name: 'Journey with a transfer', passed: false, detail: `Expected >= 2 legs, got ${itin.route.legs.length}.` };
  }
  const hasTransferDescription = interchangeSteps.some((s) => s.description.includes('Transfer'));
  if (!hasTransferDescription) {
    return { name: 'Journey with a transfer', passed: false, detail: 'Interchange step missing transfer description.' };
  }
  return {
    name: 'Journey with a transfer',
    passed: true,
    detail: `${interchangeSteps.length} interchange step(s), ${itin.route.legs.length} legs. Transfer at Ameerpet.`,
  };
}

// 4. A journey with no timetable data — we simulate this by requesting a
//    departure outside operating hours (timetableSource = 'unavailable').
//    The itinerary should still produce a route with a note about no timetable.
function testNoTimetableData(): Phase5TestResult {
  const req = makeRequest({ departureTime: '23:45' });
  const { outcome, itineraries } = planDoorToDoorJourney(req);

  if (outcome.status !== 'ok' || itineraries.length === 0) {
    return { name: 'Journey with no timetable data', passed: false, detail: 'No route returned.' };
  }
  const itin = itineraries[0];
  if (itin.timetableSource !== 'unavailable') {
    return { name: 'Journey with no timetable data', passed: false, detail: `Expected 'unavailable', got '${itin.timetableSource}'.` };
  }
  // Should still have ride steps — the metro route exists, just no schedule.
  const rideSteps = itin.steps.filter((s) => s.type === 'ride');
  if (rideSteps.length === 0) {
    return { name: 'Journey with no timetable data', passed: false, detail: 'No ride steps in itinerary.' };
  }
  // Notes should mention the simulated/unavailable nature.
  const hasNote = itin.notes.some((n) => n.includes('SIMULATED') || n.includes('outside'));
  if (!hasNote) {
    return { name: 'Journey with no timetable data', passed: false, detail: 'No note about timetable unavailability.' };
  }
  return {
    name: 'Journey with no timetable data',
    passed: true,
    detail: `Timetable unavailable, ${rideSteps.length} ride step(s) still present. Notes warn about unavailability.`,
  };
}

// 5. A journey with access and exit walking — provide start/end addresses and
//    walking times. The itinerary should have access_walk and exit_walk steps.
function testAccessAndExitWalking(): Phase5TestResult {
  const req = makeRequest({
    startAddress: 'KPHB Colony Phase 1',
    endAddress: 'HITEC City Gate 2',
    startWalkingMin: 10,
    endWalkingMin: 8,
  });
  const { outcome, itineraries } = planDoorToDoorJourney(req);

  if (outcome.status !== 'ok' || itineraries.length === 0) {
    return { name: 'Journey with access and exit walking', passed: false, detail: 'No route returned.' };
  }
  const itin = itineraries[0];
  const accessSteps = itin.steps.filter((s) => s.type === 'access_walk');
  const exitSteps = itin.steps.filter((s) => s.type === 'exit_walk');

  if (accessSteps.length === 0) {
    return { name: 'Journey with access and exit walking', passed: false, detail: 'No access_walk step found.' };
  }
  if (exitSteps.length === 0) {
    return { name: 'Journey with access and exit walking', passed: false, detail: 'No exit_walk step found.' };
  }
  if (accessSteps[0].durationMin !== 10) {
    return { name: 'Journey with access and exit walking', passed: false, detail: `Access walk duration ${accessSteps[0].durationMin}, expected 10.` };
  }
  if (exitSteps[0].durationMin !== 8) {
    return { name: 'Journey with access and exit walking', passed: false, detail: `Exit walk duration ${exitSteps[0].durationMin}, expected 8.` };
  }
  if (itin.totalWalkingKm <= 0) {
    return { name: 'Journey with access and exit walking', passed: false, detail: 'Total walking km should be > 0.' };
  }
  // Leave time should be the departure time, arrival should be after.
  const totalMin = timeDiffMin(itin.leaveTime, itin.arrivalTime);
  if (totalMin <= 0) {
    return { name: 'Journey with access and exit walking', passed: false, detail: 'Arrival should be after leave time.' };
  }
  return {
    name: 'Journey with access and exit walking',
    passed: true,
    detail: `Access: ${accessSteps[0].durationMin} min, exit: ${exitSteps[0].durationMin} min, total walking ${itin.totalWalkingKm} km, total duration ${totalMin} min.`,
  };
}

// 6. Consistency between leg durations and total duration — the sum of all
//    step durations should equal totalDurationMin.
function testDurationConsistency(): Phase5TestResult {
  const req = makeRequest({
    startAddress: 'Test Start',
    endAddress: 'Test End',
    startWalkingMin: 7,
    endWalkingMin: 5,
    departureTime: '14:00',
  });
  const { outcome, itineraries } = planDoorToDoorJourney(req);

  if (outcome.status !== 'ok' || itineraries.length === 0) {
    return { name: 'Duration consistency', passed: false, detail: 'No route returned.' };
  }
  const itin = itineraries[0];
  const stepSum = itin.steps.reduce((sum, s) => sum + s.durationMin, 0);
  const totalFromTimes = timeDiffMin(itin.leaveTime, itin.arrivalTime);

  const EPSILON = 0.5;
  if (Math.abs(stepSum - totalFromTimes) > EPSILON) {
    return {
      name: 'Duration consistency',
      passed: false,
      detail: `Step durations sum to ${stepSum} min but leave→arrival span is ${totalFromTimes} min.`,
    };
  }
  if (Math.abs(stepSum - itin.totalDurationMin) > EPSILON) {
    return {
      name: 'Duration consistency',
      passed: false,
      detail: `Step durations sum to ${stepSum} min but totalDurationMin is ${itin.totalDurationMin}.`,
    };
  }
  return {
    name: 'Duration consistency',
    passed: true,
    detail: `Step sum (${stepSum}) ≈ leave→arrival span (${totalFromTimes}) ≈ totalDurationMin (${itin.totalDurationMin}).`,
  };
}

// --- Runner ------------------------------------------------------------------

export function runPhase5Tests(): Phase5TestResult[] {
  return [
    testWithinOperatingHours(),
    testOutsideOperatingHours(),
    testJourneyWithTransfer(),
    testNoTimetableData(),
    testAccessAndExitWalking(),
    testDurationConsistency(),
  ];
}
