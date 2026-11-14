export type RoutePath = '/' | '/app' | '/privacy' | '/terms';

export type AppScreen =
  | 'welcome'
  | 'room'
  | 'focus'
  | 'history'
  | 'settings';

export type CharacterId = 'female';

export type CompanionPoseMode = 'auto' | 'writing' | 'reading' | 'mug' | 'resting';

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

export const CHARACTERS: Record<string, CharacterInfo> = {
  female: {
    id: 'female',
    name: 'Hana',
    label: 'Study Companion',
    description:
      'Dark messy bob, crisp white collared blouse, dark pleated skirt, quiet across-the-desk companion.',
    accentColor: '#9C82B5',
  },
};

export const CAT_COMPANION = {
  name: 'Mochi',
  description: 'Soft cream-white study cat who naps on the lavender rug and curls beside your desk.',
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
  showCatCompanion: boolean;
  selectedSubject: string;
  timeOfDay: TimeOfDayMode;
  soundscape: SoundscapeMode;
  volume: number;
  lampMode: 'auto' | 'on' | 'off';
  showDialogue: boolean;
  poseMode: CompanionPoseMode;
}
