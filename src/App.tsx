import { useCallback, useEffect, useState } from 'react';
import { LegalPage } from './components/LegalPages';
import { MarketingSite } from './components/MarketingSite';
import { OfflineIndicator } from './components/OfflineIndicator';
import { StillalongApp } from './components/StillalongApp';
import { RoutePath } from './types/study';
import { cozyAudio } from './utils/audio';

type ResolvedView = RoutePath | 'not-found';

function normalizeRoute(pathname: string): ResolvedView {
  const clean = pathname !== '/' ? pathname.replace(/\/+$/, '') : '/';
  if (clean === '/' || clean === '') return '/';
  if (clean === '/app' || clean.startsWith('/app/')) return '/app';
  if (clean === '/about' || clean.startsWith('/about/')) return '/about';
  if (clean === '/privacy') return '/privacy';
  if (clean === '/terms') return '/terms';
  return 'not-found';
}

export default function App() {
  const [route, setRoute] = useState<ResolvedView>(() =>
    normalizeRoute(typeof window !== 'undefined' ? window.location.pathname : '/')
  );

  useEffect(() => {
    const onPopState = () => {
      const next = normalizeRoute(window.location.pathname);
      if (next !== '/' && next !== '/app') {
        cozyAudio.stopSoundscape();
      }
      setRoute(next);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateRoute = useCallback((next: RoutePath) => {
    if (next !== '/' && next !== '/app') {
      cozyAudio.stopSoundscape();
    }
    if (window.location.pathname !== next) {
      window.history.pushState({}, '', next);
    }
    setRoute(next);
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <>
      {(route === '/' || route === '/app') && (
        <StillalongApp
          initialScreen={route === '/app' ? 'focus' : 'room'}
          onNavigateRoute={navigateRoute}
        />
      )}
      {route === '/about' && <MarketingSite onNavigateRoute={navigateRoute} />}
      {route === '/privacy' && (
        <LegalPage page="privacy" onNavigateRoute={navigateRoute} />
      )}
      {route === '/terms' && (
        <LegalPage page="terms" onNavigateRoute={navigateRoute} />
      )}
      {route === 'not-found' && (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#11152A] px-4 text-center text-[#F7F1E3]">
          <div className="rpg-frame w-full max-w-md rounded-lg p-6">
            <p className="font-gba text-xs tracking-wider text-[#F2BE6F]">404 · ROOM NOT FOUND</p>
            <h1 className="font-pixel mt-2 text-3xl font-bold text-[#FFF9EC]">
              This hallway leads outside.
            </h1>
            <p className="mt-2 text-sm text-[#C9D2F0]">
              Return to Stillalong&apos;s home page or step directly into your study room.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => navigateRoute('/')}
                className="rpg-btn-cream min-h-[44px] rounded px-4 py-2 text-xs font-bold"
              >
                Home Page
              </button>
              <button
                type="button"
                onClick={() => navigateRoute('/app')}
                className="rpg-btn-amber min-h-[44px] rounded px-4 py-2 text-xs font-bold"
              >
                Start studying
              </button>
            </div>
          </div>
        </div>
      )}
      <OfflineIndicator />
    </>
  );
}
