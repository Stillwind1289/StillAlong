import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rpg-dialog fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded px-3 py-1.5 text-xs font-bold"
    >
      <WifiOff className="h-3.5 w-3.5 text-[#945158]" aria-hidden="true" />
      <span>Offline mode — study log saved locally</span>
    </div>
  );
};
