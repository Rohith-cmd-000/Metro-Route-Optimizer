import pptxgenjs from 'pptxgenjs';
import { readFileSync } from 'fs';

const pptx = new pptxgenjs();

// --- 3D Theme Constants ---
const THEME = {
  // Deep layered background colors
  bgDark: '0A1628',
  bgMid: '112844',
  bgLight: '1B3A5C',
  // Accent colors matching the metro app
  red: 'E53935',
  blue: '1E88E5',
  green: '43A047',
  accent: '00BCD4',
  accentDark: '00838F',
  gold: 'FFB300',
  // Text colors
  white: 'FFFFFF',
  lightGray: 'E0E0E0',
  midGray: 'B0BEC5',
  dimGray: '78909C',
  // 3D layer shadows
  shadowDark: '000000',
  shadowSoft: '0D1B2A',
};

const W = 13.333; // 16:9 widescreen width in inches
const H = 7.5;    // height

pptx.defineLayout({ name: 'WIDE', width: W, height: H });
pptx.layout = 'WIDE';

// --- Helper: 3D layered background ---
function add3DBackground(slide, baseColor = THEME.bgDark) {
  // Base layer — full slide dark background
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: W, h: H,
    fill: { color: baseColor },
    line: { type: 'none' },
  });

  // Second layer — slightly lighter, offset for 3D depth
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.15, y: 0.15, w: W - 0.3, h: H - 0.3,
    rectRadius: 0.1,
    fill: { color: THEME.bgMid },
    line: { color: THEME.bgLight, width: 1 },
    shadow: { type: 'outer', color: THEME.shadowDark, blur: 8, offset: 3, angle: 45, opacity: 0.6 },
  });
}

// --- Helper: 3D floating card ---
function add3DCard(slide, x, y, w, h, fillColor = THEME.bgLight) {
  // Shadow layer (offset behind)
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x + 0.06, y: y + 0.06, w, h,
    rectRadius: 0.12,
    fill: { color: THEME.shadowSoft },
    line: { type: 'none' },
  });
  // Main card
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.12,
    fill: { color: fillColor },
    line: { color: THEME.accent, width: 0.75 },
    shadow: { type: 'outer', color: THEME.shadowDark, blur: 6, offset: 2, angle: 45, opacity: 0.5 },
  });
}

// --- Helper: 3D accent bar ---
function addAccentBar(slide, x, y, w, color = THEME.accent) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x + 0.03, y: y + 0.04, w, h: 0.06,
    rectRadius: 0.03,
    fill: { color: THEME.shadowDark },
    line: { type: 'none' },
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h: 0.06,
    rectRadius: 0.03,
    fill: { color },
    line: { type: 'none' },
    shadow: { type: 'outer', color, blur: 4, offset: 0, angle: 0, opacity: 0.4 },
  });
}

// --- Helper: 3D text with shadow ---
function add3DText(slide, text, options) {
  slide.addText(text, {
    ...options,
    shadow: { type: 'outer', color: THEME.shadowDark, blur: 3, offset: 1, angle: 45, opacity: 0.7 },
  });
}

// --- Helper: slide number badge ---
function addSlideNumber(slide, num) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x: W - 0.7, y: H - 0.55, w: 0.35, h: 0.35,
    fill: { color: THEME.accentDark },
    line: { color: THEME.accent, width: 0.5 },
    shadow: { type: 'outer', color: THEME.shadowDark, blur: 3, offset: 1, angle: 45, opacity: 0.5 },
  });
  slide.addText(String(num), {
    x: W - 0.7, y: H - 0.55, w: 0.35, h: 0.35,
    fontSize: 9, fontFace: 'Segoe UI', color: THEME.white,
    align: 'center', valign: 'middle', bold: true,
  });
}

// --- Helper: footer brand ---
function addFooter(slide) {
  slide.addText('Hyderabad Metro Journey Planner', {
    x: 0.4, y: H - 0.45, w: 4, h: 0.3,
    fontSize: 9, fontFace: 'Segoe UI', color: THEME.dimGray, italic: true,
  });
}

// --- Helper: decorative metro line dots ---
function addMetroLineDots(slide, y) {
  const colors = [THEME.red, THEME.blue, THEME.green];
  const labels = ['Red Line', 'Blue Line', 'Green Line'];
  const startX = W / 2 - 2.5;
  for (let i = 0; i < 3; i++) {
    const x = startX + i * 1.8;
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.03, y: y + 0.03, w: 0.28, h: 0.28,
      fill: { color: THEME.shadowDark },
      line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x, y, w: 0.28, h: 0.28,
      fill: { color: colors[i] },
      line: { color: THEME.white, width: 0.5 },
      shadow: { type: 'outer', color: colors[i], blur: 4, offset: 0, angle: 0, opacity: 0.5 },
    });
    slide.addText(labels[i], {
      x: x + 0.35, y: y - 0.02, w: 1.2, h: 0.32,
      fontSize: 10, fontFace: 'Segoe UI', color: THEME.midGray, valign: 'middle',
    });
  }
}

// ============================================================
// SLIDE 1: Title — Metro image + project name
// ============================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: THEME.bgDark };

  // Full-bleed metro image
  const metroImg = readFileSync('metro_title.jpg', { encoding: 'base64' });
  slide.addImage({ data: `image/jpeg;base64,${metroImg}`, x: 0, y: 0, w: W, h: H });

  // Dark gradient overlay for readability
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: W, h: H,
    fill: { color: THEME.bgDark, transparency: 35 },
    line: { type: 'none' },
  });

  // 3D layered title card
  add3DCard(slide, 1.5, 2.3, W - 3, 3.2, THEME.bgMid);

  // Accent bar on top of card
  addAccentBar(slide, 1.8, 2.55, 2.5, THEME.accent);

  // Title
  add3DText(slide, 'Hyderabad Metro', {
    x: 1.8, y: 2.8, w: W - 3.6, h: 0.9,
    fontSize: 44, fontFace: 'Segoe UI', color: THEME.white, bold: true,
    align: 'left', valign: 'middle',
  });

  add3DText(slide, 'Journey Planner & Route Optimizer', {
    x: 1.8, y: 3.65, w: W - 3.6, h: 0.6,
    fontSize: 24, fontFace: 'Segoe UI', color: THEME.accent, bold: false,
    align: 'left', valign: 'middle',
  });

  add3DText(slide, 'Graph Algorithms  |  Multi-Objective Routing  |  Door-to-Door Planning', {
    x: 1.8, y: 4.35, w: W - 3.6, h: 0.5,
    fontSize: 14, fontFace: 'Segoe UI', color: THEME.midGray,
    align: 'left', valign: 'middle',
  });

  // Metro line dots
  addMetroLineDots(slide, 5.0);
}

