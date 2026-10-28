// Hyderabad Metro network data (Phase 2).
//
// Station names, line assignments, and interchange relationships are verified
// against published HMRL / L&T Metro Rail references (see dataProvenance.ts).
// Inter-station distances and travel times are simulated estimates, clearly
// labelled as such in the UI — they are NOT official HMRL timetable data.
//
// Data source: HMRL open-data page (https://hmrl.co.in/open-data/) publishes a
// GTFS feed behind a request form. The structured station list below was
// compiled from the operational Phase 1 network as documented by HMRL,
// Wikipedia's "List of Hyderabad Metro stations", and L&T Metro Rail's
// trip-details page. Station *names and line membership* are verified; per-
// segment *distances and times* are simulated.

import type { LineId, MetroLine, Station } from '@/types/metro';

export const METRO_LINES: Record<LineId, MetroLine> = {
  red: {
    id: 'red',
    name: 'Red Line',
    color: '#E53935',
    route: 'Miyapur ↔ LB Nagar',
    stationCount: 27,
    lengthKm: 29.21,
  },
  green: {
    id: 'green',
    name: 'Green Line',
    color: '#43A047',
    route: 'JBS Parade Ground ↔ MGBS',
    stationCount: 9,
    lengthKm: 11.0,
  },
  blue: {
    id: 'blue',
    name: 'Blue Line',
    color: '#1E88E5',
    route: 'Raidurg ↔ Nagole',
    stationCount: 23,
    lengthKm: 27.0,
  },
};

export const LINE_ORDER: LineId[] = ['red', 'blue', 'green'];

// ---------------------------------------------------------------------------
// Station ids per line, in operational order from one terminal to the other.
// Source: HMRL / L&T Metro Rail published station lists (verified names + order).
// ---------------------------------------------------------------------------

const RED_LINE_IDS = [
  'miyapur',
  'jntu_college',
  'kphb_colony',
  'kukatpally',
  'balanagar',
  'moosapet',
  'bharat_nagar',
  'erragadda',
  'esi_hospital',
  'sr_nagar',
  'ameerpet',
  'punjagutta',
  'erramanzil',
  'khairatabad',
  'lakdikapul',
  'assembly',
  'nampally',
  'gandhi_bhavan',
  'osmania_medical_college',
  'mgbs',
  'malakpet',
  'new_market',
  'musarambagh',
  'dilsukhnagar',
  'chaitanyapuri',
  'victoria_memorial',
  'lb_nagar',
];

const BLUE_LINE_IDS = [
  'raidurg',
  'hitec_city',
  'durgam_cheruvu',
  'madhapur',
  'peddamma_gudi',
  'jubilee_hills_check_post',
  'road_no_5_jubilee_hills',
  'yusufguda',
  'taruni_madhura_nagar',
  'ameerpet',
  'begumpet',
  'prakash_nagar',
  'rasoolpura',
  'paradise',
  'parade_ground',
  'secunderabad_east',
  'mettuguda',
  'tarnaka',
  'habsiguda',
  'ngri',
  'stadium',
  'uppal',
  'nagole',
];

const GREEN_LINE_IDS = [
  'jbs_parade_ground',
  'parade_ground',
  'secunderabad_west',
  'gandhi_hospital',
  'musheerabad',
  'rtc_x_roads',
  'chikkadpally',
  'narayanguda',
  'sultan_bazaar',
  'mgbs',
];

export const LINE_STATION_IDS: Record<LineId, string[]> = {
  red: RED_LINE_IDS,
  blue: BLUE_LINE_IDS,
  green: GREEN_LINE_IDS,
};

// Display names keyed by station id.
const STATION_NAMES: Record<string, string> = {
  // Red Line
  miyapur: 'Miyapur',
  jntu_college: 'JNTU College',
  kphb_colony: 'KPHB Colony',
  kukatpally: 'Kukatpally',
  balanagar: 'Balanagar',
  moosapet: 'Moosapet',
  bharat_nagar: 'Bharat Nagar',
  erragadda: 'Erragadda',
  esi_hospital: 'ESI Hospital',
  sr_nagar: 'SR Nagar',
  ameerpet: 'Ameerpet',
  punjagutta: 'Punjagutta',
  erramanzil: 'Irrum Manzil',
  khairatabad: 'Khairatabad',
  lakdikapul: 'Lakdikapul',
  assembly: 'Assembly',
  nampally: 'Nampally',
  gandhi_bhavan: 'Gandhi Bhavan',
  osmania_medical_college: 'Osmania Medical College',
  mgbs: 'MG Bus Station',
  malakpet: 'Malakpet',
  new_market: 'New Market',
  musarambagh: 'Musarambagh',
  dilsukhnagar: 'Dilsukhnagar',
  chaitanyapuri: 'Chaitanyapuri',
  victoria_memorial: 'Victoria Memorial',
  lb_nagar: 'LB Nagar',
  // Blue Line (unique stations)
  raidurg: 'Raidurg',
  hitec_city: 'HITEC City',
  durgam_cheruvu: 'Durgam Cheruvu',
  madhapur: 'Madhapur',
  peddamma_gudi: 'Peddamma Gudi',
  jubilee_hills_check_post: 'Jubilee Hills Check Post',
  road_no_5_jubilee_hills: 'Road No 5 Jubilee Hills',
  yusufguda: 'Yusufguda',
  taruni_madhura_nagar: 'Taruni Madhura Nagar',
  begumpet: 'Begumpet',
  prakash_nagar: 'Prakash Nagar',
  rasoolpura: 'Rasoolpura',
  paradise: 'Paradise',
  parade_ground: 'Parade Ground',
  secunderabad_east: 'Secunderabad East',
  mettuguda: 'Mettuguda',
  tarnaka: 'Tarnaka',
  habsiguda: 'Habsiguda',
  ngri: 'NGRI',
  stadium: 'Stadium',
  uppal: 'Uppal',
  nagole: 'Nagole',
  // Green Line (unique stations)
  jbs_parade_ground: 'JBS Parade Ground',
  secunderabad_west: 'Secunderabad West',
  gandhi_hospital: 'Gandhi Hospital',
  musheerabad: 'Musheerabad',
  rtc_x_roads: 'RTC X Roads',
  chikkadpally: 'Chikkadpally',
  narayanguda: 'Narayanguda',
  sultan_bazaar: 'Sultan Bazaar',
};

// Build the deduplicated station list with line membership.
function buildStations(): Station[] {
  const lineMap = new Map<string, LineId[]>();
  for (const line of LINE_ORDER) {
    for (const id of LINE_STATION_IDS[line]) {
      const arr = lineMap.get(id) ?? [];
      if (!arr.includes(line)) arr.push(line);
      lineMap.set(id, arr);
    }
  }
  return Array.from(lineMap.entries())
    .map(([id, lines]) => ({
      id,
      name: STATION_NAMES[id] ?? id,
      lines,
      isInterchange: lines.length > 1,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const STATIONS: Station[] = buildStations();

export const STATION_BY_ID: Record<string, Station> = Object.fromEntries(
  STATIONS.map((s) => [s.id, s])
);

export const INTERCHANGE_STATIONS = STATIONS.filter((s) => s.isInterchange);

export const SAMPLE_JOURNEY = {
  source: 'miyapur',
  destination: 'hitec_city',
  departureTime: '09:00',
  preference: 'fastest' as const,
};
