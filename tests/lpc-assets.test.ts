import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { animationSheets, getAnimation, getIllustratedAnimation } from '../src/render/animationAssets';
import { createMotion, directionFor, frameForMotion, poseForMotion, type FacingDirection, type SheetDefinition } from '../src/render/animationModel';

const directory = resolve('public/assets/animations/lpc');
const sheets: SheetDefinition[] = readdirSync(directory).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(resolve(directory, f), 'utf8')));
const directions: FacingDirection[] = ['north', 'west', 'south', 'east'];
const motions = ['idle', 'walk', 'attack', 'cast', 'hurt', 'death', 'victory'] as const;
const credits = JSON.parse(readFileSync(resolve('public/credits/lpc-credits.json'), 'utf8'));

describe('complete LPC roster', () => {
  it('registers all 55 heroes at all three stars and preserves illustrated portraits', () => {
    expect(sheets).toHaveLength(165);
    expect(animationSheets.size).toBe(165);
    const hashes = new Set<string>();
    for (let id = 1; id <= 55; id++) for (const stars of [1, 2, 3]) {
      const sheet = getAnimation(id, stars)!;
      expect(sheet.style).toBe('lpc');
      expect(sheet.stars).toBe(stars);
      expect(getIllustratedAnimation(id, stars)?.image).toMatch(/animations\/(v2|v3)\//);
      hashes.add(createHash('sha256').update(readFileSync(resolve('public', sheet.image.slice(1)))).digest('hex'));
    }
    expect(hashes.size).toBe(165);
  });

  it.each(sheets)('$name $stars stars has every motion, valid transparent PNG frames and local pivots', sheet => {
    const bytes = readFileSync(resolve('public', sheet.image.slice(1)));
    expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(bytes.readUInt32BE(16)).toBe(sheet.imageWidth);
    expect(bytes.readUInt32BE(20)).toBe(sheet.imageHeight);
    expect(bytes[25], 'PNG color type supports alpha').toBe(6);
    expect(Object.keys(sheet.directions!).sort()).toEqual([...directions].sort());
    const reached: number[] = [];
    for (const direction of directions) {
      const clips = sheet.directions![direction];
      expect(clips.walk).toHaveLength(8);
      expect(clips.cast).toHaveLength(7);
      expect(clips.death).toHaveLength(6);
      for (const motion of motions) {
        expect(clips[motion]!.length).toBeGreaterThan(1);
        for (const index of clips[motion]!) {
          expect(Number.isInteger(index)).toBe(true);
          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThan(sheet.frameRects!.length);
          reached.push(index);
        }
      }
      expect(clips.cast).not.toEqual(clips.attack);
    }
    expect([...new Set(reached)].sort((a,b) => a-b)).toEqual(sheet.frameRects!.map((_,i) => i));
    expect(sheet.frameAnchors).toHaveLength(sheet.frameRects!.length);
    sheet.frameRects!.forEach((r, i) => {
      expect(r.x).toBeGreaterThanOrEqual(0); expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.width).toBeGreaterThan(0); expect(r.height).toBeGreaterThan(0);
      expect(r.x + r.width).toBeLessThanOrEqual(sheet.imageWidth!);
      expect(r.y + r.height).toBeLessThanOrEqual(sheet.imageHeight!);
      const anchor = sheet.frameAnchors![i];
      expect(anchor.x).toBeGreaterThan(0); expect(anchor.x).toBeLessThan(r.width);
      expect(anchor.y).toBeGreaterThan(0); expect(anchor.y).toBeLessThan(r.height);
    });
  });

  it('credits every selected source and provides readable credits in the deployed game', () => {
    const config = JSON.parse(readFileSync(resolve('scripts/lpc-profiles.json'), 'utf8'));
    expect(credits.revision).toBe(config.revision);
    expect(credits.assets).toHaveLength(607);
    expect(new Set(credits.assets.map((asset: {filename:string}) => asset.filename)).size).toBe(credits.assets.length);
    for (const asset of credits.assets) {
      expect(asset.authors.trim().length).toBeGreaterThan(0);
      expect(asset.urls).toMatch(/^https?:\/\//);
      expect(asset.selectedLicense).toMatch(/^(CC-BY-SA|CC-BY |OGA-BY |CC0)/);
    }
    for (const file of ['lpc-credits.html', 'lpc-credits.csv', 'lpc-license.txt']) expect(existsSync(resolve('public/credits', file))).toBe(true);
    const profiles = JSON.parse(readFileSync(resolve('docs/production/lpc/profiles.json'), 'utf8'));
    expect(profiles).toHaveLength(165);
    expect(new Set(profiles.map((p: {sha256:string}) => p.sha256)).size).toBe(165);
    for (const profile of profiles) {
      const path=resolve(directory, `${String(profile.id).padStart(2,'0')}-s${profile.stars}.png`);
      expect(createHash('sha256').update(readFileSync(path)).digest('hex')).toBe(profile.sha256);
    }
  });
});

describe('LPC playback', () => {
  it('selects four actual directional rows and holds direction while stationary', () => {
    const sheet = getAnimation(1)!; const state = createMotion();
    for (const [dx,dy,want] of [[0,-2,'north'],[-2,0,'west'],[0,2,'south'],[2,0,'east']] as const) {
      state.direction = directionFor(dx,dy);
      expect(state.direction).toBe(want);
      expect(frameForMotion(state,sheet)).toBe(sheet.directions![want].idle[0]);
      expect(directionFor(0,0,want)).toBe(want);
    }
    expect(directionFor(NaN,0,'north')).toBe('north');
  });
  it('uses independent casting and impact frames and holds the last fallen frame', () => {
    const sheet = getAnimation(8,3)!; const state = createMotion(); state.direction='east';
    const clips = sheet.directions!.east;
    state.clip='cast'; state.elapsed=.24;
    expect(clips.cast).toContain(frameForMotion(state,sheet));
    state.hit=.1;
    expect(clips.cast).toContain(frameForMotion(state,sheet));
    state.clip='idle'; expect(clips.hurt).toContain(frameForMotion(state,sheet));
    state.clip='death'; state.elapsed=12;
    expect(frameForMotion(state,sheet)).toBe(clips.death!.at(-1));
    const pose=poseForMotion(state,true,false,true);
    expect(pose.angle).toBe(0); expect(pose.y).toBe(0); expect(pose.scaleY).toBe(1);
    expect(pose.alpha).toBe(0);
  });
});