// ============================================================
// SLIDE 2: Team Members
// ============================================================
{
  const slide = pptx.addSlide();
  add3DBackground(slide);

  addAccentBar(slide, 0.6, 0.6, 3, THEME.accent);
  add3DText(slide, 'Team Members', {
    x: 0.6, y: 0.75, w: 6, h: 0.6,
    fontSize: 32, fontFace: 'Segoe UI', color: THEME.white, bold: true,
  });
  add3DText(slide, 'Project Contributors', {
    x: 0.6, y: 1.3, w: 6, h: 0.35,
    fontSize: 13, fontFace: 'Segoe UI', color: THEME.midGray,
  });

  const members = [
    { name: 'Vanisha', roll: '25BAI70118', color: THEME.red },
    { name: 'Rachna', roll: '25BAI70288', color: THEME.blue },
    { name: 'Akriti', roll: '25BAI', color: THEME.green },
    { name: 'Rohith Sai Gowd', roll: '25BAI70780', color: THEME.gold },
  ];

  const cardW = 2.7;
  const cardH = 3.0;
  const gap = 0.35;
  const totalW = cardW * 4 + gap * 3;
  const startX = (W - totalW) / 2;
  const startY = 2.2;

  members.forEach((m, i) => {
    const x = startX + i * (cardW + gap);

    // Shadow card
    add3DCard(slide, x, startY, cardW, cardH, THEME.bgLight);

    // Avatar circle
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + cardW / 2 - 0.55 + 0.03, y: startY + 0.35 + 0.03, w: 1.1, h: 1.1,
      fill: { color: THEME.shadowDark },
      line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + cardW / 2 - 0.55, y: startY + 0.35, w: 1.1, h: 1.1,
      fill: { color: m.color },
      line: { color: THEME.white, width: 1 },
      shadow: { type: 'outer', color: m.color, blur: 6, offset: 0, angle: 0, opacity: 0.5 },
    });

    // Initials
    const initials = m.name.split(' ').map(w => w[0]).join('').slice(0, 2);
    add3DText(slide, initials, {
      x: x + cardW / 2 - 0.55, y: startY + 0.35, w: 1.1, h: 1.1,
      fontSize: 28, fontFace: 'Segoe UI', color: THEME.white, bold: true,
      align: 'center', valign: 'middle',
    });

    // Name
    add3DText(slide, m.name, {
      x: x + 0.15, y: startY + 1.6, w: cardW - 0.3, h: 0.4,
      fontSize: 16, fontFace: 'Segoe UI', color: THEME.white, bold: true,
      align: 'center', valign: 'middle',
    });

    // Roll number badge
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.35, y: startY + 2.1, w: cardW - 0.7, h: 0.4,
      rectRadius: 0.08,
      fill: { color: THEME.bgMid },
      line: { color: m.color, width: 0.5 },
    });
    add3DText(slide, m.roll, {
      x: x + 0.35, y: startY + 2.1, w: cardW - 0.7, h: 0.4,
      fontSize: 11, fontFace: 'Consolas', color: m.color, bold: true,
      align: 'center', valign: 'middle',
    });
  });

  addFooter(slide);
  addSlideNumber(slide, 2);
}

// ============================================================
// SLIDE 3: Problem Statement
// ============================================================
{
  const slide = pptx.addSlide();
  add3DBackground(slide);

  addAccentBar(slide, 0.6, 0.6, 3, THEME.red);
  add3DText(slide, 'Problem Statement', {
    x: 0.6, y: 0.75, w: 8, h: 0.6,
    fontSize: 30, fontFace: 'Segoe UI', color: THEME.white, bold: true,
  });

  add3DCard(slide, 0.8, 1.8, W - 1.6, 1.6, THEME.bgLight);
  add3DText(slide, 'Hyderabad Metro Rail operates 3 lines with 59 stations across the city. Commuters struggle to find the optimal route — fastest, cheapest, or with fewest transfers — especially when interchange stations connect multiple lines.', {
    x: 1.1, y: 1.95, w: W - 2.2, h: 1.3,
    fontSize: 15, fontFace: 'Segoe UI', color: THEME.lightGray,
    align: 'left', valign: 'middle', lineSpacingMultiple: 1.4,
  });

  const challenges = [
    { icon: '!', title: 'Multiple Lines', desc: 'Red, Blue, and Green lines with complex interchange points' },
    { icon: '?', title: 'Competing Goals', desc: 'Speed vs cost vs comfort — no single "best" route' },
    { icon: '~', title: 'First/Last Mile', desc: 'Walking to and from stations adds hidden time and cost' },
  ];

  challenges.forEach((c, i) => {
    const x = 0.8 + i * (W - 1.6) / 3 + 0.1;
    const cardW = (W - 1.6) / 3 - 0.25;
    add3DCard(slide, x, 3.8, cardW, 2.2, THEME.bgMid);
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.2, y: 4.0, w: 0.5, h: 0.5,
      fill: { color: THEME.red },
      line: { color: THEME.white, width: 0.5 },
      shadow: { type: 'outer', color: THEME.red, blur: 4, offset: 0, opacity: 0.4 },
    });
    add3DText(slide, c.icon, {
      x: x + 0.2, y: 4.0, w: 0.5, h: 0.5,
      fontSize: 18, fontFace: 'Segoe UI', color: THEME.white, bold: true,
      align: 'center', valign: 'middle',
    });
    add3DText(slide, c.title, {
      x: x + 0.2, y: 4.65, w: cardW - 0.4, h: 0.35,
      fontSize: 14, fontFace: 'Segoe UI', color: THEME.white, bold: true,
    });
    add3DText(slide, c.desc, {
      x: x + 0.2, y: 5.05, w: cardW - 0.4, h: 0.7,
      fontSize: 11, fontFace: 'Segoe UI', color: THEME.midGray,
      lineSpacingMultiple: 1.3,
    });
  });

  addFooter(slide);
  addSlideNumber(slide, 3);
}

// ============================================================
// SLIDE 4: Project Objectives
// ============================================================
{
  const slide = pptx.addSlide();
  add3DBackground(slide);

  addAccentBar(slide, 0.6, 0.6, 3, THEME.accent);
  add3DText(slide, 'Project Objectives', {
    x: 0.6, y: 0.75, w: 8, h: 0.6,
    fontSize: 30, fontFace: 'Segoe UI', color: THEME.white, bold: true,
  });

  const objectives = [
    { num: '01', title: 'Graph-Based Network Model', desc: 'Represent all 59 stations and 3 metro lines as a weighted directed graph with typed edges (adjacent, interchange, walking).' },
    { num: '02', title: 'Multi-Objective Route Search', desc: 'Implement 6 routing objectives: fastest, cheapest, fewest interchanges, least walking, shortest distance, and balanced.' },
    { num: '03', title: 'Real Graph Algorithms', desc: 'Use Dijkstra\'s shortest path, Yen\'s k-shortest paths, and transfer-aware BFS — no hardcoded routes.' },
    { num: '04', title: 'Door-to-Door Itinerary', desc: 'Generate complete travel timelines with access walking, timetable-based waiting, and exit walking.' },
    { num: '05', title: 'Fare Estimation', desc: 'Estimate metro fares using HMRL\'s published distance-based slab structure (Rs. 10–60).' },
    { num: '06', title: 'Interactive Visualization', desc: 'Provide a DSA Lab screen that visualizes algorithm execution step-by-step for educational value.' },
  ];

  const colW = (W - 1.8) / 3;
  const rowH = 2.4;
  objectives.forEach((o, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.9 + col * colW;
    const y = 1.8 + row * rowH;

    add3DCard(slide, x, y, colW - 0.2, rowH - 0.2, THEME.bgLight);

    add3DText(slide, o.num, {
      x: x + 0.15, y: y + 0.15, w: 0.7, h: 0.5,
      fontSize: 22, fontFace: 'Segoe UI', color: THEME.accent, bold: true,
    });
    add3DText(slide, o.title, {
      x: x + 0.15, y: y + 0.7, w: colW - 0.5, h: 0.5,
      fontSize: 13, fontFace: 'Segoe UI', color: THEME.white, bold: true,
    });
    add3DText(slide, o.desc, {
      x: x + 0.15, y: y + 1.2, w: colW - 0.5, h: 0.9,
      fontSize: 10, fontFace: 'Segoe UI', color: THEME.midGray,
      lineSpacingMultiple: 1.3,
    });
  });

  addFooter(slide);
  addSlideNumber(slide, 4);
}

