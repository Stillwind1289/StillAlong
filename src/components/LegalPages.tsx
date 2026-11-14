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
        ? 'Privacy Policy — Stillalong'
        : 'Terms of Service — Stillalong';
    window.scrollTo({ top: 0 });
  }, [page]);

  return (
    <div className="min-h-screen bg-[#11152A] text-[#F7F1E3]">
      <header className="border-b border-[#28315C] bg-[#11152A]">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => onNavigateRoute('/')}
            className="flex min-h-[42px] items-center gap-2 text-xs font-semibold text-[#C9D2F0] hover:text-[#F7F1E3]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Stillalong</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateRoute('/app')}
            className="rpg-btn-amber min-h-[42px] rounded px-4 py-1.5 text-xs font-bold"
          >
            Start studying
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rpg-dialog mb-6 rounded px-4 py-3 text-xs font-bold">
          PRE-LAUNCH NOTICE: Placeholder markers such as [CONTACT_EMAIL_PLACEHOLDER] and
          [EFFECTIVE_DATE_PLACEHOLDER] indicate details that must be filled in and reviewed before
          accepting commercial payments.
        </div>

        {page === 'privacy' ? (
          <article className="space-y-6 rounded-lg border border-[#303B6B] bg-[#181E3D] p-6 sm:p-8">
            <div className="border-b border-[#2B3561] pb-4">
              <h1 className="font-pixel text-3xl font-bold text-[#FFF9EC]">Privacy Policy</h1>
              <p className="mt-1 text-xs text-[#9AA6CC]">
                Stillalong (Crafted by Volfnyra) · Effective Date: [EFFECTIVE_DATE_PLACEHOLDER]
              </p>
            </div>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                1. Local-First Study Data
              </h2>
              <p>
                Stillalong stores your companion preferences, time-of-day settings, soundscape volume,
                and completed study session history locally inside your browser using{' '}
                <code>localStorage</code>. Using the study room does not require account
                registration, and your study logs are not uploaded to a remote database.
              </p>
              <p>
                The Interactive Playground on the home page operates strictly in temporary memory as a
                Demo Mode preview and does not alter your saved study notebook.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                2. No Camera, Microphone, or Behavioral Tracking
              </h2>
              <p>
                Although Focus Mode portrays an across-the-desk perspective, Stillalong never
                requests access to your webcam or microphone, and does not capture or transmit video
                or audio. We do not embed third-party ad networks.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                3. Hosting, Fonts &amp; Payment Services
              </h2>
              <p>
                Stillalong is hosted via Cloudflare Pages and loads display typography stylesheets from
                Google Fonts (cached locally for offline PWA reliability). When paid checkout is
                enabled, one-time license purchases are processed by Lemon Squeezy, which collects
                billing, tax, and receipt information directly under Lemon Squeezy&apos;s own
                privacy policy. Stillalong receives only the order confirmation or refund webhook
                metadata needed to validate your license status.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                4. Deleting Your Local Data &amp; Contact
              </h2>
              <p>
                You can remove individual sessions from the Study Notebook or erase all study
                history in Settings at any time. Clearing browser site data also deletes all saved
                records. For privacy questions or order inquiries, contact{' '}
                <span className="font-mono-tabular text-[#FFF9EC]">[CONTACT_EMAIL_PLACEHOLDER]</span>{' '}
                or write to <span className="text-[#FFF9EC]">[BUSINESS_ADDRESS_PLACEHOLDER]</span>.
              </p>
            </section>
          </article>
        ) : (
          <article className="space-y-6 rounded-lg border border-[#303B6B] bg-[#181E3D] p-6 sm:p-8">
            <div className="border-b border-[#2B3561] pb-4">
              <h1 className="font-pixel text-3xl font-bold text-[#FFF9EC]">Terms of Service</h1>
              <p className="mt-1 text-xs text-[#9AA6CC]">
                Stillalong (Crafted by Volfnyra) · Effective Date: [EFFECTIVE_DATE_PLACEHOLDER]
              </p>
            </div>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                1. Purpose &amp; Local Storage
              </h2>
              <p>
                Stillalong provides a personal focus timer and pixel-art study environment. Because
                your session logs live in browser storage, please export important records or share
                cards before clearing browser data or switching devices.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                2. One-Time Purchase &amp; No Subscriptions
              </h2>
              <p>
                Stillalong is licensed for full use via a $6.99 USD one-time payment when checkout is
                enabled (alongside the interactive Demo Mode preview on the homepage). There are no
                recurring subscriptions or automatic renewals. Payments and applicable regional taxes
                are handled by Lemon Squeezy as merchant of record.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                3. Refunds &amp; Cancellations
              </h2>
              <p>
                Because Stillalong is a one-time digital purchase rather than a recurring plan, there
                is no subscription to cancel. Refund requests within{' '}
                <span className="text-[#FFF9EC]">[REFUND_WINDOW_PLACEHOLDER]</span> days of purchase
                can be submitted via your Lemon Squeezy order receipt or by contacting{' '}
                <span className="font-mono-tabular text-[#FFF9EC]">[CONTACT_EMAIL_PLACEHOLDER]</span>.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                4. Operator &amp; Governing Law
              </h2>
              <p>
                Stillalong is provided on an &ldquo;as-is&rdquo; basis without uptime guarantees.
                Operator: Volfnyra ([BUSINESS_ADDRESS_PLACEHOLDER]). Governing jurisdiction:{' '}
                [JURISDICTION_PLACEHOLDER].
              </p>
            </section>
          </article>
        )}
      </main>
    </div>
  );
};
