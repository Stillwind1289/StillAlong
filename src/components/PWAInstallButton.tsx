import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'rpg' | 'web';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'web' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={
          variant === 'rpg'
            ? 'rpg-btn-cream flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0'
            : 'flex items-center gap-1.5 rounded border border-[#3E4B80] bg-[#1D2445] px-3 py-1.5 text-xs font-semibold text-[#F7F1E3] transition-colors hover:bg-[#27305C] whitespace-nowrap shrink-0'
        }
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={
            variant === 'rpg'
              ? 'rpg-btn-cream flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0'
              : 'flex items-center gap-1.5 rounded border border-[#3E4B80] bg-[#1D2445] px-3 py-1.5 text-xs font-semibold text-[#F7F1E3] transition-colors hover:bg-[#27305C] whitespace-nowrap shrink-0'
          }
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0E1D]/75 p-4">
            <div className="rpg-dialog w-full max-w-sm rounded-lg p-5">
              <h3 className="font-pixel text-xl font-bold text-[#252E52]">
                Install on iPhone / iPad
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#4C3A2F]">
                1. Tap the <strong>Share</strong> icon in Safari.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="rpg-btn-amber mt-4 w-full rounded py-2 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