// ============================================================
// SLIDE 5: Network Overview
// ============================================================
{
  const slide = pptx.addSlide();
  add3DBackground(slide);

  addAccentBar(slide, 0.6, 0.6, 3, THEME.blue);
  add3DText(slide, 'Hyderabad Metro Network', {
    x: 0.6, y: 0.75, w: 8, h: 0.6,
    fontSize: 30, fontFace: 'Segoe UI', color: THEME.white, bold: true,
  });

  const lines = [
    { name: 'Red Line', route: 'Miyapur to LB Nagar', stations: 27, length: '29.21 km', color: THEME.red },
    { name: 'Blue Line', route: 'Raidurg to Nagole', stations: 23, length: '27.00 km', color: THEME.blue },
    { name: 'Green Line', route: 'JBS Parade Ground to MGBS', stations: 9, length: '11.00 km', color: THEME.green },
  ];

  lines.forEach((l, i) => {
    const x = 0.8 + i * (W - 1.6) / 3;
    const cardW = (W - 1.6) / 3 - 0.25;

    add3DCard(slide, x, 1.9, cardW, 3.5, THEME.bgLight);

    // Line color header
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.03, y: 1.93, w: cardW - 0.06, h: 0.7,
      rectRadius: 0.1,
      fill: { color: l.color },
      line: { type: 'none' },
      shadow: { type: 'outer', color: l.color, blur: 5, offset: 0, opacity: 0.4 },
    });
    add3DText(slide, l.name, {
      x: x + 0.15, y: 1.95, w: cardW - 0.3, h: 0.65,
      fontSize: 18, fontFace: 'Segoe UI', color: THEME.white, bold: true,
      align: 'center', valign: 'middle',
    });

    add3DText(slide, l.route, {
      x: x + 0.2, y: 2.8, w: cardW - 0.4, h: 0.4,
      fontSize: 12, fontFace: 'Segoe UI', color: THEME.lightGray,
      align: 'center',
    });

    // Stats
    const stats = [
      { label: 'Stations', value: String(l.stations) },
      { label: 'Length', value: l.length },
    ];
    stats.forEach((s, j) => {
      const sy = 3.4 + j * 0.9;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: x + 0.3, y: sy, w: cardW - 0.6, h: 0.7,
        rectRadius: 0.08,
        fill: { color: THEME.bgMid },
        line: { color: l.color, width: 0.5 },
      });
      add3DText(slide, s.value, {
        x: x + 0.3, y: sy, w: cardW - 0.6, h: 0.4,
        fontSize: 18, fontFace: 'Segoe UI', color: l.color, bold: true,
        align: 'center', valign: 'middle',
      });
      add3DText(slide, s.label, {
        x: x + 0.3, y: sy + 0.35, w: cardW - 0.6, h: 0.3,
        fontSize: 10, fontFace: 'Segoe UI', color: THEME.midGray,
        align: 'center',
      });
    });
  });

  // Summary card
  add3DCard(slide, 0.8, 5.7, W - 1.6, 0.9, THEME.bgMid);
  add3DText(slide, 'Total: 3 Lines  |  59 Stations  |  67.21 km  |  Key Interchanges: Ameerpet (Red-Blue), Parade Ground (Blue-Green), MGBS (Red-Green)', {
    x: 1.0, y: 5.75, w: W - 2, h: 0.8,
    fontSize: 12, fontFace: 'Segoe UI', color: THEME.accent, bold: true,
    align: 'center', valign: 'middle',
  });

  addFooter(slide);
  addSlideNumber(slide, 5);
}

// ============================================================
// SLIDE 6: Graph Model
// ============================================================
{
  const slide = pptx.addSlide();
  add3DBackground(slide);

  addAccentBar(slide, 0.6, 0.6, 3, THEME.green);
  add3DText(slide, 'Graph Data Model', {
    x: 0.6, y: 0.75, w: 8, h: 0.6,
    fontSize: 30, fontFace: 'Segoe UI', color: THEME.white, bold: true,
  });
  add3DText(slide, 'How the metro network is represented as a weighted graph', {
    x: 0.6, y: 1.3, w: 8, h: 0.35,
    fontSize: 13, fontFace: 'Segoe UI', color: THEME.midGray,
  });

  // Left card: Vertices
  add3DCard(slide, 0.8, 2.0, 5.6, 4.3, THEME.bgLight);
  add3DText(slide, 'Vertices (Nodes)', {
    x: 1.0, y: 2.15, w: 5.2, h: 0.4,
    fontSize: 16, fontFace: 'Segoe UI', color: THEME.green, bold: true,
  });
  const vertexPoints = [
    'Each station on a line = 1 vertex',
    'A station serving N lines = N vertices',
    'Vertex ID format: stationId:lineId',
    'Example: ameerpet:red, ameerpet:blue',
    'Allows precise line-change tracking',
    'Interchange stations are explicitly modeled',
  ];
  vertexPoints.forEach((p, i) => {
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 1.1, y: 2.7 + i * 0.52, w: 0.12, h: 0.12,
      fill: { color: THEME.green }, line: { type: 'none' },
    });
    add3DText(slide, p, {
      x: 1.35, y: 2.62 + i * 0.52, w: 4.8, h: 0.35,
      fontSize: 12, fontFace: 'Segoe UI', color: THEME.lightGray,
    });
  });

  // Right card: Edges
  add3DCard(slide, 6.9, 2.0, 5.6, 4.3, THEME.bgLight);
  add3DText(slide, 'Edges (Connections)', {
    x: 7.1, y: 2.15, w: 5.2, h: 0.4,
    fontSize: 16, fontFace: 'Segoe UI', color: THEME.blue, bold: true,
  });
  const edgeTypes = [
    { type: 'Adjacent', color: THEME.blue, desc: 'Two consecutive stations on the same line' },
    { type: 'Interchange', color: THEME.gold, desc: 'Same station, different line — transfer penalty' },
    { type: 'Walking', color: THEME.red, desc: 'Short out-of-station walking transfer' },
  ];
  edgeTypes.forEach((e, i) => {
    const y = 2.7 + i * 1.0;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 7.1, y, w: 5.2, h: 0.8,
      rectRadius: 0.08,
      fill: { color: THEME.bgMid },
      line: { color: e.color, width: 0.5 },
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 7.25, y: y + 0.25, w: 0.3, h: 0.3,
      fill: { color: e.color }, line: { type: 'none' },
      shadow: { type: 'outer', color: e.color, blur: 3, offset: 0, opacity: 0.4 },
    });
    add3DText(slide, e.type, {
      x: 7.65, y, w: 1.6, h: 0.8,
      fontSize: 13, fontFace: 'Segoe UI', color: e.color, bold: true,
      valign: 'middle',
    });
    // Fix: proper call
  });

  // Edge weights section
  add3DText(slide, 'Edge Weights:', {
    x: 7.1, y: 5.8, w: 2, h: 0.35,
    fontSize: 13, fontFace: 'Segoe UI', color: THEME.white, bold: true,
  });
  add3DText(slide, 'distanceKm  |  timeMin  |  type  |  line', {
    x: 9.0, y: 5.8, w: 3, h: 0.35,
    fontSize: 11, fontFace: 'Consolas', color: THEME.accent,
  });

  addFooter(slide);
  addSlideNumber(slide, 6);
}

