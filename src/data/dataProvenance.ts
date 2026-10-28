import type { DataProvenance } from '@/types/metro';

// Provenance for the Hyderabad Metro graph data shown across the app.
//
// Station names, line assignments, and interchange relationships are verified
// against published HMRL / L&T Metro Rail references. The HMRL open-data portal
// (https://hmrl.co.in/open-data/) publishes a GTFS feed behind a request form;
// that feed was not directly downloadable in this environment, so the
// structured station list was compiled from the sources listed below.
//
// Per-segment distances and travel times are SIMULATED estimates for the
// academic DSA demonstration. They are clearly labelled as such in the UI and
// must never be presented as official HMRL data.

export const DATA_PROVENANCE: DataProvenance = {
  status: 'mixed',
  verified: [
    'Station names and spelling',
    'Line membership (which lines serve each station)',
    'Operational station order along each line',
    'Interchange relationships (Ameerpet, Parade Ground, MGBS)',
    'Line colours, terminal stations, and station counts',
  ],
  simulated: [
    'Inter-station distances (uniform estimate, not surveyed)',
    'Inter-station travel times (derived from estimated distance)',
    'Interchange transfer penalties (assumed 5 min)',
    'Walking-transfer connections and times (none modelled in Phase 1)',
  ],
  sources: [
    'HMRL Open Data Portal — https://hmrl.co.in/open-data/ (GTFS feed, request-form access)',
    'L&T Metro Rail — Trip Details & Train Timings pages (ltmetro.com)',
    'Wikipedia — "List of Hyderabad Metro stations" & per-line articles',
  ],
  notes:
    'Station names, line assignments, and interchange topology are verified against the published HMRL/L&T network. The HMRL GTFS feed is available via a request form at hmrl.co.in/open-data/ but could not be fetched programmatically in this environment, so distances and times are simulated estimates for the academic DSA demonstration and are clearly labelled as such. The graph explorer shows exactly the graph the routing engine will use.',
};
