import { Info } from 'lucide-react';

export function DataDisclaimer() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <p>
        Station names, line assignments, and interchange topology are{' '}
        <strong>verified</strong> against published HMRL / L&amp;T Metro Rail
        references. Inter-station distances and travel times are{' '}
        <strong>simulated estimates</strong> for academic demonstration of data
        structures and algorithms — not official HMRL timetable data. See the
        Graph Explorer for full source attribution.
      </p>
    </div>
  );
}
