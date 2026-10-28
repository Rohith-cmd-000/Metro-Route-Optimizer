import { useState } from 'react';
import { Header } from '@/components/Header';
import { type ScreenId } from '@/components/navItems';
import { planDoorToDoorJourney } from '@/routing/journeyPlanner';
import { AboutScreen } from '@/screens/AboutScreen';
import { DsaScreen } from '@/screens/DsaScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { NetworkScreen } from '@/screens/NetworkScreen';
import { ResultsScreen } from '@/screens/ResultsScreen';
import type { DoorToDoorItinerary, JourneyRequest, RoutingOutcome } from '@/types/metro';

function App() {
  const [screen, setScreen] = useState<ScreenId>('home');
  const [request, setRequest] = useState<JourneyRequest | null>(null);
  const [outcome, setOutcome] = useState<RoutingOutcome | null>(null);
  const [itineraries, setItineraries] = useState<DoorToDoorItinerary[]>([]);
  const [loading, setLoading] = useState(false);

  function handleFindRoutes(req: JourneyRequest) {
    setRequest(req);
    setLoading(true);
    setOutcome(null);
    setItineraries([]);
    // Simulate a brief loading state for UX, then compute synchronously.
    setTimeout(() => {
      const { outcome: routeOutcome, itineraries: itins } = planDoorToDoorJourney(req);
      setOutcome(routeOutcome);
      setItineraries(itins);
      setLoading(false);
    }, 350);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header active={screen} onNavigate={setScreen} />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        {screen === 'home' && (
          <HomeScreen
            onFindRoutes={handleFindRoutes}
            onNavigateResults={() => setScreen('results')}
          />
        )}
        {screen === 'results' && (
          <ResultsScreen
            request={request}
            outcome={outcome}
            itineraries={itineraries}
            onPlanAgain={() => setScreen('home')}
            loading={loading}
          />
        )}
        {screen === 'network' && <NetworkScreen />}
        {screen === 'dsa' && <DsaScreen />}
        {screen === 'about' && <AboutScreen />}
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-8 pt-2 text-center text-xs text-slate-400">
        Smart Metro · Hyderabad Metro Route Optimizer · Academic DSA project ·
        Simulated data, clearly labelled.
      </footer>
    </div>
  );
}

export default App;
