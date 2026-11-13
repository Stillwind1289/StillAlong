import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Play, Star } from 'lucide-react';
import {
  LoadedPixelAssets,
  ROOM_H,
  ROOM_W,
  drawRoomScene,
  loadPixelAssets,
} from '../canvas/spriteSheetEngine';
import { RoutePath } from '../types/study';
import { TIME_ATMOSPHERES, resolveTimeOfDay } from '../utils/timeOfDay';
import { PWAInstallButton } from './PWAInstallButton';

interface MarketingSiteProps {
  onNavigateRoute: (route: RoutePath) => void;
}

const FAQS = [
  {
    q: 'Is Stillalong a live video call or multiplayer chat room?',
    a: 'No. Stillalong recreates the comforting feeling of body doubling locally in your browser. There are no strangers, cameras, microphones, or AI chatbots—just a quiet pixel-art room and your study companion.',
  },
  {
    q: 'Where are my study sessions and preferences saved?',
    a: 'All study sessions, timer settings, and character choices are stored locally in your browser via localStorage. Nothing is uploaded to external servers.',
  },
  {
    q: 'Can I use Stillalong offline or install it on my device?',
    a: 'Yes. Stillalong is built as an installable Progressive Web App (PWA) so you can add it to your desktop or mobile home screen and keep focusing even offline.',
  },
  {
    q: 'Does the timer keep running if I switch rooms or tabs?',
    a: 'Yes. The study timer is timestamp-based rather than relying on visual frame intervals, so your focus and break countdowns stay accurate even when switching screens or browser tabs.',
  },
];

