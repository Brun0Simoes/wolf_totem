import type { Character } from '../data/characters';
import { frameRect, getAnimation } from './animationAssets';

/** Crop by layout, preserving the generated file and its alpha channel. */
export function portraitHTML(character: Character, stars = 1): string {
  if (character.art) return `<img src="/chars/${character.art}-${stars}star.png" alt="${character.name}" loading="lazy"/>`;
  const sheet = getAnimation(character.id, stars);
  if (!sheet) return '<span class="unknown-art" aria-label="Arte em produção">✦</span>';
  const rect = sheet.portrait ?? frameRect(sheet, 0);
  const width = sheet.imageWidth ?? Math.max(...sheet.frameRects!.map(r => r.x + r.width));
  const height = sheet.imageHeight ?? Math.max(...sheet.frameRects!.map(r => r.y + r.height));
  return `<span class="atlas-portrait" style="--portrait-ratio:${rect.width / rect.height}" role="img" aria-label="${character.name}, ${stars} estrela${stars > 1 ? 's' : ''}"><img src="${sheet.image}" alt="" loading="lazy" style="width:${width / rect.width * 100}%;height:${height / rect.height * 100}%;left:${-rect.x / rect.width * 100}%;top:${-rect.y / rect.height * 100}%"/></span>`;
}
