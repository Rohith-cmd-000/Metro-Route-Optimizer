// PDF 2: Total Detailed Overview of the Model + Worked Example
// Uses jsPDF to create a multi-page PDF with images, diagrams, tables, and styled text.

import { jsPDF } from 'jspdf';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - 2 * MARGIN;

const C = {
  navy: [17, 40, 68],
  blue: [30, 88, 162],
  red: [229, 57, 53],
  green: [67, 160, 71],
  gold: [199, 168, 79],
  gray: [107, 114, 128],
  lightGray: [240, 242, 245],
  midGray: [200, 205, 212],
  darkGray: [55, 65, 81],
  white: [255, 255, 255],
  purple: [120, 80, 160],
  teal: [0, 121, 107],
};

const LINE_COLORS = {
  red: [229, 57, 53],
  blue: [30, 88, 162],
  green: [67, 160, 71],
};

const LINE_NAMES = { red: 'Red Line', blue: 'Blue Line', green: 'Green Line' };

const PHOTOS = {
  metro: 'https://images.pexels.com/photos/12384054/pexels-photo-12384054.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  commuter: 'https://images.pexels.com/photos/37678059/pexels-photo-37678059.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  smartphone: 'https://images.pexels.com/photos/8824105/pexels-photo-8824105.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  bengaluru: 'https://images.pexels.com/photos/29773997/pexels-photo-29773997.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  delhi: 'https://images.pexels.com/photos/31743457/pexels-photo-31743457.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

const doc = new jsPDF({ unit: 'mm', format: 'a4' });
let y = 0;

// --- Helpers (same as PDF 1) ---
function newPage() { doc.addPage(); y = MARGIN; }
function ensureSpace(n) { if (y + n > PAGE_H - MARGIN - 10) newPage(); }
function setFill(rgb) { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }
function setText(rgb) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }
function setDraw(rgb) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }
function setStroke(w) { doc.setLineWidth(w); }

function rect2(x2, y2, w, h, rgb, r = 0) {
  setFill(rgb);
  if (r > 0) doc.roundedRect(x2, y2, w, h, r, r, 'F');
  else doc.rect(x2, y2, w, h, 'F');
}

function text2(str, x2, y2, opts = {}) {
  setText(opts.color ?? C.darkGray);
  doc.setFontSize(opts.size ?? 11);
  doc.setFont(opts.font ?? 'helvetica', opts.style ?? 'normal');
  doc.text(str, x2, y2, { align: opts.align ?? 'left', maxWidth: opts.maxWidth ?? CONTENT_W });
}

function sectionHeader(num, title) {
  ensureSpace(20);
  const barY = y;
  setFill(C.navy);
  doc.roundedRect(MARGIN, barY, CONTENT_W, 14, 3, 3, 'F');
  setFill(C.gold);
  doc.circle(MARGIN + 8, barY + 7, 4.5, 'F');
  setText(C.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(String(num), MARGIN + 8, barY + 9, { align: 'center' });
  doc.setFontSize(13);
  doc.text(title, MARGIN + 16, barY + 10);
  y = barY + 20;
}

function subHeader(title) {
  ensureSpace(14);
  setText(C.blue);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN, y);
  y += 7;
}

function bodyText(str, opts = {}) {
  setText(opts.color ?? C.darkGray);
  doc.setFontSize(opts.size ?? 10.5);
  doc.setFont('helvetica', opts.style ?? 'normal');
  const lines = doc.splitTextToSize(str, opts.maxWidth ?? CONTENT_W);
  for (const line of lines) {
    ensureSpace(5.5);
    doc.text(line, MARGIN, y);
    y += 5.5;
  }
  y += opts.gap ?? 2;
}

function bullet(str, opts = {}) {
  ensureSpace(7);
  const indent = opts.indent ?? 6;
  setFill(C.gold);
  doc.circle(MARGIN + indent - 1.5, y - 1.2, 1.2, 'F');
  setText(opts.color ?? C.darkGray);
  doc.setFontSize(opts.size ?? 10.5);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(str, CONTENT_W - indent - 2);
  for (let i = 0; i < lines.length; i++) {
    ensureSpace(5.5);
    doc.text(lines[i], MARGIN + indent + 2, y);
    if (i < lines.length - 1) y += 5.5;
  }
  y += 6;
}

function card(x2, y2, w, h, bgColor, shadowColor) {
  setFill(shadowColor);
  doc.roundedRect(x2 + 1, y2 + 1.5, w, h, 3, 3, 'F');
  setFill(bgColor);
  doc.roundedRect(x2, y2, w, h, 3, 3, 'F');
}

function addImg(url, x2, y2, w, h) {
  try { doc.addImage(url, 'JPEG', x2, y2, w, h, undefined, 'FAST'); return true; }
  catch { return false; }
}