export const MarketingSite: React.FC<MarketingSiteProps> = ({ onNavigateRoute }) => {
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const [assets, setAssets] = useState<LoadedPixelAssets | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  useEffect(() => {
    document.title = 'Stillalong — A Cozy Pixel-Art Study Companion';
    let mounted = true;
    loadPixelAssets()
      .then((loaded) => {
        if (mounted) setAssets(loaded);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!assets) return;
    let rafId = 0;
    let frame = 0;
    let last = 0;
    const atmosphere = TIME_ATMOSPHERES[resolveTimeOfDay('auto')];

    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      if (now - last < 1000 / 20) return;
      last = now;
      frame += 1;
      const canvas = previewRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      drawRoomScene(ctx, assets, frame, {
        characterId: 'female',
        walker: {
          x: 344,
          y: 300,
          targetX: 344,
          targetY: 300,
          facing: 'down',
          moving: false,
          waitTicks: 0,
        },
        hoveredZone: null,
        catHappyTimer: 0,
        isStudying: false,
        atmosphere,
        lampOn: atmosphere.lampDefaultOn,
      });
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [assets]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) {
      setContactError('Please enter your name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      setContactError('Please enter a valid email address.');
      return;
    }
    if (contactMessage.trim().length < 6) {
      setContactError('Please share a short note before sending.');
      return;
    }
    setContactError(null);
    setContactSubmitted(true);
    setContactName('');
    setContactEmail('');
    setContactMessage('');
  };

  return (
    <div className="min-h-screen bg-[#11152A] text-[#F7F1E3]">
      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[#28315C] bg-[#11152A]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="font-gba shrink-0 whitespace-nowrap text-base font-bold tracking-wider text-[#F7F1E3]"
          >
            STILLALONG
          </a>

          <nav aria-label="Primary" className="hidden items-center gap-7 text-sm font-medium text-[#C5CEE8] md:flex">
            <a href="#features" className="whitespace-nowrap shrink-0 hover:text-[#F7F1E3]">
              Features
            </a>
            <a href="#about" className="whitespace-nowrap shrink-0 hover:text-[#F7F1E3]">
              About
            </a>
            <a href="#faq" className="whitespace-nowrap shrink-0 hover:text-[#F7F1E3]">
              FAQ
            </a>
            <a href="#contact" className="whitespace-nowrap shrink-0 hover:text-[#F7F1E3]">
              Contact
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => onNavigateRoute('/app')}
              className="rpg-btn-amber whitespace-nowrap shrink-0 rounded px-4 py-1.5 text-xs font-bold"
            >
              Open Stillalong
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-6">
              <p className="font-gba text-xs tracking-widest text-[#AEB9DF]">
                A LITTLE PLACE TO STAY AWHILE
              </p>
              <h1
                className="font-pixel font-bold tracking-tight text-[#FFF9EC]"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.6rem)', lineHeight: 1.08, textWrap: 'balance' }}
              >
                Study alongside someone, even when you are on your own.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-[#C9D2F0]">
                Stillalong is a GBA-inspired pixel-art bedroom where you choose a study companion,
                sit down across the desk, and work through focus blocks with a quiet cat curled
                nearby.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigateRoute('/app')}
                  className="rpg-btn-amber flex min-h-[44px] items-center gap-2 rounded px-5 py-2.5 text-sm font-bold"
                >
                  <span className="font-pixel text-lg">Enter the Room</span>
                  <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                </button>
                <PWAInstallButton variant="web" />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#9AA6CC]">
                <span>Works in browser &amp; offline</span>
                <span aria-hidden="true">·</span>
                <span>No account required</span>
                <span aria-hidden="true">·</span>
                <span>Private local storage</span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rpg-frame rounded-lg p-2.5">
                <canvas
                  ref={previewRef}
                  width={ROOM_W}
                  height={ROOM_H}
                  className="pixelated block aspect-3/2 w-full rounded"
                  aria-label="Live preview of Stillalong pixel-art bedroom"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t border-[#252E54] bg-[#151A34] py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="font-pixel text-3xl font-bold text-[#FFF9EC]">
                Designed to feel like a shared room, not another checklist.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#C5CEE8]">
                Every detail serves calm body-doubling presence without distracting social feeds or
                cluttered dashboards.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-[#303B6B] bg-[#1B2244] p-6">
                <h3 className="font-pixel text-xl font-bold text-[#F2C97D]">
                  01. One Bedroom, Two Camera Angles
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#C9D2F0]">
                  Begin in the top-down pixel bedroom, then approach the wooden desk to switch into
                  a webcam-style study perspective looking back across the very same room.
                </p>
              </div>

              <div className="rounded-lg border border-[#303B6B] bg-[#1B2244] p-6">
                <h3 className="font-pixel text-xl font-bold text-[#F2C97D]">
                  02. Companions &amp; Shared Kitty
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#C9D2F0]">
                  Choose Milo or Hana at the start—each with gentle breathing, blinking, studying,
                  and break animations—joined by a white cat that blinks, twitches, and naps by your
                  books.
                </p>
              </div>

              <div className="rounded-lg border border-[#303B6B] bg-[#1B2244] p-6">
                <h3 className="font-pixel text-xl font-bold text-[#F2C97D]">
                  03. Time-of-Day Atmosphere
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#C9D2F0]">
                  Morning sunbeams, clear afternoon skies, warm dusk light, and starry nights follow
                  your local clock automatically or can be switched manually anytime.
                </p>
              </div>

              <div className="rounded-lg border border-[#303B6B] bg-[#1B2244] p-6">
                <h3 className="font-pixel text-xl font-bold text-[#F2C97D]">
                  04. Accurate Pomodoro &amp; Study Log
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#C9D2F0]">
                  Timestamp-driven 25/5 Pomodoro blocks, custom durations, soft synthesized ambient
                  soundscapes, and a clean local study journal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid grid-cols-1 gap-8 rounded-lg border border-[#303B6B] bg-[#181E3D] p-7 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-8">
              <h2 className="font-pixel text-3xl font-bold text-[#FFF9EC]">
                Why we built Stillalong
              </h2>
              <p className="text-sm leading-relaxed text-[#C9D2F0]">
                Studying alone late at night can make every hour feel twice as heavy. Video study
                streams and Discord rooms help, yet sometimes you want something quieter—no webcams
                to turn on, no chat messages, just the steady presence of someone working at their
                own desk beside you.
              </p>
              <p className="text-sm leading-relaxed text-[#C9D2F0]">
                Stillalong pairs nostalgic Game Boy Advance warmth with focused study tools so your
                desk feels like a place you actually look forward to visiting tomorrow.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 lg:col-span-4 lg:items-end">
              <div className="rpg-dialog rounded px-4 py-3 text-sm font-bold">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-[#F2C97D] text-[#2A3561]" aria-hidden="true" />
                  <span className="font-pixel text-base">Ready when you are.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateRoute('/app')}
                className="rpg-btn-amber rounded px-5 py-2.5 text-sm font-bold"
              >
                Sit Down Together
              </button>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="border-t border-[#252E54] bg-[#151A34] py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="font-pixel text-3xl font-bold text-[#FFF9EC]">
              Frequently Asked Questions
            </h2>
            <div className="mt-6 space-y-3">
              {FAQS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={item.q}
                    className="rounded-lg border border-[#303B6B] bg-[#1B2244]"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-[#FFF9EC]"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#AEB9DF] transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-[#2B3561] px-5 py-3.5 text-sm leading-relaxed text-[#C9D2F0]">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <div className="rounded-lg border border-[#303B6B] bg-[#181E3D] p-6 sm:p-8">
            <h2 className="font-pixel text-3xl font-bold text-[#FFF9EC]">Contact</h2>
            <p className="mt-1 text-sm text-[#C9D2F0]">
              Have feedback, pixel art suggestions, or accessibility notes? Send us a message.
            </p>

            {contactSubmitted ? (
              <div className="rpg-dialog mt-5 rounded px-4 py-4 text-sm font-semibold">
                Thank you for reaching out. Your note has been recorded locally for this session.
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="mt-5 space-y-4" noValidate>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-[#C9D2F0]">
                    Name
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Your name"
                      className="mt-1.5 w-full rounded border border-[#3A467A] bg-[#11152A] px-3 py-2 text-sm text-[#F7F1E3] focus:border-[#F2C97D] focus:outline-none"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-[#C9D2F0]">
                    Email
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="mt-1.5 w-full rounded border border-[#3A467A] bg-[#11152A] px-3 py-2 text-sm text-[#F7F1E3] focus:border-[#F2C97D] focus:outline-none"
                    />
                  </label>
                </div>
                <label className="block text-xs font-semibold text-[#C9D2F0]">
                  Message
                  <textarea
                    rows={3}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Share a thought or question..."
                    className="mt-1.5 w-full rounded border border-[#3A467A] bg-[#11152A] px-3 py-2 text-sm text-[#F7F1E3] focus:border-[#F2C97D] focus:outline-none"
                  />
                </label>
                {contactError && (
                  <p className="text-xs font-semibold text-[#F2A0A0]" role="alert">
                    {contactError}
                  </p>
                )}
                <button
                  type="submit"
                  className="rpg-btn-amber rounded px-5 py-2 text-xs font-bold"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Quiet Website Footer (kept strictly on marketing & legal pages, never inside /app) */}
      <footer className="border-t border-[#252E54] bg-[#0E1224] py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-xs text-[#9AA6CC] sm:px-6">
          <div>
            <span className="font-gba font-bold text-[#F7F1E3]">STILLALONG</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>A little place to stay awhile.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => onNavigateRoute('/app')}
              className="hover:text-[#F7F1E3]"
            >
              Launch App
            </button>
            <button
              type="button"
              onClick={() => onNavigateRoute('/privacy')}
              className="hover:text-[#F7F1E3]"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => onNavigateRoute('/terms')}
              className="hover:text-[#F7F1E3]"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
