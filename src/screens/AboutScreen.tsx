import { Database, Info, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/Card';
import { ScreenHeader } from '@/components/ScreenHeader';
import { DataDisclaimer } from '@/components/DataDisclaimer';

export function AboutScreen() {
  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader
        title="About & Data Sources"
        subtitle="Project context, methodology, and where the data comes from."
        icon={<Info className="h-5 w-5" />}
      />

      <Card className="p-5">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Info className="h-4 w-4 text-blue-600" />
          Project overview
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Smart Metro is a college project that demonstrates genuine Data
          Structures and Algorithms through a realistic transit application. It
          models the Hyderabad Metro as a weighted graph and will compute routes
          using shortest-path algorithms — never hardcoded or random outputs.
        </p>
      </Card>

      <Card className="p-5">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Database className="h-4 w-4 text-blue-600" />
          Data sources
        </h3>
        <ul className="mt-2 space-y-2 text-sm text-slate-600">
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            Station names, line assignments, and interchange relationships are
            based on the operational Hyderabad Metro Phase 1 network published
            by HMRL and L&amp;T Metro Rail (Wikipedia&apos;s
            &ldquo;List of Hyderabad Metro stations&rdquo; used as a reference
            compilation).
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            Inter-station distances and travel times are{' '}
            <strong>simulated estimates</strong> for academic demonstration.
            Official HMRL timetable data is not used.
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            The graph structure (nodes, edges, weights) is the dataset the
            routing algorithms operate on.
          </li>
        </ul>
      </Card>

      <Card className="p-5">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          Engineering approach
        </h3>
        <ul className="mt-2 space-y-2 text-sm text-slate-600">
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            Metro data, routing logic, and UI are kept in separate layers so the
            algorithm can be tested independently of the interface.
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            A single shared TypeScript model describes stations, edges, routes,
            and journey results across the whole app.
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            Phase 1 delivers the full application shell with a clearly labelled
            empty route state — no fake results are ever shown.
          </li>
        </ul>
      </Card>

      <DataDisclaimer />
    </div>
  );
}
