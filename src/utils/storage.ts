import { AppPreferences, StudySession, TimerSettings } from '../types/study';

const SESSIONS_KEY = 'stillalong_sessions_v2';
const SETTINGS_KEY = 'stillalong_settings_v2';
const PREFS_KEY = 'stillalong_prefs_v2';

export const DEFAULT_SETTINGS: TimerSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  customMinutes: 25,
  autoStartBreaks: false,
  autoStartFocus: false,
  chimeEnabled: true,
};

export const DEFAULT_PREFS: AppPreferences = {
  characterId: 'female',
  characterConfirmed: false,
  selectedSubject: 'General Study',
  timeOfDay: 'auto',
  soundscape: 'off',
  volume: 0.45,
  lampMode: 'auto',
  showDialogue: true,
};

export function loadSessions(): StudySession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY) || localStorage.getItem('stillalong_sessions_v1');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: StudySession[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadSettings(): TimerSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: TimerSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

export function loadPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePreferences(prefs: AppPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore
  }
}

export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface DailyBucket {
  dateKey: string;
  label: string;
  minutes: number;
  sessions: number;
}

export function computeStudyStats(sessions: StudySession[]) {
  const focusSessions = sessions.filter((s) => s.phase === 'focus');
  const todayKey = toLocalDateKey(new Date());

  let todayMinutes = 0;
  let todayCount = 0;
  let totalMinutes = 0;

  const byDay = new Map<string, { minutes: number; sessions: number }>();

  for (const s of focusSessions) {
    const key = toLocalDateKey(new Date(s.completedAt));
    totalMinutes += s.durationMinutes;
    const prev = byDay.get(key) ?? { minutes: 0, sessions: 0 };
    byDay.set(key, {
      minutes: prev.minutes + s.durationMinutes,
      sessions: prev.sessions + 1,
    });
    if (key === todayKey) {
      todayMinutes += s.durationMinutes;
      todayCount += 1;
    }
  }

  const last7Days: DailyBucket[] = [];
  const weekdayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - offset);
    const key = toLocalDateKey(d);
    const bucket = byDay.get(key) ?? { minutes: 0, sessions: 0 };
    last7Days.push({
      dateKey: key,
      label: offset === 0 ? 'Today' : weekdayFmt.format(d),
      minutes: bucket.minutes,
      sessions: bucket.sessions,
    });
  }

  let streakDays = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!byDay.has(toLocalDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (byDay.has(toLocalDateKey(cursor))) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    todayMinutes,
    todayCount,
    totalMinutes,
    totalCount: focusSessions.length,
    streakDays,
    last7Days,
  };
}
