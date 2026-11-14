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
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigateRoute('/')}
              className="flex min-h-[42px] items-center gap-2 text-xs font-semibold text-[#C9D2F0] hover:text-[#F7F1E3]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Study Room</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateRoute('/about')}
              className="min-h-[42px] text-xs font-semibold text-[#F7CB85] hover:text-[#FFF9EC]"
            >
              About Stillalong
            </button>
          </div>
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
        {page === 'privacy' ? (
          <article className="space-y-6 rounded-lg border border-[#303B6B] bg-[#181E3D] p-6 sm:p-8">
            <div className="border-b border-[#2B3561] pb-4">
              <h1 className="font-pixel text-3xl font-bold text-[#FFF9EC]">Privacy Policy</h1>
              <p className="mt-1 text-xs text-[#9AA6CC]">
                Stillalong (Crafted by Volfnyra) · Effective Date: November 14, 2026
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
                registration, and your study logs or subject tags are not uploaded to a remote
                database.
              </p>
              <p>
                The Interactive Playground on the home page operates strictly in temporary memory as a
                Demo Mode preview and does not alter your saved study notebook.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                2. No Camera, Microphone, or Ad Tracking
              </h2>
              <p>
                Although Focus Mode portrays an across-the-desk perspective, Stillalong never
                requests access to your webcam or microphone, and does not capture or transmit video
                or audio. We do not run behavioral ad trackers or sell user data to third parties.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                3. Hosting, Fonts &amp; Payment Processing
              </h2>
              <p>
                Stillalong is served via Cloudflare Pages (which handles standard edge delivery and
                transient request security logs) and loads display typography stylesheets from Google
                Fonts (cached locally for offline PWA reliability). When you purchase a license,
                checkout, billing, invoicing, and applicable regional taxes are processed by{' '}
                <strong className="text-[#FFF9EC]">Lemon Squeezy</strong> as our Merchant of Record
                under Lemon Squeezy&apos;s privacy policy. Stillalong receives only the order
                verification metadata (such as order ID, payment status, and buyer email) required to
                validate your license or process support/refund requests.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                4. Your Rights, Deleting Data &amp; Contact
              </h2>
              <p>
                Because study history stays inside your browser, you can remove individual entries in
                the Study Notebook or erase all study records in Settings at any time. Clearing
                browser site data also deletes all locally stored preferences and logs.
              </p>
              <p>
                For privacy inquiries, GDPR/CCPA requests regarding order records, or general support,
                contact Volfnyra at{' '}
                <a
                  href="mailto:hello@stillalong.xyz"
                  className="font-mono-tabular text-[#F7CB85] underline hover:text-[#FFF9EC]"
                >
                  hello@stillalong.xyz
                </a>
                .
              </p>
            </section>
          </article>
        ) : (
          <article className="space-y-6 rounded-lg border border-[#303B6B] bg-[#181E3D] p-6 sm:p-8">
            <div className="border-b border-[#2B3561] pb-4">
              <h1 className="font-pixel text-3xl font-bold text-[#FFF9EC]">Terms of Service</h1>
              <p className="mt-1 text-xs text-[#9AA6CC]">
                Stillalong (Crafted by Volfnyra) · Effective Date: November 14, 2026
              </p>
            </div>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                1. License Scope &amp; Local Browser Storage
              </h2>
              <p>
                Stillalong is operated by <strong className="text-[#FFF9EC]">Volfnyra</strong>.
                Upon valid purchase, you are granted a personal, non-exclusive, non-transferable
                license to access and use the current release of Stillalong for your own personal
                study and focus sessions. You may not resell, redistribute, or repackage the
                application or artwork as your own product.
              </p>
              <p>
                Because session logs and timer settings are stored locally inside your browser
                (<code>localStorage</code>), please export any desired PNG completion cards or
                records before clearing site data or switching devices.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                2. $6.99 One-Time Purchase &amp; Update Policy
              </h2>
              <p>
                Full access to Stillalong is offered for a single{' '}
                <strong className="text-[#FFF9EC]">$6.99 USD one-time payment</strong> (alongside the
                free Demo Mode preview on the home page). There are no recurring subscriptions or
                automatic renewals.
              </p>
              <p>
                Your $6.99 one-time payment covers access to the current Stillalong release and
                routine bug-fix or maintenance patches for that release. It does{' '}
                <strong className="text-[#FFF9EC]">not</strong> include or guarantee all future
                feature updates, future major versions, or separate add-on packs, which may be
                offered separately. All checkout payments, receipts, and regional sales/VAT taxes are
                processed securely by <strong className="text-[#FFF9EC]">Lemon Squeezy</strong> as
                Merchant of Record.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                3. Refunds &amp; Cancellations
              </h2>
              <p>
                Because Stillalong is a one-time digital purchase rather than a subscription, there is
                no recurring plan to cancel. If you encounter a technical issue that prevents Stillalong
                from working in a modern browser, or wish to request a refund within{' '}
                <strong className="text-[#FFF9EC]">14 days</strong> of purchase, please use the
                refund link on your Lemon Squeezy order receipt or email{' '}
                <a
                  href="mailto:hello@stillalong.xyz"
                  className="font-mono-tabular text-[#F7CB85] underline hover:text-[#FFF9EC]"
                >
                  hello@stillalong.xyz
                </a>{' '}
                with your order number.
              </p>
            </section>

            <section className="space-y-2 text-sm leading-relaxed text-[#C9D2F0]">
              <h2 className="font-pixel text-xl font-bold text-[#F2C97D]">
                4. Disclaimer, Limitation of Liability &amp; Contact
              </h2>
              <p>
                Stillalong is provided on an &ldquo;as-is&rdquo; and &ldquo;as-available&rdquo;
                basis without warranties of uninterrupted availability or fitness for any specific
                academic or commercial outcome. To the maximum extent permitted by applicable law,
                Volfnyra&apos;s total aggregate liability arising out of or relating to Stillalong
                shall not exceed the $6.99 USD amount you paid for the product. Nothing in these
                terms limits non-waivable statutory consumer rights where you live.
              </p>
              <p>
                Support and legal inquiries:{' '}
                <a
                  href="mailto:hello@stillalong.xyz"
                  className="font-mono-tabular text-[#F7CB85] underline hover:text-[#FFF9EC]"
                >
                  hello@stillalong.xyz
                </a>
                .
              </p>
            </section>
          </article>
        )}
      </main>
    </div>
  );
};
