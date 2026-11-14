import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Cat,
  Check,
  Clock,
  Coffee,
  Download,
  Info,
  Music,
  Play,
  Settings as SettingsIcon,
  Share2,
  Square,
  Star,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import {
  CompanionReactionKind,
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
import { EndedSessionSummary, useStudyTimer } from '../hooks/useStudyTimer';
import {
  AppPreferences,
  AppScreen,
  CAT_COMPANION,
  CHARACTERS,
  CompanionPoseMode,
  RoutePath,
  SUBJECT_PRESETS,
  SoundscapeMode,
  StudySession,
  TimeOfDayMode,
  TimerSettings,
} from '../types/study';
import { cozyAudio } from '../utils/audio';
import { renderSessionShareCard } from '../utils/shareCard';
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
import { GirlAnimationState, GirlSprite } from './GirlSprite';
import { PWAInstallButton } from './PWAInstallButton';

interface StillalongAppProps {
  initialScreen?: 'room' | 'focus';
  onNavigateRoute: (route: RoutePath) => void;
}

const SOUND_CYCLE: { id: SoundscapeMode; label: string }[] = [
  { id: 'off', label: 'Quiet Mode' },
  { id: 'rain', label: 'Soft Rain' },
  { id: 'vinyl', label: 'Warm Vinyl' },
  { id: 'crickets', label: 'Night Air' },
];

const POSE_OPTIONS: { id: CompanionPoseMode; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'writing', label: 'Write' },
  { id: 'reading', label: 'Read' },
  { id: 'mug', label: 'Tea' },
  { id: 'resting', label: 'Rest' },
];

const REACTION_LINES: { kind: CompanionReactionKind; line: string }[] = [
  { kind: 'happy', line: "I'm glad you're studying here with me!" },
  { kind: 'perkUp', line: 'One quiet page at a time—we have plenty of time.' },
  { kind: 'eureka', line: 'Ooh, that part just clicked! How is your section going?' },
  { kind: 'mug', line: 'Take a slow sip of water or tea whenever you need.' },
  { kind: 'confused', line: 'Tricky problem? Let us break it down piece by piece.' },
];

