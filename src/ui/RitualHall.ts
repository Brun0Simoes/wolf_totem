import type { GameState } from "../game/simulation";
import { characters } from "../data/characters";
import {
  PRACTICES,
  practiceById,
  RITUAL_XP,
  CURA_NOTE,
  type PracticeId,
} from "../game/tribe";
import { ritualCost } from "../game/economy";
import { RITUAL_PLAY } from "../game/ritualPlay";
import { portraitHTML } from "../render/portrait";
import { growthBars } from "./heroProgress";
import { uiIcon as icon, uiEsc as esc } from "./AncestralJourney";

export function ritualHall(
  s: GameState,
  uid: string,
  id: PracticeId,
  lock: string | null,
): string {
  const h = s.heroes.find((h) => h.uid === uid) ?? s.heroes[0],
    c = characters.find((c) => c.id === h.characterId)!,
    p = practiceById(id)!,
    cost = ritualCost(id, h.rituals[id] ?? 0);
  return `<header class="page-heading ritual-page-title"><div><p class="eyebrow">A CHAMA QUE TRANSFORMA</p><h1>Rituais do espírito.</h1></div><span class="amber-purse">${icon("gem")}<b>${s.amber}</b> âmbar</span></header><div class="ritual-console"><aside class="ritual-companion"><label for="ritual-hero-picker">Guardião da cerimônia</label><select id="ritual-hero-picker">${s.heroes.map((h) => `<option value="${h.uid}" ${h.uid === uid ? "selected" : ""}>${characters.find((c) => c.id === h.characterId)!.name} · Nv ${h.level} · Rito ${h.ritualLevel}</option>`).join("")}</select><div class="ritual-companion-art">${portraitHTML(c, h.stars)}</div><h2>${c.name} <small>${"★".repeat(h.stars)}</small></h2>${growthBars(h, true)}<p class="ritual-immediate">${icon("check")}XP imediato. Disponível para lutar após confirmar.</p></aside><section class="ritual-workbench"><nav class="ritual-tabs" aria-label="Cerimônias">${PRACTICES.map((r) => `<button data-practice-select="${r.id}" aria-pressed="${r.id === id}" class="${s.era < r.era ? "locked" : ""}">${icon(({ rape: "feather", sananga: "eye", kambo: "heart", ayahuasca: "leaf", cacau: "cup-soda" } as Record<string, string>)[r.id])}<span>${r.name}</span><small>${s.era < r.era ? "Era " + r.era : RITUAL_XP[r.id] + " XP"}</small></button>`).join("")}</nav><div class="ritual-summary"><div class="ritual-summary-title"><span class="ritual-symbol">${icon("flame")}</span><div><p class="eyebrow">${p.tribe ? "TODA A TRIBO" : "VÍNCULO INDIVIDUAL"}</p><h2>${p.name}</h2></div></div><p>${p.effect}</p><div class="ritual-outcome"><span>Experiência ritual<b>+${RITUAL_XP[id]}<small>até +20% pela sintonia</small></b></span><span>Investimento<b>${p.tribe ? ritualCost("cacau") : cost}<small>âmbar por cerimônia</small></b></span><span>Aprendizado<b>${p.tribe ? s.cacaoBattles + " batalhas" : (h.rituals[id] ?? 0) + " / " + p.max}<small>${p.tribe ? "de bênção restante" : "bônus já aprendidos"}</small></b></span></div><p class="ritual-instruction">${RITUAL_PLAY[id].instruction}</p><details class="ritual-context"><summary>Tradição e contexto</summary><p>${esc(p.text)}</p><small>${esc(p.peoples)}</small><p>${esc(CURA_NOTE)}</p></details></div><footer class="ritual-confirm-bar"><span>${lock ? icon("lock") + esc(lock) : icon("check") + "Pronto para participar"}</span><button class="primary" ${p.tribe ? 'data-action="cacao"' : `data-ritual="${id}"`} ${lock ? "disabled" : ""}>${icon("flame")}Participar · ${p.tribe ? ritualCost("cacau") : cost} âmbar</button></footer></section></div>`;
}