// ============================================================
// SLIDE 7: Dijkstra's Algorithm
// ============================================================
{
  const slide = pptx.addSlide();
  add3DBackground(slide);

  addAccentBar(slide, 0.6, 0.6, 3, THEME.accent);
  add3DText(slide, 'Dijkstra\'s Shortest Path Algorithm', {
    x: 0.6, y: 0.75, w: 10, h: 0.6,
    fontSize: 28, fontFace: 'Segoe UI', color: THEME.white, bold: true,
  });

  // Left: Description
  add3DCard(slide, 0.8, 1.9, 5.8, 4.5, THEME.bgLight);
  add3DText(slide, 'Core Algorithm', {
    x: 1.0, y: 2.05, w: 5.4, h: 0.4,
    fontSize: 16, fontFace: 'Segoe UI', color: THEME.accent, bold: true,
  });
  const dijkstraSteps = [
    'Initialize all distances to infinity',
    'Set source distance to 0',
    'Insert source into min-priority queue',
    'Extract minimum vertex, mark as settled',
    'Relax all unsettled neighbors',
    'Update distance if shorter path found',
    'Repeat until all vertices settled',
    'Reconstruct path from destination to source',
  ];
  dijkstraSteps.forEach((s, i) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.05, y: 2.55 + i * 0.45, w: 0.3, h: 0.3,
      rectRadius: 0.05,
      fill: { color: THEME.accentDark },
      line: { color: THEME.accent, width: 0.5 },
    });
    add3DText(slide, String(i + 1), {
      x: 1.05, y: 2.55 + i * 0.45, w: 0.3, h: 0.3,
      fontSize: 10, fontFace: 'Segoe UI', color: THEME.white, bold: true,
      align: 'center', valign: 'middle',
    });
    add3DText(slide, s, {
      x: 1.45, y: 2.52 + i * 0.45, w: 5, h: 0.35,
      fontSize: 11, fontFace: 'Segoe UI', color: THEME.lightGray,
    });
  });

  // Right: Data structures & complexity
  add3DCard(slide, 7.0, 1.9, 5.5, 2.1, THEME.bgLight);
  add3DText(slide, 'Data Structures Used', {
    x: 7.2, y: 2.05, w: 5.1, h: 0.4,
    fontSize: 14, fontFace: 'Segoe UI', color: THEME.green, bold: true,
  });
  const dataStructures = [
    'Adjacency-list graph representation',
    'Min-priority queue (binary heap)',
    'Distance array (Map<vertexId, number>)',
    'Predecessor array (Map<vertexId, string>)',
    'Settled set (Set<vertexId>)',
  ];
  dataStructures.forEach((d, i) => {
    add3DText(slide, '> ' + d, {
      x: 7.2, y: 2.5 + i * 0.3, w: 5.1, h: 0.3,
      fontSize: 11, fontFace: 'Consolas', color: THEME.midGray,
    });
  });

  // Complexity card
  add3DCard(slide, 7.0, 4.2, 5.5, 2.2, THEME.bgMid);
  add3DText(slide, 'Complexity Analysis', {
    x: 7.2, y: 4.35, w: 5.1, h: 0.4,
    fontSize: 14, fontFace: 'Segoe UI', color: THEME.gold, bold: true,
  });
  const complexity = [
    { label: 'Time', value: 'O((V + E) log V)' },
    { label: 'Space', value: 'O(V + E)' },
    { label: 'Weight modes', value: 'time, distance' },
  ];
  complexity.forEach((c, i) => {
    add3DText(slide, c.label + ':', {
      x: 7.2, y: 4.85 + i * 0.45, w: 1.5, h: 0.35,
      fontSize: 12, fontFace: 'Segoe UI', color: THEME.white, bold: true,
    });
    add3DText(slide, c.value, {
      x: 8.8, y: 4.85 + i * 0.45, w: 3.5, h: 0.35,
      fontSize: 12, fontFace: 'Consolas', color: THEME.accent,
    });
  });

  addFooter(slide);
  addSlideNumber(slide, 7);
}

// ============================================================
// SLIDE 8: Yen's K-Shortest Paths
// ============================================================
{
  const slide = pptx.addSlide();
  add3DBackground(slide);

  addAccentBar(slide, 0.6, 0.6, 3, THEME.gold);
  add3DText(slide, 'Yen\'s K-Shortest Paths Algorithm', {
    x: 0.6, y: 0.75, w: 10, h: 0.6,
    fontSize: 26, fontFace: 'Segoe UI', color: THEME.white, bold: true,
  });
  add3DText(slide, 'Finding multiple alternative routes for user choice', {
    x: 0.6, y: 1.3, w: 8, h: 0.35,
    fontSize: 13, fontFace: 'Segoe UI', color: THEME.midGray,
  });

  // Left: How it works
  add3DCard(slide, 0.8, 1.9, 5.8, 4.5, THEME.bgLight);
  add3DText(slide, 'How It Works', {
    x: 1.0, y: 2.05, w: 5.4, h: 0.4,
    fontSize: 16, fontFace: 'Segoe UI', color: THEME.gold, bold: true,
  });
  const yenSteps = [
    'Find shortest path using Dijkstra',
    'For each node on the best path:',
    '  Spur from that node (deviate)',
    '  Remove used edges and root vertices',
    '  Run Dijkstra on modified graph',
    '  Collect candidate paths',
    'Pick lowest-cost candidate as next path',
    'Repeat until K paths found',
  ];
  yenSteps.forEach((s, i) => {
    const isSub = s.startsWith('  ');
    add3DText(slide, (isSub ? '' : '> ') + s.trim(), {
      x: isSub ? 1.5 : 1.05, y: 2.55 + i * 0.45, w: 5, h: 0.35,
      fontSize: 11, fontFace: 'Consolas', color: isSub ? THEME.dimGray : THEME.lightGray,
    });
  });

  // Right: Why K paths?
  add3DCard(slide, 7.0, 1.9, 5.5, 4.5, THEME.bgLight);
  add3DText(slide, 'Why Multiple Paths?', {
    x: 7.2, y: 2.05, w: 5.1, h: 0.4,
    fontSize: 16, fontFace: 'Segoe UI', color: THEME.accent, bold: true,
  });
  const reasons = [
    { title: 'User Choice', desc: 'Present 3–5 route options, not just one' },
    { title: 'Balanced Objective', desc: 'Score alternatives across time, cost, transfers' },
    { title: 'Trade-off Visibility', desc: 'Show a faster vs cheaper vs easier route' },
    { title: 'Robustness', desc: 'Fallback routes if preferred path is disrupted' },
  ];
  reasons.forEach((r, i) => {
    const y = 2.6 + i * 0.9;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 7.15, y, w: 5.2, h: 0.75,
      rectRadius: 0.08,
      fill: { color: THEME.bgMid },
      line: { color: THEME.gold, width: 0.4 },
    });
    add3DText(slide, r.title, {
      x: 7.3, y, w: 2, h: 0.75,
      fontSize: 12, fontFace: 'Segoe UI', color: THEME.gold, bold: true,
      valign: 'middle',
    });
    // Fix below
  });

  // Reference
  add3DCard(slide, 7.0, 6.0, 5.5, 0.5, THEME.bgMid);
  add3DText(slide, 'Reference: Yen, J.Y. (1971). Management Science.', {
    x: 7.2, y: 6.05, w: 5.1, h: 0.4,
    fontSize: 10, fontFace: 'Segoe UI', color: THEME.dimGray, italic: true,
    valign: 'middle',
  });

  addFooter(slide);
  addSlideNumber(slide, 8);
}

