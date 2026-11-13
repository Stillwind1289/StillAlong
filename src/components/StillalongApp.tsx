import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Clock,
  Music,
  Play,
  Settings as SettingsIcon,
  Square,
  Star,
  Tag,
  Trash2,
  User,
  X,
} from 'lucide-react';
import {
  DESK_H,
  DESK_W,
  LoadedPixelAssets,
  ROOM_CLICK_ZONES,
  ROOM_H,
  ROOM_W,
  RoomTargetArea,
  RoomWalker,
  drawCharacterPreview,
  drawRoomScene,
  drawWebcamFocusScene,
  loadPixelAssets,
  stepRoomWalker,
} from '../canvas/spriteSheetEngine';
import { EndedSessionSummary, useStudyTimer } from '../hooks/useStudyTimer';
import {
  AppPreferences,
  AppScreen,
  CHARACTERS,
  CharacterId,
  RoutePath,
  SUBJECT_PRESETS,
  SoundscapeMode,
  StudySession,
  TimeOfDayMode,
  TimerSettings,
} from '../types/study';
import { cozyAudio } from '../utils/audio';
import {
  computeStudyStats,
  loadPreferences,
  loadSessions,
  loadSettings,
  savePreferences,
  saveSessions,
  saveSettings,
} from '../utils/storage';
import { TIME_ATMOSPHERES, resolveTimeOfDay } from '../utils/timeOfDay';
import { GirlSprite } from './GirlSprite';
import { PWAInstallButton } from './PWAInstallButton';

interface StillalongAppProps {
  onNavigateRoute: (route: RoutePath) => void;
}

const SOUND_CYCLE: { id: SoundscapeMode; label: string }[] = [
  { id: 'off', label: 'Quiet Mode' },
  { id: 'rain', label: 'Soft Rain' },
  { id: 'vinyl', label: 'Warm Vinyl' },
  { id: 'crickets', label: 'Night Air' },
];

