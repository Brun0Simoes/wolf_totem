/** Device preferences, kept apart from the journey save: sound, motion and readability. */
export type MotionPref = 'system' | 'full' | 'reduced';
export interface Prefs { sound: boolean; sfx: number; music: number; motion: MotionPref; numbers: boolean }

export const PREFS_KEY = 'wolf-totem-prefs';
export const DEFAULT_PREFS: Prefs = { sound: false, sfx: 0.8, music: 0.5, motion: 'system', numbers: true };

const level = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;

export function sanitizePrefs(raw: unknown): Prefs {
  const data = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  return {
    sound: typeof data.sound === 'boolean' ? data.sound : DEFAULT_PREFS.sound,
    sfx: level(data.sfx, DEFAULT_PREFS.sfx),
    music: level(data.music, DEFAULT_PREFS.music),
    motion: data.motion === 'full' || data.motion === 'reduced' ? data.motion : 'system',
    numbers: typeof data.numbers === 'boolean' ? data.numbers : DEFAULT_PREFS.numbers,
  };
}

export function loadPrefs(storage: Pick<Storage, 'getItem'>): Prefs {
  try { return sanitizePrefs(JSON.parse(storage.getItem(PREFS_KEY) || 'null')); } catch { return { ...DEFAULT_PREFS }; }
}

export function savePrefs(storage: Pick<Storage, 'setItem'>, prefs: Prefs): void {
  try { storage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* preferences are a convenience */ }
}

/** "Seguir o sistema" defers to the operating system's reduced-motion setting. */
export const motionReduced = (prefs: Prefs, systemReduced: boolean) => prefs.motion === 'system' ? systemReduced : prefs.motion === 'reduced';
