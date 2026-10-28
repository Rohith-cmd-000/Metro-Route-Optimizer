import { Card } from '@/components/Card';

const OFFICIAL_ROUTE_MAP_IMAGE = 'https://ltmetro.com/wp-content/uploads/2024/12/Hyderabad-Metro-Rail-Network-Map-scaled-legend-bottom.jpg';

export function OriginalRouteMap() {
  return (
    <Card className="overflow-hidden p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Hyderabad Metro Route Map</h3>
          <p className="mt-1 text-sm text-slate-500">Official route map shown in its original format.</p>
        </div>
        <a
          href={OFFICIAL_ROUTE_MAP_IMAGE}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          View full-size map
        </a>
      </div>

      <div className="mt-4 overflow-auto rounded-xl border border-slate-200 bg-white">
        <img
          src={OFFICIAL_ROUTE_MAP_IMAGE}
          alt="Official Hyderabad Metro route map"
          className="block h-auto min-w-[760px] w-full"
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        Source: Hyderabad Metro Rail. The original artwork and station labels are preserved exactly as published.
      </p>
    </Card>
  );
}