function formatClock(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export const StillalongApp: React.FC<StillalongAppProps> = ({ onNavigateRoute }) => {
  const [screen, setScreen] = useState<AppScreen>('welcome');
  const [assets, setAssets] = useState<LoadedPixelAssets | null>(null);
  const [prefs, setPrefs] = useState<AppPreferences>(() => loadPreferences());
  const [settings, setSettings] = useState<TimerSettings>(() => loadSettings());
  const [sessions, setSessions] = useState<StudySession[]>(() => loadSessions());

  const [pendingCharacter, setPendingCharacter] = useState<CharacterId>(prefs.characterId);
  const [roomDialogue, setRoomDialogue] = useState<string>(
    'The room is quiet and the desk is ready.'
  );
  const [focusDialogue, setFocusDialogue] = useState<string>("I'll be right here.");
  const [hoveredZone, setHoveredZone] = useState<RoomTargetArea>(null);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  // Subject switcher & End Session summary state
  const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);
  const [customSubjectDraft, setCustomSubjectDraft] = useState('');
  const [endedSummary, setEndedSummary] = useState<EndedSessionSummary | null>(null);

  // Minute ticker for local time + Auto time-of-day updates
  const [clockNow, setClockNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setClockNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const resolvedPeriod = resolveTimeOfDay(prefs.timeOfDay, clockNow);
  const atmosphere = TIME_ATMOSPHERES[resolvedPeriod];
  const lampOn =
    prefs.lampMode === 'auto' ? atmosphere.lampDefaultOn : prefs.lampMode === 'on';
  const localClockText = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(clockNow),
    [clockNow]
  );

  // Canvas & sprite animation refs
  const welcomeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const malePreviewRef = useRef<HTMLCanvasElement | null>(null);
  const femalePreviewRef = useRef<HTMLCanvasElement | null>(null);
  const roomCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const deskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const frameRef = useRef<number>(0);
  const catHappyRef = useRef<number>(0);
  const walkerRef = useRef<RoomWalker>({
    x: 345,
    y: 295,
    targetX: 386,
    targetY: 220,
    facing: 'down',
    moving: false,
    waitTicks: 45,
  });

  const handleSessionCompleted = React.useCallback((session: StudySession) => {
    setSessions((prev) => [session, ...prev]);
    catHappyRef.current = 90;
  }, []);

  const handlePhaseMessage = React.useCallback((msg: string) => {
    setFocusDialogue(msg);
  }, []);

  // Timestamp-based timer decoupled from scenes (stays accurate across all 6 screens)
  const timer = useStudyTimer({
    settings,
    characterId: prefs.characterId,
    subject: prefs.selectedSubject || 'General Study',
    onSessionCompleted: handleSessionCompleted,
    onPhaseMessage: handlePhaseMessage,
  });

  // Load sprite sheets & room art
  useEffect(() => {
    let mounted = true;
    loadPixelAssets()
      .then((loaded) => {
        if (mounted) setAssets(loaded);
      })
      .catch(() => {
        // Handled cleanly
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Persist user data locally
  useEffect(() => {
    savePreferences(prefs);
    if (prefs.soundscape === 'off') {
      cozyAudio.stopSoundscape();
    } else {
      cozyAudio.setSoundscape(prefs.soundscape, prefs.volume);
    }
  }, [prefs]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  // Document title reflects active timer across screens
  useEffect(() => {
    if (timer.status === 'running') {
      document.title = `${formatClock(timer.secondsLeft)} · ${
        timer.phase === 'focus' || timer.mode === 'custom'
          ? prefs.selectedSubject || 'Focusing'
          : 'Break'
      } — Stillalong`;
    } else {
      document.title = 'Stillalong — A Little Place to Stay Awhile';
    }
  }, [timer.secondsLeft, timer.status, timer.phase, timer.mode, prefs.selectedSubject]);

  const renderStateRef = useRef({
    screen,
    characterId: prefs.characterId,
    status: timer.status,
    phase: timer.phase,
    secondsLeft: timer.secondsLeft,
    hoveredZone,
    soundOn: prefs.soundscape !== 'off',
    atmosphere,
    lampOn,
  });
  renderStateRef.current = {
    screen,
    characterId: prefs.characterId,
    status: timer.status,
    phase: timer.phase,
    secondsLeft: timer.secondsLeft,
    hoveredZone,
    soundOn: prefs.soundscape !== 'off',
    atmosphere,
    lampOn,
  };

  // Smooth 24fps pixel animation loop
  useEffect(() => {
    if (!assets) return;
    let rafId = 0;
    let lastTick = 0;
    const interval = 1000 / 24;

    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      if (now - lastTick < interval) return;
      lastTick = now;

      frameRef.current += 1;
      if (catHappyRef.current > 0) catHappyRef.current -= 1;

      const cur = renderStateRef.current;

      if (cur.screen === 'welcome' && welcomeCanvasRef.current) {
        const ctx = welcomeCanvasRef.current.getContext('2d');
        if (ctx) {
          drawRoomScene(ctx, assets, frameRef.current, {
            characterId: cur.characterId,
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
            atmosphere: cur.atmosphere,
            lampOn: cur.lampOn,
          });
        }
      } else if (cur.screen === 'character') {
        if (malePreviewRef.current) {
          const ctx = malePreviewRef.current.getContext('2d');
          if (ctx) drawCharacterPreview(ctx, assets, 'male', frameRef.current, 160, 148);
        }
        if (femalePreviewRef.current) {
          const ctx = femalePreviewRef.current.getContext('2d');
          if (ctx) drawCharacterPreview(ctx, assets, 'female', frameRef.current, 160, 148);
        }
      } else if (cur.screen === 'room' && roomCanvasRef.current) {
        const ctx = roomCanvasRef.current.getContext('2d');
        if (ctx) {
          walkerRef.current = stepRoomWalker(
            walkerRef.current,
            cur.status === 'running' && cur.phase === 'focus'
          );
          drawRoomScene(ctx, assets, frameRef.current, {
            characterId: cur.characterId,
            walker: walkerRef.current,
            hoveredZone: cur.hoveredZone,
            catHappyTimer: catHappyRef.current,
            isStudying: cur.status === 'running' && cur.phase === 'focus',
            atmosphere: cur.atmosphere,
            lampOn: cur.lampOn,
          });
        }
      } else if (cur.screen === 'focus' && deskCanvasRef.current) {
        const ctx = deskCanvasRef.current.getContext('2d');
        if (ctx) {
          drawWebcamFocusScene(ctx, assets, frameRef.current, {
            characterId: cur.characterId,
            status: cur.status,
            phase: cur.phase,
            clockText: formatClock(cur.secondsLeft),
            catHappyTimer: catHappyRef.current,
            soundOn: cur.soundOn,
            atmosphere: cur.atmosphere,
            lampOn: cur.lampOn,
          });
        }
      }
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [assets]);

  const cycleSoundscape = () => {
    const idx = SOUND_CYCLE.findIndex((s) => s.id === prefs.soundscape);
    const next = SOUND_CYCLE[(idx + 1) % SOUND_CYCLE.length];
    setPrefs((prev) => ({ ...prev, soundscape: next.id }));
    if (settings.chimeEnabled) cozyAudio.playChime('click');
  };

  const currentSoundLabel =
    SOUND_CYCLE.find((s) => s.id === prefs.soundscape)?.label ?? 'Quiet Mode';

  const selectSubject = (nextSubject: string) => {
    const clean = nextSubject.trim();
    if (!clean) return;
    setPrefs((prev) => ({ ...prev, selectedSubject: clean }));
    setSubjectPickerOpen(false);
    setCustomSubjectDraft('');
    if (settings.chimeEnabled) cozyAudio.playChime('click');
  };

  const startStudyingFromRoom = () => {
    if (settings.chimeEnabled) cozyAudio.playChime('click');
    setEndedSummary(null);
    setScreen('focus');
    if (timer.status === 'idle') {
      timer.start();
    }
  };

  const handleEndSession = () => {
    const summary = timer.endSession();
    if (settings.chimeEnabled) cozyAudio.playChime('complete');
    setEndedSummary(summary);
  };

  const handleRoomPointer = (
    e: React.MouseEvent<HTMLCanvasElement>,
    isClick: boolean
  ) => {
    const canvas = roomCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * ROOM_W;
    const vy = ((e.clientY - rect.top) / rect.height) * ROOM_H;
    const found = ROOM_CLICK_ZONES.find(
      (z) => vx >= z.x && vx <= z.x + z.w && vy >= z.y && vy <= z.y + z.h
    );
    const id = found ? found.id : null;
    setHoveredZone(id);

    if (!isClick || !id) return;
    if (settings.chimeEnabled) cozyAudio.playChime('click');

    if (id === 'desk') {
      setScreen('focus');
    } else if (id === 'cat') {
      catHappyRef.current = 75;
      setRoomDialogue('The white kitty purrs softly and curls closer.');
    } else if (id === 'window') {
      setRoomDialogue(
        resolvedPeriod === 'night'
          ? 'The night sky outside is calm and dotted with stars.'
          : resolvedPeriod === 'evening'
            ? 'Warm evening light fades gently across the rooftops.'
            : resolvedPeriod === 'afternoon'
              ? 'Soft afternoon clouds drift past the window.'
              : 'Fresh morning daylight fills the room.'
      );
    } else if (id === 'bookshelf') {
      setRoomDialogue('Neatly stacked notebooks and reference books line the shelves.');
    } else if (id === 'bed') {
      setRoomDialogue('A quiet corner to rest when your study blocks are done.');
    }
  };

  const handleDeskCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = deskCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * DESK_W;
    const vy = ((e.clientY - rect.top) / rect.height) * DESK_H;
    const hitKitty =
      prefs.characterId === 'male'
        ? vx >= 506 && vx <= 622 && vy >= 325 && vy <= 450
        : vx >= 462 && vx <= 556 && vy >= 280 && vy <= 398;
    if (hitKitty) {
      catHappyRef.current = 80;
      if (settings.chimeEnabled) cozyAudio.playChime('click');
      setFocusDialogue('Kitty seems glad to have us both studying together.');
    }
  };

  const stats = useMemo(() => computeStudyStats(sessions), [sessions]);
  const activeChar = CHARACTERS[prefs.characterId];
  const focusSessions = sessions.filter((s) => s.phase === 'focus');
  const maxDay = Math.max(25, ...stats.last7Days.map((d) => d.minutes));
  const timeFmt = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const progressPct =
    timer.totalSeconds > 0
      ? Math.min(
          100,
          Math.max(0, Math.round(((timer.totalSeconds - timer.secondsLeft) / timer.totalSeconds) * 100))
        )
      : 0;

  const sessionStatusLabel =
    timer.status === 'running'
      ? timer.phase === 'focus' || timer.mode === 'custom'
        ? 'FOCUSING'
        : 'BREAK'
      : timer.status === 'paused'
        ? 'PAUSED'
        : 'READY';

  // Helper bar for non-focus game screens (Room, History, Settings)
  const renderGameNavStrip = (titleText: string, backTarget?: AppScreen, backLabel?: string) => (
    <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {backTarget && (
          <button
            type="button"
            onClick={() => setScreen(backTarget)}
            className="rpg-plate flex min-h-[38px] items-center gap-1.5 rounded px-3 py-1 text-xs font-bold"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-gba text-[11px]">{backLabel}</span>
          </button>
        )}
      </div>

      <div className="rpg-plate flex items-center gap-2 rounded px-3.5 py-1.5">
        <Star className="h-3.5 w-3.5 fill-[#F2BE6F] text-[#3B251B]" aria-hidden="true" />
        <span className="font-gba text-[11px] font-bold tracking-wider text-[#2D2229]">
          {titleText}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {timer.status === 'running' && screen !== 'focus' && (
          <button
            type="button"
            onClick={() => setScreen('focus')}
            className="rpg-btn-blue font-mono-tabular flex min-h-[38px] items-center gap-1.5 rounded px-3 py-1 text-xs font-bold"
          >
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{formatClock(timer.secondsLeft)}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setScreen('history')}
          aria-label="Study history"
          className={`flex min-h-[38px] items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold ${
            screen === 'history' ? 'rpg-btn-blue' : 'rpg-plate'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-gba hidden text-[10px] sm:inline">history</span>
        </button>
        <button
          type="button"
          onClick={() => setScreen('settings')}
          aria-label="Settings"
          className={`flex min-h-[38px] items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold ${
            screen === 'settings' ? 'rpg-btn-blue' : 'rpg-plate'
          }`}
        >
          <SettingsIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-gba hidden text-[10px] sm:inline">settings</span>
        </button>
        <button
          type="button"
          onClick={cycleSoundscape}
          aria-label="Toggle ambient sound"
          className="rpg-plate flex min-h-[38px] items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold"
        >
          <Music className="h-3.5 w-3.5 text-[#3E549A]" aria-hidden="true" />
          <span className="font-gba hidden text-[10px] md:inline">
            {currentSoundLabel.toLowerCase()}
          </span>
        </button>
      </div>
    </header>
  );

  // Reusable Subject Picker Overlay/Drawer
  const renderSubjectPicker = () => {
    if (!subjectPickerOpen) return null;
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose study subject"
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0E20]/75 p-4"
      >
        <div className="rpg-bezel w-full max-w-md rounded-lg p-3">
          <div className="rpg-inner-card space-y-4 rounded p-4 sm:p-5">
            <div className="flex items-center justify-between border-b-2 border-[#E5D4BD] pb-2.5">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#BA5F54]" aria-hidden="true" />
                <h2 className="font-gba text-xs font-bold text-[#2D2229]">CHOOSE SUBJECT</h2>
              </div>
              <button
                type="button"
                onClick={() => setSubjectPickerOpen(false)}
                aria-label="Close subject picker"
                className="rpg-btn-cream rounded p-1.5"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {SUBJECT_PRESETS.map((sub) => {
                const active = prefs.selectedSubject === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => selectSubject(sub)}
                    className={`flex min-h-[40px] items-center justify-between rounded px-3 py-2 text-left text-xs font-bold ${
                      active ? 'rpg-btn-blue' : 'rpg-btn-cream'
                    }`}
                  >
                    <span className="truncate">{sub}</span>
                    {active && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (customSubjectDraft.trim()) selectSubject(customSubjectDraft);
              }}
              className="flex gap-2 border-t-2 border-[#E5D4BD] pt-3"
            >
              <input
                type="text"
                maxLength={28}
                value={customSubjectDraft}
                onChange={(e) => setCustomSubjectDraft(e.target.value)}
                placeholder="Custom subject..."
                aria-label="Custom study subject"
                className="min-h-[40px] flex-1 rounded border-2 border-[#4A3126] bg-[#FFFDF8] px-3 text-xs font-medium text-[#36261E] placeholder-[#94806D] focus:border-[#3E549A] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!customSubjectDraft.trim()}
                className="rpg-btn-amber min-h-[40px] rounded px-4 text-xs font-bold disabled:opacity-45"
              >
                Use
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Reusable Session Summary Modal when user ends a study session
  const renderSessionSummaryModal = () => {
    if (!endedSummary) return null;
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Study session summary"
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0E20]/80 p-4"
      >
        <div className="rpg-walnut w-full max-w-md rounded-lg p-3">
          <div className="rpg-inner-card space-y-4 rounded p-5">
            <div className="flex items-center justify-between border-b-2 border-[#E5D4BD] pb-3">
              <div>
                <p className="font-gba text-[10px] tracking-wider text-[#7D6551]">
                  STUDY BLOCK COMPLETE
                </p>
                <h2 className="font-pixel text-2xl font-bold text-[#2D2229]">Session Summary</h2>
              </div>
              {prefs.characterId === 'female' ? (
                <GirlSprite
                  animation="reading"
                  className="w-16 rounded border-2 border-[#3D2820] bg-[#21264D]"
                  alt="Hana resting with a book"
                />
              ) : (
                <Star className="h-6 w-6 fill-[#F2BE6F] text-[#3B251B]" aria-hidden="true" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-center">
              <div className="rounded border-2 border-[#D6C7B2] bg-[#FFFDF8] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7D6652]">
                  Subject
                </p>
                <p className="mt-1 truncate text-sm font-bold text-[#2D2229]">
                  {endedSummary.subject}
                </p>
              </div>
              <div className="rounded border-2 border-[#D6C7B2] bg-[#FFFDF8] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7D6652]">
                  Time Focused
                </p>
                <p className="font-mono-tabular mt-1 text-lg font-bold text-[#3E549A]">
                  {endedSummary.durationMinutes >= 1
                    ? `${endedSummary.durationMinutes}m`
                    : `${endedSummary.elapsedSeconds}s`}
                </p>
              </div>
            </div>

            <div className="rounded border-2 border-[#D6C7B2] bg-[#FFFDF8] px-3.5 py-2.5 text-xs text-[#4A382B]">
              {endedSummary.recorded ? (
                <span>
                  Saved to your Study Notebook. Total today:{' '}
                  <strong className="font-mono-tabular text-[#2D2229]">
                    {formatDuration(stats.todayMinutes)}
                  </strong>{' '}
                  across {stats.todayCount} {stats.todayCount === 1 ? 'block' : 'blocks'}.
                </span>
              ) : (
                <span>
                  Timer reset cleanly. Blocks of 1 minute or longer are recorded to your Study
                  Notebook.
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setEndedSummary(null);
                  timer.start();
                }}
                className="rpg-btn-rose min-h-[42px] rounded px-4 py-2 text-xs font-bold"
              >
                Start Another Block
              </button>
              <button
                type="button"
                onClick={() => {
                  setEndedSummary(null);
                  setScreen('room');
                }}
                className="rpg-btn-amber min-h-[42px] rounded px-4 py-2 text-xs font-bold"
              >
                Back to Room
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setEndedSummary(null);
                setScreen('history');
              }}
              className="w-full text-center text-xs font-bold text-[#3E549A] hover:underline"
            >
              Open Study Notebook →
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#12162E] px-3 py-4 sm:px-6">
      {/* Subtle pixel-step starry midnight backdrop (no blur or noisy particles) */}
      <div
        className="pointer-events-none fixed inset-0 opacity-35"
        style={{
          backgroundImage:
            'radial-gradient(#FFF3C4 1px, transparent 1px), radial-gradient(#8DA4E8 1px, transparent 1px)',
          backgroundSize: '48px 48px, 72px 72px',
          backgroundPosition: '0 0, 24px 36px',
        }}
        aria-hidden="true"
      />

      {renderSubjectPicker()}
      {renderSessionSummaryModal()}

      {/* SCREEN 1 — WELCOME */}
      {screen === 'welcome' && (
        <main className="rpg-frame relative z-10 w-full max-w-5xl rounded-lg p-4 sm:p-6">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#2D335E] pb-4">
            <div className="rpg-plate flex items-center gap-2 rounded px-3.5 py-1.5">
              <Star className="h-4 w-4 fill-[#F2BE6F] text-[#3B251B]" aria-hidden="true" />
              <span className="font-gba text-sm font-bold tracking-wider text-[#2D2229]">
                STILLALONG
              </span>
            </div>

            <p className="font-gba hidden text-xs tracking-widest text-[#C9D2F0] md:block">
              A LITTLE PLACE TO STAY AWHILE.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cycleSoundscape}
                className="rpg-plate flex min-h-[38px] items-center gap-2 rounded px-3 py-1.5 text-xs font-bold"
              >
                <Music className="h-3.5 w-3.5 text-[#3E549A]" aria-hidden="true" />
                <span className="font-gba text-[11px]">
                  {prefs.soundscape === 'off' ? 'sound off' : currentSoundLabel.toLowerCase()}
                </span>
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 items-center gap-7 py-6 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-6">
              <p className="font-gba text-[11px] tracking-widest text-[#AEB9DF]">
                COZY RETRO STUDY COMPANION
              </p>
              <h1 className="font-pixel text-4xl leading-tight font-bold text-[#FFF9EC] sm:text-5xl">
                Some things are better together.
              </h1>
              <p className="max-w-md text-base leading-relaxed text-[#D2DAF5]">
                Step into a quiet pixel bedroom, meet your study companion and your cat, and sit
                together at the desk while you work.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (settings.chimeEnabled) cozyAudio.playChime('click');
                    setScreen(prefs.characterConfirmed ? 'room' : 'character');
                  }}
                  className="rpg-btn-amber flex min-h-[44px] items-center gap-2 rounded px-5 py-2.5 text-sm font-bold"
                >
                  <span className="font-pixel text-lg">
                    {prefs.characterConfirmed ? 'Enter Room' : 'Enter'}
                  </span>
                  <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPendingCharacter(prefs.characterId);
                    setScreen('character');
                  }}
                  className="rpg-btn-cream flex min-h-[44px] items-center gap-2 rounded px-4 py-2.5 text-xs font-bold"
                >
                  <User className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Companion: {activeChar.name}</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative overflow-hidden rounded border-[3px] border-[#4A3126] bg-[#14182D] p-1.5 shadow-[0_6px_0_#0D1021]">
                <canvas
                  ref={welcomeCanvasRef}
                  width={ROOM_W}
                  height={ROOM_H}
                  className="pixelated block aspect-3/2 w-full rounded-xs"
                  aria-label="Animated preview of the cozy Stillalong bedroom"
                />
                <div className="font-gba absolute bottom-4 left-4 rounded border-2 border-[#3D2820] bg-[#FFF8EB] px-2.5 py-1 text-[10px] font-bold text-[#2D2229]">
                  {atmosphere.label.toUpperCase()} · {activeChar.name.toUpperCase()} &amp; KITTY
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#2D335E] pt-3 text-[11px] text-[#93A0CC]">
            <button
              type="button"
              onClick={() => onNavigateRoute('/')}
              className="font-gba hover:text-[#FFF9EC]"
            >
              ← ABOUT STILLALONG
            </button>
            <span className="font-gba text-[#C9D2F0]">
              {localClockText} · {atmosphere.label.toUpperCase()}
            </span>
            <span className="font-gba">TAKE YOUR TIME</span>
          </div>
        </main>
      )}

      {/* SCREEN 2 — CHARACTER SELECTION */}
      {screen === 'character' && (
        <main className="rpg-frame relative z-10 w-full max-w-4xl rounded-lg p-4 sm:p-6">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#2D335E] pb-4">
            <button
              type="button"
              onClick={() => setScreen('welcome')}
              className="rpg-plate flex min-h-[38px] items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-gba text-[11px]">back</span>
            </button>

            <div className="rpg-plate flex items-center gap-2 rounded px-4 py-1.5">
              <Star className="h-3.5 w-3.5 fill-[#F2BE6F] text-[#3B251B]" aria-hidden="true" />
              <span className="font-gba text-xs font-bold text-[#2D2229]">
                CHOOSE YOUR COMPANION
              </span>
            </div>

            <div className="w-16" aria-hidden="true" />
          </header>

          <p className="mb-5 text-center text-sm text-[#D2DAF5]">
            Pick who you would like to share the bedroom desk with. Both companions keep steady
            study energy alongside your white cat.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(['female', 'male'] as CharacterId[]).map((cid) => {
              const char = CHARACTERS[cid];
              const selected = pendingCharacter === cid;
              return (
                <button
                  key={cid}
                  type="button"
                  onClick={() => {
                    setPendingCharacter(cid);
                    if (settings.chimeEnabled) cozyAudio.playChime('click');
                  }}
                  aria-pressed={selected}
                  className={`flex flex-col items-center rounded-lg border-[3px] p-4 text-left transition-transform ${
                    selected
                      ? 'border-[#F2BE6F] bg-[#282D57] shadow-[0_6px_0_#10132A]'
                      : 'border-[#333B6B] bg-[#1B2042] hover:border-[#6A79B8]'
                  }`}
                >
                  <div className="mb-3 overflow-hidden rounded border-2 border-[#4A3126] bg-[#161A36]">
                    <canvas
                      ref={cid === 'male' ? malePreviewRef : femalePreviewRef}
                      width={160}
                      height={148}
                      className="pixelated block h-[148px] w-[160px]"
                      aria-label={`${char.name} animated sprite preview`}
                    />
                  </div>
                  <div className="w-full space-y-1 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-pixel text-2xl font-bold text-[#FFF9EC]">
                        {char.name}
                      </span>
                      <span className="font-gba text-[10px] text-[#AEB9DF]">
                        · {char.label}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-[#C9D2F0]">{char.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rpg-dialog mt-6 flex flex-wrap items-center justify-between gap-3 rounded px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Star className="h-4 w-4 shrink-0 fill-[#F2BE6F] text-[#3B251B]" aria-hidden="true" />
              <p className="font-pixel text-base font-bold text-[#3B2920]">
                Study alongside {CHARACTERS[pendingCharacter].name} and the white kitty?
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setPrefs((prev) => ({
                  ...prev,
                  characterId: pendingCharacter,
                  characterConfirmed: true,
                }));
                if (settings.chimeEnabled) cozyAudio.playChime('start');
                setRoomDialogue(
                  `${CHARACTERS[pendingCharacter].name} is getting the desk ready for us.`
                );
                setScreen('room');
              }}
              className="rpg-btn-amber flex min-h-[44px] items-center gap-2 rounded px-5 py-2 text-sm font-bold"
            >
              <span className="font-pixel text-lg">Confirm &amp; Enter Room</span>
              <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            </button>
          </div>
        </main>
      )}

      {/* SCREEN 3 — PLAYGROUND (MINIMAL COZY BEDROOM, NORMAL LIGHTING) */}
      {screen === 'room' && (
        <main className="rpg-frame relative z-10 w-full max-w-5xl rounded-lg p-3 sm:p-4">
          {renderGameNavStrip(
            `${localClockText} · ${atmosphere.label.toUpperCase()}`,
            'welcome',
            'outside'
          )}

          <div className="relative overflow-hidden rounded border-[3px] border-[#4A3126] bg-[#0D1020]">
            <canvas
              ref={roomCanvasRef}
              width={ROOM_W}
              height={ROOM_H}
              onMouseMove={(e) => handleRoomPointer(e, false)}
              onMouseLeave={() => setHoveredZone(null)}
              onClick={(e) => handleRoomPointer(e, true)}
              className={`pixelated block aspect-3/2 w-full select-none ${
                hoveredZone ? 'cursor-pointer' : 'cursor-default'
              }`}
              aria-label="Top-down pixel art bedroom"
            />

            {hoveredZone && (
              <div className="rpg-plate pointer-events-none absolute top-3 left-3 rounded px-2.5 py-1 text-xs font-bold">
                {ROOM_CLICK_ZONES.find((z) => z.id === hoveredZone)?.label}
              </div>
            )}

            {prefs.showDialogue && (
              <div className="rpg-dialog mx-2.5 my-2.5 flex items-center justify-between gap-3 rounded px-4 py-2.5 sm:mx-3.5 sm:my-3">
                <div className="flex items-start gap-2.5">
                  <Star
                    className="mt-0.5 h-4 w-4 shrink-0 fill-[#F2BE6F] text-[#3B251B]"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-pixel text-lg font-bold leading-snug text-[#3B2920]">
                      {roomDialogue}
                    </p>
                    <p className="text-xs text-[#7D6652]">
                      Click the desk to sit down together, or greet the white kitty.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Minimal Warm Walnut Playground Command Bar (Subject, Today's Progress, Start Studying) */}
          <div className="rpg-walnut mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 sm:px-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSubjectPickerOpen(true)}
                className="rpg-btn-cream flex min-h-[40px] items-center gap-2 rounded px-3 py-1.5 text-xs font-bold"
              >
                <Tag className="h-3.5 w-3.5 text-[#BA5F54]" aria-hidden="true" />
                <span>Subject: {prefs.selectedSubject}</span>
              </button>

              <div className="rpg-plate font-mono-tabular flex min-h-[40px] items-center gap-2 rounded px-3 py-1.5 text-xs font-bold">
                <span>Today: {formatDuration(stats.todayMinutes)}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {stats.todayCount} {stats.todayCount === 1 ? 'block' : 'blocks'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={startStudyingFromRoom}
              className="rpg-btn-rose flex min-h-[44px] items-center gap-2 rounded px-5 py-2 text-sm font-bold"
            >
              <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              <span className="font-pixel text-lg">Start Studying</span>
            </button>
          </div>
        </main>
      )}

      {/* SCREEN 4 — FOCUS MODE (POKEMON PLATINUM ATMOSPHERIC DEPTH + SPLIT/BOTTOM COMMAND CONSOLE) */}
      {screen === 'focus' && (
        <main className="rpg-frame relative z-10 w-full max-w-6xl rounded-lg p-3 sm:p-4">
          {/* Top Slim Strip */}
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setScreen('room')}
              className="rpg-plate flex min-h-[38px] items-center gap-1.5 rounded px-3 py-1 text-xs font-bold"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-gba text-[11px]">room</span>
            </button>

            <div className="rpg-plate rounded px-3.5 py-1 text-center">
              <span className="font-gba text-[10px] font-bold tracking-wider text-[#2D2229] sm:text-[11px]">
                {localClockText} · {atmosphere.label.toUpperCase()} · {activeChar.name.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={cycleSoundscape}
                aria-label="Toggle ambient soundscape"
                className="rpg-plate flex min-h-[38px] items-center gap-1 rounded px-2.5 py-1 text-xs font-bold"
              >
                <Music className="h-3.5 w-3.5 text-[#3E549A]" aria-hidden="true" />
                <span className="font-gba hidden text-[10px] sm:inline">
                  {prefs.soundscape === 'off' ? 'off' : prefs.soundscape}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setScreen('history')}
                aria-label="Study history"
                className="rpg-plate flex min-h-[38px] items-center gap-1 rounded px-2.5 py-1 text-xs font-bold"
              >
                <BookOpen className="h-3.5 w-3.5 text-[#3E549A]" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setScreen('settings')}
                aria-label="Settings"
                className="rpg-plate flex min-h-[38px] items-center gap-1 rounded px-2.5 py-1 text-xs font-bold"
              >
                <SettingsIcon className="h-3.5 w-3.5 text-[#3E549A]" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* LEFT (Atmospheric Companion Scene) + RIGHT (Retro Desk Timer Console) */}
          <div className="grid grid-cols-1 items-stretch gap-3.5 lg:grid-cols-12">
            {/* LEFT: Sharp Companion + Walnut Desk layered cleanly over deep blue-purple atmospheric room */}
            <div className="lg:col-span-8">
              <div className="relative h-full overflow-hidden rounded border-[3px] border-[#4A3126] bg-[#0B0D1F]">
                <canvas
                  ref={deskCanvasRef}
                  width={DESK_W}
                  height={DESK_H}
                  onClick={handleDeskCanvasClick}
                  className="pixelated block aspect-3/2 w-full cursor-pointer select-none"
                  aria-label="Atmospheric study view of your companion and white kitty studying at the desk"
                />
              </div>
            </div>

            {/* RIGHT: Large Distinctive Retro GBA Study Timer */}
            <aside
              aria-label="Study timer readout"
              className="rpg-bezel flex flex-col justify-between rounded-lg p-3 lg:col-span-4"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="font-gba text-[11px] font-bold tracking-wider text-[#2D2229]">
                  STUDY DESK
                </span>
                <span
                  className={`font-gba rounded border border-[#3D2820] px-2 py-0.5 text-[10px] font-bold ${
                    timer.status === 'running'
                      ? timer.phase === 'focus' || timer.mode === 'custom'
                        ? 'bg-[#BA5F54] text-[#FFF8F0]'
                        : 'bg-[#4E7A5B] text-[#FFF8F0]'
                      : 'bg-[#F8F1E3] text-[#2D2229]'
                  }`}
                >
                  {sessionStatusLabel}
                </span>
              </div>

              <div className="rpg-inner-card flex flex-1 flex-col justify-between rounded p-4">
                <div className="space-y-3">
                  {/* Subject & Session Task */}
                  <div className="rounded border-2 border-[#4A3126] bg-[#F5EBDC] px-3 py-2 text-center">
                    <p className="font-gba text-[9px] tracking-wider text-[#7D6551]">SUBJECT</p>
                    <p className="truncate text-sm font-bold text-[#2D2229]">
                      {prefs.selectedSubject}
                    </p>
                  </div>

                  {/* Mode & Phase Tabs */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => timer.switchModeAndPhase('pomodoro', 'focus')}
                      className={`min-h-[38px] rounded py-1 text-[11px] font-bold ${
                        timer.mode === 'pomodoro' && timer.phase === 'focus'
                          ? 'rpg-btn-blue'
                          : 'rpg-btn-cream'
                      }`}
                    >
                      Focus
                    </button>
                    <button
                      type="button"
                      onClick={() => timer.switchModeAndPhase('pomodoro', 'shortBreak')}
                      className={`min-h-[38px] rounded py-1 text-[11px] font-bold ${
                        timer.mode === 'pomodoro' && timer.phase !== 'focus'
                          ? 'rpg-btn-blue'
                          : 'rpg-btn-cream'
                      }`}
                    >
                      Break
                    </button>
                    <button
                      type="button"
                      onClick={() => timer.switchModeAndPhase('custom', 'focus')}
                      className={`min-h-[38px] rounded py-1 text-[11px] font-bold ${
                        timer.mode === 'custom' ? 'rpg-btn-blue' : 'rpg-btn-cream'
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {/* Large Retro Countdown Readout */}
                  <div className="rounded border-2 border-[#35231D] bg-[#1E2345] px-3 py-3 text-center">
                    <div className="font-mono-tabular text-5xl font-bold tracking-tight text-[#FFF8E8]">
                      {formatClock(timer.secondsLeft)}
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-xs border border-[#4D588A] bg-[#12162E]">
                      <div
                        className="h-full bg-[#F2BE6F] transition-[width] duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Task Note */}
                  <input
                    type="text"
                    maxLength={54}
                    value={timer.intention}
                    onChange={(e) => timer.setIntention(e.target.value)}
                    placeholder="Specific task or chapter..."
                    aria-label="Study task note"
                    className="min-h-[38px] w-full rounded border-2 border-[#CBBBA4] bg-[#FFFDF8] px-2.5 py-1.5 text-center text-xs font-medium text-[#36261E] placeholder-[#9B8977] focus:border-[#3E549A] focus:outline-none"
                  />
                </div>

                {/* Preset Durations */}
                <div className="mt-3 border-t-2 border-[#E5D4BD] pt-3 text-center">
                  <p className="font-gba mb-1.5 text-[10px] tracking-wider text-[#5A4B40]">
                    BLOCK MINUTES
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[15, 25, 45, 60].map((mins) => {
                      const active = timer.selectedMinutes === mins && timer.phase === 'focus';
                      return (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => timer.selectPresetMinutes(mins)}
                          className={`font-mono-tabular min-h-[38px] rounded py-1 text-xs font-bold ${
                            active ? 'rpg-btn-blue' : 'rpg-btn-cream'
                          }`}
                        >
                          {mins}
                        </button>
                      );
                    })}
                  </div>
                  {timer.mode === 'custom' && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-xs text-[#5A4B40]">
                      <label htmlFor="custom-min-input" className="font-semibold">
                        Custom:
                      </label>
                      <input
                        id="custom-min-input"
                        type="number"
                        min={1}
                        max={180}
                        value={timer.selectedMinutes}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          if (!Number.isNaN(n)) timer.selectPresetMinutes(n);
                        }}
                        className="font-mono-tabular w-16 rounded border-2 border-[#3D2820] bg-white px-2 py-1 text-center text-xs font-bold text-[#2D2229]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>

          {/* BOTTOM: Classic GBA RPG Battle-Inspired Walnut Command Panel */}
          <div className="rpg-walnut mt-3 grid grid-cols-1 items-center gap-3 rounded-lg p-3 lg:grid-cols-12">
            {/* Dialogue / Companion Presence Box */}
            <div className="rpg-dialog flex items-center gap-3 rounded px-3.5 py-2.5 lg:col-span-6">
              {prefs.characterId === 'female' ? (
                <GirlSprite
                  animation={
                    timer.status === 'running' && (timer.phase === 'focus' || timer.mode === 'custom')
                      ? 'writing'
                      : 'reading'
                  }
                  className="w-11 shrink-0 rounded border-2 border-[#3D2820] bg-[#21264D]"
                  alt="Hana studying beside you"
                />
              ) : (
                <Star
                  className="h-5 w-5 shrink-0 fill-[#F2BE6F] text-[#3B251B]"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0">
                <p className="font-pixel truncate text-lg font-bold text-[#3B2920]">
                  {focusDialogue}
                </p>
                <p className="font-mono-tabular text-[11px] text-[#7D6551]">
                  Today: {formatDuration(stats.todayMinutes)} · {prefs.selectedSubject}
                </p>
              </div>
            </div>

            {/* 4-Action Command Deck: Start / Pause / End Session / Change Subject */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:col-span-6">
              <button
                type="button"
                onClick={timer.toggleStartPause}
                className={`min-h-[44px] rounded px-3 py-2 text-xs font-bold sm:text-sm ${
                  timer.status === 'running' ? 'rpg-btn-blue' : 'rpg-btn-rose'
                }`}
              >
                {timer.status === 'running'
                  ? 'Pause'
                  : timer.status === 'paused'
                    ? 'Resume'
                    : 'Start'}
              </button>

              <button
                type="button"
                onClick={timer.reset}
                className="rpg-btn-cream min-h-[44px] rounded px-3 py-2 text-xs font-bold sm:text-sm"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() => setSubjectPickerOpen(true)}
                className="rpg-btn-amber flex min-h-[44px] items-center justify-center gap-1 rounded px-2.5 py-2 text-xs font-bold"
              >
                <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Subject</span>
              </button>

              <button
                type="button"
                onClick={handleEndSession}
                className="rpg-btn-cream flex min-h-[44px] items-center justify-center gap-1 rounded px-2.5 py-2 text-xs font-bold text-[#8A3F36]"
              >
                <Square className="h-3 w-3 fill-current" aria-hidden="true" />
                <span>End Session</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* SCREEN 5 — STUDY HISTORY */}
      {screen === 'history' && (
        <main className="rpg-frame relative z-10 w-full max-w-4xl rounded-lg p-4 sm:p-5">
          {renderGameNavStrip('STUDY NOTEBOOK · HISTORY', 'focus', 'back to desk')}

          <div className="rpg-bezel rounded-lg p-3">
            <div className="rpg-inner-card space-y-5 rounded p-4 sm:p-5">
              {/* Summary Strip */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded border-2 border-[#D6C7B2] bg-[#FFFDF8] p-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7D6652]">
                    Today
                  </p>
                  <p className="font-mono-tabular mt-1 text-2xl font-bold text-[#2D2229]">
                    {formatDuration(stats.todayMinutes)}
                  </p>
                </div>
                <div className="rounded border-2 border-[#D6C7B2] bg-[#FFFDF8] p-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7D6652]">
                    Streak
                  </p>
                  <p className="font-mono-tabular mt-1 text-2xl font-bold text-[#BA5F54]">
                    {stats.streakDays}d
                  </p>
                </div>
                <div className="rounded border-2 border-[#D6C7B2] bg-[#FFFDF8] p-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7D6652]">
                    Completed
                  </p>
                  <p className="font-mono-tabular mt-1 text-2xl font-bold text-[#2D2229]">
                    {stats.totalCount}
                  </p>
                </div>
                <div className="rounded border-2 border-[#D6C7B2] bg-[#FFFDF8] p-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7D6652]">
                    Total Time
                  </p>
                  <p className="font-mono-tabular mt-1 text-2xl font-bold text-[#3E549A]">
                    {formatDuration(stats.totalMinutes)}
                  </p>
                </div>
              </div>

              {/* 7-Day Activity */}
              <div className="rounded border-2 border-[#D6C7B2] bg-[#FFFDF8] p-4">
                <div className="flex items-center justify-between text-xs font-bold text-[#3B2920]">
                  <span>Daily Activity (Last 7 Days)</span>
                  <span className="font-normal text-[#7D6652]">Focus minutes</span>
                </div>
                <div className="mt-4 grid h-32 grid-cols-7 items-end gap-2 border-b-2 border-[#D6C7B2] pb-2">
                  {stats.last7Days.map((day) => {
                    const pct =
                      day.minutes > 0 ? Math.max(10, Math.round((day.minutes / maxDay) * 100)) : 0;
                    const isToday = day.label === 'Today';
                    return (
                      <div
                        key={day.dateKey}
                        className="flex h-full flex-col items-center justify-end gap-1"
                      >
                        <span className="font-mono-tabular text-[11px] text-[#6E5947]">
                          {day.minutes > 0 ? `${day.minutes}m` : '0'}
                        </span>
                        <div className="flex h-20 w-full max-w-[40px] items-end rounded-t bg-[#EFE6D6] p-0.5">
                          <div
                            className={`w-full rounded-t-xs ${
                              day.minutes === 0
                                ? 'bg-transparent'
                                : isToday
                                  ? 'bg-[#3E549A]'
                                  : 'bg-[#BA5F54]'
                            }`}
                            style={{ height: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1.5 grid grid-cols-7 gap-2 text-center">
                  {stats.last7Days.map((d) => (
                    <span
                      key={d.dateKey}
                      className={`text-[11px] font-semibold ${
                        d.label === 'Today' ? 'text-[#3E549A]' : 'text-[#7D6652]'
                      }`}
                    >
                      {d.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Session History Table */}
              <div>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#5C4939]">
                  Session History
                </h2>
                {focusSessions.length === 0 ? (
                  <p className="rounded border-2 border-dashed border-[#D6C7B2] bg-[#FFFDF8] px-4 py-7 text-center text-xs text-[#7D6652]">
                    No completed study sessions yet. Sit at the desk and finish a block to record
                    your progress here.
                  </p>
                ) : (
                  <div className="divide-y divide-[#E7DAC6] rounded border-2 border-[#D6C7B2] bg-[#FFFDF8]">
                    {focusSessions.slice(0, 25).map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#36261E]">
                            {s.subject ? `${s.subject}` : 'General Study'}
                            {s.intention.trim() ? ` — ${s.intention.trim()}` : ''}
                          </p>
                          <p className="font-mono-tabular text-[11px] text-[#7D6652]">
                            {timeFmt.format(new Date(s.completedAt))} ·{' '}
                            {s.mode === 'pomodoro' ? 'Pomodoro' : 'Custom'} ·{' '}
                            {CHARACTERS[s.characterId]?.name ?? 'Hana'}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="font-mono-tabular font-bold text-[#3E549A]">
                            {s.durationMinutes}m
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSessions((prev) => prev.filter((item) => item.id !== s.id))
                            }
                            aria-label="Delete session"
                            className="rounded p-1.5 text-[#8A7562] hover:bg-[#F2E7D5] hover:text-[#B54E4E]"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* SCREEN 6 — SETTINGS */}
      {screen === 'settings' && (
        <main className="rpg-frame relative z-10 w-full max-w-4xl rounded-lg p-4 sm:p-5">
          {renderGameNavStrip('STILLALONG · SETTINGS', 'room', 'back to room')}

          <div className="rpg-bezel rounded-lg p-3">
            <div className="rpg-inner-card space-y-5 rounded p-4 sm:p-5">
              {/* Character & Time-of-Day */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <h2 className="font-gba mb-2 text-xs font-bold text-[#2D2229]">COMPANION</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {(['female', 'male'] as CharacterId[]).map((cid) => (
                      <button
                        key={cid}
                        type="button"
                        onClick={() =>
                          setPrefs((prev) => ({
                            ...prev,
                            characterId: cid,
                            characterConfirmed: true,
                          }))
                        }
                        className={`min-h-[42px] rounded px-3 py-2 text-xs font-bold ${
                          prefs.characterId === cid ? 'rpg-btn-blue' : 'rpg-btn-cream'
                        }`}
                      >
                        {CHARACTERS[cid].name} ({cid === 'female' ? 'Girl' : 'Boy'})
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingCharacter(prefs.characterId);
                      setScreen('character');
                    }}
                    className="mt-2 text-xs font-semibold text-[#3E549A] hover:underline"
                  >
                    Open full character preview →
                  </button>
                </div>

                <div>
                  <h2 className="font-gba mb-2 text-xs font-bold text-[#2D2229]">TIME OF DAY</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'auto', label: 'Auto' },
                        { id: 'morning', label: 'Morning' },
                        { id: 'afternoon', label: 'Afternoon' },
                        { id: 'evening', label: 'Evening' },
                        { id: 'night', label: 'Night' },
                      ] as { id: TimeOfDayMode; label: string }[]
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setPrefs((prev) => ({ ...prev, timeOfDay: t.id }))}
                        className={`min-h-[38px] rounded px-2.5 py-1.5 text-xs font-bold ${
                          prefs.timeOfDay === t.id ? 'rpg-btn-blue' : 'rpg-btn-cream'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sound & Ambient Settings */}
              <div className="border-t-2 border-[#E5D4BD] pt-4">
                <h2 className="font-gba mb-2.5 text-xs font-bold text-[#2D2229]">
                  SOUND &amp; AMBIENCE
                </h2>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-1.5">
                    {SOUND_CYCLE.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setPrefs((prev) => ({ ...prev, soundscape: s.id }))}
                        className={`min-h-[38px] rounded px-3 py-1.5 text-xs font-bold ${
                          prefs.soundscape === s.id ? 'rpg-btn-blue' : 'rpg-btn-cream'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-[#5C4939]">
                    <span>Volume</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={prefs.volume}
                      onChange={(e) =>
                        setPrefs((prev) => ({ ...prev, volume: parseFloat(e.target.value) }))
                      }
                      className="w-24 accent-[#3E549A]"
                    />
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[#5C4939]">Desk Lamp:</span>
                  {(['auto', 'on', 'off'] as const).map((lm) => (
                    <button
                      key={lm}
                      type="button"
                      onClick={() => setPrefs((prev) => ({ ...prev, lampMode: lm }))}
                      className={`rounded px-2.5 py-1 text-xs font-bold capitalize ${
                        prefs.lampMode === lm ? 'rpg-btn-blue' : 'rpg-btn-cream'
                      }`}
                    >
                      {lm}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timer Settings */}
              <div className="grid grid-cols-2 gap-3 border-t-2 border-[#E5D4BD] pt-4 sm:grid-cols-4">
                <label className="text-xs font-semibold text-[#5C4939]">
                  Focus (min)
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={settings.focusMinutes}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!Number.isNaN(v)) {
                        setSettings((p) => ({
                          ...p,
                          focusMinutes: Math.min(120, Math.max(1, v)),
                        }));
                      }
                    }}
                    className="font-mono-tabular mt-1 w-full rounded border-2 border-[#3D2820] bg-white px-2.5 py-1.5 text-sm text-[#2D2229]"
                  />
                </label>

                <label className="text-xs font-semibold text-[#5C4939]">
                  Short Break
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={settings.shortBreakMinutes}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!Number.isNaN(v)) {
                        setSettings((p) => ({
                          ...p,
                          shortBreakMinutes: Math.min(30, Math.max(1, v)),
                        }));
                      }
                    }}
                    className="font-mono-tabular mt-1 w-full rounded border-2 border-[#3D2820] bg-white px-2.5 py-1.5 text-sm text-[#2D2229]"
                  />
                </label>

                <label className="text-xs font-semibold text-[#5C4939]">
                  Long Break
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={settings.longBreakMinutes}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!Number.isNaN(v)) {
                        setSettings((p) => ({
                          ...p,
                          longBreakMinutes: Math.min(60, Math.max(1, v)),
                        }));
                      }
                    }}
                    className="font-mono-tabular mt-1 w-full rounded border-2 border-[#3D2820] bg-white px-2.5 py-1.5 text-sm text-[#2D2229]"
                  />
                </label>

                <label className="text-xs font-semibold text-[#5C4939]">
                  Cycle Blocks
                  <input
                    type="number"
                    min={2}
                    max={8}
                    value={settings.sessionsBeforeLongBreak}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!Number.isNaN(v)) {
                        setSettings((p) => ({
                          ...p,
                          sessionsBeforeLongBreak: Math.min(8, Math.max(2, v)),
                        }));
                      }
                    }}
                    className="font-mono-tabular mt-1 w-full rounded border-2 border-[#3D2820] bg-white px-2.5 py-1.5 text-sm text-[#2D2229]"
                  />
                </label>
              </div>

              <div className="space-y-2 border-t-2 border-[#E5D4BD] pt-3">
                <label className="flex cursor-pointer items-center justify-between text-xs font-semibold text-[#36261E]">
                  <span>Gentle chimes when sessions start or finish</span>
                  <input
                    type="checkbox"
                    checked={settings.chimeEnabled}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, chimeEnabled: e.target.checked }))
                    }
                    className="h-4 w-4 accent-[#3E549A]"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between text-xs font-semibold text-[#36261E]">
                  <span>Show room dialogue boxes</span>
                  <input
                    type="checkbox"
                    checked={prefs.showDialogue}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, showDialogue: e.target.checked }))
                    }
                    className="h-4 w-4 accent-[#3E549A]"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between text-xs font-semibold text-[#36261E]">
                  <span>Auto-start breaks when focus finishes</span>
                  <input
                    type="checkbox"
                    checked={settings.autoStartBreaks}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, autoStartBreaks: e.target.checked }))
                    }
                    className="h-4 w-4 accent-[#3E549A]"
                  />
                </label>
              </div>

              {/* Footer Actions: PWA Install, Clear Data, Legal & Website links */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#E5D4BD] pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <PWAInstallButton variant="rpg" />
                  {!confirmClearHistory ? (
                    <button
                      type="button"
                      onClick={() => setConfirmClearHistory(true)}
                      disabled={sessions.length === 0}
                      className="rpg-btn-cream rounded px-3 py-1.5 text-xs font-bold disabled:opacity-40"
                    >
                      Clear Study Log
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSessions([]);
                          setConfirmClearHistory(false);
                        }}
                        className="rpg-btn-rose rounded px-3 py-1.5 text-xs font-bold"
                      >
                        Confirm Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearHistory(false)}
                        className="rpg-btn-cream rounded px-3 py-1.5 text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold text-[#3E549A]">
                  <button
                    type="button"
                    onClick={() => onNavigateRoute('/privacy')}
                    className="hover:underline"
                  >
                    Privacy
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateRoute('/terms')}
                    className="hover:underline"
                  >
                    Terms
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateRoute('/')}
                    className="hover:underline"
                  >
                    Website
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};
