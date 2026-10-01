import type { Character } from '../data/characters';
import { bestAnimation, getAnimation } from './animationAssets';
import type { SheetDefinition } from './animationModel';
import { proceduralSheet } from './proceduralArt';

/**
 * Which art represents a hero at a given star, in order of preference:
 * the painted sheet of that star, the original illustration, the closest painted sheet
 * (shown with a spirit aura), and finally the code-drawn figure.
 */
export type ArtKind = 'painted' | 'illustration' | 'standin' | 'procedural';
export function artFor(character: Pick<Character, 'id' | 'art'>, stars: number): { kind: ArtKind; sheet?: SheetDefinition } {
  const exact = getAnimation(character.id, stars);
  if (exact) return { kind: 'painted', sheet: exact };
  if (character.art) return { kind: 'illustration' };
  const nearest = bestAnimation(character.id, stars);
  if (nearest) return { kind: 'standin', sheet: nearest };
  return { kind: 'procedural', sheet: proceduralSheet(character.id, stars).sheet };
}
