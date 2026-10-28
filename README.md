# Hyderabad Metro Journey Planner

An interactive journey planner for the Hyderabad Metro Rail network, built with React, TypeScript, Vite, and Tailwind CSS. The app uses real graph algorithms — Dijkstra's shortest path, Yen's k-shortest paths, and transfer-aware BFS — to find optimal routes across all three metro lines (Red, Blue, Green).

## Features

- **Multi-objective route search** — fastest, cheapest, fewest interchanges, least walking, shortest distance, or a balanced weighted score.
- **Door-to-door planning** — optional first/last mile walking and cost estimates for a complete itinerary.
- **Fare estimation** — distance-based slab pricing matching Hyderabad Metro fare structure.
- **Timetable-aware** — departure time input influences travel time estimates.
- **Official route map** — the Network screen displays the original Hyderabad Metro Rail route map unchanged.
- **DSA Lab** — an educational screen visualising the algorithms (Dijkstra, priority queue, k-shortest paths) behind the route engine.
- **Route comparison report** — side-by-side comparison of multiple route options with time, cost, transfers, and walking metrics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Language | TypeScript 5 |
| Build tool | Vite 7 |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| Backend | Supabase (optional, for data persistence) |

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build

```bash
npm run build
```

The production build will be in the `dist/` directory.

### Type Checking & Linting

```bash
npm run typecheck
npm run lint
```

## Project Structure

```
src/
├── components/        # Reusable UI components (cards, buttons, maps, selectors)
├── data/              # Metro station/line data, graph builder, provenance
├── routing/           # Route engine: Dijkstra, k-shortest paths, BFS, fares, timetable
├── screens/           # Top-level views (Home, Results, Network, DSA Lab, About)
├── types/             # TypeScript type definitions
└── App.tsx            # Root component with navigation
```

## Deployment via GitHub Pages

This project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys the app to GitHub Pages whenever code is pushed to the `main` branch.

### Setup steps

1. Push this repository to GitHub.
2. Go to **Settings > Pages** in your repository.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. Push to `main` — the workflow will build and deploy automatically.
5. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

## Data Sources

- Station names, line colours, and the route map are sourced from Hyderabad Metro Rail (HMRL / LT Metro) public materials.
- Fare slabs are based on published Hyderabad Metro fare structure.
- Timetable and walking estimates are simulated for demonstration purposes.

## License

MIT — see [LICENSE](./LICENSE).
