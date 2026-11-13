import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { RoutePath } from '../types/study';

interface LegalPageProps {
  page: 'privacy' | 'terms';
  onNavigateRoute: (route: RoutePath) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ page, onNavigateRoute }) => {
  useEffect(() => {
    document.title =
      page === 'privacy'
        ? 'Privacy Policy (Draft) — Stillalong'
        : 'Terms of Service (Draft) — Stillalong';
    window.scrollTo({ top: 0 });
  }, [page]);

  return (
    <div className="min-h-screen bg-[#11152A] text-[#F7F1E3]">
      <header className="border-b border-[#28315C] bg-[#11152A]">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => onNavigateRoute('/')}
            className="flex items-center gap-2 text-xs font-semibold text-[#C9D2F0] hover:text-[#F7F1E3]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Stillalong</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateRoute('/app')}
            className="rpg-btn-amber rounded px-4 py-1.5 text-xs font-bold"
          >
            Open App
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rpg-dialog mb-6 rounded px-4 py-3 text-xs font-bold">
          DRAFT NOTICE: This document is preliminary placeholder copy prepared for product review
          and must be reviewed by qualified legal counsel before public publication.
        </div>

        {page === 'privacy' ? (
          <article className="space-y-5 rounded-lg border border-[#303B6B] bg-[#181E3D] p-6 sm:p-8">
            <h1 className="font-pixel text-3xl font-bold text-[#FFF9EC]">
              Privacy Policy (Draft)
            </h1>
            <p className="text-xs text-[#9AA6CC]">Status: Draft for review</p>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                1. Local-First Study Data
              </h2>
              <p>
                Stillalong currently stores your companion choice, timer settings, room preferences,
                and completed study session logs strictly inside your own browser using
                localStorage. No account registration is required, and no study logs are sent to a
                remote server.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                2. No Camera or Microphone Access
              </h2>
              <p>
                Although Focus Mode presents a webcam-inspired pixel-art desk perspective,
                Stillalong does not request, record, or transmit any camera video or microphone
                audio from your device.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                3. Managing or Deleting Your Data
              </h2>
              <p>
                You can remove individual study sessions inside the Study History screen or clear
                all saved history from the Settings screen at any time. Clearing your browser site
                data also removes all locally stored information.
              </p>
            </section>
          </article>
        ) : (
          <article className="space-y-5 rounded-lg border border-[#303B6B] bg-[#181E3D] p-6 sm:p-8">
            <h1 className="font-pixel text-3xl font-bold text-[#FFF9EC]">
              Terms of Service (Draft)
            </h1>
            <p className="text-xs text-[#9AA6CC]">Status: Draft for review</p>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                1. Purpose of Stillalong
              </h2>
              <p>
                Stillalong is a personal focus timer and virtual pixel-art study environment
                designed to support calm, self-directed study sessions.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                2. Acceptable Use &amp; Availability
              </h2>
              <p>
                The application is provided on an &ldquo;as-is&rdquo; basis for personal
                productivity use. Because study records live in browser storage, please export or
                back up important notes separately if you switch browsers or clear device storage.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                3. Changes Before Publication
              </h2>
              <p>
                These draft terms will be finalized with operator contact details, governing law,
                and publication dates prior to formal public release.
              </p>
            </section>
          </article>
        )}
      </main>
    </div>
  );
};
