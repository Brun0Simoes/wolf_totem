import { characters } from '../data/characters';
import type { Hero } from '../game/simulation';
import { AWAKENING, MAX_HERO_LEVEL, MAX_RITUAL_LEVEL, ritualXpToNext, xpToNext } from '../game/tribe';

const number = (n: number) => Math.floor(n).toLocaleString('pt-BR');
export function growthBars(hero: Hero, compact = false): string {
  return `<div class="growth-bars ${compact ? 'compact' : ''}">${[
    { kind: 'activity', name: 'Experiência', level: hero.level, xp: hero.xp, max: MAX_HERO_LEVEL, target: xpToNext(hero.level) },
    { kind: 'ritual', name: 'Ritualística', level: hero.ritualLevel, xp: hero.ritualXp, max: MAX_RITUAL_LEVEL, target: ritualXpToNext(hero.ritualLevel) },
  ].map(track => `<div class="growth-track ${track.kind}" data-growth="${hero.uid}:${track.kind}"><div><span>${track.name} <b>Nível ${track.level}</b></span><small>${track.level >= track.max ? 'Máximo' : compact ? `${Math.floor(track.xp / track.target * 100)}%` : `${number(track.xp)} / ${number(track.target)}`}</small></div><progress max="${track.level >= track.max ? 1 : track.target}" value="${track.level >= track.max ? 1 : track.xp}" aria-label="${track.name} de ${characters.find(c=>c.id===hero.characterId)?.name??'herói'}, nível ${track.level}"></progress></div>`).join('')}</div>`;
}
export function awakeningMarkup(hero: Hero): string {
  const need = AWAKENING.find(entry => entry.stars > hero.stars);
  if (!need) return '<section class="awakening"><h3>Avatar desperto · 3★</h3><p>Continue fortalecendo a experiência e o vínculo ritual.</p></section>';
  const requirements = [
    { text: `Experiência nível ${need.level}`, ready: hero.level >= need.level },
    { text: `Ritualística nível ${need.ritualLevel}`, ready: hero.ritualLevel >= need.ritualLevel },
    ...(need.ayahuasca ? [{ text: 'Ayahuasca concluída', ready: !!hero.rituals.ayahuasca }] : []),
  ];
  return `<section class="awakening"><h3>Próximo despertar · ${need.stars}★</h3><ul>${requirements.map(req => `<li class="${req.ready ? 'ready' : ''}"><span aria-hidden="true">${req.ready ? '✓' : '○'}</span>${req.text}</li>`).join('')}</ul><p>A forma desperta automaticamente quando todos os requisitos forem alcançados.</p></section>`;
}
/** Update bars in place; ticking XP must never replace the control under the pointer. */
export function updateGrowthBars(heroes: Hero[]): void {
  for (const hero of heroes) for (const kind of ['activity', 'ritual'] as const) {
    const level = kind === 'activity' ? hero.level : hero.ritualLevel;
    const maxLevel = kind === 'activity' ? MAX_HERO_LEVEL : MAX_RITUAL_LEVEL;
    const xp = kind === 'activity' ? hero.xp : hero.ritualXp;
    const target = kind === 'activity' ? xpToNext(level) : ritualXpToNext(level);
    document.querySelectorAll<HTMLElement>(`[data-growth="${hero.uid}:${kind}"]`).forEach(el => {
      el.querySelector('b')!.textContent = `Nível ${level}`;
      el.querySelector('small')!.textContent = level >= maxLevel ? 'Máximo' : el.closest('.compact') ? `${Math.floor(xp / target * 100)}%` : `${number(xp)} / ${number(target)}`;
      const bar = el.querySelector('progress')!; bar.max = level >= maxLevel ? 1 : target; bar.value = level >= maxLevel ? 1 : xp;
      bar.setAttribute('aria-label', `${kind === 'activity' ? 'Experiência' : 'Ritualística'} de ${characters.find(c => c.id === hero.characterId)?.name ?? 'herói'}, nível ${level}`);
      bar.setAttribute('aria-valuetext', level >= maxLevel ? 'Nível máximo' : `${number(xp)} de ${number(target)} XP`);
    });
  }
}
