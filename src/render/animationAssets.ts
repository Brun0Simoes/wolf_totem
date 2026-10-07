import type { SheetDefinition } from './animationModel';

/** Public files are addressed from the site root in data; the deployed site may live under a subpath. */
export const assetUrl = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, '');

const definitions = import.meta.glob<SheetDefinition>('../../public/assets/animations/{v2,v3}/*.json', { eager: true, import: 'default' });
export const animationSheets = new Map<string, SheetDefinition>(Object.values(definitions)
  .filter(sheet => sheet.characterId && sheet.clips?.idle?.length && sheet.clips?.walk?.length && sheet.clips?.attack?.length)
  .map(sheet => [`${sheet.characterId}:${sheet.stars ?? 1}`, { ...sheet, image: assetUrl(sheet.image) }]));
export const getAnimation = (id: number, stars = 1) => animationSheets.get(`${id}:${stars}`);
const summonDefinitions = import.meta.glob<SheetDefinition>('../../public/assets/animations/summons/*.json', { eager: true, import: 'default' });
export const summonSheets = new Map<string, SheetDefinition>(Object.values(summonDefinitions)
  .filter(sheet => sheet.summonId && sheet.clips?.idle?.length && sheet.clips?.walk?.length && sheet.clips?.attack?.length)
  .map(sheet => [sheet.summonId!, { ...sheet, image: assetUrl(sheet.image) }]));
export const getSummonAnimation = (kind: string) => summonSheets.get(kind);
export const summonSheetKey = (kind: string) => `summon-motion-${kind}`;
/** Exact stage first, then the closest lower stage, then any higher one: a stand-in while art is in production. */
export function bestAnimation(id: number, stars = 1): SheetDefinition | undefined {
  for (const candidate of [stars, stars - 1, stars - 2, stars + 1, stars + 2]) {
    const sheet = candidate >= 1 && candidate <= 3 ? getAnimation(id, candidate) : undefined;
    if (sheet) return sheet;
  }
  return undefined;
}
export const sheetKey = (id: number, stars = 1) => `hero-motion-${id}-${stars}`;
export const frameRect = (sheet: SheetDefinition, index: number) => sheet.frameRects?.[index] ?? {
  x: index % sheet.columns * sheet.frameWidth,
  y: Math.floor(index / sheet.columns) * sheet.frameHeight,
  width: sheet.frameWidth, height: sheet.frameHeight,
};