// ============================================================
// SLIDE 9: Route Objectives (6 objectives)
// ============================================================
{
  const slide = pptx.addSlide();
  add3DBackground(slide);

  addAccentBar(slide, 0.6, 0.6, 3, THEME.red);
  add3DText(slide, 'Six Route Optimization Objectives', {
    x: 0.6, y: 0.75, w: 10, h: 0.6,
    fontSize: 28, fontFace: 'Segoe UI', color: THEME.white, bold: true,
  });

  const objectives = [
    { name: 'Fastest', icon: 'G', color: THEME.red, algo: 'Dijkstra (time weight)', desc: 'Minimize total travel time' },
    { name: 'Cheapest', icon: 'W', color: THEME.green, algo: 'Dijkstra (fare slab)', desc: 'Minimize estimated fare' },
    { name: 'Fewest Changes', icon: 'S', color: THEME.blue, algo: 'Lexicographic BFS', desc: 'Minimize line transfers' },
    { name: 'Least Walking', icon: 'F', color: THEME.gold, algo: 'Dijkstra (walk weight)', desc: 'Minimize walking distance' },
    { name: 'Shortest', icon: 'R', color: THEME.accent, algo: 'Dijkstra (distance)', desc: 'Minimize track distance' },
    { name: 'Balanced', icon: '=', color: THEME.accentDark, algo: 'K-shortest + scoring', desc: 'Weighted multi-criteria' },
  ];

  const cardW = 3.7;
  const cardH = 2.3;
  const gapX = 0.3;
  const gapY = 0.25;
  const startX = (W - (cardW * 3 + gapX * 2)) / 2;
  const startY = 1.7;

  objectives.forEach((o, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    add3DCard(slide, x, y, cardW, cardH, THEME.bgLight);

    // Icon circle
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.15 + 0.03, y: y + 0.2 + 0.03, w: 0.55, h: 0.55,
      fill: { color: THEME.shadowDark }, line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.15, y: y + 0.2, w: 0.55, h: 0.55,
      fill: { color: o.color },
      line: { color: THEME.white, width: 0.5 },
      shadow: { type: 'outer', color: o.color, blur: 4, offset: 0, opacity: 0.4 },
    });
    add3DText(slide, o.icon, {
      x: x + 0.15, y: y + 0.2, w: 0.55, h: 0.55,
      fontSize: 16, fontFace: 'Segoe UI', color: THEME.white, bold: true,
      align: 'center', valign: 'middle',
    });

    add3DText(slide, o.name, {
      x: x + 0.85, y: y + 0.2, w: cardW - 1.0, h: 0.35,
      fontSize: 15, fontFace: 'Segoe UI', color: THEME.white, bold: true,
      valign: 'middle',
    });
    add3DText(slide, o.desc, {
      x: x + 0.85, y: y + 0.55, w: cardW - 1.0, h: 0.25,
      fontSize: 10, fontFace: 'Segoe UI', color: THEME.midGray,
    });

    // Algorithm badge
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.2, y: y + 1.0, w: cardW - 0.4, h: 0.45,
      rectRadius: 0.06,
      fill: { color: THEME.bgMid },
      line: { color: o.color, width: 0.5 },
    });
    add3DText(slide, o.algo, {
      x: x + 0.2, y: y + 1.0, w: cardW - 0.4, h: 0.45,
      fontSize: 10, fontFace: 'Consolas', color: o.color, bold: true,
      align: 'center', valign: 'middle',
    });

    // Balanced weights note for balanced objective
    if (o.name === 'Balanced') {
      add3DText(slide, 'Weights: Time 35% | Cost 25% | Transfers 25% | Walking 15%', {
        x: x + 0.2, y: y + 1.55, w: cardW - 0.4, h: 0.3,
        fontSize: 8, fontFace: 'Segoe UI', color: THEME.dimGray,
        align: 'center',
      });
    }
  });

  addFooter(slide);
  addSlideNumber(slide, 9);
}

