import type { SheetDefinition } from './animationModel';

const definitions = import.meta.glob<SheetDefinition>('../../public/assets/animations/{v2,v3}/*.json', { eager: true, import: 'default' });
export const animationSheets = new Map<string, SheetDefinition>(Object.values(definitions)
  .filter(sheet => sheet.characterId && sheet.clips?.idle?.length && sheet.clips?.walk?.length && sheet.clips?.attack?.length)
  .map(sheet => [`${sheet.characterId}:${sheet.stars ?? 1}`, sheet]));
export const getAnimation = (id: number, stars = 1) => animationSheets.get(`${id}:${stars}`);
export const sheetKey = (id: number, stars = 1) => `hero-motion-${id}-${stars}`;
export const frameRect = (sheet: SheetDefinition, index: number) => sheet.frameRects?.[index] ?? {
  x: index % sheet.columns * sheet.frameWidth,
  y: Math.floor(index / sheet.columns) * sheet.frameHeight,
  width: sheet.frameWidth, height: sheet.frameHeight,
};
