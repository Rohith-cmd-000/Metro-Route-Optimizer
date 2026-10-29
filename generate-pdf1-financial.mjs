// PDF 1: Financial Aspect of the Model + Target Audience
// Uses jsPDF to create a multi-page PDF with images, tables, and styled text.

import { jsPDF } from 'jspdf';

const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - 2 * MARGIN;

// Color palette
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
};

const LINE_COLORS = {
  red: [229, 57, 53],
  blue: [30, 88, 162],
  green: [67, 160, 71],
};

const PHOTOS = {
  metro: 'https://images.pexels.com/photos/12384054/pexels-photo-12384054.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  commuter: 'https://images.pexels.com/photos/37678059/pexels-photo-37678059.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  rupees: 'https://images.pexels.com/photos/5476028/pexels-photo-5476028.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  smartphone: 'https://images.pexels.com/photos/28461205/pexels-photo-28461205.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

const doc = new jsPDF({ unit: 'mm', format: 'a4' });
let y = 0;

// --- Helper functions ---

function newPage() {
  doc.addPage();
  y = MARGIN;
}

function ensureSpace(needed) {
  if (y + needed > PAGE_H - MARGIN - 10) newPage();
}

function setFill(rgb) { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }
function setText(rgb) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }
function setDraw(rgb) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }
function setStroke(w) { doc.setLineWidth(w); }

function rect(x, y2, w, h, rgb, radius = 0) {
  setFill(rgb);
  if (radius > 0) doc.roundedRect(x, y2, w, h, radius, radius, 'F');
  else doc.rect(x, y2, w, h, 'F');
}

