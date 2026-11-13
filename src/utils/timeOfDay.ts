import { ResolvedTimeOfDay, TimeOfDayMode } from '../types/study';

export interface TimeAtmosphere {
  period: ResolvedTimeOfDay;
  label: string;
  skyTop: string;
  skyBottom: string;
  roomTint: string; // RGBA overlay on room
  sunBeamAlpha: number;
  starsAlpha: number;
  lampDefaultOn: boolean;
  windowHorizonColor: string;
  windowLitColor: string;
}

export function resolveTimeOfDay(mode: TimeOfDayMode, now = new Date()): ResolvedTimeOfDay {
  if (mode !== 'auto') return mode;
  const h = now.getHours();
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

export const TIME_ATMOSPHERES: Record<ResolvedTimeOfDay, TimeAtmosphere> = {
  morning: {
    period: 'morning',
    label: 'Morning',
    skyTop: '#7FAEDB',
    skyBottom: '#D6E6F2',
    roomTint: 'rgba(255, 240, 205, 0.08)',
    sunBeamAlpha: 0.16,
    starsAlpha: 0,
    lampDefaultOn: false,
    windowHorizonColor: '#5B7C9E',
    windowLitColor: '#FFF3CC',
  },
  afternoon: {
    period: 'afternoon',
    label: 'Afternoon',
    skyTop: '#6A9CD4',
    skyBottom: '#B5D3EE',
    roomTint: 'rgba(255, 246, 224, 0.04)',
    sunBeamAlpha: 0.12,
    starsAlpha: 0,
    lampDefaultOn: false,
    windowHorizonColor: '#4A6B8F',
    windowLitColor: '#FFF5D6',
  },
  evening: {
    period: 'evening',
    label: 'Late Evening',
    skyTop: '#4A3A6E',
    skyBottom: '#D9856A',
    roomTint: 'rgba(54, 34, 72, 0.16)',
    sunBeamAlpha: 0.06,
    starsAlpha: 0.35,
    lampDefaultOn: true,
    windowHorizonColor: '#2E2346',
    windowLitColor: '#FFD685',
  },
  night: {
    period: 'night',
    label: 'Night',
    skyTop: '#151B3A',
    skyBottom: '#233262',
    roomTint: 'rgba(14, 18, 42, 0.28)',
    sunBeamAlpha: 0,
    starsAlpha: 1,
    lampDefaultOn: true,
    windowHorizonColor: '#121833',
    windowLitColor: '#F7CE78',
  },
};
