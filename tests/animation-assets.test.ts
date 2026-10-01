import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { SheetDefinition } from '../src/render/animationModel';
import { getAnimation, frameRect } from '../src/render/animationAssets';

const publicDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
const manifests = ['v2', 'v3'].flatMap(version => {
 const atlasDirectory = resolve(publicDirectory, 'assets/animations', version);
 if (!existsSync(atlasDirectory)) return [];
 return readdirSync(atlasDirectory)
  .filter(file => file.endsWith('.json'))
  .sort()
  .map(file => ({
    file,
    version,
    sheet: JSON.parse(readFileSync(resolve(atlasDirectory, file), 'utf8')) as SheetDefinition,
  }));
});
const frameIndices = Array.from({ length: 12 }, (_, index) => index);

function pngDimensions(file: string): { width: number; height: number } {
  const bytes = readFileSync(file);
  expect(bytes.length, 'PNG must contain a complete IHDR chunk').toBeGreaterThanOrEqual(33);
  expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(bytes.readUInt32BE(8), 'IHDR payload size').toBe(13);
  expect(bytes.toString('ascii', 12, 16), 'First PNG chunk').toBe('IHDR');
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  expect(width).toBeGreaterThan(0);
  expect(height).toBeGreaterThan(0);
  return { width, height };
}

function expectFinite(value: number, label: string): void {
  expect(typeof value, label).toBe('number');
  expect(Number.isFinite(value), label).toBe(true);
}

describe('shipped character animation atlases', () => {
  it('preserves the first roster and assigns each character stage a unique atlas', () => {
    const ids = manifests.map(({ sheet }) => sheet.characterId);
    const keys = manifests.map(({sheet}) => `${sheet.characterId}:${sheet.stars ?? 1}`);
    expect(new Set(keys).size).toBe(manifests.length);
    expect(ids.every(id => Number.isInteger(id))).toBe(true);
    expect(ids.every(id => id >= 1 && id <= 55)).toBe(true);
    for (let id = 1; id <= 13; id++) expect(keys).toContain(`${id}:1`);
    expect(manifests.every(({sheet}) => [1,2,3].includes(sheet.stars ?? 1))).toBe(true);
  });

  it.each(manifests)('$file contains complete clips and valid PNG rectangles and anchors', ({ file, version, sheet }) => {
    expect(getAnimation(sheet.characterId, sheet.stars ?? 1)?.image).toBe(sheet.image);
    expect(sheet.image).toBe(`/assets/animations/${version}/${file.replace(/\.json$/, '.png')}`);
    const imagePath = resolve(publicDirectory, sheet.image.slice(1));
    expect(existsSync(imagePath), sheet.image).toBe(true);
    const image = pngDimensions(imagePath);
    if (version === 'v3') {
      expect(sheet.imageWidth).toBe(image.width);
      expect(sheet.imageHeight).toBe(image.height);
      expect(sheet.portrait).toBeDefined();
      const portrait = sheet.portrait!;
      expect(portrait.x).toBeGreaterThanOrEqual(0);
      expect(portrait.y).toBeGreaterThanOrEqual(0);
      expect(portrait.width).toBeGreaterThan(0);
      expect(portrait.height).toBeGreaterThan(0);
      expect(portrait.x + portrait.width).toBeLessThanOrEqual(image.width);
      expect(portrait.y + portrait.height).toBeLessThanOrEqual(image.height);
    }

    expect(sheet.columns).toBe(4);
    expect(sheet.rows).toBe(3);
    expect(sheet.frameRects, 'Custom atlas rectangles are required').toHaveLength(12);
    expect(sheet.frameAnchors, 'Every frame needs a local foot anchor').toHaveLength(12);
    expectFinite(sheet.bodyHeight, 'Body height');
    expect(sheet.bodyHeight).toBeGreaterThan(0);
    for (const size of [sheet.frameWidth, sheet.frameHeight]) {
      expect(Number.isInteger(size)).toBe(true);
      expect(size).toBeGreaterThan(0);
    }

    for (const clip of ['idle', 'walk', 'attack'] as const) {
      expect(sheet.clips[clip], clip).toHaveLength(4);
      expect(sheet.clips[clip].every(index => Number.isInteger(index) && index >= 0 && index < 12), clip).toBe(true);
    }
    expect([...sheet.clips.idle, ...sheet.clips.walk, ...sheet.clips.attack].sort((a, b) => a - b))
      .toEqual(frameIndices);

    sheet.frameRects!.forEach((rect, index) => {
      expect(frameRect(sheet, index)).toEqual(rect);
      const label = `${file}, frame ${index}`;
      for (const value of [rect.x, rect.y, rect.width, rect.height]) {
        expect(Number.isInteger(value), label).toBe(true);
      }
      expect(rect.x, label).toBeGreaterThanOrEqual(0);
      expect(rect.y, label).toBeGreaterThanOrEqual(0);
      expect(rect.width, label).toBeGreaterThan(0);
      expect(rect.height, label).toBeGreaterThan(0);
      expect(rect.x + rect.width, label).toBeLessThanOrEqual(image.width);
      expect(rect.y + rect.height, label).toBeLessThanOrEqual(image.height);

      const anchor = sheet.frameAnchors![index];
      expectFinite(anchor.x, `${label}, anchor X`);
      expectFinite(anchor.y, `${label}, anchor Y`);
      expect(anchor.x, label).toBeGreaterThanOrEqual(0);
      expect(anchor.y, label).toBeGreaterThanOrEqual(0);
      expect(anchor.x, label).toBeLessThanOrEqual(rect.width);
      expect(anchor.y, label).toBeLessThanOrEqual(rect.height);
    });

    const firstFrame = sheet.frameRects![0];
    expectFinite(sheet.anchorX, 'Default anchor X');
    expectFinite(sheet.anchorY, 'Default anchor Y');
    expect(sheet.anchorX).toBeGreaterThanOrEqual(0);
    expect(sheet.anchorY).toBeGreaterThanOrEqual(0);
    expect(sheet.anchorX).toBeLessThanOrEqual(firstFrame.width);
    expect(sheet.anchorY).toBeLessThanOrEqual(firstFrame.height);
  });
});