// ============================================================
// SLIDE 10: Fare Model
// ============================================================
{
  const slide = pptx.addSlide();
  add3DBackground(slide);

  addAccentBar(slide, 0.6, 0.6, 3, THEME.green);
  add3DText(slide, 'Fare Estimation Model', {
    x: 0.6, y: 0.75, w: 8, h: 0.6,
    fontSize: 30, fontFace: 'Segoe UI', color: THEME.white, bold: true,
  });
  add3DText(slide, 'Based on HMRL published distance-based slab structure', {
    x: 0.6, y: 1.3, w: 8, h: 0.35,
    fontSize: 13, fontFace: 'Segoe UI', color: THEME.midGray,
  });

  // Fare slab table
  add3DCard(slide, 0.8, 1.9, 7.2, 4.5, THEME.bgLight);
  add3DText(slide, 'Fare Slab Structure', {
    x: 1.0, y: 2.05, w: 6.8, h: 0.4,
    fontSize: 16, fontFace: 'Segoe UI', color: THEME.green, bold: true,
  });

  const slabs = [
    { dist: '0 – 2 km', fare: 'Rs. 10' },
    { dist: '2 – 4 km', fare: 'Rs. 15' },
    { dist: '4 – 6 km', fare: 'Rs. 20' },
    { dist: '6 – 8 km', fare: 'Rs. 25' },
    { dist: '8 – 10 km', fare: 'Rs. 30' },
    { dist: '10 – 14 km', fare: 'Rs. 35' },
    { dist: '14 – 18 km', fare: 'Rs. 40' },
    { dist: '18 – 22 km', fare: 'Rs. 45' },
    { dist: '22 – 26 km', fare: 'Rs. 50' },
    { dist: '26 – 30 km', fare: 'Rs. 55' },
    { dist: '30+ km', fare: 'Rs. 60' },
  ];

  // Table header
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.0, y: 2.55, w: 6.8, h: 0.4,
    rectRadius: 0.05,
    fill: { color: THEME.green },
    line: { type: 'none' },
  });
  add3DText(slide, 'Distance Range', {
    x: 1.2, y: 2.55, w: 3, h: 0.4,
    fontSize: 12, fontFace: 'Segoe UI', color: THEME.white, bold: true,
    valign: 'middle',
  });
  add3DText(slide, 'Fare', {
    x: 5.0, y: 2.55, w: 2, h: 0.4,
    fontSize: 12, fontFace: 'Segoe UI', color: THEME.white, bold: true,
    valign: 'middle',
  });

  slabs.forEach((s, i) => {
    const y = 3.0 + i * 0.3;
    const isAlt = i % 2 === 0;
    slide.addShape(pptx.ShapeType.rect, {
      x: 1.0, y, w: 6.8, h: 0.28,
      fill: { color: isAlt ? THEME.bgMid : THEME.bgLight },
      line: { type: 'none' },
    });
    add3DText(slide, s.dist, {
      x: 1.2, y, w: 3, h: 0.28,
      fontSize: 10, fontFace: 'Segoe UI', color: THEME.lightGray,
      valign: 'middle',
    });
    add3DText(slide, s.fare, {
      x: 5.0, y, w: 2, h: 0.28,
      fontSize: 10, fontFace: 'Segoe UI', color: THEME.green, bold: true,
      valign: 'middle',
    });
  });

  // Right: Key points
  add3DCard(slide, 8.3, 1.9, 4.2, 4.5, THEME.bgLight);
  add3DText(slide, 'Key Properties', {
    x: 8.5, y: 2.05, w: 3.8, h: 0.4,
    fontSize: 14, fontFace: 'Segoe UI', color: THEME.accent, bold: true,
  });
  const props = [
    'Distance-based, not line-based',
    'Same fare regardless of route taken',
    'Fare depends only on total km traveled',
    'Slab boundaries from HMRL published data',
    'Minimum: Rs. 10 (up to 2 km)',
    'Maximum: Rs. 60 (30+ km)',
    'Cheapest objective meaningful with first/last mile costs',
  ];
  props.forEach((p, i) => {
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 8.55, y: 2.65 + i * 0.52, w: 0.1, h: 0.1,
      fill: { color: THEME.green }, line: { type: 'none' },
    });
    add3DText(slide, p, {
      x: 8.75, y: 2.58 + i * 0.52, w: 3.5, h: 0.45,
      fontSize: 10, fontFace: 'Segoe UI', color: THEME.lightGray,
      lineSpacingMultiple: 1.2,
    });
  });

  addFooter(slide);
  addSlideNumber(slide, 10);
}

// ============================================================
// SLIDE 11: Door-to-Door Itinerary
// ============================================================
{
  const slide = pptx.addSlide();
  add3DBackground(slide);

  addAccentBar(slide, 0.6, 0.6, 3, THEME.blue);
  add3DText(slide, 'Door-to-Door Itinerary Planning', {
    x: 0.6, y: 0.75, w: 10, h: 0.6,
    fontSize: 28, fontFace: 'Segoe UI', color: THEME.white, bold: true,
  });

  // Timeline steps
  const steps = [
    { type: 'Access Walk', desc: 'Walk from start address to boarding station', color: THEME.gold, icon: 'W' },
    { type: 'Wait', desc: 'Wait for next train based on timetable', color: THEME.midGray, icon: 'C' },
    { type: 'Board', desc: 'Board the first metro line', color: THEME.blue, icon: 'B' },
    { type: 'Ride', desc: 'Travel along the metro line', color: THEME.green, icon: 'R' },
    { type: 'Interchange', desc: 'Transfer between lines at interchange station', color: THEME.red, icon: 'T' },
    { type: 'Exit Walk', desc: 'Walk from exit station to final destination', color: THEME.gold, icon: 'W' },
  ];

  steps.forEach((s, i) => {
    const x = 0.6 + i * (W - 1.2) / 6;
    const w = (W - 1.2) / 6 - 0.15;

    // Connecting line (except after last)
    if (i < steps.length - 1) {
      slide.addShape(pptx.ShapeType.rect, {
        x: x + w + 0.02, y: 2.75, w: 0.13, h: 0.06,
        fill: { color: THEME.dimGray }, line: { type: 'none' },
      });
    }

    // Step card
    add3DCard(slide, x, 2.2, w, 3.0, THEME.bgLight);

    // Icon circle
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + w / 2 - 0.35 + 0.03, y: 2.4 + 0.03, w: 0.7, h: 0.7,
      fill: { color: THEME.shadowDark }, line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + w / 2 - 0.35, y: 2.4, w: 0.7, h: 0.7,
      fill: { color: s.color },
      line: { color: THEME.white, width: 0.5 },
      shadow: { type: 'outer', color: s.color, blur: 5, offset: 0, opacity: 0.5 },
    });
    add3DText(slide, s.icon, {
      x: x + w / 2 - 0.35, y: 2.4, w: 0.7, h: 0.7,
      fontSize: 18, fontFace: 'Segoe UI', color: THEME.white, bold: true,
      align: 'center', valign: 'middle',
    });

    add3DText(slide, s.type, {
      x: x + 0.1, y: 3.25, w: w - 0.2, h: 0.35,
      fontSize: 11, fontFace: 'Segoe UI', color: s.color, bold: true,
      align: 'center',
    });
    add3DText(slide, s.desc, {
      x: x + 0.1, y: 3.65, w: w - 0.2, h: 1.2,
      fontSize: 9, fontFace: 'Segoe UI', color: THEME.midGray,
      align: 'center', lineSpacingMultiple: 1.3,
    });
  });

  // Bottom: outputs
  add3DCard(slide, 0.8, 5.6, W - 1.6, 0.9, THEME.bgMid);
  add3DText(slide, 'Outputs:  Leave Time  |  Board Time  |  Arrival Time  |  Total Duration  |  Walking Distance  |  Total Cost (Metro + First/Last Mile)', {
    x: 1.0, y: 5.65, w: W - 2, h: 0.8,
    fontSize: 11, fontFace: 'Segoe UI', color: THEME.accent, bold: true,
    align: 'center', valign: 'middle',
  });

  addFooter(slide);
  addSlideNumber(slide, 11);
}

