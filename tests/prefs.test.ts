import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFS, loadPrefs, motionReduced, PREFS_KEY, sanitizePrefs, savePrefs } from '../src/prefs';

const memory = () => { const data = new Map<string, string>(); return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); } }; };

describe('device preferences', () => {
  it('falls back to defaults and clamps broken values', () => {
    expect(sanitizePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(sanitizePrefs({ sound: 'yes', sfx: 4, music: -1, motion: 'wild', numbers: 0 })).toEqual({ ...DEFAULT_PREFS, sfx: 1, music: 0 });
    expect(sanitizePrefs({ sfx: Number.NaN }).sfx).toBe(DEFAULT_PREFS.sfx);
  });

  it('round-trips through storage and survives corrupt data', () => {
    const storage = memory();
    savePrefs(storage, { sound: true, sfx: 0.3, music: 0.9, motion: 'reduced', numbers: false });
    expect(loadPrefs(storage)).toEqual({ sound: true, sfx: 0.3, music: 0.9, motion: 'reduced', numbers: false });
    storage.setItem(PREFS_KEY, '{oops');
    expect(loadPrefs(storage)).toEqual(DEFAULT_PREFS);
  });

  it('follows the system motion setting unless one is chosen', () => {
    expect(motionReduced({ ...DEFAULT_PREFS }, true)).toBe(true);
    expect(motionReduced({ ...DEFAULT_PREFS }, false)).toBe(false);
    expect(motionReduced({ ...DEFAULT_PREFS, motion: 'full' }, true)).toBe(false);
    expect(motionReduced({ ...DEFAULT_PREFS, motion: 'reduced' }, false)).toBe(true);
  });
});