function addFooters() {
  const total = doc.getNumberOfPages();
  for (let p = 2; p <= total; p++) {
    doc.setPage(p);
    setFill(C.navy);
    doc.rect(0, PAGE_H - 12, PAGE_W, 12, 'F');
    setText(C.midGray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Hyderabad Metro Route Optimizer — Detailed Model Overview', MARGIN, PAGE_H - 5);
    doc.text(`Page ${p}`, PAGE_W - MARGIN, PAGE_H - 5, { align: 'right' });
  }
}

// --- Metro network schematic diagram (drawn with shapes) ---
function drawSchematicMap(x2, y2, w, h) {
  // Background
  setFill(C.lightGray);
  doc.roundedRect(x2, y2, w, h, 4, 4, 'F');

  const padX = 12;
  const padY = 10;
  const innerW = w - 2 * padX;
  const innerH = h - 2 * padY;

  // Red Line: horizontal across top
  const redY = y2 + padY + 8;
  setDraw(LINE_COLORS.red);
  setStroke(2.5);
  doc.line(x2 + padX, redY, x2 + padX + innerW * 0.55, redY);
  // Red stations
  const redStations = ['Miyapur', 'KPHB', 'Kukatpally', 'Ameerpet', 'MG Bus', 'Dilsukhnagar', 'LB Nagar'];
  redStations.forEach((name, i) => {
    const sx = x2 + padX + (innerW * 0.55 / (redStations.length - 1)) * i;
    setFill(LINE_COLORS.red);
    doc.circle(sx, redY, 2, 'F');
    setText(C.darkGray);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.text(name, sx, redY - 3, { align: 'center' });
  });

  // Blue Line: horizontal across, lower
  const blueY = y2 + padY + innerH * 0.5;
  setDraw(LINE_COLORS.blue);
  setStroke(2.5);
  doc.line(x2 + padX + innerW * 0.15, blueY, x2 + padX + innerW * 0.95, blueY);
  const blueStations = ['Raidurg', 'HITEC City', 'Ameerpet', 'Begumpet', 'Paradise', 'Uppal', 'Nagole'];
  blueStations.forEach((name, i) => {
    const sx = x2 + padX + innerW * 0.15 + (innerW * 0.8 / (blueStations.length - 1)) * i;
    setFill(LINE_COLORS.blue);
    doc.circle(sx, blueY, 2, 'F');
    setText(C.darkGray);
    doc.setFontSize(5);
    doc.text(name, sx, blueY + 6, { align: 'center' });
  });

  // Green Line: vertical from Parade Ground to MGBS
  const greenX = x2 + padX + innerW * 0.52;
  const greenTop = y2 + padY + innerH * 0.65;
  const greenBottom = y2 + padY + innerH * 0.95;
  setDraw(LINE_COLORS.green);
  setStroke(2.5);
  doc.line(greenX, greenTop, greenX, greenBottom);
  const greenStations = ['Parade Ground', 'RTC X Roads', 'Sultan Bazaar', 'MG Bus'];
  greenStations.forEach((name, i) => {
    const sy = greenTop + (greenBottom - greenTop) / (greenStations.length - 1) * i;
    setFill(LINE_COLORS.green);
    doc.circle(greenX, sy, 2, 'F');
    setText(C.darkGray);
    doc.setFontSize(5);
    doc.text(name, greenX + 5, sy + 1.5);
  });

  // Ameerpet interchange (Red meets Blue)
  setFill(C.gold);
  doc.circle(x2 + padX + innerW * 0.35, redY, 3, 'F');
  doc.circle(x2 + padX + innerW * 0.35, blueY, 3, 'F');
  setDraw(C.gold);
  setStroke(1.5);
  doc.setLineDashPattern([2, 1.5], 0);
  doc.line(x2 + padX + innerW * 0.35, redY, x2 + padX + innerW * 0.35, blueY);
  doc.setLineDashPattern([], 0);

  // MGBS interchange (Red meets Green)
  const mgbsX = x2 + padX + innerW * 0.45;
  setFill(C.gold);
  doc.circle(mgbsX, redY, 3, 'F');
  doc.circle(greenX, greenBottom, 3, 'F');
  setDraw(C.gold);
  setStroke(1.5);
  doc.setLineDashPattern([2, 1.5], 0);
  // Connect MGBS label
  doc.setLineDashPattern([], 0);

  // Legend
  setFill(LINE_COLORS.red);
  doc.rect(x2 + w - 45, y2 + 4, 4, 1.5, 'F');
  setText(C.darkGray);
  doc.setFontSize(6);
  doc.text('Red Line', x2 + w - 39, y2 + 5.5);
  setFill(LINE_COLORS.blue);
  doc.rect(x2 + w - 45, y2 + 7, 4, 1.5, 'F');
  doc.text('Blue Line', x2 + w - 39, y2 + 8.5);
  setFill(LINE_COLORS.green);
  doc.rect(x2 + w - 45, y2 + 10, 4, 1.5, 'F');
  doc.text('Green Line', x2 + w - 39, y2 + 11.5);
  setFill(C.gold);
  doc.circle(x2 + w - 43, y2 + 14, 1.2, 'F');
  doc.text('Interchange', x2 + w - 39, y2 + 14.5);
}

// =============================================================================
// COVER PAGE
// =============================================================================
function coverPage() {
  setFill(C.navy);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  setFill(C.gold);
  doc.rect(0, 0, PAGE_W, 4, 'F');

  const dots = [C.red, C.blue, C.green];
  dots.forEach((c, i) => {
    setFill(c);
    doc.circle(PAGE_W / 2 - 12 + i * 12, 30, 3.5, 'F');
  });

  setText(C.white);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Detailed Overview', PAGE_W / 2, 58, { align: 'center' });
  doc.text('of the Model', PAGE_W / 2, 73, { align: 'center' });

  setText(C.gold);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Hyderabad Metro Route Optimizer', PAGE_W / 2, 87, { align: 'center' });
  doc.setFontSize(10);
  doc.text('How It Works \u2022 Each Component Explained \u2022 Worked Example', PAGE_W / 2, 96, { align: 'center' });

  addImg(PHOTOS.delhi, MARGIN + 20, 110, CONTENT_W - 40, 60);

  setText(C.midGray);
  doc.setFontSize(10);
  doc.text('Team Members', PAGE_W / 2, 188, { align: 'center' });
  setText(C.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Vanisha  \u2022  Rachna  \u2022  Akriti  \u2022  Rohith Sai Gowd', PAGE_W / 2, 198, { align: 'center' });

  card(MARGIN + 25, 210, CONTENT_W - 50, 40, [25, 50, 80], [10, 25, 45]);
  setText(C.white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const info = [
    'Graph Data Model  \u2022  Dijkstra & Yen\u2019s Algorithm',
    'Six Route Objectives  \u2022  Fare & Timetable Models',
    'Door-to-Door Itinerary  \u2022  Worked Example: Miyapur \u2192 Nagole',
  ];
  info.forEach((line, i) => {
    doc.text(line, PAGE_W / 2, 220 + i * 9, { align: 'center' });
  });

  setFill(C.navy);
  doc.rect(0, PAGE_H - 12, PAGE_W, 12, 'F');
  setText(C.midGray);
  doc.setFontSize(8);
  doc.text('Page 1', PAGE_W - MARGIN, PAGE_H - 5, { align: 'right' });
}

// =============================================================================
// PAGE 2: WHAT IS THE MODEL
// =============================================================================
function whatIsPage() {
  newPage();
  sectionHeader(1, 'What Is the Model?');

  bodyText(
    'The Hyderabad Metro Route Optimizer is a graph-based journey planning system that models the ' +
    'entire Hyderabad Metro network as a weighted graph and uses classical shortest-path algorithms ' +
    'to find optimal routes between any two stations. The model has six components that work together ' +
    'to produce a complete door-to-door journey plan.'
  );

  subHeader('The Six Components');

  const components = [
    { num: '1', name: 'Graph Data Model', desc: 'Builds a weighted graph from station and line data with vertices, edges, and interchange connections.' },
    { num: '2', name: 'Routing Engine', desc: 'Dijkstra\u2019s algorithm and Yen\u2019s K-shortest paths find optimal routes under six different objectives.' },
    { num: '3', name: 'Fare Model', desc: 'Estimates metro fares using HMRL\u2019s published distance-based slab structure (Rs. 10\u201360).' },
    { num: '4', name: 'Timetable Model', desc: 'Simulated departure times with realistic operating hours (06:30\u201322:00) and headways (5\u20138 min).' },
    { num: '5', name: 'Walking Model', desc: 'Estimates first/last-mile walking times at 5 km/h for door-to-door itinerary planning.' },
    { num: '6', name: 'Journey Planner', desc: 'Combines all components into a complete timeline: walk \u2192 wait \u2192 ride \u2192 transfer \u2192 walk.' },
  ];

  components.forEach(comp => {
    ensureSpace(14);
    setFill(C.navy);
    doc.circle(MARGIN + 5, y + 3, 4, 'F');
    setText(C.white);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(comp.num, MARGIN + 5, y + 5, { align: 'center' });
    setText(C.navy);
    doc.setFontSize(11);
    doc.text(comp.name, MARGIN + 12, y + 4);
    setText(C.gray);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(comp.desc, CONTENT_W - 18);
    doc.text(descLines[0], MARGIN + 12, y + 9);
    if (descLines.length > 1) {
      ensureSpace(5);
      doc.text(descLines.slice(1).join(' '), MARGIN + 12, y + 13.5);
    }
    y += 14;
  });

  y += 4;
  addImg(PHOTOS.metro, MARGIN, y, CONTENT_W, 50);
  y += 58;
}

// =============================================================================
// PAGE 3: NETWORK OVERVIEW + SCHEMATIC MAP
// =============================================================================
function networkPage() {
  newPage();
  sectionHeader(2, 'Network Overview & Schematic Map');

  bodyText(
    'The Hyderabad Metro operates 3 lines with 56 unique stations across 67.21 km of track. ' +
    'Three stations serve as interchanges where riders can transfer between lines without exiting ' +
    'the paid area.'
  );

  // Line summary cards
  const lines = [
    { name: 'Red Line', route: 'Miyapur \u2194 LB Nagar', stations: 27, km: 29.21, color: C.red },
    { name: 'Blue Line', route: 'Raidurg \u2194 Nagole', stations: 23, km: 27.0, color: C.blue },
    { name: 'Green Line', route: 'JBS Parade Ground \u2194 MGBS', stations: 9, km: 11.0, color: C.green },
  ];

  const cardW = (CONTENT_W - 12) / 3;
  lines.forEach((l, i) => {
    const cx = MARGIN + i * (cardW + 6);
    card(cx, y, cardW, 22, C.lightGray, C.midGray);
    setFill(l.color);
    doc.roundedRect(cx, y, cardW, 5, 2.5, 2.5, 'F');
    setText(C.navy);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(l.name, cx + 4, y + 10);
    setText(C.gray);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(l.route, cx + 4, y + 14);
    setText(l.color);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${l.stations} stations  \u2022  ${l.km} km`, cx + 4, y + 19);
  });
  y += 28;

  // Interchange info
  subHeader('Interchange Stations');
  bullet('Ameerpet: Red Line \u2194 Blue Line (the busiest interchange, connecting east-west and north-south corridors)');
  bullet('Parade Ground: Blue Line \u2194 Green Line (connects Secunderabad area to Old City)');
  bullet('MG Bus Station (MGBS): Red Line \u2194 Green Line (major transit hub in central Hyderabad)');

  y += 4;
  subHeader('Schematic Network Map');
  drawSchematicMap(MARGIN, y, CONTENT_W, 70);
  y += 76;
}

// =============================================================================
// PAGE 4: GRAPH DATA MODEL
// =============================================================================
function graphPage() {
  newPage();
  sectionHeader(3, 'Component 1: Graph Data Model');

  bodyText(
    'The foundation of the model is a weighted graph that represents the metro network. Each station ' +
    'on a line becomes a vertex, and connections between stations become weighted edges.'
  );

  subHeader('Vertices (59 total)');
  bodyText(
    'Each vertex is a (station, line) pair. A station served by N lines produces N vertices. ' +
    'For example, Ameerpet is served by both Red and Blue lines, so it has two vertices: ' +
    '"ameerpet:red" and "ameerpet:blue". Vertex IDs use the format stationId:lineId.'
  );

  subHeader('Edges (116 total)');
  const edgeTypes = [
    { type: 'Adjacent', count: '110', desc: 'Connect consecutive stations on the same line. Weight: 1.1 km, 2.4 min. Bidirectional.' },
    { type: 'Interchange', count: '6', desc: 'Connect same-station vertices across different lines. Weight: 0 km, 5 min (transfer penalty). Bidirectional.' },
    { type: 'Walking', count: '0', desc: 'Reserved for future out-of-station transfers (e.g., 300m walk between nearby stations). Not used in current network.' },
  ];

  edgeTypes.forEach(e => {
    ensureSpace(16);
    card(MARGIN, y, CONTENT_W, 14, C.lightGray, C.midGray);
    setFill(C.blue);
    doc.roundedRect(MARGIN, y, 3, 14, 1.5, 1.5, 'F');
    setText(C.navy);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(e.type, MARGIN + 6, y + 6);
    setText(C.gold);
    doc.setFontSize(9);
    doc.text(`${e.count} edges`, MARGIN + 40, y + 6);
    setText(C.gray);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const descLines = doc.splitTextToSize(e.desc, CONTENT_W - 55);
    doc.text(descLines[0], MARGIN + 6, y + 11);
    y += 16;
  });

  y += 2;
  subHeader('Adjacency List');
  bodyText(
    'The graph is stored as an adjacency list: a map from each vertex ID to its list of neighbour ' +
    'entries. Each entry contains the target vertex and the edge (type, line, distance, time). ' +
    'This structure enables efficient traversal by Dijkstra\u2019s algorithm in O((V + E) log V) time.'
  );

  // Code-style example
  ensureSpace(20);
  setFill([30, 35, 45]);
  doc.roundedRect(MARGIN, y, CONTENT_W, 16, 2, 2, 'F');
  setText([180, 200, 220]);
  doc.setFontSize(7.5);
  doc.setFont('courier', 'normal');
  const codeLines = [
    'ameerpet:red \u2192 [sr_nagar:red (1.1km, 2.4min), punjagutta:red (1.1km, 2.4min),',
    '                  ameerpet:blue (0km, 5min, interchange)]',
    'ameerpet:blue \u2192 [taruni_madhura_nagar:blue (1.1km, 2.4min), begumpet:blue (...),',
    '                    ameerpet:red (0km, 5min, interchange)]',
  ];
  codeLines.forEach((line, i) => {
    doc.text(line, MARGIN + 4, y + 5 + i * 3.5);
  });
  y += 20;
}

// =============================================================================
// PAGE 5: DIJKSTRA'S ALGORITHM
// =============================================================================
function dijkstraPage() {
  newPage();
  sectionHeader(4, 'Component 2: Routing Engine \u2014 Dijkstra\u2019s Algorithm');

  bodyText(
    'Dijkstra\u2019s algorithm finds the shortest path from a source vertex to all other vertices ' +
    'in a weighted graph. The model uses it with two weight modes: time (minimise travel time) ' +
    'and distance (minimise track kilometres).'
  );

  subHeader('Data Structures Used');
  const ds = [
    ['Adjacency List', 'Stores the graph; each vertex maps to its neighbours with edge weights.'],
    ['Min-Priority Queue', 'Binary heap that always returns the vertex with the smallest known distance.'],
    ['Distance Array', 'Map<vertexId, number> tracking the shortest known distance to each vertex.'],
    ['Predecessor Array', 'Map<vertexId, string|null> tracking the previous vertex on the shortest path.'],
    ['Settled Set', 'Set<vertexId> of vertices whose shortest distance is finalised.'],
  ];

  ds.forEach(([name, desc]) => {
    bullet(name, { size: 10, color: C.blue });
    bodyText(desc, { size: 9.5, gap: 2, color: C.gray });
  });

  y += 4;
  subHeader('Algorithm Steps');
  const steps = [
    'Initialise: Set source distance = 0, all others = \u221E. Insert source into priority queue.',
    'Extract minimum: Remove the vertex U with the smallest distance from the queue.',
    'Settle U: Mark U as settled (its shortest distance is now final).',
    'Relax neighbours: For each unvisited neighbour V of U, if dist[U] + weight(U,V) < dist[V], update dist[V] and set prev[V] = U. Insert V into the queue.',
    'Repeat steps 2\u20134 until the queue is empty.',
    'Reconstruct path: Walk backwards from destination to source using the predecessor array, then reverse.',
  ];

  steps.forEach((s, i) => {
    ensureSpace(10);
    setFill(C.gold);
    doc.circle(MARGIN + 4, y + 2, 2.5, 'F');
    setText(C.white);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(String(i + 1), MARGIN + 4, y + 3.5, { align: 'center' });
    setText(C.darkGray);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const lines = doc.splitTextToSize(s, CONTENT_W - 12);
    doc.text(lines, MARGIN + 9, y + 3.5);
    y += Math.max(6, lines.length * 5) + 2;
  });

  y += 2;
  subHeader('Complexity');
  bullet('Time: O((V + E) log V) with a binary heap priority queue', { size: 10 });
  bullet('Space: O(V + E) for the adjacency list and auxiliary arrays', { size: 10 });
  bullet('With 59 vertices and 116 edges, routes compute in milliseconds', { size: 10, color: C.blue });
}

// =============================================================================
// PAGE 6: YEN'S ALGORITHM + SIX OBJECTIVES
// =============================================================================
function objectivesPage() {
  newPage();
  sectionHeader(5, 'Yen\u2019s K-Shortest Paths & Six Route Objectives');

  subHeader('Yen\u2019s Algorithm');
  bodyText(
    'While Dijkstra finds the single shortest path, Yen\u2019s algorithm finds the K shortest ' +
    'loopless paths between two vertices. It works by running Dijkstra for the first path, then ' +
    'iteratively "spurring" from each node on the previous best path, temporarily removing edges ' +
    'to force alternative routes. The model uses K=5 candidates for the cheapest and balanced objectives.'
  );

  y += 4;
  subHeader('Six Route Objectives');

  const objectives = [
    { name: 'Fastest', algo: 'Dijkstra (time-weighted)', desc: 'Minimises total travel time. Best for commuters who value speed.' },
    { name: 'Cheapest', algo: 'Yen K=5 + fare slabs', desc: 'Finds lowest fare. When all routes share a slab, notes this explicitly.' },
    { name: 'Fewest Interchanges', algo: 'Lexicographic Dijkstra', desc: 'Minimises line changes first, then time. Best for comfort.' },
    { name: 'Least Walking', algo: 'Dijkstra (walking-weighted)', desc: 'Minimises walking distance. Ready for future out-of-station transfers.' },
    { name: 'Shortest Distance', algo: 'Dijkstra (distance-weighted)', desc: 'Minimises total track kilometres. May differ from fastest.' },
    { name: 'Balanced', algo: 'Yen K=5 + normalised scoring', desc: 'Scores candidates on time, cost, transfers, walking with configurable weights.' },
  ];

  objectives.forEach((obj, i) => {
    ensureSpace(16);
    const rowY = y;
    setFill(i % 2 === 0 ? C.lightGray : [248, 249, 251]);
    doc.roundedRect(MARGIN, rowY, CONTENT_W, 13, 2, 2, 'F');
    setFill(C.gold);
    doc.roundedRect(MARGIN, rowY, 3, 13, 1.5, 1.5, 'F');
    setText(C.navy);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(obj.name, MARGIN + 6, rowY + 5.5);
    setText(C.blue);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(obj.algo, MARGIN + 6, rowY + 9.5);
    setText(C.gray);
    const descLines = doc.splitTextToSize(obj.desc, CONTENT_W - 65);
    doc.text(descLines, MARGIN + 55, rowY + 6);
    y += 15;
  });
}

// =============================================================================
// PAGE 7: FARE + TIMETABLE + WALKING MODELS
// =============================================================================
function modelsPage() {
  newPage();
  sectionHeader(6, 'Components 3\u20135: Fare, Timetable & Walking Models');

  subHeader('Fare Model (Component 3)');
  bodyText(
    'Hyderabad Metro fares are distance-based with 11 slabs from Rs. 10 (0\u20132 km) to Rs. 60 (>30 km). ' +
    'The fare depends only on total metro distance, not the route taken. The model looks up the slab ' +
    'for the journey\u2019s total distance and returns the corresponding fare.'
  );

  // Mini fare table
  const miniSlabs = [
    ['0\u20132 km', 'Rs. 10'], ['2\u20134 km', 'Rs. 15'], ['4\u20136 km', 'Rs. 20'],
    ['6\u20138 km', 'Rs. 25'], ['8\u201310 km', 'Rs. 30'], ['10\u201314 km', 'Rs. 35'],
    ['14\u201318 km', 'Rs. 40'], ['18\u201322 km', 'Rs. 45'], ['22\u201326 km', 'Rs. 50'],
    ['26\u201330 km', 'Rs. 55'], ['>30 km', 'Rs. 60'],
  ];
  const fcW = (CONTENT_W - 6) / 2;
  miniSlabs.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = MARGIN + col * (fcW + 6);
    const sy = y + row * 6;
    setFill(i % 4 < 2 ? C.lightGray : C.white);
    doc.rect(sx, sy, fcW, 5.5, 'F');
    setText(C.darkGray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(s[0], sx + 3, sy + 4);
    setText(C.blue);
    doc.setFont('helvetica', 'bold');
    doc.text(s[1], sx + fcW - 3, sy + 4, { align: 'right' });
  });
  y += Math.ceil(miniSlabs.length / 2) * 6 + 4;

  subHeader('Timetable Model (Component 4)');
  bodyText(
    'Since HMRL\u2019s GTFS feed is behind a request form, the model uses a SIMULATED timetable with ' +
    'realistic parameters: operating hours 06:30\u201322:00, headways of 5\u20138 minutes (peak vs off-peak). ' +
    'The nextDeparture() function finds the next train after a given time, computing waiting time ' +
    'for the itinerary timeline.'
  );

  bullet('Red Line: 6 min headway', { size: 9.5 });
  bullet('Blue Line: 5 min headway', { size: 9.5 });
  bullet('Green Line: 8 min headway', { size: 9.5 });
  bullet('All times labelled as SIMULATED in the UI', { size: 9.5, color: C.red });

  y += 2;
  subHeader('Walking Model (Component 5)');
  bodyText(
    'Estimates first/last-mile walking at 5 km/h average speed. Users can provide a walking time ' +
    'directly or an address (estimated via a deterministic heuristic producing 5\u201320 min). ' +
    'Interchange walking is modelled as a 5-minute penalty within the graph itself.'
  );
}

// =============================================================================
// PAGE 8: JOURNEY PLANNER (Component 6)
// =============================================================================
function plannerPage() {
  newPage();
  sectionHeader(7, 'Component 6: Door-to-Door Journey Planner');

  bodyText(
    'The journey planner wraps the routing engine with access walking, timetable-based waiting, ' +
    'and exit walking to produce a complete timeline from leaving your start location to arriving ' +
    'at your destination.'
  );

  subHeader('Itinerary Timeline Steps');

  const stepTypes = [
    { type: 'Access Walk', desc: 'Walk from your start address to the boarding station', color: C.green },
    { type: 'Wait', desc: 'Wait for the next train on the first line (timetable-based)', color: C.gold },
    { type: 'Board', desc: 'Board the train at the source station', color: C.blue },
    { type: 'Ride', desc: 'Travel on the train through consecutive stations', color: C.blue },
    { type: 'Interchange Walk', desc: 'Transfer between lines at an interchange station (5 min)', color: C.red },
    { type: 'Wait (transfer)', desc: 'Wait for the next train on the new line', color: C.gold },
    { type: 'Board (transfer)', desc: 'Board the next line\u2019s train', color: C.blue },
    { type: 'Ride (continued)', desc: 'Continue journey on the new line', color: C.blue },
    { type: 'Exit Walk', desc: 'Walk from the alighting station to your final destination', color: C.green },
  ];

  stepTypes.forEach((s, i) => {
    ensureSpace(10);
    setFill(s.color);
    doc.circle(MARGIN + 4, y + 2, 2.2, 'F');
    setText(C.white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(String(i + 1), MARGIN + 4, y + 3.5, { align: 'center' });
    setText(C.navy);
    doc.setFontSize(9.5);
    doc.text(s.type, MARGIN + 9, y + 3);
    setText(C.gray);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(s.desc, CONTENT_W - 50);
    doc.text(lines, MARGIN + 50, y + 3);
    y += Math.max(7, lines.length * 4.5) + 1;
  });

  y += 4;
  subHeader('Total Duration Calculation');
  bodyText(
    'Total = Access Walk + Waiting + Metro Ride + Interchange Penalties + Transfer Waiting + Exit Walk. ' +
    'All times are deterministic — no randomness. The result includes departure time, arrival time, ' +
    'total cost (metro fare + optional first/last-mile costs), and total walking distance.'
  );

  addImg(PHOTOS.smartphone, MARGIN, y, CONTENT_W * 0.45, 40);
  y += 46;
}

// =============================================================================
// PAGE 9: WORKED EXAMPLE - SETUP
// =============================================================================
function exampleSetupPage() {
  newPage();
  sectionHeader(8, 'Worked Example: Miyapur \u2192 Nagole');

  bodyText(
    'Let us trace a complete journey from Miyapur (Red Line terminal in the north-west) to Nagole ' +
    '(Blue Line terminal in the east). This is a cross-city journey that requires a transfer at ' +
    'Ameerpet, the busiest interchange station.'
  );

  // Journey summary cards
  const summary = [
    { label: 'Source', value: 'Miyapur (Red Line)', color: C.red },
    { label: 'Destination', value: 'Nagole (Blue Line)', color: C.blue },
    { label: 'Transfer at', value: 'Ameerpet', color: C.gold },
    { label: 'Departure', value: '09:00 AM', color: C.navy },
    { label: 'Objective', value: 'Fastest', color: C.green },
    { label: 'Total Distance', value: '~33 km', color: C.gray },
  ];

  const cardW = (CONTENT_W - 12) / 3;
  const cardH = 16;
  summary.forEach((s, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = MARGIN + col * (cardW + 6);
    const cy = y + row * (cardH + 4);
    card(cx, cy, cardW, cardH, C.lightGray, C.midGray);
    setFill(s.color);
    doc.roundedRect(cx, cy, 3, cardH, 1.5, 1.5, 'F');
    setText(C.gray);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(s.label, cx + 5, cy + 6);
    setText(C.navy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(s.value, cx + 5, cy + 12);
  });
  y += 2 * (cardH + 4) + 6;

  subHeader('Step 1: Build the Graph');
  bodyText(
    'The graph has 59 vertices and 116 edges. Miyapur maps to vertex "miyapur:red". Nagole maps to ' +
    '"nagole:blue". Since these are on different lines, the algorithm must find a path through an ' +
    'interchange vertex.'
  );

  subHeader('Step 2: Run Dijkstra (Time-Weighted)');
  bodyText(
    'Dijkstra starts at "miyapur:red" with distance 0. It explores the Red Line eastward, settling ' +
    'each station: JNTU College (2.4 min), KPHB Colony (4.8 min), Kukatpally (7.2 min)... until ' +
    'reaching Ameerpet on the Red Line (~26.4 min). At Ameerpet, it discovers the interchange edge ' +
    'to "ameerpet:blue" with a 5-minute transfer penalty. It continues on the Blue Line eastward: ' +
    'Begumpet, Paradise, Secunderabad East... until reaching "nagole:blue".'
  );

  // Schematic for this route
  y += 4;
  drawRouteDiagram(y);
  y += 40;
}

function drawRouteDiagram(y2) {
  const w = CONTENT_W;
  const h = 36;
  setFill(C.lightGray);
  doc.roundedRect(MARGIN, y2, w, h, 3, 3, 'F');

  // Red Line segment
  const redStart = MARGIN + 8;
  const redEnd = MARGIN + w * 0.42;
  const lineY = y2 + 12;
  setDraw(LINE_COLORS.red);
  setStroke(2.5);
  doc.line(redStart, lineY, redEnd, lineY);

  // Red stations (abbreviated)
  const redStops = ['Miyapur', 'KPHB', 'Ameerpet'];
  redStops.forEach((name, i) => {
    const sx = i === 0 ? redStart : i === 2 ? redEnd : redStart + (redEnd - redStart) * 0.85;
    setFill(LINE_COLORS.red);
    doc.circle(sx, lineY, 2.5, 'F');
    setText(C.darkGray);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(name, sx, lineY - 4, { align: 'center' });
  });

  // Transfer (dashed)
  setDraw(C.gold);
  setStroke(1.5);
  doc.setLineDashPattern([2, 1.5], 0);
  doc.line(redEnd, lineY, redEnd, lineY + 10);
  doc.setLineDashPattern([], 0);
  setText(C.gold);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('Transfer\n5 min', redEnd + 3, lineY + 6);

  // Blue Line segment
  const blueStart = MARGIN + w * 0.42;
  const blueEnd = MARGIN + w - 8;
  const blueY = y2 + 22;
  setDraw(LINE_COLORS.blue);
  setStroke(2.5);
  doc.line(blueStart, blueY, blueEnd, blueY);

  const blueStops = ['Ameerpet', 'Begumpet', 'Paradise', 'Uppal', 'Nagole'];
  blueStops.forEach((name, i) => {
    const sx = blueStart + (blueEnd - blueStart) / (blueStops.length - 1) * i;
    setFill(LINE_COLORS.blue);
    doc.circle(sx, blueY, 2.5, 'F');
    setText(C.darkGray);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(name, sx, blueY + 6, { align: 'center' });
  });

  // Time labels
  setText(C.gray);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('~26 min on Red Line', redStart + (redEnd - redStart) / 2, lineY + 10, { align: 'center' });
  doc.text('~33 min on Blue Line', blueStart + (blueEnd - blueStart) / 2, blueY + 14, { align: 'center' });
}

// =============================================================================
// PAGE 10: WORKED EXAMPLE - RESULTS
// =============================================================================
function exampleResultsPage() {
  newPage();
  sectionHeader(9, 'Worked Example: Results & Itinerary');

  subHeader('Step 3: Path Reconstruction');
  bodyText(
    'Dijkstra reconstructs the path by walking backwards from "nagole:blue" through the predecessor ' +
    'array, then reversing. The full vertex path is:'
  );

  // Path display
  ensureSpace(16);
  setFill([30, 35, 45]);
  doc.roundedRect(MARGIN, y, CONTENT_W, 14, 2, 2, 'F');
  setText([180, 200, 220]);
  doc.setFontSize(7);
  doc.setFont('courier', 'normal');
  doc.text(
    'miyapur:red \u2192 ... \u2192 ameerpet:red \u2192 ameerpet:blue (transfer) \u2192 ... \u2192 nagole:blue',
    MARGIN + 4, y + 9
  );
  y += 18;

  subHeader('Step 4: Build Legs & Metrics');

  const metrics = [
    { label: 'Total Travel Time', value: '~64 min', color: C.blue },
    { label: 'Total Distance', value: '~33 km', color: C.navy },
    { label: 'Interchanges', value: '1 (at Ameerpet)', color: C.gold },
    { label: 'Fare', value: 'Rs. 60 (max slab)', color: C.green },
    { label: 'Stops Traversed', value: '~30 stations', color: C.red },
    { label: 'Transfer Penalty', value: '5 min', color: C.gray },
  ];

  const cardW = (CONTENT_W - 12) / 3;
  metrics.forEach((m, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = MARGIN + col * (cardW + 6);
    const cy = y + row * 16;
    card(cx, cy, cardW, 14, C.lightGray, C.midGray);
    setFill(m.color);
    doc.roundedRect(cx, cy, 3, 14, 1.5, 1.5, 'F');
    setText(C.gray);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(m.label, cx + 5, cy + 6);
    setText(m.color);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(m.value, cx + 5, cy + 11.5);
  });
  y += 2 * 16 + 6;

  subHeader('Step 5: Door-to-Door Itinerary Timeline');

  const itinerary = [
    { time: '09:00', step: 'Leave your start location in Miyapur', type: 'access', color: C.green },
    { time: '09:05', step: 'Arrive at Miyapur station (5 min walk)', type: 'access', color: C.green },
    { time: '09:06', step: 'Board Red Line train (1 min wait)', type: 'board', color: C.red },
    { time: '09:06', step: 'Ride Red Line: Miyapur \u2192 Ameerpet (26 min, 10 stops)', type: 'ride', color: C.red },
    { time: '09:32', step: 'Arrive at Ameerpet, transfer to Blue Line (5 min)', type: 'transfer', color: C.gold },
    { time: '09:37', step: 'Wait for Blue Line train (3 min)', type: 'wait', color: C.gold },
    { time: '09:40', step: 'Board Blue Line at Ameerpet', type: 'board', color: C.blue },
    { time: '09:40', step: 'Ride Blue Line: Ameerpet \u2192 Nagole (33 min, 13 stops)', type: 'ride', color: C.blue },
    { time: '10:13', step: 'Arrive at Nagole station', type: 'arrive', color: C.blue },
    { time: '10:18', step: 'Walk to destination (5 min)', type: 'exit', color: C.green },
    { time: '10:18', step: 'TOTAL: 78 min door-to-door  \u2022  Rs. 60 fare', type: 'total', color: C.navy },
  ];

  itinerary.forEach((item, i) => {
    ensureSpace(8);
    const isTotal = item.type === 'total';
    if (isTotal) {
      setFill(C.navy);
      doc.roundedRect(MARGIN, y, CONTENT_W, 8, 2, 2, 'F');
      setText(C.white);
      doc.setFont('helvetica', 'bold');
    } else {
      setFill(i % 2 === 0 ? C.lightGray : C.white);
      doc.rect(MARGIN, y, CONTENT_W, 6.5, 'F');
      setText(C.darkGray);
      doc.setFont('helvetica', 'normal');
    }
    setFill(item.color);
    doc.circle(MARGIN + 4, y + (isTotal ? 4 : 3.2), 1.8, 'F');
    setText(isTotal ? C.white : C.gray);
    doc.setFontSize(isTotal ? 9 : 8);
    doc.setFont('helvetica', isTotal ? 'bold' : 'bold');
    doc.text(item.time, MARGIN + 9, y + (isTotal ? 5.5 : 4.5));
    setText(isTotal ? C.white : C.darkGray);
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
    doc.setFontSize(isTotal ? 9 : 8.5);
    doc.text(item.step, MARGIN + 25, y + (isTotal ? 5.5 : 4.5));
    y += isTotal ? 10 : 7.5;
  });

  y += 6;
  bodyText(
    'Note: Times are based on simulated estimates. Average edge durations do not guarantee a real ' +
    'train connection. The UI clearly labels all timetable data as SIMULATED.',
    { size: 8, color: C.red }
  );
}

// =============================================================================
// PAGE 11: HOW ALL COMPONENTS WORK TOGETHER
// =============================================================================
function architecturePage() {
  newPage();
  sectionHeader(10, 'How All Components Work Together');

  bodyText(
    'When a user searches for a route, the application follows this pipeline:'
  );

  const pipeline = [
    { step: '1', title: 'User Input', desc: 'User selects source, destination, departure time, and route objective on the Plan screen.' },
    { step: '2', title: 'Graph Lookup', desc: 'Source and destination station IDs are resolved to graph vertices (station:line pairs).' },
    { step: '3', title: 'Routing Engine', desc: 'Dijkstra or Yen\u2019s algorithm runs on the graph with the appropriate weight mode for the chosen objective.' },
    { step: '4', title: 'Metrics Computation', desc: 'Total time, distance, interchanges, fare, and walking are recomputed from the path\u2019s actual edges.' },
    { step: '5', title: 'Itinerary Assembly', desc: 'The journey planner wraps the route with access walk, timetable waiting, interchange timing, and exit walk.' },
    { step: '6', title: 'UI Display', desc: 'Results shown as route cards with metrics, a schematic map, an itinerary timeline, and algorithm explanation.' },
  ];

  pipeline.forEach(p => {
    ensureSpace(16);
    card(MARGIN, y, CONTENT_W, 14, C.lightGray, C.midGray);
    setFill(C.navy);
    doc.circle(MARGIN + 6, y + 7, 3.5, 'F');
    setText(C.white);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(p.step, MARGIN + 6, y + 9, { align: 'center' });
    setText(C.navy);
    doc.setFontSize(10);
    doc.text(p.title, MARGIN + 13, y + 6);
    setText(C.gray);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const descLines = doc.splitTextToSize(p.desc, CONTENT_W - 16);
    doc.text(descLines, MARGIN + 13, y + 10.5);
    y += 16;

    // Arrow
    if (p.step !== '6') {
      ensureSpace(4);
      setDraw(C.midGray);
      setStroke(0.8);
      doc.line(MARGIN + 6, y - 1, MARGIN + 6, y + 2);
      y += 2;
    }
  });

  y += 6;
  subHeader('Technology Stack');
  bullet('React + TypeScript: UI components and type-safe data flow', { size: 10 });
  bullet('Vite: Fast development and production builds', { size: 10 });
  bullet('Tailwind CSS: Responsive, consistent styling', { size: 10 });
  bullet('Supabase: Backend (database, auth) — available but not required for routing', { size: 10 });
  bullet('All routing runs client-side — no server calls needed for route computation', { size: 10, color: C.blue });

  addImg(PHOTOS.bengaluru, MARGIN, y, CONTENT_W, 45);
}

// =============================================================================
// BUILD
// =============================================================================
coverPage();
whatIsPage();
networkPage();
graphPage();
dijkstraPage();
objectivesPage();
modelsPage();
plannerPage();
exampleSetupPage();
exampleResultsPage();
architecturePage();
addFooters();

doc.save('Hyderabad-Metro-Model-Overview.pdf');
console.log('Generated: Hyderabad-Metro-Model-Overview.pdf');