function text(str, x2, y2, opts = {}) {
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
  setText(C.white);
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
  ensureSpace(8);
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

function addImageFromUrl(url, x2, y2, w, h) {
  try {
    doc.addImage(url, 'JPEG', x2, y2, w, h, undefined, 'FAST');
    return true;
  } catch {
    return false;
  }
}

function footer(pageNum) {
  setFill(C.navy);
  doc.rect(0, PAGE_H - 12, PAGE_W, 12, 'F');
  setText(C.midGray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Hyderabad Metro Route Optimizer — Financial Analysis & Target Audience', MARGIN, PAGE_H - 5);
  doc.text(`Page ${pageNum}`, PAGE_W - MARGIN, PAGE_H - 5, { align: 'right' });
}

// --- FARE SLAB TABLE ---
const FARE_SLABS = [
  [2, 10], [4, 15], [6, 20], [8, 25], [10, 30],
  [14, 35], [18, 40], [22, 45], [26, 50], [30, 55], [Infinity, 60],
];

function drawFareTable(x2, y2, w) {
  const colW = w / 3;
  const rowH = 7;
  // Header
  setFill(C.navy);
  doc.roundedRect(x2, y2, w, rowH, 2, 2, 'F');
  setText(C.white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Distance (km)', x2 + colW / 2, y2 + 5, { align: 'center' });
  doc.text('Fare (Rs.)', x2 + colW + colW / 2, y2 + 5, { align: 'center' });
  doc.text('Per km (Rs.)', x2 + 2 * colW + colW / 2, y2 + 5, { align: 'center' });
  let ry = y2 + rowH;
  FARE_SLABS.forEach((slab, i) => {
    const prev = i === 0 ? 0 : FARE_SLABS[i - 1][0];
    const distLabel = slab[0] === Infinity ? '>30' : `${prev}\u2013${slab[0]}`;
    const perKm = slab[0] === Infinity ? '\u2014' : (slab[1] / slab[0]).toFixed(1);
    setFill(i % 2 === 0 ? C.lightGray : C.white);
    doc.rect(x2, ry, w, rowH, 'F');
    setText(C.darkGray);
    doc.setFont('helvetica', 'normal');
    doc.text(distLabel, x2 + colW / 2, ry + 5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    setText(C.blue);
    doc.text(`Rs. ${slab[1]}`, x2 + colW + colW / 2, ry + 5, { align: 'center' });
    setText(C.gray);
    doc.setFont('helvetica', 'normal');
    doc.text(perKm, x2 + 2 * colW + colW / 2, ry + 5, { align: 'center' });
    ry += rowH;
  });
  setDraw(C.midGray);
  setStroke(0.2);
  doc.line(x2 + colW, y2 + rowH, x2 + colW, ry);
  doc.line(x2 + 2 * colW, y2 + rowH, x2 + 2 * colW, ry);
  return ry;
}

let pageNum = 1;

// =============================================================================
// COVER PAGE
// =============================================================================
function coverPage() {
  setFill(C.navy);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Decorative accent bar
  setFill(C.gold);
  doc.rect(0, 0, PAGE_W, 4, 'F');

  // Metro line dots
  const dots = [C.red, C.blue, C.green];
  dots.forEach((c, i) => {
    setFill(c);
    doc.circle(PAGE_W / 2 - 12 + i * 12, 30, 3.5, 'F');
  });

  // Title
  setText(C.white);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Aspect', PAGE_W / 2, 60, { align: 'center' });
  doc.text('& Target Audience', PAGE_W / 2, 75, { align: 'center' });

  // Subtitle
  setText(C.gold);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Hyderabad Metro Route Optimizer', PAGE_W / 2, 90, { align: 'center' });

  // Image
  addImageFromUrl(PHOTOS.metro, MARGIN + 20, 105, CONTENT_W - 40, 60);

  // Team
  setText(C.midGray);
  doc.setFontSize(10);
  doc.text('Team Members', PAGE_W / 2, 185, { align: 'center' });
  setText(C.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Vanisha  \u2022  Rachna  \u2022  Akriti  \u2022  Rohith Sai Gowd', PAGE_W / 2, 195, { align: 'center' });

  // Info box
  card(MARGIN + 30, 210, CONTENT_W - 60, 35, [25, 50, 80], [10, 25, 45]);
  setText(C.white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const infoLines = [
    'Fare Structure Analysis  \u2022  Revenue Model  \u2022  Cost Breakdown',
    'Ridership Estimates  \u2022  Target Audience Segments',
    'Metro Rider Personas  \u2022  Use Cases  \u2022  Value Proposition',
  ];
  infoLines.forEach((line, i) => {
    doc.text(line, PAGE_W / 2, 220 + i * 8, { align: 'center' });
  });

  footer(pageNum);
}

// =============================================================================
// PAGE 2: FARE STRUCTURE
// =============================================================================
function farePage() {
  newPage();
  sectionHeader(1, 'Fare Structure of Hyderabad Metro');

  bodyText(
    'Hyderabad Metro operates on a distance-based slab fare system set by HMRL (Hyderabad Metro Rail Limited). ' +
    'The fare depends ONLY on the total distance travelled on the metro network — not on the number of lines used ' +
    'or the route taken. This means a metro-only path from A to B costs the same regardless of which route the ' +
    'optimizer recommends, unless first/last-mile costs differ.'
  );

  subHeader('Official Fare Slabs (Rs. 10 \u2013 Rs. 60)');
  const tableEnd = drawFareTable(MARGIN, y, CONTENT_W * 0.75);
  y = tableEnd + 6;

  bodyText(
    'The minimum fare is Rs. 10 for up to 2 km, and the maximum is Rs. 60 for distances above 30 km. ' +
    'There are 11 fare slabs in total. The per-kilometre cost decreases as distance increases, making ' +
    'longer journeys more economical per kilometre.'
  );

  // Image
  ensureSpace(55);
  addImageFromUrl(PHOTOS.rupees, MARGIN, y, CONTENT_W * 0.5, 50);
  y += 55;
}

// =============================================================================
// PAGE 3: REVENUE MODEL
// =============================================================================
function revenuePage() {
  newPage();
  sectionHeader(2, 'Revenue Model of the Application');

  bodyText(
    'The Hyderabad Metro Route Optimizer is a non-commercial academic project. It does not generate ' +
    'direct revenue. However, understanding the financial dynamics of the metro system it models is ' +
    'essential for evaluating its real-world applicability.'
  );

  subHeader('HMRL Revenue Sources');

  const revenues = [
    ['Ticket Sales', 'Primary revenue source. Fares range from Rs. 10 to Rs. 60 per ride based on distance slabs.'],
    ['Smart Cards & QR Tickets', 'Pre-loaded smart cards and mobile QR tickets encourage repeat usage and advance payment.'],
    ['Station Retail & Advertising', 'Commercial space rental at stations and advertising on trains/platforms.'],
    ['Park-and-Ride Fees', 'Parking charges at metro stations for commuters who drive to the station.'],
    ['Last-Mile Connectivity', 'Feeder bus services and auto-stands at stations generate auxiliary revenue.'],
  ];

  revenues.forEach(([title, desc]) => {
    bullet(title, { size: 10.5 });
    bodyText(desc, { size: 10, gap: 3, color: C.gray });
  });

  y += 4;
  subHeader('Application Cost Model (This Project)');

  const costs = [
    ['Development', 'Open-source tools (React, TypeScript, Vite, Tailwind CSS) — zero licensing cost.'],
    ['Hosting', 'Supabase free tier for database/auth; static hosting for the frontend — zero cost.'],
    ['Data', 'Station names and line data from public HMRL sources. Distances and times are simulated — zero data purchase cost.'],
    ['Maintenance', 'Community or academic maintenance. No paid API subscriptions required.'],
  ];

  costs.forEach(([title, desc]) => {
    bullet(title, { size: 10.5 });
    bodyText(desc, { size: 10, gap: 3, color: C.gray });
  });
}

// =============================================================================
// PAGE 4: RIDERSHIP & FINANCIAL DYNAMICS
// =============================================================================
function ridershipPage() {
  newPage();
  sectionHeader(3, 'Ridership Estimates & Financial Dynamics');

  bodyText(
    'The Hyderabad Metro network spans 3 operational lines covering 67.21 km with 56 stations. ' +
    'Understanding ridership patterns helps evaluate the financial viability of the system and the ' +
    'value of a route optimization tool.'
  );

  // Stats cards
  const stats = [
    { label: 'Network Length', value: '67.21 km', color: C.blue },
    { label: 'Total Stations', value: '56', color: C.green },
    { label: 'Operating Lines', value: '3', color: C.red },
    { label: 'Fare Range', value: 'Rs. 10\u201360', color: C.gold },
    { label: 'Operating Hours', value: '06:30\u201322:00', color: C.blue },
    { label: 'Headway', value: '5\u20138 min', color: C.green },
  ];

  const cardW = (CONTENT_W - 12) / 3;
  const cardH = 18;
  stats.forEach((s, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = MARGIN + col * (cardW + 6);
    const cy = y + row * (cardH + 6);
    card(cx, cy, cardW, cardH, C.lightGray, C.midGray);
    setFill(s.color);
    doc.roundedRect(cx, cy, 3, cardH, 1.5, 1.5, 'F');
    setText(C.gray);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(s.label, cx + 6, cy + 7);
    setText(C.navy);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(s.value, cx + 6, cy + 14);
  });
  y += 2 * (cardH + 6) + 6;

  subHeader('Financial Impact of Route Optimization');

  const impacts = [
    {
      title: 'Fare Savings for Riders',
      desc: 'The "cheapest" objective finds routes in the lowest fare slab. For cross-city journeys, choosing a shorter route can save Rs. 5\u201315 per trip.',
    },
    {
      title: 'Time Savings = Economic Value',
      desc: 'The "fastest" objective minimises travel time. For a daily commuter saving 10 minutes each way, that is 100 hours saved per year — equivalent to over 4 full days.',
    },
    {
      title: 'Transfer Reduction',
      desc: 'The "fewest interchanges" objective reduces platform changes, saving 5 minutes per avoided transfer and reducing the risk of missed connections.',
    },
    {
      title: 'Informed Fare Decisions',
      desc: 'By showing estimated fares upfront, riders can choose between metro, auto, or bus based on total cost, increasing metro adoption for cost-sensitive segments.',
    },
  ];

  impacts.forEach(imp => {
    bullet(imp.title, { size: 10.5 });
    bodyText(imp.desc, { size: 10, gap: 3, color: C.gray });
  });

  // Image
  ensureSpace(55);
  addImageFromUrl(PHOTOS.commuter, MARGIN, y, CONTENT_W, 50);
  y += 55;
}

// =============================================================================
// PAGE 5: COST-BENEFIT ANALYSIS
// =============================================================================
function costBenefitPage() {
  newPage();
  sectionHeader(4, 'Cost-Benefit Analysis for Riders');

  bodyText(
    'This analysis compares the financial cost of using the Hyderabad Metro versus alternative transport ' +
    'options for typical journey scenarios, using the fare model built into the application.'
  );

  // Comparison table
  const scenarios = [
    { route: 'Short (2\u20134 km)', metro: 'Rs. 10\u201315', auto: 'Rs. 40\u201360', bus: 'Rs. 10\u201315', saving: 'Rs. 25\u201345' },
    { route: 'Medium (8\u201314 km)', metro: 'Rs. 25\u201335', auto: 'Rs. 80\u2013140', bus: 'Rs. 15\u201325', saving: 'Rs. 45\u2013105' },
    { route: 'Long (18\u201327 km)', metro: 'Rs. 40\u201350', auto: 'Rs. 180\u2013250', bus: 'Rs. 25\u201340', saving: 'Rs. 130\u2013210' },
    { route: 'Cross-city (>27 km)', metro: 'Rs. 55\u201360', auto: 'Rs. 250\u2013350', bus: 'Rs. 35\u201350', saving: 'Rs. 190\u2013290' },
  ];

  const colWs = [CONTENT_W * 0.20, CONTENT_W * 0.18, CONTENT_W * 0.18, CONTENT_W * 0.18, CONTENT_W * 0.26];
  const headers = ['Journey Type', 'Metro Fare', 'Auto/Rickshaw', 'City Bus', 'Savings vs Auto'];
  const rowH = 9;

  // Header row
  setFill(C.navy);
  doc.roundedRect(MARGIN, y, CONTENT_W, rowH, 2, 2, 'F');
  setText(C.white);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  let cx = MARGIN;
  headers.forEach((h, i) => {
    doc.text(h, cx + colWs[i] / 2, y + 6, { align: 'center' });
    cx += colWs[i];
  });
  y += rowH;

  scenarios.forEach((s, idx) => {
    setFill(idx % 2 === 0 ? C.lightGray : C.white);
    doc.rect(MARGIN, y, CONTENT_W, rowH, 'F');
    setText(C.darkGray);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    cx = MARGIN;
    doc.text(s.route, cx + colWs[0] / 2, y + 6, { align: 'center' });
    setText(C.blue);
    doc.setFont('helvetica', 'bold');
    doc.text(s.metro, cx + colWs[1] / 2, y + 6, { align: 'center' });
    cx += colWs[1];
    setText(C.darkGray);
    doc.setFont('helvetica', 'normal');
    doc.text(s.auto, cx + colWs[1] / 2, y + 6, { align: 'center' });
    cx += colWs[1];
    doc.text(s.bus, cx + colWs[1] / 2, y + 6, { align: 'center' });
    cx += colWs[1];
    setText(C.green);
    doc.setFont('helvetica', 'bold');
    doc.text(s.saving, cx + colWs[4] / 2, y + 6, { align: 'center' });
    y += rowH;
  });

  y += 8;
  bodyText(
    'Key insight: The metro is significantly cheaper than auto-rickshaws for all journey types, ' +
    'with savings of Rs. 25\u2013290 per trip. For short journeys, city buses compete on price but ' +
    'not on speed or comfort. The route optimizer helps riders discover these savings by computing ' +
    'exact fares for any station pair.',
    { size: 10 }
  );

  subHeader('Annual Savings Estimate for a Daily Commuter');

  bullet('Assume 2 trips/day, 22 working days/month = 44 trips/month');
  bullet('Medium journey (8\u201314 km): Metro Rs. 30 vs Auto Rs. 110 = Rs. 80 saved per trip');
  bullet('Monthly savings: Rs. 80 \u00d7 44 = Rs. 3,520');
  bullet('Annual savings: Rs. 3,520 \u00d7 12 = Rs. 42,240');
  bullet('The route optimizer makes these savings discoverable and actionable.', { color: C.blue });
}

// =============================================================================
// PAGE 6: TARGET AUDIENCE OVERVIEW
// =============================================================================
function audiencePage() {
  newPage();
  sectionHeader(5, 'Target Audience: Metro Riders');

  bodyText(
    'The Hyderabad Metro Route Optimizer is designed for metro riders — the people who use or could use ' +
    'the Hyderabad Metro for their daily travel. This section breaks down the target audience into distinct ' +
    'segments, each with specific needs that the application addresses.'
  );

  addImageFromUrl(PHOTOS.smartphone, MARGIN, y, CONTENT_W, 55);
  y += 62;

  subHeader('Why Metro Riders Need This Tool');

  const needs = [
    'The Hyderabad Metro has 3 lines with 56 stations and 3 interchange points. Choosing the right route is not always obvious.',
    'Fares depend on distance, not route — but riders rarely know the exact distance or fare before travelling.',
    'Interchanges add 5+ minutes per transfer. Minimising transfers can save significant time for some journeys.',
    'Different riders prioritise different things: speed, cost, comfort (fewer transfers), or minimal walking.',
    'First-time riders and tourists may not know which stations connect to which lines.',
  ];

  needs.forEach(n => bullet(n, { size: 10 }));
}

// =============================================================================
// PAGE 7: AUDIENCE SEGMENTS
// =============================================================================
function segmentsPage() {
  newPage();
  sectionHeader(6, 'Audience Segments & Personas');

  const segments = [
    {
      name: 'Daily Commuters',
      icon: 'A',
      color: C.blue,
      desc: 'Office workers, IT professionals, and government employees who travel the same route every day.',
      needs: ['Fastest route option', 'Timetable-based departure times', 'Consistent and repeatable results'],
      benefit: 'Save 10\u201320 minutes daily by choosing the fastest or fewest-transfer route.',
    },
    {
      name: 'Students',
      icon: 'B',
      color: C.green,
      desc: 'College and university students travelling between home, campus, and internships across the city.',
      needs: ['Cheapest route option', 'Fare estimation before travel', 'Simple, clear instructions'],
      benefit: 'Save Rs. 25\u201380 per trip by confirming the lowest fare route before boarding.',
    },
    {
      name: 'Tourists & Visitors',
      icon: 'C',
      color: C.red,
      desc: 'Visitors to Hyderabad who are unfamiliar with the metro network and need guidance.',
      needs: ['Visual network map', 'Station search by name', 'Step-by-step itinerary with transfers'],
      benefit: 'Navigate the entire metro confidently without local knowledge.',
    },
    {
      name: 'Occasional Riders',
      icon: 'D',
      color: C.gold,
      desc: 'People who use the metro occasionally for shopping, medical visits, or social outings.',
      needs: ['Balanced route (time + cost + transfers)', 'Door-to-door itinerary', 'Operating hours information'],
      benefit: 'Make informed travel decisions without memorising the network.',
    },
    {
      name: 'Elderly & Mobility-Limited',
      icon: 'E',
      color: [120, 80, 160],
      desc: 'Senior citizens and people with mobility concerns who want comfortable journeys.',
      needs: ['Fewest interchanges option', 'Least walking option', 'Clear transfer instructions'],
      benefit: 'Minimise physical effort by reducing platform changes and walking distances.',
    },
    {
      name: 'Cost-Conscious Riders',
      icon: 'F',
      color: [0, 121, 107],
      desc: 'Riders on tight budgets who compare metro fares with bus and auto-rickshaw costs.',
      needs: ['Cheapest route with exact fare', 'Comparison with alternative transport', 'Shortest distance route'],
      benefit: 'Maximise savings by choosing the most economical route every time.',
    },
  ];

  segments.forEach(seg => {
    ensureSpace(30);
    const cardH = 28;
    card(MARGIN, y, CONTENT_W, cardH, C.lightGray, C.midGray);
    // Icon circle
    setFill(seg.color);
    doc.circle(MARGIN + 8, y + 10, 4.5, 'F');
    setText(C.white);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(seg.icon, MARGIN + 8, y + 12, { align: 'center' });
    // Name
    setText(C.navy);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(seg.name, MARGIN + 16, y + 8);
    // Description
    setText(C.gray);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(seg.desc, CONTENT_W - 60);
    doc.text(descLines, MARGIN + 16, y + 14);
    // Needs
    setText(C.darkGray);
    doc.setFontSize(8);
    const needsStr = 'Needs: ' + seg.needs.join('  \u2022  ');
    const needsLines = doc.splitTextToSize(needsStr, CONTENT_W - 16);
    doc.text(needsLines, MARGIN + 4, y + 21);
    // Benefit
    setText(seg.color);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const benefitLines = doc.splitTextToSize('Value: ' + seg.benefit, CONTENT_W - 16);
    doc.text(benefitLines, MARGIN + 4, y + 26);
    y += cardH + 4;
  });
}

// =============================================================================
// PAGE 8: USE CASES & VALUE PROPOSITION
// =============================================================================
function useCasePage() {
  newPage();
  sectionHeader(7, 'Use Cases & Value Proposition');

  subHeader('Real-World Use Cases');

  const useCases = [
    {
      title: 'Morning Office Commute',
      desc: 'A software engineer in Madhapur needs to reach Begumpet by 9:30 AM. The app finds the fastest Blue Line route with exact departure time and fare.',
    },
    {
      title: 'Student Budget Travel',
      desc: 'A student in Miyapur needs to reach Nagole for an internship. The "cheapest" objective shows the lowest fare route (Rs. 55\u201360) versus Rs. 200+ by auto.',
    },
    {
      title: 'Weekend Shopping Trip',
      desc: 'A family in Kukatpally wants to visit Sultan Bazaar. The "balanced" objective finds a route with 1 transfer at MGBS, balancing time and comfort.',
    },
    {
      title: 'Tourist City Tour',
      desc: 'A visitor staying near Ameerpet wants to explore Charminar area. The app shows the Red Line to MGBS, then Green Line to Sultan Bazaar, with a visual map.',
    },
    {
      title: 'Medical Appointment',
      desc: 'An elderly passenger from LB Nagar needs to reach Gandhi Hospital. The "fewest interchanges" route minimises platform changes for comfort.',
    },
  ];

  useCases.forEach(uc => {
    bullet(uc.title, { size: 10.5 });
    bodyText(uc.desc, { size: 10, gap: 3, color: C.gray });
  });

  y += 6;
  subHeader('Value Proposition Summary');

  const values = [
    ['Save Money', 'Exact fare estimation helps riders choose the cheapest option, saving Rs. 25\u2013290 per trip.'],
    ['Save Time', 'Fastest-route optimization saves 10\u201320 minutes per journey compared to guessing.'],
    ['Reduce Complexity', 'Visual map + step-by-step itinerary makes the 56-station network navigable for everyone.'],
    ['Personalised Routes', 'Six optimization objectives let each rider prioritise what matters most to them.'],
    ['Zero Cost to User', 'The app is free to use — no subscription, no ads, no data collection.'],
  ];

  values.forEach(([title, desc]) => {
    bullet(title, { size: 10.5, color: C.blue });
    bodyText(desc, { size: 10, gap: 3, color: C.gray });
  });

  // Closing card
  y += 8;
  ensureSpace(30);
  card(MARGIN, y, CONTENT_W, 24, C.navy, [10, 25, 45]);
  setText(C.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Bottom Line', MARGIN + 8, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const closing = doc.splitTextToSize(
    'The Hyderabad Metro Route Optimizer transforms a complex 3-line, 56-station network into an ' +
    'accessible, personalised journey planner. For metro riders, it means saving money, saving time, ' +
    'and travelling with confidence — every single trip.',
    CONTENT_W - 16
  );
  doc.text(closing, MARGIN + 8, y + 14);
}

// =============================================================================
// BUILD
// =============================================================================
coverPage();
farePage();
pageNum++; footer(1); doc.setPage(2); footer(2);
revenuePage();
ridershipPage();
costBenefitPage();
audiencePage();
segmentsPage();
useCasePage();

// Add footers to all pages
const totalPages = doc.getNumberOfPages();
for (let p = 2; p <= totalPages; p++) {
  doc.setPage(p);
  setFill(C.navy);
  doc.rect(0, PAGE_H - 12, PAGE_W, 12, 'F');
  setText(C.midGray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Hyderabad Metro Route Optimizer — Financial Analysis & Target Audience', MARGIN, PAGE_H - 5);
  doc.text(`Page ${p}`, PAGE_W - MARGIN, PAGE_H - 5, { align: 'right' });
}

doc.save('Hyderabad-Metro-Financial-Analysis.pdf');
console.log('Generated: Hyderabad-Metro-Financial-Analysis.pdf');
