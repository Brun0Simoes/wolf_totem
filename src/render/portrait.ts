import type { Character } from '../data/characters';
import { bestAnimation, frameRect } from './animationAssets';

/** Crop by layout, preserving the generated file and its alpha channel. */
export function portraitHTML(character: Character, stars = 1): string {
  if (character.art) return `<img src="/chars/${character.art}-${stars}star.png" alt="${character.name}" loading="lazy"/>`;
  const sheet = bestAnimation(character.id, stars);
  if (!sheet) return `<span class="unknown-art cost-${character.cost}" role="img" aria-label="${character.name}: arte em produção"><b>${character.name.charAt(0)}</b><small>Arte em produção</small></span>`;
  const rect = sheet.portrait ?? frameRect(sheet, 0);
  const width = sheet.imageWidth ?? Math.max(...sheet.frameRects!.map(r => r.x + r.width));
  const height = sheet.imageHeight ?? Math.max(...sheet.frameRects!.map(r => r.y + r.height));
  const shown = sheet.stars ?? 1;
  return `<span class="atlas-portrait${shown !== stars ? ' stand-in' : ''}" style="--portrait-ratio:${rect.width / rect.height}" role="img" aria-label="${character.name}, ${shown} estrela${shown > 1 ? 's' : ''}"><img src="${sheet.image}" alt="" loading="lazy" style="width:${width / rect.width * 100}%;height:${height / rect.height * 100}%;left:${-rect.x / rect.width * 100}%;top:${-rect.y / rect.height * 100}%"/></span>`;
}

/** True when the requested stage has no art of its own and a neighbouring stage stands in. */
export function usesStandIn(character: Character, stars: number): boolean {
  if (character.art) return false;
  const sheet = bestAnimation(character.id, stars);
  return !sheet || (sheet.stars ?? 1) !== stars;
}
