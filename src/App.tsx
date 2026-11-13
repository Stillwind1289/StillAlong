import { useCallback, useEffect, useState } from 'react';
import { LegalPage } from './components/LegalPages';
import { MarketingSite } from './components/MarketingSite';
import { OfflineIndicator } from './components/OfflineIndicator';
import { StillalongApp } from './components/StillalongApp';
import { RoutePath } from './types/study';
import { cozyAudio } from './utils/audio';

function normalizeRoute(pathname: string): RoutePath {
  if (pathname === '/app' || pathname.startsWith('/app/')) return '/app';
  if (pathname === '/privacy') return '/privacy';
  if (pathname === '/terms') return '/terms';
  return '/';
}

export default function App() {
  const [route, setRoute] = useState<RoutePath>(() =>
    normalizeRoute(typeof window !== 'undefined' ? window.location.pathname : '/')
  );

  useEffect(() => {
    const onPopState = () => {
      const next = normalizeRoute(window.location.pathname);
      if (next !== '/app') {
        cozyAudio.stopSoundscape();
      }
      setRoute(next);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateRoute = useCallback((next: RoutePath) => {
    if (next !== '/app') {
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
      {route === '/' && <MarketingSite onNavigateRoute={navigateRoute} />}
      {route === '/app' && <StillalongApp onNavigateRoute={navigateRoute} />}
      {route === '/privacy' && (
        <LegalPage page="privacy" onNavigateRoute={navigateRoute} />
      )}
      {route === '/terms' && (
        <LegalPage page="terms" onNavigateRoute={navigateRoute} />
      )}
      <OfflineIndicator />
    </>
  );
}
