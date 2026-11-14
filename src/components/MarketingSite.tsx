import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Cat,
  ChevronDown,
  Clock,
  Download,
  Menu,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Share2,
  Sparkles,
  Star,
  Sun,
  X,
} from 'lucide-react';
import {
  DESK_H,
  DESK_W,
  FOCUS_DESK_GEOMETRY,
  LoadedPixelAssets,
  ROOM_CLICK_ZONES,
  ROOM_H,
  ROOM_W,
  RoomTargetArea,
  RoomWalker,
  clampWalkPoint,
  drawFocusScene,
  drawRoomScene,
  loadPixelAssets,
  stepRoomWalker,
} from '../canvas/spriteSheetEngine';
import { CompanionPoseMode, RoutePath } from '../types/study';
import { TIME_ATMOSPHERES, resolveTimeOfDay } from '../utils/timeOfDay';
import { PWAInstallButton } from './PWAInstallButton';

interface MarketingSiteProps {
  onNavigateRoute: (route: RoutePath) => void;
}

const FEATURES = [
  {
    num: '01',
    title: 'Immersive pixel-art study room',
    body: 'Explore a cozy top-down bedroom, browse your bookshelf, look out the window, and sit across the wooden desk inside the very same space.',
  },
  {
    num: '02',
    title: 'Companion presence & focus poses',
    body: 'Study alongside Hana as she writes notes, reads a hardcover book, sips tea on breaks, or rests calmly beside your notebook.',
  },
  {
    num: '03',
    title: 'Cat companion',
    body: 'Mochi curls on the lavender rug in room view and keeps quiet company on the corner of your wooden study desk—tap anytime for a purr.',
  },
  {
    num: '04',
    title: 'Focus and break timer',
    body: 'Switch smoothly between Pomodoro cycles, breaks, and custom durations powered by an accurate timestamp clock that never drifts across tabs.',
  },
  {
    num: '05',
    title: 'Study statistics & session history',
    body: 'Review today’s focus minutes, active study streak, 7-day chart, top subjects, and a private local notebook of every completed block.',
  },
  {
    num: '06',
    title: 'Day and night ambience',
    body: 'Morning sunbeams, clear afternoon skies, warm dusk light, and starry nights paired with gentle desk lamp glow and Web Audio soundscapes.',
  },
  {
    num: '07',
    title: 'Shareable session-completion cards',
    body: 'Save a crisp retro PNG completion card featuring your subject, duration, streak, Hana, and Mochi at the end of a focused study session.',
  },
  {
    num: '08',
    title: 'Calm environment for body doubling',
    body: 'No webcams to turn on, no microphones, no live chat feeds, and no competing leaderboards—just steady presence for deep focus.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Enter your room.',
    desc: 'Open Stillalong straight in your browser. Stroll across the bedroom rug, check the weather outside the window, and choose your subject.',
  },
  {
    step: '02',
    title: 'Start a focus session.',
    desc: 'Take your seat across the wooden desk. Set a Pomodoro block or custom duration, turn on soft rain or vinyl ambience, and focus together.',
  },
  {
    step: '03',
    title: 'Build your study habit, one session at a time.',
    desc: 'Finish each block with a calm break, save or share your completion card, and watch your 7-day notebook fill up gently over time.',
  },
];

const FAQS = [
  {
    q: 'Is Stillalong a live video call or multiplayer chat room?',
    a: 'No. Stillalong recreates the comforting feeling of body doubling privately in your browser. There are no strangers, cameras, microphones, or AI chatbots—just a quiet pixel-art room, Hana, and Mochi.',
  },
  {
    q: 'Where are my study sessions and preferences saved?',
    a: 'All study sessions, timer durations, room settings, and preferences are stored locally in your own browser via localStorage. Nothing is uploaded to external servers.',
  },
  {
    q: 'How does the $6.99 one-time purchase work? Is there a subscription?',
    a: 'Stillalong is a $6.99 USD one-time payment for the current Stillalong release—no monthly fees, no renewals, and no subscriptions. Maintenance bug fixes are included, while future major updates or separate add-ons are not automatically bundled. You can explore the Interactive Playground in Demo Mode right here first.',
  },
  {
    q: 'Can I use Stillalong offline or install it on my device?',
    a: 'Yes. Stillalong is a Progressive Web App (PWA). You can install it to your desktop or mobile home screen and keep running timers and soundscapes offline.',
  },
  {
    q: 'Does the timer stay accurate if I switch tabs or apps?',
    a: 'Yes. Both Focus and Break timers calculate remaining time from actual wall-clock timestamps rather than browser frame ticks, so tab throttling never throws off your session.',
  },
  {
    q: 'How are payments and refunds handled when checkout launches?',
    a: 'When paid checkout is enabled, orders and taxes will be processed by Lemon Squeezy as our merchant of record. Refund eligibility and contact steps are documented clearly on our Terms page.',
  },
];

