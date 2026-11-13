export type RoutePath = '/' | '/app' | '/privacy' | '/terms';

export type AppScreen =
  | 'welcome'
  | 'character'
  | 'room'
  | 'focus'
  | 'history'
  | 'settings';

export type CharacterId = 'male' | 'female';

export type TimeOfDayMode = 'auto' | 'morning' | 'afternoon' | 'evening' | 'night';
export type ResolvedTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export type TimerMode = 'pomodoro' | 'custom';
export type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused';

export type SoundscapeMode = 'off' | 'rain' | 'vinyl' | 'crickets';

export interface CharacterInfo {
  id: CharacterId;
  name: string;
  label: string;
  description: string;
  accentColor: string;
}

export const CHARACTERS: Record<CharacterId, CharacterInfo> = {
  female: {
    id: 'female',
    name: 'Hana',
    label: 'Stillalong Companion',
    description: 'Navy pleated pinafore with cream collar, warm chestnut hair, quiet notebook notes.',
    accentColor: '#A85D52',
  },
  male: {
    id: 'male',
    name: 'Milo',
    label: 'Alternate Companion',
    description: 'Warm navy knit sweater, tousled chestnut hair, steady desk focus.',
    accentColor: '#4F5D95',
  },
};

export const SUBJECT_PRESETS = [
  'General Study',
  'Mathematics',
  'Reading',
  'Coding',
  'Writing',
  'Languages',
  'Science',
] as const;

export interface StudySession {
  id: string;
  completedAt: string;
  durationMinutes: number;
  mode: TimerMode;
  phase: PomodoroPhase;
  subject?: string;
  intention: string;
  characterId: CharacterId;
}

export interface TimerSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  customMinutes: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  chimeEnabled: boolean;
}

export interface AppPreferences {
  characterId: CharacterId;
  characterConfirmed: boolean;
  selectedSubject: string;
  timeOfDay: TimeOfDayMode;
  soundscape: SoundscapeMode;
  volume: number;
  lampMode: 'auto' | 'on' | 'off';
  showDialogue: boolean;
}