// ============================================================
// SLIDE 12: Timetable & Walking Model
// ============================================================
{
  const slide = pptx.addSlide();
  add3DBackground(slide);

  addAccentBar(slide, 0.6, 0.6, 3, THEME.gold);
  add3DText(slide, 'Timetable & Walking Estimation', {
    x: 0.6, y: 0.75, w: 10, h: 0.6,
    fontSize: 28, fontFace: 'Segoe UI', color: THEME.white, bold: true,
  });

  // Left: Timetable
  add3DCard(slide, 0.8, 1.9, 5.6, 4.5, THEME.bgLight);
  add3DText(slide, 'Simulated Timetable', {
    x: 1.0, y: 2.05, w: 5.2, h: 0.4,
    fontSize: 16, fontFace: 'Segoe UI', color: THEME.gold, bold: true,
  });
  add3DText(slide, 'Operating Hours: 06:30 – 22:00', {
    x: 1.0, y: 2.5, w: 5.2, h: 0.35,
    fontSize: 12, fontFace: 'Segoe UI', color: THEME.lightGray,
  });

  const timetableData = [
    { line: 'Red Line', headway: '3–5 min', color: THEME.red },
    { line: 'Blue Line', headway: '4–6 min', color: THEME.blue },
    { line: 'Green Line', headway: '5–8 min', color: THEME.green },
  ];
  timetableData.forEach((t, i) => {
    const y = 3.1 + i * 0.7;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.1, y, w: 5.0, h: 0.55,
      rectRadius: 0.08,
      fill: { color: THEME.bgMid },
      line: { color: t.color, width: 0.5 },
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 1.25, y: y + 0.15, w: 0.25, h: 0.25,
      fill: { color: t.color }, line: { type: 'none' },
    });
    add3DText(slide, t.line, {
      x: 1.6, y, w: 2.5, h: 0.55,
      fontSize: 12, fontFace: 'Segoe UI', color: THEME.white, bold: true,
      valign: 'middle',
    });
    add3DText(slide, 'Headway: ' + t.headway, {
      x: 4.0, y, w: 2, h: 0.55,
      fontSize: 11, fontFace: 'Segoe UI', color: t.color,
      valign: 'middle',
    });
  });

  add3DText(slide, 'Note: HMRL GTFS data requires request form access. Timetable is simulated with realistic headways for demonstration.', {
    x: 1.0, y: 5.4, w: 5.2, h: 0.8,
    fontSize: 10, fontFace: 'Segoe UI', color: THEME.dimGray, italic: true,
    lineSpacingMultiple: 1.3,
  });

  // Right: Walking model
  add3DCard(slide, 7.0, 1.9, 5.5, 4.5, THEME.bgLight);
  add3DText(slide, 'Walking Estimation', {
    x: 7.2, y: 2.05, w: 5.1, h: 0.4,
    fontSize: 16, fontFace: 'Segoe UI', color: THEME.green, bold: true,
  });

  const walkPoints = [
    { label: 'Average walking speed', value: '5 km/h' },
    { label: 'Walking distance', value: 'speed x time' },
    { label: 'Interchange penalty', value: '5 minutes' },
    { label: 'Access walk', value: 'User input or estimated' },
    { label: 'Exit walk', value: 'User input or estimated' },
  ];
  walkPoints.forEach((w, i) => {
    const y = 2.7 + i * 0.65;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 7.15, y, w: 5.2, h: 0.5,
      rectRadius: 0.06,
      fill: { color: THEME.bgMid },
      line: { color: THEME.green, width: 0.4 },
    });
    add3DText(slide, w.label, {
      x: 7.3, y, w: 2.8, h: 0.5,
      fontSize: 11, fontFace: 'Segoe UI', color: THEME.lightGray,
      valign: 'middle',
    });
    add3DText(slide, w.value, {
      x: 10.1, y, w: 2.1, h: 0.5,
      fontSize: 11, fontFace: 'Consolas', color: THEME.green, bold: true,
      valign: 'middle',
    });
  });

  add3DText(slide, 'No GPS or map API used. All walking estimates are simulated for demonstration.', {
    x: 7.2, y: 5.9, w: 5.1, h: 0.4,
    fontSize: 10, fontFace: 'Segoe UI', color: THEME.dimGray, italic: true,
  });

  addFooter(slide);
  addSlideNumber(slide, 12);
}

// ============================================================
// SLIDE 13: Application Features
// ============================================================
{
  const slide = pptx.addSlide();
  add3DBackground(slide);

  addAccentBar(slide, 0.6, 0.6, 3, THEME.accent);
  add3DText(slide, 'Application Features', {
    x: 0.6, y: 0.75, w: 8, h: 0.6,
    fontSize: 30, fontFace: 'Segoe UI', color: THEME.white, bold: true,
  });

  const features = [
    { title: 'Plan Journey', desc: 'Select source, destination, departure time, and routing objective with a clean, intuitive interface.', color: THEME.accent },
    { title: 'Route Results', desc: 'View multiple route options with metrics: time, distance, fare, transfers, and walking distance.', color: THEME.blue },
    { title: 'Network Map', desc: 'Explore the full Hyderabad Metro network map with all 3 lines and 59 stations.', color: THEME.green },
    { title: 'DSA Lab', desc: 'Step-by-step visualization of Dijkstra, priority queue, and k-shortest paths algorithm execution.', color: THEME.gold },
    { title: 'Graph Inspector', desc: 'Inspect vertices, edges, and adjacency lists of the metro graph data model.', color: THEME.red },
    { title: 'Route Comparison', desc: 'Side-by-side comparison report of all candidate routes across every metric.', color: THEME.accentDark },
    { title: 'Door-to-Door', desc: 'Optional first/last mile walking and cost inputs for complete journey planning.', color: THEME.green },
    { title: 'Itinerary Timeline', desc: 'Detailed timeline with timestamps for each step: walk, wait, board, ride, transfer.', color: THEME.blue },
  ];

  const cardW = 2.8;
  const cardH = 2.0;
  const gapX = 0.3;
  const gapY = 0.25;
  const startX = (W - (cardW * 4 + gapX * 3)) / 2;
  const startY = 1.7;

  features.forEach((f, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    add3DCard(slide, x, y, cardW, cardH, THEME.bgLight);

    // Color accent top
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.02, y: y + 0.02, w: cardW - 0.04, h: 0.08,
      rectRadius: 0.04,
      fill: { color: f.color },
      line: { type: 'none' },
    });

    add3DText(slide, f.title, {
      x: x + 0.2, y: y + 0.3, w: cardW - 0.4, h: 0.4,
      fontSize: 13, fontFace: 'Segoe UI', color: f.color, bold: true,
    });
    add3DText(slide, f.desc, {
      x: x + 0.2, y: y + 0.75, w: cardW - 0.4, h: 1.0,
      fontSize: 10, fontFace: 'Segoe UI', color: THEME.midGray,
      lineSpacingMultiple: 1.3,
    });
  });

  addFooter(slide);
  addSlideNumber(slide, 13);
}

// ============================================================
// SLIDE 14: Tech Stack
// ============================================================
{
  const slide = pptx.addSlide();
  add3DBackground(slide);

  addAccentBar(slide, 0.6, 0.6, 3, THEME.blue);
  add3DText(slide, 'Technology Stack', {
    x: 0.6, y: 0.75, w: 8, h: 0.6,
    fontSize: 30, fontFace: 'Segoe UI', color: THEME.white, bold: true,
  });

  const stack = [
    { layer: 'Frontend Framework', tech: 'React 18', desc: 'Component-based UI with hooks for state management', color: THEME.accent },
    { layer: 'Language', tech: 'TypeScript 5', desc: 'Type-safe code with interfaces for all graph and routing types', color: THEME.blue },
    { layer: 'Build Tool', tech: 'Vite 7', desc: 'Fast development server and optimized production builds', color: THEME.green },
    { layer: 'Styling', tech: 'Tailwind CSS 3', desc: 'Utility-first CSS framework for responsive, consistent design', color: THEME.gold },
    { layer: 'Icons', tech: 'Lucide React', desc: 'Clean, modern SVG icon set for UI elements', color: THEME.red },
    { layer: 'Backend', tech: 'Supabase', desc: 'PostgreSQL database with Row Level Security for data persistence', color: THEME.accentDark },
  ];

  const cardW = 3.7;
  const cardH = 2.3;
  const gapX = 0.3;
  const gapY = 0.25;
  const startX = (W - (cardW * 3 + gapX * 2)) / 2;
  const startY = 1.8;

  stack.forEach((s, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    add3DCard(slide, x, y, cardW, cardH, THEME.bgLight);

    add3DText(slide, s.layer, {
      x: x + 0.2, y: y + 0.2, w: cardW - 0.4, h: 0.3,
      fontSize: 11, fontFace: 'Segoe UI', color: THEME.midGray, bold: true,
    });
    add3DText(slide, s.tech, {
      x: x + 0.2, y: y + 0.55, w: cardW - 0.4, h: 0.5,
      fontSize: 18, fontFace: 'Segoe UI', color: s.color, bold: true,
    });
    add3DText(slide, s.desc, {
      x: x + 0.2, y: y + 1.15, w: cardW - 0.4, h: 0.9,
      fontSize: 10, fontFace: 'Segoe UI', color: THEME.lightGray,
      lineSpacingMultiple: 1.3,
    });

    // Color accent bottom
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.02, y: y + cardH - 0.1, w: cardW - 0.04, h: 0.08,
      rectRadius: 0.04,
      fill: { color: s.color },
      line: { type: 'none' },
    });
  });

  addFooter(slide);
  addSlideNumber(slide, 14);
}