const KITTY_LINES = [
  'Mochi purrs softly and tucks her paws beneath her chin.',
  'Mochi blinks slowly at you, happy to keep watch over the desk.',
  'Mochi curls into a warm loaf while the timer ticks quietly.',
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

export const StillalongApp: React.FC<StillalongAppProps> = ({
  initialScreen = 'room',
  onNavigateRoute,
}) => {
  const [screen, setScreen] = useState<AppScreen>(initialScreen);
  const [assets, setAssets] = useState<LoadedPixelAssets | null>(null);
  const [assetError, setAssetError] = useState(false);
  const [prefs, setPrefs] = useState<AppPreferences>(() => loadPreferences());
  const [settings, setSettings] = useState<TimerSettings>(() => loadSettings());
  const [sessions, setSessions] = useState<StudySession[]>(() => loadSessions());

  useEffect(() => {
    setScreen(initialScreen);
  }, [initialScreen]);

  const [roomDialogue, setRoomDialogue] = useState<string>(
    'The bedroom is quiet and the study desk is waiting for us.'
  );
  const [focusDialogue, setFocusDialogue] = useState<string>("I'll be right here.");
  const [hoveredZone, setHoveredZone] = useState<RoomTargetArea>(null);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  // Subject switcher & End Session share card modal state
  const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);
  const [customSubjectDraft, setCustomSubjectDraft] = useState('');
  const [endedSummary, setEndedSummary] = useState<EndedSessionSummary | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

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

  // Canvas & animation refs
  const roomCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const deskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const frameRef = useRef<number>(0);
  const reactionTimerRef = useRef<number>(0);
  const reactionKindRef = useRef<CompanionReactionKind>('happy');
  const reactionIndexRef = useRef<number>(0);
  const kittyReactionTimerRef = useRef<number>(0);
  const kittyLineIdxRef = useRef<number>(0);

  const walkerRef = useRef<RoomWalker>({
    x: 288,
    y: 362,
    targetX: 288,
    targetY: 362,
    facing: 'down',
    moving: false,
    waitTicks: 60,
    manualMove: false,
  });

  const handleSessionCompleted = React.useCallback((session: StudySession) => {
    setSessions((prev) => [session, ...prev]);
    reactionKindRef.current = 'happy';
    reactionTimerRef.current = 80;
    kittyReactionTimerRef.current = 72;
  }, []);

  const handlePhaseMessage = React.useCallback((msg: string) => {
    setFocusDialogue(msg);
  }, []);

  // Timestamp-based timer decoupled from scenes (stays accurate across all screens)
  const timer = useStudyTimer({
    settings,
    characterId: 'female',
    subject: prefs.selectedSubject || 'General Study',
    onSessionCompleted: handleSessionCompleted,
    onPhaseMessage: handlePhaseMessage,
  });

  const reloadAssets = React.useCallback(() => {
    setAssetError(false);
    return loadPixelAssets()
      .then((loaded) => {
        setAssets(loaded);
        setAssetError(false);
      })
      .catch(() => {
        setAssetError(true);
      });
  }, []);

  useEffect(() => {
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
    return () => {
      mounted = false;
    };
  }, []);

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
    status: timer.status,
    phase: timer.phase,
    poseMode: prefs.poseMode,
    hoveredZone,
    atmosphere,
    lampOn,
    showCat: prefs.showCatCompanion,
  });
  renderStateRef.current = {
    screen,
    status: timer.status,
    phase: timer.phase,
    poseMode: prefs.poseMode,
    hoveredZone,
    atmosphere,
    lampOn,
    showCat: prefs.showCatCompanion,
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
      if (reactionTimerRef.current > 0) reactionTimerRef.current -= 1;
      if (kittyReactionTimerRef.current > 0) kittyReactionTimerRef.current -= 1;

      const cur = renderStateRef.current;

      if (cur.screen === 'room' && roomCanvasRef.current) {
        const ctx = roomCanvasRef.current.getContext('2d');
        if (ctx) {
          walkerRef.current = stepRoomWalker(
            walkerRef.current,
            cur.status === 'running' && cur.phase === 'focus'
          );
          drawRoomScene(ctx, assets, frameRef.current, {
            walker: walkerRef.current,
            hoveredZone: cur.hoveredZone,
            isStudying: cur.status === 'running' && cur.phase === 'focus',
            atmosphere: cur.atmosphere,
            lampOn: cur.lampOn,
            showCat: cur.showCat,
            kittyReactionTimer: kittyReactionTimerRef.current,
          });
        }
      } else if (cur.screen === 'focus' && deskCanvasRef.current) {
        const ctx = deskCanvasRef.current.getContext('2d');
        if (ctx) {
          drawFocusScene(ctx, assets, frameRef.current, {
            status: cur.status,
            phase: cur.phase,
            poseMode: cur.poseMode,
            reactionTimer: reactionTimerRef.current,
            reactionKind: reactionKindRef.current,
            atmosphere: cur.atmosphere,
            lampOn: cur.lampOn,
            showCat: cur.showCat,
            kittyReactionTimer: kittyReactionTimerRef.current,
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
    reactionKindRef.current = 'perkUp';
    reactionTimerRef.current = 42;
    setFocusDialogue(`Switching gears to ${clean}. Ready when you are.`);
    if (settings.chimeEnabled) cozyAudio.playChime('click');
  };

  const startStudyingFromRoom = () => {
    if (settings.chimeEnabled) cozyAudio.playChime('click');
    setEndedSummary(null);
    setShareFeedback(null);
    setScreen('focus');
    if (timer.status === 'idle') {
      timer.start();
    }
  };

  const handleEndSession = () => {
    const summary = timer.endSession();
    if (settings.chimeEnabled) cozyAudio.playChime('complete');
    reactionKindRef.current = 'happy';
    reactionTimerRef.current = 64;
    kittyReactionTimerRef.current = 64;
    setShareFeedback(null);
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
    const found = ROOM_CLICK_ZONES.find((z) => {
      if (z.id === 'kitty' && !prefs.showCatCompanion) return false;
      return vx >= z.x && vx <= z.x + z.w && vy >= z.y && vy <= z.y + z.h;
    });
    const id = found ? found.id : null;
    setHoveredZone(id);

    if (!isClick) return;
    if (settings.chimeEnabled) cozyAudio.playChime('click');

    if (id === 'kitty') {
      kittyReactionTimerRef.current = 66;
      const line = KITTY_LINES[kittyLineIdxRef.current % KITTY_LINES.length];
      kittyLineIdxRef.current += 1;
      setRoomDialogue(line);
      const target = clampWalkPoint(332, 392);
      walkerRef.current = {
        ...walkerRef.current,
        targetX: target.x,
        targetY: target.y,
        manualMove: true,
        waitTicks: 0,
      };
    } else if (id === 'desk') {
      startStudyingFromRoom();
    } else if (id === 'window') {
      const target = clampWalkPoint(318, 250);
      walkerRef.current = {
        ...walkerRef.current,
        targetX: target.x,
        targetY: target.y,
        manualMove: true,
        waitTicks: 0,
      };
      setRoomDialogue(
        resolvedPeriod === 'night'
          ? 'Starlight glows softly outside the lavender curtains.'
          : resolvedPeriod === 'evening'
            ? 'Warm evening light fades gently across the treetops.'
            : resolvedPeriod === 'afternoon'
              ? 'Soft afternoon clouds drift calmly past the window.'
              : 'Fresh morning daylight fills the room.'
      );
    } else if (id === 'bookshelf') {
      const target = clampWalkPoint(132, 272);
      walkerRef.current = {
        ...walkerRef.current,
        targetX: target.x,
        targetY: target.y,
        manualMove: true,
        waitTicks: 0,
      };
      setRoomDialogue('Neatly stacked textbooks, notebooks, and a leafy plant line the shelf.');
    } else if (id === 'bed') {
      const target = clampWalkPoint(410, 310);
      walkerRef.current = {
        ...walkerRef.current,
        targetX: target.x,
        targetY: target.y,
        manualMove: true,
        waitTicks: 0,
      };
      setRoomDialogue('A soft plaid bed waiting for when your study blocks are finished.');
    } else {
      const target = clampWalkPoint(vx, vy);
      walkerRef.current = {
        ...walkerRef.current,
        targetX: target.x,
        targetY: target.y,
        manualMove: true,
        waitTicks: 0,
      };
      if (id === 'rug') {
        setRoomDialogue('Stepping across the quiet lavender rug.');
      }
    }
  };

  const handleDeskCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = deskCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * DESK_W;
    const vy = ((e.clientY - rect.top) / rect.height) * DESK_H;

    // 1. Pet Mochi the desk cat
    const { kittyX, kittyY, kittyW, kittyH } = FOCUS_DESK_GEOMETRY;
    if (
      prefs.showCatCompanion &&
      vx >= kittyX - 10 &&
      vx <= kittyX + kittyW + 10 &&
      vy >= kittyY - 10 &&
      vy <= kittyY + kittyH + 10
    ) {
      kittyReactionTimerRef.current = 70;
      const line = KITTY_LINES[kittyLineIdxRef.current % KITTY_LINES.length];
      kittyLineIdxRef.current += 1;
      if (settings.chimeEnabled) cozyAudio.playChime('click');
      setFocusDialogue(line);
      return;
    }

    // 2. Clicking window gives atmospheric note
    if (vx >= 330 && vx <= 596 && vy >= 72 && vy <= 232) {
      if (settings.chimeEnabled) cozyAudio.playChime('click');
      setFocusDialogue(
        resolvedPeriod === 'night'
          ? 'The night sky outside is quiet and full of stars.'
          : resolvedPeriod === 'evening'
            ? 'Dusk settles softly outside the window.'
            : 'Clear daylight drifts through the curtains.'
      );
      return;
    }

    // 3. Clicking Hana or the wooden desk triggers a friendly animated reaction
    if (vx >= 150 && vx <= 620 && vy >= 170 && vy <= 525) {
      const next = REACTION_LINES[reactionIndexRef.current % REACTION_LINES.length];
      reactionIndexRef.current += 1;
      reactionKindRef.current = next.kind;
      reactionTimerRef.current = 52;
      if (settings.chimeEnabled) cozyAudio.playChime('click');
      setFocusDialogue(next.line);
    }
  };

  const stats = useMemo(() => computeStudyStats(sessions), [sessions]);
  const activeChar = CHARACTERS.female;
  const focusSessions = sessions.filter((s) => s.phase === 'focus');
  const maxDay = Math.max(25, ...stats.last7Days.map((d) => d.minutes));
  const timeFmt = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const shareCardPreviewUrl = useMemo(() => {
    if (!endedSummary) return null;
    return renderSessionShareCard(assets, {
      subject: endedSummary.subject,
      intention: endedSummary.intention,
      durationMinutes: endedSummary.durationMinutes,
      elapsedSeconds: endedSummary.elapsedSeconds,
      todayMinutes: stats.todayMinutes,
      streakDays: stats.streakDays,
      showCat: prefs.showCatCompanion,
    });
  }, [
    endedSummary,
    assets,
    stats.todayMinutes,
    stats.streakDays,
    prefs.showCatCompanion,
  ]);

  const handleDownloadShareCard = () => {
    if (!shareCardPreviewUrl) return;
    const link = document.createElement('a');
    link.href = shareCardPreviewUrl;
    const slug = (endedSummary?.subject || 'study')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    link.download = `stillalong-${slug}-session.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShareFeedback('Session card saved as PNG.');
  };

  const handleShareCard = async () => {
    if (!shareCardPreviewUrl || !endedSummary) return;
    try {
      const res = await fetch(shareCardPreviewUrl);
      const blob = await res.blob();
      const file = new File([blob], 'stillalong-session.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Stillalong Study Session',
          text: `Completed a ${
            endedSummary.durationMinutes >= 1
              ? `${endedSummary.durationMinutes} min`
              : `${endedSummary.elapsedSeconds}s`
          } ${endedSummary.subject} session on Stillalong.`,
          files: [file],
        });
        setShareFeedback('Shared!');
        return;
      }
    } catch {
      // Fallback cleanly to download
    }
    handleDownloadShareCard();
  };

  const progressPct =
    timer.totalSeconds > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(((timer.totalSeconds - timer.secondsLeft) / timer.totalSeconds) * 100)
          )
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

  const portraitSpriteState: GirlAnimationState =
    prefs.poseMode === 'reading'
      ? 'reading'
      : prefs.poseMode === 'mug'
        ? 'mug'
        : prefs.poseMode === 'resting'
          ? 'sleepy'
          : prefs.poseMode === 'writing'
            ? 'writing'
            : timer.phase !== 'focus'
              ? 'mug'
              : timer.status === 'running'
                ? 'writing'
                : 'idle';

  const renderGameNavStrip = (titleText: string, backTarget?: AppScreen, backLabel?: string) => (
    <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {backTarget && (
          <button
            type="button"
            onClick={() => setScreen(backTarget)}
            className="rpg-plate flex min-h-[44px] items-center gap-1.5 rounded px-3 py-1 text-xs font-bold"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-gba text-[11px]">{backLabel}</span>
          </button>
        )}
      </div>

      <div className="rpg-plate flex min-h-[40px] items-center gap-2 rounded px-3.5 py-1.5">
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
            className="rpg-btn-blue font-mono-tabular flex min-h-[44px] items-center gap-1.5 rounded px-3 py-1 text-xs font-bold"
          >
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{formatClock(timer.secondsLeft)}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setScreen('history')}
          aria-label="Study history"
          className={`flex min-h-[44px] items-center gap-1.5 rounded px-3 py-1 text-xs font-bold ${
            screen === 'history' ? 'rpg-btn-blue' : 'rpg-plate'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-gba hidden text-[10px] sm:inline">notebook</span>
        </button>
        <button
          type="button"
          onClick={() => setScreen('settings')}
          aria-label="Settings"
          className={`flex min-h-[44px] items-center gap-1.5 rounded px-3 py-1 text-xs font-bold ${
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
          className="rpg-plate flex min-h-[44px] items-center gap-1.5 rounded px-3 py-1 text-xs font-bold"
        >
          <Music className="h-3.5 w-3.5 text-[#3E549A]" aria-hidden="true" />
          <span className="font-gba hidden text-[10px] md:inline">
            {currentSoundLabel.toLowerCase()}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onNavigateRoute('/about')}
          aria-label="About Stillalong"
          className="rpg-btn-amber flex min-h-[44px] items-center gap-1.5 rounded px-3 py-1 text-xs font-bold"
        >
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-gba text-[10px]">About Stillalong</span>
        </button>
      </div>
    </header>
  );

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
            <div className="flex items-center justify-between border-b border-[#E5D4BD] pb-2.5">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#BA5F54]" aria-hidden="true" />
                <h2 className="font-gba text-xs font-bold text-[#2D2229]">CHOOSE SUBJECT</h2>
              </div>
              <button
                type="button"
                onClick={() => setSubjectPickerOpen(false)}
                aria-label="Close subject picker"
                className="rpg-btn-cream flex min-h-[36px] min-w-[36px] items-center justify-center rounded p-1.5"
              >
                <X className="h-4 w-4" aria-hidden="true" />
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
                    className={`flex min-h-[44px] items-center justify-between rounded px-3 py-2 text-left text-xs font-bold ${
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
              className="flex gap-2 border-t border-[#E5D4BD] pt-3"
            >
              <input
                type="text"
                maxLength={28}
                value={customSubjectDraft}
                onChange={(e) => setCustomSubjectDraft(e.target.value)}
                placeholder="Custom subject..."
                aria-label="Custom study subject"
                className="min-h-[44px] flex-1 rounded border border-[#4A3126] bg-[#FFFDF8] px-3 text-xs font-medium text-[#36261E] placeholder-[#94806D] focus:border-[#3E549A] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!customSubjectDraft.trim()}
                className="rpg-btn-amber min-h-[44px] rounded px-4 text-xs font-bold disabled:opacity-45"
              >
                Use
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderSessionSummaryModal = () => {
    if (!endedSummary) return null;
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Study session summary"
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#0B0E20]/82 p-4"
      >
        <div className="rpg-walnut my-auto w-full max-w-lg rounded-lg p-3">
          <div className="rpg-inner-card space-y-4 rounded p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-[#E5D4BD] pb-3">
              <div>
                <p className="font-gba text-[10px] tracking-wider text-[#BA5F54]">
                  STUDY BLOCK COMPLETE
                </p>
                <h2 className="font-pixel text-2xl font-bold text-[#2D2229]">
                  Session Complete
                </h2>
              </div>
              <GirlSprite
                animation="happy"
                className="w-16 rounded border border-[#3D2820] bg-[#EFE4F5]"
                alt="Hana smiling after finishing a study block"
              />
            </div>

            {/* Shareable Session Completion Card Preview */}
            {shareCardPreviewUrl && (
              <div className="space-y-2">
                <div className="overflow-hidden rounded border border-[#3D2820] bg-[#11152A] shadow-sm">
                  <img
                    src={shareCardPreviewUrl}
                    alt="Shareable Stillalong session completion card"
                    className="block w-full"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadShareCard}
                    className="rpg-btn-cream flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Download Card (PNG)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareCard}
                    className="rpg-btn-blue flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold"
                  >
                    <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Share Card</span>
                  </button>
                </div>
                {shareFeedback && (
                  <p className="text-center text-[11px] font-semibold text-[#3E549A]">
                    {shareFeedback}
                  </p>
                )}
              </div>
            )}

            <div className="rounded border border-[#D6C7B2] bg-[#FFFDF8] px-3.5 py-2.5 text-xs text-[#4A382B]">
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
                  Timer reset cleanly. Blocks of 1 minute or longer are saved to your Study
                  Notebook automatically.
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
                className="rpg-btn-rose min-h-[44px] rounded px-4 py-2 text-xs font-bold"
              >
                Start Another Block
              </button>
              <button
                type="button"
                onClick={() => {
                  setEndedSummary(null);
                  setScreen('room');
                }}
                className="rpg-btn-amber min-h-[44px] rounded px-4 py-2 text-xs font-bold"
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
              className="min-h-[36px] w-full text-center text-xs font-bold text-[#3E549A] hover:underline"
            >
              Open Study Notebook →
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#11152A] px-3 py-4 sm:px-6">
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
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

      {/* SCREEN 1 — MAIN INTERACTIVE BEDROOM (LANDING PAGE) */}
      {screen === 'room' && (
        <main className="rpg-frame relative z-10 w-full max-w-5xl rounded-lg p-3 sm:p-4">
          {renderGameNavStrip(
            `STILLALONG · ${localClockText} · ${atmosphere.label.toUpperCase()}`
          )}

          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
            {/* LEFT: Interactive Top-Down Pixel Bedroom */}
            <div className="flex items-center justify-center lg:col-span-7">
              <div className="relative w-full max-w-[540px] overflow-hidden rounded border-2 border-[#4A3126] bg-[#0D1020]">
                <canvas
                  ref={roomCanvasRef}
                  width={ROOM_W}
                  height={ROOM_H}
                  onMouseMove={(e) => handleRoomPointer(e, false)}
                  onMouseLeave={() => setHoveredZone(null)}
                  onClick={(e) => handleRoomPointer(e, true)}
                  className={`pixelated block aspect-[640/614] w-full select-none ${
                    hoveredZone ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  aria-label="Top-down pixel art bedroom"
                />

                {!assets && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#14182D]/90 p-4 text-center">
                    <p className="font-gba text-xs text-[#F2BE6F]">
                      {assetError ? 'COULD NOT LOAD PIXEL ROOM' : 'ENTERING BEDROOM...'}
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

                {hoveredZone && (
                  <div className="rpg-plate pointer-events-none absolute top-3 left-3 rounded px-2.5 py-1 text-xs font-bold">
                    {ROOM_CLICK_ZONES.find((z) => z.id === hoveredZone)?.label}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Companion Presence, Dialogue & Study Controls */}
            <aside className="flex flex-col justify-between gap-3 lg:col-span-5">
              <div className="rpg-bezel flex flex-1 flex-col justify-between rounded-lg p-3">
                <div className="rpg-inner-card flex flex-1 flex-col justify-between gap-4 rounded p-4">
                  <div className="flex items-center gap-3 border-b border-[#E5D4BD] pb-3">
                    <GirlSprite
                      animation={timer.status === 'running' ? 'writing' : 'idle'}
                      className="w-20 rounded border border-[#3D2820] bg-[#EFE4F5]"
                      alt="Hana study companion portrait"
                    />
                    <div className="min-w-0">
                      <p className="font-gba text-[10px] tracking-wider text-[#7D6551]">
                        COMPANION
                      </p>
                      <h1 className="font-pixel text-2xl font-bold text-[#2D2229]">
                        {activeChar.name}
                      </h1>
                      <p className="text-xs leading-snug text-[#6E5947]">
                        Click the floor to walk, tap Mochi on the rug, or click the study desk.
                      </p>
                    </div>
                  </div>

                  {prefs.showDialogue && (
                    <div className="rpg-dialog rounded px-3.5 py-3">
                      <div className="flex items-start gap-2">
                        <Star
                          className="mt-0.5 h-4 w-4 shrink-0 fill-[#F2BE6F] text-[#3B251B]"
                          aria-hidden="true"
                        />
                        <p className="font-pixel text-lg leading-snug font-bold text-[#3B2920]">
                          {roomDialogue}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setSubjectPickerOpen(true)}
                      className="rpg-btn-cream flex min-h-[44px] w-full items-center justify-between rounded px-3.5 py-2 text-xs font-bold"
                    >
                      <span className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-[#BA5F54]" aria-hidden="true" />
                        <span>Subject: {prefs.selectedSubject}</span>
                      </span>
                      <span className="font-gba text-[10px] text-[#3E549A]">CHANGE</span>
                    </button>

                    <div className="flex items-center justify-between rounded border border-[#D6C7B2] bg-[#FFFDF8] px-3.5 py-2.5 text-xs">
                      <span className="flex items-center gap-2 font-semibold text-[#6E5947]">
                        <Cat className="h-3.5 w-3.5 text-[#7D6551]" aria-hidden="true" />
                        <span>{CAT_COMPANION.name} in room</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPrefs((p) => ({ ...p, showCatCompanion: !p.showCatCompanion }))
                        }
                        className={`min-h-[32px] rounded px-2.5 py-1 text-[11px] font-bold ${
                          prefs.showCatCompanion ? 'rpg-btn-blue' : 'rpg-btn-cream'
                        }`}
                      >
                        {prefs.showCatCompanion ? 'Here' : 'Napping'}
                      </button>
                    </div>

                    <div className="rounded border border-[#D6C7B2] bg-[#FFFDF8] px-3.5 py-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#6E5947]">Today&apos;s Focus</span>
                        <span className="font-mono-tabular font-bold text-[#2D2229]">
                          {formatDuration(stats.todayMinutes)} · {stats.todayCount}{' '}
                          {stats.todayCount === 1 ? 'block' : 'blocks'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rpg-walnut rounded-lg p-3">
                <button
                  type="button"
                  onClick={startStudyingFromRoom}
                  className="rpg-btn-rose flex min-h-[48px] w-full items-center justify-center gap-2 rounded px-5 py-2 text-sm font-bold"
                >
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  <span className="font-pixel text-xl">Start Studying</span>
                </button>
              </div>
            </aside>
          </div>

          <footer className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#2D335E] pt-3 text-[11px] text-[#93A0CC]">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigateRoute('/about')}
                className="font-semibold text-[#F7CB85] hover:text-[#FFF9EC] hover:underline"
              >
                About Stillalong &amp; Pricing ($6.99)
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onNavigateRoute('/privacy')}
                className="hover:text-[#FFF9EC] hover:underline"
              >
                Privacy
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onNavigateRoute('/terms')}
                className="hover:text-[#FFF9EC] hover:underline"
              >
                Terms
              </button>
              <span aria-hidden="true">·</span>
              <a
                href="mailto:hello@stillalong.xyz"
                className="font-mono-tabular hover:text-[#FFF9EC] hover:underline"
              >
                hello@stillalong.xyz
              </a>
            </div>
            <div className="flex items-center gap-2">
              <PWAInstallButton variant="rpg" />
              <span className="font-gba text-[10px]">CRAFTED BY VOLFNYRA</span>
            </div>
          </footer>
        </main>
      )}

      {/* SCREEN 3 — FOCUS MODE (ACROSS THE WOODEN DESK WITH HANA & MOCHI) */}
      {screen === 'focus' && (
        <main className="rpg-frame relative z-10 w-full max-w-6xl rounded-lg p-3 sm:p-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setScreen('room')}
              className="rpg-plate flex min-h-[44px] items-center gap-1.5 rounded px-3 py-1 text-xs font-bold"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-gba text-[11px]">room</span>
            </button>

            <div className="rpg-plate rounded px-3.5 py-1.5 text-center">
              <span className="font-gba text-[10px] font-bold tracking-wider text-[#2D2229] sm:text-[11px]">
                {localClockText} · {atmosphere.label.toUpperCase()} · {activeChar.name.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={cycleSoundscape}
                aria-label="Toggle ambient soundscape"
                className="rpg-plate flex min-h-[44px] items-center gap-1.5 rounded px-3 py-1 text-xs font-bold"
              >
                <Music className="h-3.5 w-3.5 text-[#3E549A]" aria-hidden="true" />
                <span className="font-gba hidden text-[10px] sm:inline">
                  {prefs.soundscape === 'off' ? 'off' : prefs.soundscape}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setScreen('history')}
                aria-label="Study notebook"
                className="rpg-plate flex min-h-[44px] min-w-[44px] items-center justify-center rounded px-2.5 py-1 text-xs font-bold"
              >
                <BookOpen className="h-4 w-4 text-[#3E549A]" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setScreen('settings')}
                aria-label="Settings"
                className="rpg-plate flex min-h-[44px] min-w-[44px] items-center justify-center rounded px-2.5 py-1 text-xs font-bold"
              >
                <SettingsIcon className="h-4 w-4 text-[#3E549A]" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-3.5 lg:grid-cols-12">
            {/* LEFT: Across-the-Desk Bedroom View */}
            <div className="lg:col-span-8">
              <div className="relative h-full overflow-hidden rounded border-2 border-[#4A3126] bg-[#161A36]">
                <canvas
                  ref={deskCanvasRef}
                  width={DESK_W}
                  height={DESK_H}
                  onClick={handleDeskCanvasClick}
                  className="pixelated block aspect-[768/528] w-full cursor-pointer select-none"
                  aria-label="Across-the-desk study view with Hana and Mochi"
                />
                {!assets && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#14182D]/90 p-4 text-center">
                    <p className="font-gba text-xs text-[#F2BE6F]">
                      {assetError ? 'COULD NOT LOAD STUDY DESK' : 'SETTING UP STUDY DESK...'}
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

            {/* RIGHT: Retro GBA Study Desk Timer Console */}
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

              <div className="rpg-inner-card flex flex-1 flex-col justify-between rounded p-3.5">
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setSubjectPickerOpen(true)}
                    className="w-full rounded border border-[#4A3126] bg-[#F5EBDC] px-3 py-1.5 text-center transition-colors hover:bg-[#EFE2CE]"
                  >
                    <p className="font-gba text-[9px] tracking-wider text-[#7D6551]">
                      SUBJECT · TAP TO CHANGE
                    </p>
                    <p className="truncate text-sm font-bold text-[#2D2229]">
                      {prefs.selectedSubject}
                    </p>
                  </button>

                  {/* Mode & Phase Tabs */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => timer.switchModeAndPhase('pomodoro', 'focus')}
                      className={`min-h-[40px] rounded py-1 text-[11px] font-bold ${
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
                      className={`min-h-[40px] rounded py-1 text-[11px] font-bold ${
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
                      className={`min-h-[40px] rounded py-1 text-[11px] font-bold ${
                        timer.mode === 'custom' ? 'rpg-btn-blue' : 'rpg-btn-cream'
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {/* Large Retro Countdown Readout */}
                  <div className="rounded border-2 border-[#35231D] bg-[#1E2345] px-3 py-2.5 text-center">
                    <div className="font-mono-tabular text-4xl font-bold tracking-tight text-[#FFF8E8] sm:text-5xl">
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
                    className="min-h-[40px] w-full rounded border border-[#CBBBA4] bg-[#FFFDF8] px-2.5 py-1 text-center text-xs font-medium text-[#36261E] placeholder-[#9B8977] focus:border-[#3E549A] focus:outline-none"
                  />
                </div>

                {/* Preset Durations & Companion Activity */}
                <div className="mt-2.5 space-y-2.5 border-t border-[#E5D4BD] pt-2.5 text-center">
                  <div>
                    <p className="font-gba mb-1 text-[9px] tracking-wider text-[#5A4B40]">
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
                          className="font-mono-tabular min-h-[36px] w-16 rounded border border-[#3D2820] bg-white px-2 py-1 text-center text-xs font-bold text-[#2D2229]"
                        />
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#E5D4BD] pt-2">
                    <p className="font-gba mb-1 flex items-center justify-center gap-1 text-[9px] tracking-wider text-[#5A4B40]">
                      <Coffee className="h-3 w-3" aria-hidden="true" />
                      <span>COMPANION ACTIVITY</span>
                    </p>
                    <div className="grid grid-cols-5 gap-1">
                      {POSE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setPrefs((p) => ({ ...p, poseMode: opt.id }));
                            if (settings.chimeEnabled) cozyAudio.playChime('click');
                          }}
                          className={`min-h-[36px] rounded py-1 text-[10px] font-bold whitespace-nowrap ${
                            prefs.poseMode === opt.id ? 'rpg-btn-blue' : 'rpg-btn-cream'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* BOTTOM: Warm Walnut Command Panel */}
          <div className="rpg-walnut mt-3 grid grid-cols-1 items-center gap-3 rounded-lg p-3 lg:grid-cols-12">
            <div className="rpg-dialog flex items-center gap-3 rounded px-3.5 py-2 lg:col-span-6">
              <GirlSprite
                animation={portraitSpriteState}
                className="w-14 shrink-0 rounded border border-[#3D2820] bg-[#EFE4F5]"
                alt="Hana studying beside you"
              />
              <div className="min-w-0">
                <p className="font-pixel truncate text-lg font-bold text-[#3B2920]">
                  {focusDialogue}
                </p>
                <p className="font-mono-tabular text-[11px] text-[#7D6551]">
                  Today: {formatDuration(stats.todayMinutes)} · {prefs.selectedSubject}
                </p>
              </div>
            </div>

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

      {/* SCREEN 4 — STUDY NOTEBOOK / STATISTICS */}
      {screen === 'history' && (
        <main className="rpg-frame relative z-10 w-full max-w-4xl rounded-lg p-4 sm:p-5">
          {renderGameNavStrip('STUDY NOTEBOOK · HISTORY', 'focus', 'back to desk')}

          <div className="rpg-bezel rounded-lg p-3">
            <div className="rpg-inner-card space-y-5 rounded p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded border border-[#D6C7B2] bg-[#FFFDF8] p-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7D6652]">
                    Today
                  </p>
                  <p className="font-mono-tabular mt-1 text-2xl font-bold text-[#2D2229]">
                    {formatDuration(stats.todayMinutes)}
                  </p>
                </div>
                <div className="rounded border border-[#D6C7B2] bg-[#FFFDF8] p-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7D6652]">
                    Streak
                  </p>
                  <p className="font-mono-tabular mt-1 text-2xl font-bold text-[#BA5F54]">
                    {stats.streakDays}d
                  </p>
                </div>
                <div className="rounded border border-[#D6C7B2] bg-[#FFFDF8] p-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7D6652]">
                    Completed
                  </p>
                  <p className="font-mono-tabular mt-1 text-2xl font-bold text-[#2D2229]">
                    {stats.totalCount}
                  </p>
                </div>
                <div className="rounded border border-[#D6C7B2] bg-[#FFFDF8] p-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7D6652]">
                    Total Time
                  </p>
                  <p className="font-mono-tabular mt-1 text-2xl font-bold text-[#3E549A]">
                    {formatDuration(stats.totalMinutes)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="rounded border border-[#D6C7B2] bg-[#FFFDF8] p-4 lg:col-span-8">
                  <div className="flex items-center justify-between text-xs font-bold text-[#3B2920]">
                    <span>Daily Activity (Last 7 Days)</span>
                    <span className="font-normal text-[#7D6652]">Focus minutes</span>
                  </div>
                  <div className="mt-4 grid h-32 grid-cols-7 items-end gap-2 border-b border-[#D6C7B2] pb-2">
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

                {/* Top Subjects */}
                <div className="rounded border border-[#D6C7B2] bg-[#FFFDF8] p-4 lg:col-span-4">
                  <p className="text-xs font-bold text-[#3B2920]">Top Subjects</p>
                  {stats.subjectBreakdown.length === 0 ? (
                    <p className="mt-4 text-xs leading-relaxed text-[#7D6652]">
                      Completed focus blocks will summarize your subjects here.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2.5">
                      {stats.subjectBreakdown.map((item) => {
                        const share = Math.max(
                          8,
                          Math.round((item.minutes / Math.max(1, stats.totalMinutes)) * 100)
                        );
                        return (
                          <div key={item.subject} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="truncate font-semibold text-[#36261E]">
                                {item.subject}
                              </span>
                              <span className="font-mono-tabular text-[#3E549A]">
                                {formatDuration(item.minutes)}
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EFE6D6]">
                              <div
                                className="h-full bg-[#3E549A]"
                                style={{ width: `${share}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#5C4939]">
                  Session History
                </h2>
                {focusSessions.length === 0 ? (
                  <p className="rounded border border-dashed border-[#D6C7B2] bg-[#FFFDF8] px-4 py-7 text-center text-xs text-[#7D6652]">
                    No completed study sessions yet. Sit at the desk and finish a block to record
                    your progress here.
                  </p>
                ) : (
                  <div className="divide-y divide-[#E7DAC6] rounded border border-[#D6C7B2] bg-[#FFFDF8]">
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
                            {CHARACTERS.female.name}
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
                            className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded p-1.5 text-[#8A7562] hover:bg-[#F2E7D5] hover:text-[#B54E4E]"
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

      {/* SCREEN 5 — SETTINGS */}
      {screen === 'settings' && (
        <main className="rpg-frame relative z-10 w-full max-w-4xl rounded-lg p-4 sm:p-5">
          {renderGameNavStrip('STILLALONG · SETTINGS', 'room', 'back to room')}

          <div className="rpg-bezel rounded-lg p-3">
            <div className="rpg-inner-card space-y-5 rounded p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <h2 className="font-gba mb-2 text-xs font-bold text-[#2D2229]">COMPANIONS</h2>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 rounded border border-[#D6C7B2] bg-[#FFFDF8] p-3">
                      <GirlSprite
                        animation="idle"
                        className="w-16 rounded border border-[#3D2820] bg-[#EFE4F5]"
                        alt="Hana study companion"
                      />
                      <div>
                        <p className="font-pixel text-xl font-bold text-[#2D2229]">
                          {activeChar.name}
                        </p>
                        <p className="text-xs text-[#6E5947]">{activeChar.description}</p>
                      </div>
                    </div>

                    <label className="flex min-h-[44px] cursor-pointer items-center justify-between rounded border border-[#D6C7B2] bg-[#FFFDF8] px-3 py-2 text-xs font-semibold text-[#36261E]">
                      <span>Show {CAT_COMPANION.name} the cat in room &amp; desk</span>
                      <input
                        type="checkbox"
                        checked={prefs.showCatCompanion}
                        onChange={(e) =>
                          setPrefs((p) => ({ ...p, showCatCompanion: e.target.checked }))
                        }
                        className="h-4 w-4 accent-[#3E549A]"
                      />
                    </label>
                  </div>
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
                        className={`min-h-[40px] rounded px-3 py-1.5 text-xs font-bold ${
                          prefs.timeOfDay === t.id ? 'rpg-btn-blue' : 'rpg-btn-cream'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E5D4BD] pt-4">
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
                        className={`min-h-[40px] rounded px-3 py-1.5 text-xs font-bold ${
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
                  <span className="text-xs font-semibold text-[#5C4939]">Desk Glow:</span>
                  {(['auto', 'on', 'off'] as const).map((lm) => (
                    <button
                      key={lm}
                      type="button"
                      onClick={() => setPrefs((prev) => ({ ...prev, lampMode: lm }))}
                      className={`min-h-[36px] rounded px-3 py-1 text-xs font-bold capitalize ${
                        prefs.lampMode === lm ? 'rpg-btn-blue' : 'rpg-btn-cream'
                      }`}
                    >
                      {lm}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-[#E5D4BD] pt-4 sm:grid-cols-4">
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
                    className="font-mono-tabular mt-1 min-h-[40px] w-full rounded border border-[#3D2820] bg-white px-2.5 py-1.5 text-sm text-[#2D2229]"
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
                    className="font-mono-tabular mt-1 min-h-[40px] w-full rounded border border-[#3D2820] bg-white px-2.5 py-1.5 text-sm text-[#2D2229]"
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
                    className="font-mono-tabular mt-1 min-h-[40px] w-full rounded border border-[#3D2820] bg-white px-2.5 py-1.5 text-sm text-[#2D2229]"
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
                    className="font-mono-tabular mt-1 min-h-[40px] w-full rounded border border-[#3D2820] bg-white px-2.5 py-1.5 text-sm text-[#2D2229]"
                  />
                </label>
              </div>

              <div className="space-y-2 border-t border-[#E5D4BD] pt-3">
                <label className="flex min-h-[38px] cursor-pointer items-center justify-between text-xs font-semibold text-[#36261E]">
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
                <label className="flex min-h-[38px] cursor-pointer items-center justify-between text-xs font-semibold text-[#36261E]">
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
                <label className="flex min-h-[38px] cursor-pointer items-center justify-between text-xs font-semibold text-[#36261E]">
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

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5D4BD] pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <PWAInstallButton variant="rpg" />
                  {!confirmClearHistory ? (
                    <button
                      type="button"
                      onClick={() => setConfirmClearHistory(true)}
                      disabled={sessions.length === 0}
                      className="rpg-btn-cream min-h-[40px] rounded px-3 py-1.5 text-xs font-bold disabled:opacity-40"
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
                        className="rpg-btn-rose min-h-[40px] rounded px-3 py-1.5 text-xs font-bold"
                      >
                        Confirm Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearHistory(false)}
                        className="rpg-btn-cream min-h-[40px] rounded px-3 py-1.5 text-xs font-bold"
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
                    className="min-h-[36px] hover:underline"
                  >
                    Privacy
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateRoute('/terms')}
                    className="min-h-[36px] hover:underline"
                  >
                    Terms
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateRoute('/about')}
                    className="min-h-[36px] hover:underline"
                  >
                    About &amp; Pricing
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