function formatClock(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const MarketingSite: React.FC<MarketingSiteProps> = ({ onNavigateRoute }) => {
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const playgroundCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [assets, setAssets] = useState<LoadedPixelAssets | null>(null);
  const [assetError, setAssetError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Playground Demo State (isolated from real user localStorage!)
  const [demoView, setDemoView] = useState<'room' | 'focus'>('focus');
  const [demoPeriod, setDemoPeriod] = useState<'morning' | 'night'>('night');
  const [demoPose, setDemoPose] = useState<CompanionPoseMode>('auto');
  const [demoCatVisible, setDemoCatVisible] = useState(true);
  const [demoHoveredZone, setDemoHoveredZone] = useState<RoomTargetArea>(null);
  const [demoMinutes, setDemoMinutes] = useState(15);
  const [demoSecondsLeft, setDemoSecondsLeft] = useState(15 * 60);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoCaption, setDemoCaption] = useState(
    'Tap Hana, Mochi, or the bedroom floor to explore—nothing here writes to your study log.'
  );

  const demoWalkerRef = useRef<RoomWalker>({
    x: 288,
    y: 362,
    targetX: 288,
    targetY: 362,
    facing: 'down',
    moving: false,
    waitTicks: 40,
    manualMove: false,
  });
  const demoReactionTimerRef = useRef(0);
  const demoReactionKindRef = useRef<'happy' | 'perkUp' | 'eureka' | 'mug'>('happy');
  const demoKittyTimerRef = useRef(0);

  // Checkout readiness check against /api/checkout (safe fallback when not yet configured)
  const [checkoutConfigured, setCheckoutConfigured] = useState<boolean | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);

  // FAQ & Contact form state
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactMailtoHref, setContactMailtoHref] = useState('mailto:hello@stillalong.xyz');

  const reloadAssets = () => {
    setAssetError(false);
    loadPixelAssets()
      .then((loaded) => {
        setAssets(loaded);
        setAssetError(false);
      })
      .catch(() => setAssetError(true));
  };

  useEffect(() => {
    document.title = 'About Stillalong — A Little Place to Stay Awhile';
    let mounted = true;

    loadPixelAssets()
      .then((loaded) => {
        if (mounted) {
          setAssets(loaded);
          setAssetError(false);
        }
      })
      .catch(() => {
        if (mounted) setAssetError(true);
      });

    fetch('/api/checkout')
      .then((res) => (res.ok ? res.json() : { configured: false }))
      .then((data: { configured?: boolean }) => {
        if (mounted) setCheckoutConfigured(Boolean(data?.configured));
      })
      .catch(() => {
        if (mounted) setCheckoutConfigured(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Playground Demo Timer countdown (strictly temporary demo state)
  useEffect(() => {
    if (!demoRunning) return;
    const targetEnd = Date.now() + demoSecondsLeft * 1000;
    const id = window.setInterval(() => {
      const rem = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
      setDemoSecondsLeft(rem);
      if (rem === 0) {
        setDemoRunning(false);
        demoReactionKindRef.current = 'happy';
        demoReactionTimerRef.current = 72;
        demoKittyTimerRef.current = 72;
        setDemoCaption('Demo block finished! Launch Stillalong to save real sessions and export PNG cards.');
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [demoRunning]);

  const demoRenderRef = useRef({
    demoView,
    demoPeriod,
    demoPose,
    demoCatVisible,
    demoHoveredZone,
    demoRunning,
  });
  demoRenderRef.current = {
    demoView,
    demoPeriod,
    demoPose,
    demoCatVisible,
    demoHoveredZone,
    demoRunning,
  };

  // Shared 20fps animation loop for Hero + Interactive Playground canvases
  useEffect(() => {
    if (!assets) return;
    let rafId = 0;
    let frame = 0;
    let last = 0;
    const heroAtmo = TIME_ATMOSPHERES[resolveTimeOfDay('auto')];

    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      if (now - last < 1000 / 20) return;
      last = now;
      frame += 1;

      if (demoReactionTimerRef.current > 0) demoReactionTimerRef.current -= 1;
      if (demoKittyTimerRef.current > 0) demoKittyTimerRef.current -= 1;

      if (heroCanvasRef.current) {
        const ctx = heroCanvasRef.current.getContext('2d');
        if (ctx) {
          drawRoomScene(ctx, assets, frame, {
            walker: {
              x: 288,
              y: 362,
              targetX: 288,
              targetY: 362,
              facing: 'down',
              moving: false,
              waitTicks: 0,
              manualMove: false,
            },
            hoveredZone: null,
            isStudying: false,
            atmosphere: heroAtmo,
            lampOn: heroAtmo.lampDefaultOn,
            showCat: true,
          });
        }
      }

      if (playgroundCanvasRef.current) {
        const ctx = playgroundCanvasRef.current.getContext('2d');
        const cur = demoRenderRef.current;
        const atmo = TIME_ATMOSPHERES[cur.demoPeriod];
        if (ctx) {
          if (cur.demoView === 'room') {
            demoWalkerRef.current = stepRoomWalker(demoWalkerRef.current, false);
            drawRoomScene(ctx, assets, frame, {
              walker: demoWalkerRef.current,
              hoveredZone: cur.demoHoveredZone,
              isStudying: cur.demoRunning,
              atmosphere: atmo,
              lampOn: atmo.lampDefaultOn,
              showCat: cur.demoCatVisible,
              kittyReactionTimer: demoKittyTimerRef.current,
            });
          } else {
            drawFocusScene(ctx, assets, frame, {
              status: cur.demoRunning ? 'running' : 'idle',
              phase: 'focus',
              poseMode: cur.demoPose,
              reactionTimer: demoReactionTimerRef.current,
              reactionKind: demoReactionKindRef.current,
              atmosphere: atmo,
              lampOn: atmo.lampDefaultOn,
              showCat: cur.demoCatVisible,
              kittyReactionTimer: demoKittyTimerRef.current,
            });
          }
        }
      }
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [assets]);

  const handlePlaygroundPointer = (
    e: React.MouseEvent<HTMLCanvasElement>,
    isClick: boolean
  ) => {
    const canvas = playgroundCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (demoView === 'room') {
      const vx = ((e.clientX - rect.left) / rect.width) * ROOM_W;
      const vy = ((e.clientY - rect.top) / rect.height) * ROOM_H;
      const found = ROOM_CLICK_ZONES.find((z) => {
        if (z.id === 'kitty' && !demoCatVisible) return false;
        return vx >= z.x && vx <= z.x + z.w && vy >= z.y && vy <= z.y + z.h;
      });
      const id = found ? found.id : null;
      setDemoHoveredZone(id);
      if (!isClick) return;

      if (id === 'desk') {
        setDemoView('focus');
        setDemoCaption('Switched to Focus Mode across the wooden study desk.');
      } else if (id === 'kitty') {
        demoKittyTimerRef.current = 60;
        setDemoCaption('Mochi purrs softly from the lavender rug.');
      } else {
        const pt = clampWalkPoint(vx, vy);
        demoWalkerRef.current = {
          ...demoWalkerRef.current,
          targetX: pt.x,
          targetY: pt.y,
          manualMove: true,
          waitTicks: 0,
        };
        setDemoCaption(
          id === 'window'
            ? 'Looking out the bedroom window—try switching between Morning and Night!'
            : id === 'bookshelf'
              ? 'Neat notebooks and cozy greenery line the wooden shelf.'
              : 'Hana strolls quietly across the bedroom floor.'
        );
      }
      return;
    }

    if (!isClick) return;
    const vx = ((e.clientX - rect.left) / rect.width) * DESK_W;
    const vy = ((e.clientY - rect.top) / rect.height) * DESK_H;
    const { kittyX, kittyY, kittyW, kittyH } = FOCUS_DESK_GEOMETRY;
    if (
      demoCatVisible &&
      vx >= kittyX - 10 &&
      vx <= kittyX + kittyW + 10 &&
      vy >= kittyY - 10 &&
      vy <= kittyY + kittyH + 10
    ) {
      demoKittyTimerRef.current = 60;
      setDemoCaption('Mochi curls beside your study notebook.');
    } else {
      demoReactionKindRef.current = demoReactionKindRef.current === 'happy' ? 'perkUp' : 'happy';
      demoReactionTimerRef.current = 52;
      setDemoCaption('Hana waves across the desk: "Ready for a quiet focus block?"');
    }
  };

  const handleSelectDemoMinutes = (mins: number) => {
    setDemoRunning(false);
    setDemoMinutes(mins);
    setDemoSecondsLeft(mins * 60);
  };

  const handleStartCheckout = async () => {
    if (!checkoutConfigured || checkoutBusy) return;
    setCheckoutBusy(true);
    setCheckoutNotice(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: 'stillalong-v1' }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        setCheckoutNotice(data.error || 'Checkout could not be started yet.');
      } else {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      setCheckoutNotice('Unable to reach checkout endpoint right now.');
    } finally {
      setCheckoutBusy(false);
    }
  };

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
    const subject = encodeURIComponent(`Stillalong Inquiry from ${contactName.trim()}`);
    const body = encodeURIComponent(
      `Name: ${contactName.trim()}\nReply-To: ${contactEmail.trim()}\n\n${contactMessage.trim()}`
    );
    setContactMailtoHref(`mailto:hello@stillalong.xyz?subject=${subject}&body=${body}`);
    setContactError(null);
    setContactSubmitted(true);
    setContactName('');
    setContactEmail('');
    setContactMessage('');
  };

  return (
    <div className="min-h-screen bg-[#11152A] text-[#F7F1E3]">
      {/* Sticky Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-[#252E54] bg-[#11152A]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigateRoute('/');
            }}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[#F7F1E3]"
          >
            <Star className="h-4 w-4 fill-[#F2BE6F] text-[#F2BE6F]" aria-hidden="true" />
            <span className="font-gba text-sm font-bold tracking-wider sm:text-base">
              STILLALONG
            </span>
          </a>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-6 text-sm font-medium text-[#C5CEE8] lg:flex"
          >
            <a href="#playground" className="shrink-0 whitespace-nowrap hover:text-[#F7F1E3]">
              Playground
            </a>
            <a href="#features" className="shrink-0 whitespace-nowrap hover:text-[#F7F1E3]">
              Features
            </a>
            <a href="#how-it-works" className="shrink-0 whitespace-nowrap hover:text-[#F7F1E3]">
              How It Works
            </a>
            <a
              href="#about"
              className="shrink-0 whitespace-nowrap rounded border border-[#44518A] bg-[#1A2146] px-2.5 py-1 font-semibold text-[#F7CB85] hover:bg-[#232C5C] hover:text-[#FFF9EC]"
            >
              About Stillalong
            </a>
            <a href="#pricing" className="shrink-0 whitespace-nowrap hover:text-[#F7F1E3]">
              Pricing
            </a>
            <a href="#faq" className="shrink-0 whitespace-nowrap hover:text-[#F7F1E3]">
              FAQ
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateRoute('/')}
              className="rpg-btn-cream hidden min-h-[42px] shrink-0 whitespace-nowrap rounded px-3.5 py-2 text-xs font-bold sm:inline-flex sm:items-center"
            >
              Study Room
            </button>
            <button
              type="button"
              onClick={() => onNavigateRoute('/app')}
              className="rpg-btn-amber min-h-[42px] shrink-0 whitespace-nowrap rounded px-4 py-2 text-xs font-bold"
            >
              Start studying
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="flex min-h-[42px] min-w-[42px] items-center justify-center rounded border border-[#303B6B] bg-[#181E3D] text-[#F7F1E3] lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="border-t border-[#252E54] bg-[#151A34] px-4 py-3 lg:hidden"
          >
            <div className="grid grid-cols-2 gap-2 text-sm font-medium text-[#C5CEE8]">
              {[
                { href: '#playground', label: 'Playground' },
                { href: '#features', label: 'Features' },
                { href: '#how-it-works', label: 'How It Works' },
                { href: '#about', label: 'About Stillalong' },
                { href: '#pricing', label: 'Pricing' },
                { href: '#faq', label: 'FAQ' },
                { href: '#contact', label: 'Contact' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-[42px] items-center rounded px-3 hover:bg-[#1D2549] hover:text-[#FFF9EC]"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main>
        {/* 1. HERO SECTION */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-6">
              <p className="font-gba text-xs tracking-widest text-[#AEB9DF]">
                A LITTLE PLACE TO STAY AWHILE.
              </p>
              <h1
                className="font-pixel font-bold tracking-tight text-[#FFF9EC]"
                style={{
                  fontSize: 'clamp(2.25rem, 4.2vw, 3.65rem)',
                  lineHeight: 1.07,
                  textWrap: 'balance',
                }}
              >
                Study alongside someone, even when you are on your own.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-[#C9D2F0]">
                Stillalong is a cozy GBA-inspired study room where you explore a quiet bedroom, sit
                across a wooden desk with Hana and Mochi, and finish calm Pomodoro blocks without
                cameras, feeds, or noise.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigateRoute('/app')}
                  className="rpg-btn-amber flex min-h-[48px] items-center gap-2 rounded px-6 py-2.5 text-sm font-bold"
                >
                  <span className="font-pixel text-lg">Start studying</span>
                  <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                </button>
                <a
                  href="#playground"
                  className="rpg-btn-cream flex min-h-[48px] items-center gap-2 rounded px-5 py-2.5 text-sm font-bold"
                >
                  <span>Explore Stillalong</span>
                  <ArrowRight className="h-4 w-4 text-[#3E549A]" aria-hidden="true" />
                </a>
                <a
                  href="#about"
                  className="rpg-btn-blue flex min-h-[48px] items-center gap-2 rounded px-5 py-2.5 text-sm font-bold"
                >
                  <span>About Stillalong</span>
                </a>
                <PWAInstallButton variant="web" />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#9AA6CC]">
                <span>Crafted by Volfnyra</span>
                <span aria-hidden="true">·</span>
                <span>No webcams or accounts needed</span>
                <span aria-hidden="true">·</span>
                <span>Offline-ready PWA</span>
              </div>
            </div>

            <div className="flex justify-center lg:col-span-6">
              <div className="rpg-frame relative w-full max-w-[460px] overflow-hidden rounded-lg p-2.5">
                <canvas
                  ref={heroCanvasRef}
                  width={ROOM_W}
                  height={ROOM_H}
                  className="pixelated block aspect-[640/614] w-full rounded"
                  aria-label="Live preview of Stillalong pixel-art bedroom with Hana and Mochi"
                />
                {!assets && (
                  <div className="absolute inset-2.5 flex flex-col items-center justify-center gap-3 rounded bg-[#14182D]/90 p-4 text-center">
                    <p className="font-gba text-xs text-[#F2BE6F]">
                      {assetError ? 'COULD NOT LOAD PIXEL ART' : 'LOADING PIXEL ROOM...'}
                    </p>
                    {assetError && (
                      <button
                        type="button"
                        onClick={reloadAssets}
                        className="rpg-btn-amber min-h-[40px] rounded px-4 py-1.5 text-xs font-bold"
                      >
                        Retry loading art
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 2. INTERACTIVE PLAYGROUND (CLEARLY LABELLED DEMO MODE) */}
        <section id="playground" className="border-t border-[#252E54] bg-[#151A34] py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded border border-[#5B492E] bg-[#2B241A] px-3 py-1 text-xs font-bold text-[#F7CB85]">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>DEMO MODE · PREVIEW PLAYGROUND</span>
                </div>
                <h2 className="font-pixel mt-3 text-3xl font-bold text-[#FFF9EC] sm:text-4xl">
                  Try the room &amp; focus desk right here
                </h2>
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#C5CEE8]">
                  Test switching views, walking around the bedroom, petting Mochi, changing day/night
                  ambience, and running the timer. Demo sessions are temporary previews and are not
                  saved to any cloud account.
                </p>
              </div>
            </div>

            <div className="rpg-frame mt-8 grid grid-cols-1 items-stretch gap-5 rounded-lg p-4 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="relative overflow-hidden rounded border-2 border-[#4A3126] bg-[#0D1020]">
                  <canvas
                    ref={playgroundCanvasRef}
                    width={demoView === 'room' ? ROOM_W : DESK_W}
                    height={demoView === 'room' ? ROOM_H : DESK_H}
                    onMouseMove={(e) => handlePlaygroundPointer(e, false)}
                    onMouseLeave={() => setDemoHoveredZone(null)}
                    onClick={(e) => handlePlaygroundPointer(e, true)}
                    className={`pixelated block w-full cursor-pointer select-none ${
                      demoView === 'room' ? 'aspect-[640/614]' : 'aspect-[768/528]'
                    }`}
                    aria-label="Interactive Stillalong Demo Playground"
                  />
                  {!assets && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#14182D]/90 p-4 text-center">
                      <p className="font-gba text-xs text-[#F2BE6F]">
                        {assetError ? 'COULD NOT LOAD PLAYGROUND' : 'LOADING PIXEL PLAYGROUND...'}
                      </p>
                      {assetError && (
                        <button
                          type="button"
                          onClick={reloadAssets}
                          className="rpg-btn-amber min-h-[40px] rounded px-4 py-1.5 text-xs font-bold"
                        >
                          Retry loading art
                        </button>
                      )}
                    </div>
                  )}
                  <div className="font-gba pointer-events-none absolute top-3 left-3 rounded border border-[#3D2820] bg-[#FFF8EB] px-2.5 py-1 text-[10px] font-bold text-[#2D2229]">
                    DEMO MODE · {demoView === 'room' ? 'BEDROOM VIEW' : 'DESK FOCUS VIEW'}
                  </div>
                </div>
              </div>

              <div className="rpg-bezel flex flex-col justify-between rounded-lg p-3 lg:col-span-4">
                <div className="rpg-inner-card flex flex-1 flex-col justify-between gap-4 rounded p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E5D4BD] pb-2">
                      <span className="font-gba text-[11px] font-bold text-[#2D2229]">
                        DEMO CONTROLS
                      </span>
                      <span className="rounded bg-[#EFE6D6] px-2 py-0.5 text-[10px] font-bold text-[#7D6551]">
                        NOT SAVED
                      </span>
                    </div>

                    {/* View Switcher */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDemoView('room')}
                        className={`min-h-[42px] rounded px-3 py-1.5 text-xs font-bold ${
                          demoView === 'room' ? 'rpg-btn-blue' : 'rpg-btn-cream'
                        }`}
                      >
                        Bedroom View
                      </button>
                      <button
                        type="button"
                        onClick={() => setDemoView('focus')}
                        className={`min-h-[42px] rounded px-3 py-1.5 text-xs font-bold ${
                          demoView === 'focus' ? 'rpg-btn-blue' : 'rpg-btn-cream'
                        }`}
                      >
                        Desk View
                      </button>
                    </div>

                    {/* Time + Cat Toggles */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDemoPeriod((p) => (p === 'night' ? 'morning' : 'night'))
                        }
                        className="rpg-btn-cream flex min-h-[42px] items-center justify-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-bold"
                      >
                        {demoPeriod === 'night' ? (
                          <Moon className="h-3.5 w-3.5 text-[#3E549A]" aria-hidden="true" />
                        ) : (
                          <Sun className="h-3.5 w-3.5 text-[#C4893B]" aria-hidden="true" />
                        )}
                        <span>{demoPeriod === 'night' ? 'Night Sky' : 'Morning Sky'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDemoCatVisible((v) => !v)}
                        className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-bold ${
                          demoCatVisible ? 'rpg-btn-blue' : 'rpg-btn-cream'
                        }`}
                      >
                        <Cat className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{demoCatVisible ? 'Mochi Here' : 'Show Mochi'}</span>
                      </button>
                    </div>

                    {/* Live Demo Countdown */}
                    <div className="rounded border border-[#35231D] bg-[#1E2345] p-3 text-center">
                      <p className="font-gba text-[9px] tracking-wider text-[#AEB9DF]">
                        PREVIEW TIMER
                      </p>
                      <p className="font-mono-tabular mt-1 text-4xl font-bold text-[#FFF8E8]">
                        {formatClock(demoSecondsLeft)}
                      </p>
                      <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                        {[5, 15, 25].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleSelectDemoMinutes(m)}
                            className={`font-mono-tabular min-h-[34px] rounded text-xs font-bold ${
                              demoMinutes === m ? 'rpg-btn-amber' : 'rpg-btn-cream'
                            }`}
                          >
                            {m}m
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDemoRunning((r) => !r)}
                        className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded px-3 py-2 text-xs font-bold ${
                          demoRunning ? 'rpg-btn-blue' : 'rpg-btn-rose'
                        }`}
                      >
                        {demoRunning ? (
                          <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                        )}
                        <span>{demoRunning ? 'Pause Demo' : 'Start Demo'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDemoRunning(false);
                          setDemoSecondsLeft(demoMinutes * 60);
                        }}
                        className="rpg-btn-cream flex min-h-[44px] items-center justify-center gap-1.5 rounded px-3 py-2 text-xs font-bold"
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Reset</span>
                      </button>
                    </div>

                    {demoView === 'focus' && (
                      <div className="grid grid-cols-4 gap-1">
                        {(
                          [
                            { id: 'auto', label: 'Auto' },
                            { id: 'writing', label: 'Write' },
                            { id: 'reading', label: 'Read' },
                            { id: 'mug', label: 'Tea' },
                          ] as { id: CompanionPoseMode; label: string }[]
                        ).map((pose) => (
                          <button
                            key={pose.id}
                            type="button"
                            onClick={() => setDemoPose(pose.id)}
                            className={`min-h-[36px] rounded py-1 text-[11px] font-bold ${
                              demoPose === pose.id ? 'rpg-btn-blue' : 'rpg-btn-cream'
                            }`}
                          >
                            {pose.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 border-t border-[#E5D4BD] pt-3">
                    <p className="rounded border border-[#D6C7B2] bg-[#FFFDF8] px-3 py-2 text-xs leading-snug text-[#4A382B]">
                      {demoCaption}
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigateRoute('/app')}
                      className="rpg-btn-amber flex min-h-[44px] w-full items-center justify-center gap-2 rounded px-4 py-2 text-xs font-bold"
                    >
                      <span>Open Full Study Room</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. FEATURES SECTION */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="max-w-2xl">
            <p className="font-gba text-xs tracking-widest text-[#AEB9DF]">FEATURES</p>
            <h2 className="font-pixel mt-2 text-3xl font-bold text-[#FFF9EC] sm:text-4xl">
              Designed to feel like a shared room, not another checklist.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#C5CEE8]">
              Every pixel and interaction serves calm body-doubling presence without distracting
              social feeds, pop-up streaks, or cluttered dashboards.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.num}
                className="flex flex-col justify-between rounded-lg border border-[#303B6B] bg-[#181E3D] p-5"
              >
                <div>
                  <span className="font-gba text-[11px] text-[#F2BE6F]">{f.num}</span>
                  <h3 className="font-pixel mt-2 text-xl font-bold leading-snug text-[#FFF9EC]">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#C9D2F0]">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. HOW IT WORKS (3 STEPS) */}
        <section id="how-it-works" className="border-t border-[#252E54] bg-[#151A34] py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-xl">
              <p className="font-gba text-xs tracking-widest text-[#AEB9DF]">HOW IT WORKS</p>
              <h2 className="font-pixel mt-2 text-3xl font-bold text-[#FFF9EC] sm:text-4xl">
                Three quiet steps to settle into focus.
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {HOW_IT_WORKS.map((item) => (
                <div
                  key={item.step}
                  className="rounded-lg border border-[#303B6B] bg-[#1B2244] p-6"
                >
                  <div className="font-gba inline-flex rounded border border-[#4D5A92] bg-[#141933] px-2.5 py-1 text-xs font-bold text-[#F2BE6F]">
                    STEP {item.step}
                  </div>
                  <h3 className="font-pixel mt-4 text-2xl font-bold text-[#FFF9EC]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#C9D2F0]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. ABOUT SECTION */}
        <section id="about" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid grid-cols-1 gap-8 rounded-lg border border-[#303B6B] bg-[#181E3D] p-7 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-8">
              <p className="font-gba text-xs tracking-widest text-[#F2BE6F]">ABOUT STILLALONG</p>
              <h2 className="font-pixel text-3xl font-bold text-[#FFF9EC]">
                Making solitary study hours feel gentler and less lonely.
              </h2>
              <p className="text-sm leading-relaxed text-[#C9D2F0]">
                Studying late on your own can make every chapter feel twice as heavy. Video streams
                and busy study Discords help some days, yet other evenings you just want a quiet,
                predictable space—no camera anxiety, no notifications, simply the calm company of
                someone working across the desk beside you.
              </p>
              <p className="text-sm leading-relaxed text-[#C9D2F0]">
                Crafted by Volfnyra, Stillalong brings nostalgic GBA pixel warmth together with
                reliable study tools so sitting down at your desk feels like returning to a familiar
                room.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 lg:col-span-4 lg:items-end">
              <div className="rpg-dialog rounded px-4 py-3 text-sm font-bold">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-[#F2BE6F] text-[#2A3561]" aria-hidden="true" />
                  <span className="font-pixel text-base">&ldquo;A little place to stay awhile.&rdquo;</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateRoute('/app')}
                className="rpg-btn-amber min-h-[44px] rounded px-5 py-2.5 text-sm font-bold"
              >
                Enter the Bedroom
              </button>
            </div>
          </div>
        </section>

        {/* 6. PRICING ($6.99 ONE-TIME PAYMENT, NO SUBSCRIPTIONS) */}
        <section id="pricing" className="border-t border-[#252E54] bg-[#151A34] py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="font-gba text-xs tracking-widest text-[#AEB9DF]">PRICING</p>
              <h2 className="font-pixel mt-2 text-3xl font-bold text-[#FFF9EC] sm:text-4xl">
                Pay $6.99 once. No subscriptions.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#C5CEE8]">
                No monthly subscriptions or recurring charges. Try the live room in Demo Mode first,
                then unlock Stillalong with a single $6.99 USD one-time payment when checkout is live.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Interactive Demo & Pre-Launch Preview */}
              <div className="flex flex-col justify-between rounded-lg border border-[#303B6B] bg-[#1B2244] p-6 sm:p-7">
                <div>
                  <span className="font-gba text-xs text-[#AEB9DF]">INTERACTIVE PREVIEW</span>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-pixel text-4xl font-bold text-[#FFF9EC]">$0</span>
                    <span className="text-xs text-[#9AA6CC]">Demo Mode · no account needed</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#C9D2F0]">
                    Explore the bedroom, switch between morning and night skies, pet Mochi, and test
                    the focus timer before you buy.
                  </p>
                  <ul className="mt-5 space-y-2.5 text-xs text-[#D5DDF5]">
                    <li className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-[#F2BE6F]" aria-hidden="true" />
                      <span>Interactive Bedroom &amp; Desk View Demo Mode</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Cat className="h-3.5 w-3.5 shrink-0 text-[#F2BE6F]" aria-hidden="true" />
                      <span>Meet Hana &amp; Mochi the desk cat</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 shrink-0 text-[#F2BE6F]" aria-hidden="true" />
                      <span>Full workspace open in pre-launch preview mode</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateRoute('/app')}
                  className="rpg-btn-cream mt-7 flex min-h-[46px] w-full items-center justify-center gap-2 rounded px-4 py-2 text-xs font-bold"
                >
                  <span>Try the Study Room</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              {/* $6.99 One-Time Full Tool License */}
              <div className="flex flex-col justify-between rounded-lg border-2 border-[#C89B54] bg-[#1F274D] p-6 sm:p-7">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-gba text-xs text-[#F2BE6F]">
                      FULL STILLALONG LICENSE
                    </span>
                    <span className="rounded bg-[#344075] px-2 py-0.5 text-[10px] font-bold text-[#F7CB85]">
                      ONE-TIME PAY
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-pixel text-4xl font-bold text-[#FFF9EC]">$6.99</span>
                    <span className="text-xs text-[#C9D2F0]">USD · one-time payment</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#D5DDF5]">
                    One single payment for the current Stillalong release crafted by Volfnyra—zero
                    subscriptions, zero recurring billing.
                  </p>
                  <ul className="mt-5 space-y-2.5 text-xs text-[#E4E9FA]">
                    <li className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 shrink-0 text-[#F2BE6F]" aria-hidden="true" />
                      <span>Single $6.99 USD payment — zero recurring subscriptions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Download className="h-3.5 w-3.5 shrink-0 text-[#F2BE6F]" aria-hidden="true" />
                      <span>Offline PWA install, 7-day notebook &amp; PNG share cards</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Share2 className="h-3.5 w-3.5 shrink-0 text-[#F2BE6F]" aria-hidden="true" />
                      <span>Covers current release &amp; bug fixes (future updates not bundled)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#F2BE6F]" aria-hidden="true" />
                      <span>Secure checkout &amp; tax handling via Lemon Squeezy</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-7 space-y-2">
                  {checkoutConfigured === true ? (
                    <button
                      type="button"
                      disabled={checkoutBusy}
                      onClick={handleStartCheckout}
                      className="rpg-btn-amber flex min-h-[46px] w-full items-center justify-center gap-2 rounded px-4 py-2 text-xs font-bold disabled:opacity-60"
                    >
                      <span>{checkoutBusy ? 'Opening Checkout...' : 'Buy Once for $6.99 USD'}</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex min-h-[46px] w-full cursor-not-allowed items-center justify-center rounded border border-[#44518A] bg-[#252E5B] px-4 py-2 text-xs font-bold text-[#AEB9DF] opacity-85"
                    >
                      {checkoutConfigured === null
                        ? 'Checking Checkout Availability...'
                        : 'Checkout Setup in Progress ($6.99 One-Time)'}
                    </button>
                  )}

                  {checkoutNotice ? (
                    <p className="text-center text-[11px] text-[#F2A0A0]">{checkoutNotice}</p>
                  ) : (
                    checkoutConfigured === false && (
                      <p className="text-center text-[11px] leading-snug text-[#9AA6CC]">
                        Lemon Squeezy payment keys are not connected in this environment yet. You
                        can preview Stillalong freely in the meantime.
                      </p>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. FAQ SECTION */}
        <section id="faq" className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <p className="font-gba text-xs tracking-widest text-[#AEB9DF]">FAQ</p>
          <h2 className="font-pixel mt-2 text-3xl font-bold text-[#FFF9EC]">
            Frequently Asked Questions
          </h2>
          <div className="mt-6 space-y-3">
            {FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={item.q}
                  className="rounded-lg border border-[#303B6B] bg-[#181E3D]"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex min-h-[52px] w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-[#FFF9EC]"
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
        </section>

        {/* 8. CONTACT SECTION */}
        <section id="contact" className="border-t border-[#252E54] bg-[#151A34] py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="rounded-lg border border-[#303B6B] bg-[#181E3D] p-6 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-pixel text-3xl font-bold text-[#FFF9EC]">Contact</h2>
                <a
                  href="mailto:hello@stillalong.xyz"
                  className="font-mono-tabular text-xs text-[#F7CB85] underline hover:text-[#FFF9EC]"
                >
                  hello@stillalong.xyz
                </a>
              </div>
              <p className="mt-1 text-sm text-[#C9D2F0]">
                Have feedback, pixel art suggestions, accessibility notes, or purchase questions?
              </p>

              {contactSubmitted ? (
                <div className="rpg-dialog mt-5 space-y-3 rounded px-4 py-4 text-sm font-semibold">
                  <p>
                    Your message is ready to send. Open your email client below or write directly to{' '}
                    <a
                      href="mailto:hello@stillalong.xyz"
                      className="font-mono-tabular underline"
                    >
                      hello@stillalong.xyz
                    </a>
                    .
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={contactMailtoHref}
                      className="rpg-btn-amber inline-flex min-h-[40px] items-center rounded px-4 py-1.5 text-xs font-bold"
                    >
                      Open in Email App
                    </a>
                    <button
                      type="button"
                      onClick={() => setContactSubmitted(false)}
                      className="rpg-btn-cream min-h-[40px] rounded px-3 py-1.5 text-xs font-bold"
                    >
                      Write Another Note
                    </button>
                  </div>
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
                        className="mt-1.5 min-h-[44px] w-full rounded border border-[#3A467A] bg-[#11152A] px-3 py-2 text-sm text-[#F7F1E3] focus:border-[#F2C97D] focus:outline-none"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-[#C9D2F0]">
                      Email
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="mt-1.5 min-h-[44px] w-full rounded border border-[#3A467A] bg-[#11152A] px-3 py-2 text-sm text-[#F7F1E3] focus:border-[#F2C97D] focus:outline-none"
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
                    className="rpg-btn-amber min-h-[44px] rounded px-5 py-2 text-xs font-bold"
                  >
                    Send Note
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* 9. FINAL CTA */}
        <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <p className="font-gba text-xs tracking-widest text-[#F2BE6F]">
            STILLALONG · CRAFTED BY VOLFNYRA
          </p>
          <h2 className="font-pixel mt-3 text-3xl font-bold text-[#FFF9EC] sm:text-4xl">
            Your study desk is warm and ready.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#C9D2F0]">
            Pick a subject, pour something warm to drink, and spend a quiet 25-minute block with
            Hana and Mochi.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateRoute('/app')}
              className="rpg-btn-amber flex min-h-[48px] items-center gap-2 rounded px-6 py-2.5 text-sm font-bold"
            >
              <span className="font-pixel text-lg">Start studying</span>
              <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            </button>
          </div>
        </section>
      </main>

      {/* COMPLETE MARKETING FOOTER (Strictly on marketing/legal pages, never inside /app) */}
      <footer className="border-t border-[#252E54] bg-[#0E1224] py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 text-xs text-[#9AA6CC] sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-[#F7F1E3]">
              <Star className="h-4 w-4 fill-[#F2BE6F] text-[#F2BE6F]" aria-hidden="true" />
              <span className="font-gba font-bold tracking-wider">STILLALONG</span>
            </div>
            <p className="text-sm font-medium text-[#D5DDF5]">A little place to stay awhile.</p>
            <p className="leading-relaxed text-[#8E9AC2]">
              Crafted by Volfnyra. A cozy GBA-inspired pixel-art virtual study room built for calm,
              solitary focus.
            </p>
          </div>

          <div>
            <p className="font-gba mb-3 text-[10px] font-bold tracking-wider text-[#F7F1E3]">
              EXPLORE
            </p>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateRoute('/')}
                  className="hover:text-[#F7F1E3]"
                >
                  Study Room (Home)
                </button>
              </li>
              <li>
                <a href="#playground" className="hover:text-[#F7F1E3]">
                  Interactive Playground
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#F7F1E3]">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#F7F1E3]">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-gba mb-3 text-[10px] font-bold tracking-wider text-[#F7F1E3]">
              PRODUCT
            </p>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateRoute('/app')}
                  className="hover:text-[#F7F1E3]"
                >
                  Open Focus Desk
                </button>
              </li>
              <li>
                <a href="#about" className="hover:text-[#F7F1E3]">
                  About Volfnyra
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-[#F7F1E3]">
                  Pricing ($6.99 One-Time)
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#F7F1E3]">
                  FAQ &amp; Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-gba mb-3 text-[10px] font-bold tracking-wider text-[#F7F1E3]">
              LEGAL &amp; BILLING
            </p>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateRoute('/privacy')}
                  className="hover:text-[#F7F1E3]"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateRoute('/terms')}
                  className="hover:text-[#F7F1E3]"
                >
                  Terms &amp; Refund Policy
                </button>
              </li>
              <li className="leading-relaxed text-[#8E9AC2]">
                One-time purchase only (no subscriptions). Payments handled by Lemon Squeezy when
                checkout is enabled.
              </li>
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-[#1D2442] px-4 pt-6 text-[11px] text-[#838FB8] sm:px-6">
          <span>© {new Date().getFullYear()} Stillalong · Crafted by Volfnyra.</span>
          <span>
            Support:{' '}
            <a
              href="mailto:hello@stillalong.xyz"
              className="font-mono-tabular text-[#AEB9DF] hover:text-[#FFF9EC] hover:underline"
            >
              hello@stillalong.xyz
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
};