// ============================================================
// SLIDE 15: Project Architecture / Data Flow
// ============================================================
{
  const slide = pptx.addSlide();
  add3DBackground(slide);

  addAccentBar(slide, 0.6, 0.6, 3, THEME.green);
  add3DText(slide, 'System Architecture & Data Flow', {
    x: 0.6, y: 0.75, w: 10, h: 0.6,
    fontSize: 26, fontFace: 'Segoe UI', color: THEME.white, bold: true,
  });

  // Flow diagram with 3D cards
  const flow = [
    { label: 'User Input', desc: 'Source, destination,\ntime, objective', color: THEME.accent },
    { label: 'Graph Builder', desc: 'Build adjacency list\nfrom station data', color: THEME.blue },
    { label: 'Route Engine', desc: 'Dijkstra / Yen\'s /\nTransfer BFS', color: THEME.green },
    { label: 'Fare & Timetable', desc: 'Fare slabs +\nsimulated schedule', color: THEME.gold },
    { label: 'Itinerary', desc: 'Door-to-door\ntimeline + metrics', color: THEME.red },
    { label: 'UI Display', desc: 'Route cards, maps,\ncomparison report', color: THEME.accentDark },
  ];

  const cardW = 1.75;
  const cardH = 2.2;
  const gap = 0.22;
  const totalW = cardW * 6 + gap * 5;
  const startX = (W - totalW) / 2;
  const startY = 2.3;

  flow.forEach((f, i) => {
    const x = startX + i * (cardW + gap);

    // Arrow between cards
    if (i < flow.length - 1) {
      slide.addShape(pptx.ShapeType.rightArrow, {
        x: x + cardW + 0.01, y: startY + cardH / 2 - 0.08, w: gap - 0.02, h: 0.16,
        fill: { color: THEME.dimGray }, line: { type: 'none' },
      });
    }

    add3DCard(slide, x, startY, cardW, cardH, THEME.bgLight);

    // Color header
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.02, y: startY + 0.02, w: cardW - 0.04, h: 0.5,
      rectRadius: 0.08,
      fill: { color: f.color },
      line: { type: 'none' },
    });
    add3DText(slide, f.label, {
      x: x + 0.05, y: startY + 0.02, w: cardW - 0.1, h: 0.5,
      fontSize: 11, fontFace: 'Segoe UI', color: THEME.white, bold: true,
      align: 'center', valign: 'middle',
    });

    add3DText(slide, f.desc, {
      x: x + 0.1, y: startY + 0.7, w: cardW - 0.2, h: 1.3,
      fontSize: 9, fontFace: 'Segoe UI', color: THEME.midGray,
      align: 'center', valign: 'middle', lineSpacingMultiple: 1.3,
    });

    // Step number
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + cardW / 2 - 0.18, y: startY + cardH - 0.35, w: 0.35, h: 0.35,
      fill: { color: f.color },
      line: { color: THEME.white, width: 0.5 },
    });
    add3DText(slide, String(i + 1), {
      x: x + cardW / 2 - 0.18, y: startY + cardH - 0.35, w: 0.35, h: 0.35,
      fontSize: 12, fontFace: 'Segoe UI', color: THEME.white, bold: true,
      align: 'center', valign: 'middle',
    });
  });

  // Bottom summary
  add3DCard(slide, 0.8, 5.0, W - 1.6, 1.3, THEME.bgMid);
  add3DText(slide, 'Key Design Principles', {
    x: 1.0, y: 5.1, w: W - 2, h: 0.35,
    fontSize: 13, fontFace: 'Segoe UI', color: THEME.accent, bold: true,
  });
  add3DText(slide, 'Type-safe graph model separated from UI  |  Deterministic algorithms with execution traces  |  No hardcoded routes — everything computed from edge weights  |  Data provenance clearly labeled (verified vs simulated)', {
    x: 1.0, y: 5.5, w: W - 2, h: 0.7,
    fontSize: 11, fontFace: 'Segoe UI', color: THEME.lightGray,
    align: 'center', valign: 'middle', lineSpacingMultiple: 1.4,
  });

  addFooter(slide);
  addSlideNumber(slide, 15);
}

// ============================================================
// SLIDE 16: Thank You
// ============================================================
{
  const slide = pptx.addSlide();
  slide.background = { color: THEME.bgDark };

  // Full background
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: W, h: H,
    fill: { color: THEME.bgDark },
    line: { type: 'none' },
  });

  // Large 3D center card
  add3DCard(slide, 2.5, 1.8, W - 5, 3.9, THEME.bgMid);

  // Accent bar
  addAccentBar(slide, W / 2 - 1.5, 2.1, 3, THEME.accent);

  // Thank You text
  add3DText(slide, 'Thank You', {
    x: 2.5, y: 2.4, w: W - 5, h: 1.2,
    fontSize: 54, fontFace: 'Segoe UI', color: THEME.white, bold: true,
    align: 'center', valign: 'middle',
  });

  add3DText(slide, 'Hyderabad Metro Journey Planner', {
    x: 2.5, y: 3.6, w: W - 5, h: 0.6,
    fontSize: 20, fontFace: 'Segoe UI', color: THEME.accent,
    align: 'center', valign: 'middle',
  });

  add3DText(slide, 'Questions & Discussion', {
    x: 2.5, y: 4.3, w: W - 5, h: 0.5,
    fontSize: 14, fontFace: 'Segoe UI', color: THEME.midGray, italic: true,
    align: 'center', valign: 'middle',
  });

  // Metro line dots at bottom
  addMetroLineDots(slide, 5.2);

  // Team names
  add3DText(slide, 'Vanisha  |  Rachna  |  Akriti  |  Rohith Sai Gowd', {
    x: 0, y: 6.2, w: W, h: 0.4,
    fontSize: 12, fontFace: 'Segoe UI', color: THEME.dimGray,
    align: 'center', valign: 'middle',
  });
}

// --- Generate ---
const outPath = 'Hyderabad-Metro-Presentation.pptx';
pptx.writeFile({ fileName: outPath }).then(() => {
  console.log('Generated: ' + outPath);
}).catch((err) => {
  console.error('Error:', err);
});
