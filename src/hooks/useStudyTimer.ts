import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CharacterId,
  PomodoroPhase,
  StudySession,
  TimerMode,
  TimerSettings,
  TimerStatus,
} from '../types/study';
import { cozyAudio } from '../utils/audio';

interface UseStudyTimerArgs {
  settings: TimerSettings;
  characterId: CharacterId;
  subject: string;
  onSessionCompleted: (session: StudySession) => void;
  onPhaseMessage?: (message: string) => void;
}

export interface EndedSessionSummary {
  durationMinutes: number;
  elapsedSeconds: number;
  subject: string;
  intention: string;
  completedAt: string;
  recorded: boolean;
}

/**
 * Timestamp-based study timer decoupled from visual scenes.
 * Continues accurately across screen transitions and background browser tabs.
 */
export function useStudyTimer({
  settings,
  characterId,
  subject,
  onSessionCompleted,
  onPhaseMessage,
}: UseStudyTimerArgs) {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [phase, setPhase] = useState<PomodoroPhase>('focus');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [selectedMinutes, setSelectedMinutes] = useState<number>(settings.focusMinutes);
  const [intention, setIntention] = useState<string>('');
  const [completedInCycle, setCompletedInCycle] = useState<number>(0);

  const [remainingMs, setRemainingMs] = useState<number>(settings.focusMinutes * 60 * 1000);
  const endTimestampRef = useRef<number | null>(null);
  const activeBlockDurationMinRef = useRef<number>(settings.focusMinutes);

  const onSessionCompletedRef = useRef(onSessionCompleted);
  onSessionCompletedRef.current = onSessionCompleted;
  const onPhaseMessageRef = useRef(onPhaseMessage);
  onPhaseMessageRef.current = onPhaseMessage;

  const getPhaseMinutes = useCallback(
    (m: TimerMode, p: PomodoroPhase, customMins: number, s: TimerSettings) => {
      if (m === 'custom') return customMins;
      if (p === 'focus') return customMins;
      if (p === 'shortBreak') return s.shortBreakMinutes;
      return s.longBreakMinutes;
    },
    []
  );

  const completePhase = useCallback(() => {
    endTimestampRef.current = null;
    if (settings.chimeEnabled) {
      cozyAudio.playChime('complete');
    }

    const finishedMinutes = Math.max(1, activeBlockDurationMinRef.current);

    if (mode === 'custom' || phase === 'focus') {
      onSessionCompletedRef.current({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        completedAt: new Date().toISOString(),
        durationMinutes: finishedMinutes,
        mode,
        phase: 'focus',
        subject: subject || 'General Study',
        intention: intention.trim(),
        characterId,
      });
    }

    if (mode === 'custom') {
      const nextMs = selectedMinutes * 60 * 1000;
      activeBlockDurationMinRef.current = selectedMinutes;
      setRemainingMs(nextMs);
      setStatus('idle');
      onPhaseMessageRef.current?.('Nice work. Take a gentle breather whenever you want.');
      return;
    }

    if (phase === 'focus') {
      const nextCycle = completedInCycle + 1;
      setCompletedInCycle(nextCycle);
      const nextPhase: PomodoroPhase =
        nextCycle % settings.sessionsBeforeLongBreak === 0 ? 'longBreak' : 'shortBreak';
      const nextMins =
        nextPhase === 'longBreak' ? settings.longBreakMinutes : settings.shortBreakMinutes;
      const nextMs = nextMins * 60 * 1000;

      setPhase(nextPhase);
      activeBlockDurationMinRef.current = nextMins;
      setRemainingMs(nextMs);

      if (settings.autoStartBreaks) {
        endTimestampRef.current = Date.now() + nextMs;
        setStatus('running');
      } else {
        setStatus('idle');
      }
      onPhaseMessageRef.current?.('Good focus block. Stretch your shoulders and rest a moment.');
    } else {
      const nextMs = selectedMinutes * 60 * 1000;
      setPhase('focus');
      activeBlockDurationMinRef.current = selectedMinutes;
      setRemainingMs(nextMs);

      if (settings.autoStartFocus) {
        endTimestampRef.current = Date.now() + nextMs;
        setStatus('running');
      } else {
        setStatus('idle');
      }
      onPhaseMessageRef.current?.("I'll be right here.");
    }
  }, [
    characterId,
    completedInCycle,
    intention,
    mode,
    phase,
    selectedMinutes,
    settings,
    subject,
  ]);

  const completePhaseRef = useRef(completePhase);
  completePhaseRef.current = completePhase;

  const remainingMsRef = useRef<number>(remainingMs);
  remainingMsRef.current = remainingMs;

  // Accurate timestamp polling loop (250ms resolution so seconds never drift)
  useEffect(() => {
    if (status !== 'running') return;
    if (endTimestampRef.current === null) {
      endTimestampRef.current = Date.now() + remainingMsRef.current;
    }

    const tick = () => {
      if (endTimestampRef.current === null) return;
      const left = Math.max(0, endTimestampRef.current - Date.now());
      setRemainingMs(left);
      if (left <= 0) {
        completePhaseRef.current();
      }
    };

    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [status]);

  const start = useCallback(() => {
    if (status === 'running') return;
    if (status === 'idle' && settings.chimeEnabled) {
      cozyAudio.playChime('start');
    }
    endTimestampRef.current = Date.now() + remainingMsRef.current;
    setStatus('running');
    if (phase === 'focus' || mode === 'custom') {
      onPhaseMessageRef.current?.("I'll be right here.");
    } else {
      onPhaseMessageRef.current?.('Enjoy a quiet breather.');
    }
  }, [mode, phase, settings.chimeEnabled, status]);

  const pause = useCallback(() => {
    if (status !== 'running') return;
    if (endTimestampRef.current !== null) {
      setRemainingMs(Math.max(0, endTimestampRef.current - Date.now()));
    }
    endTimestampRef.current = null;
    setStatus('paused');
    onPhaseMessageRef.current?.('Taking a pause. No rush at all.');
  }, [status]);

  const toggleStartPause = useCallback(() => {
    if (status === 'running') pause();
    else start();
  }, [pause, start, status]);

  const reset = useCallback(() => {
    endTimestampRef.current = null;
    setStatus('idle');
    const mins = getPhaseMinutes(mode, phase, selectedMinutes, settings);
    activeBlockDurationMinRef.current = mins;
    setRemainingMs(mins * 60 * 1000);
    onPhaseMessageRef.current?.('Ready whenever you are.');
  }, [getPhaseMinutes, mode, phase, selectedMinutes, settings]);

  const endSession = useCallback((): EndedSessionSummary => {
    const liveRemaining =
      status === 'running' && endTimestampRef.current !== null
        ? Math.max(0, endTimestampRef.current - Date.now())
        : remainingMsRef.current;
    const totalMs = activeBlockDurationMinRef.current * 60 * 1000;
    const elapsedMs = Math.max(0, totalMs - liveRemaining);
    const elapsedSeconds = Math.round(elapsedMs / 1000);
    const isFocusBlock = mode === 'custom' || phase === 'focus';
    const recordedMinutes = isFocusBlock ? Math.floor(elapsedSeconds / 60) : 0;
    const completedAt = new Date().toISOString();

    if (recordedMinutes >= 1) {
      onSessionCompletedRef.current({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        completedAt,
        durationMinutes: recordedMinutes,
        mode,
        phase: 'focus',
        subject: subject || 'General Study',
        intention: intention.trim(),
        characterId,
      });
    }

    endTimestampRef.current = null;
    setStatus('idle');
    setPhase('focus');
    activeBlockDurationMinRef.current = selectedMinutes;
    setRemainingMs(selectedMinutes * 60 * 1000);
    onPhaseMessageRef.current?.(
      'Good work today. Whenever you want to sit back down, the desk is ready.'
    );

    return {
      durationMinutes: recordedMinutes,
      elapsedSeconds,
      subject: subject || 'General Study',
      intention: intention.trim(),
      completedAt,
      recorded: recordedMinutes >= 1,
    };
  }, [characterId, intention, mode, phase, selectedMinutes, status, subject]);

  const selectPresetMinutes = useCallback(
    (mins: number) => {
      const clamped = Math.min(180, Math.max(1, Math.round(mins)));
      endTimestampRef.current = null;
      setSelectedMinutes(clamped);
      setPhase('focus');
      setStatus('idle');
      activeBlockDurationMinRef.current = clamped;
      setRemainingMs(clamped * 60 * 1000);
      if (settings.chimeEnabled) cozyAudio.playChime('click');
      onPhaseMessageRef.current?.("I'll be right here.");
    },
    [settings.chimeEnabled]
  );

  const switchModeAndPhase = useCallback(
    (nextMode: TimerMode, nextPhase: PomodoroPhase) => {
      endTimestampRef.current = null;
      setMode(nextMode);
      setPhase(nextPhase);
      setStatus('idle');
      const mins = getPhaseMinutes(nextMode, nextPhase, selectedMinutes, settings);
      activeBlockDurationMinRef.current = mins;
      setRemainingMs(mins * 60 * 1000);
    },
    [getPhaseMinutes, selectedMinutes, settings]
  );

  const secondsLeft = Math.ceil(remainingMs / 1000);
  const totalSeconds = activeBlockDurationMinRef.current * 60;

  return {
    mode,
    phase,
    status,
    selectedMinutes,
    secondsLeft,
    totalSeconds,
    intention,
    completedInCycle,
    setIntention,
    start,
    pause,
    toggleStartPause,
    reset,
    endSession,
    selectPresetMinutes,
    switchModeAndPhase,
  };
}
