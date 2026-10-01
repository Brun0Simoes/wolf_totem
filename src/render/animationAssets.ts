import type { SheetDefinition } from './animationModel';

const definitions = import.meta.glob<SheetDefinition>('../../public/assets/animations/v2/*.json', { eager: true, import: 'default' });
export const animationSheets = new Map<number, SheetDefinition>(Object.values(definitions)
  .filter(sheet => sheet.characterId && sheet.clips?.idle?.length && sheet.clips?.walk?.length && sheet.clips?.attack?.length)
  .map(sheet => [sheet.characterId, sheet]));
export const sheetKey = (id: number) => `hero-motion-${id}`;
