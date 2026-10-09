import type { GameState, Hero } from "../game/simulation";
import { characters, type Character } from "../data/characters";
import { armyScore, activeArmy, ROLE_GUIDE, roleOf } from "../game/armyAdvisor";
import { countTraits, traitStatus } from "../game/synergies";
import { draftPool, draftCost } from "../game/economy";
import { portraitHTML } from "../render/portrait";
import { uiIcon as icon, uiEsc as esc } from "./AncestralJourney";

export function draftFit(s: GameState, c: Character) {
  const current = activeArmy(s),
    candidate = {
      ...s.heroes[0],
      uid: "candidate",
      characterId: c.id,
      level: 1,
      stars: 1,
      items: [],
    } as Hero;
  const options =
    current.length < 2 + s.era
      ? [{ party: [...current, candidate], replace: null as Hero | null }]
      : current.map((h) => ({
          party: current.map((x) => (x === h ? candidate : x)),
          replace: h,
        }));
  const best = options.sort(
    (a, b) =>
      armyScore(b.party, s.journey.focusTraits) -
      armyScore(a.party, s.journey.focusTraits),
  )[0];
  const before = countTraits(current.map((h) => h.characterId)),
    after = countTraits((best?.party ?? [candidate]).map((h) => h.characterId));
  return {
    replace: best?.replace,
    traits: c.traits.map((name) => ({
      name,
      before: before.get(name) ?? 0,
      after: traitStatus(name, after.get(name) ?? 0),
    })),
    gained: [...after]
      .filter(
        ([name, n]) =>
          traitStatus(name, n).tier >
          traitStatus(name, before.get(name) ?? 0).tier,
      )
      .map(([name]) => name),
    lost: [...before]
      .filter(
        ([name, n]) =>
          traitStatus(name, n).tier >
          traitStatus(name, after.get(name) ?? 0).tier,
      )
      .map(([name]) => name),
  };
}
export function draftHall(
  s: GameState,
  fighting: boolean,
): string {
  const locked = s.paused || fighting,
    pool = draftPool(
      s.era,
      s.heroes.map((h) => h.characterId),
    ),
    d = s.draft;
  return `<div class="draft-hall"><header class="page-heading"><div><p class="eyebrow">O CHAMADO DOS GUARDIÕES</p><h1>Três caminhos. Uma escolha.</h1><p>Leia os laços, compare funções e acolha um espírito inédito.</p></div><button class="outline-button" data-tribe-tab="owned">${icon("users")}Sua tribo · ${s.heroes.length}</button></header>
  <div class="draft-economy"><span>${icon("gem")}<b>${s.amber}</b> âmbar</span><span>Era ${s.era} · ${pool.length} inéditos disponíveis</span><span>${d ? "Escolha já paga · cartas preservadas ao sair" : "Um chamado custa " + draftCost(s.era) + " âmbar"}</span></div>
  <div class="draft-cards">${
    d
      ? d.offers
          .map((id, index) => {
            const c = characters.find((c) => c.id === id)!,
              fit = draftFit(s, c),
              role = ROLE_GUIDE[roleOf(c)];
            return `<article class="draft-card" style="--draft-tier:${["#89b39d", "#82afcf", "#b398da", "#d8b273", "#e2c789"][c.cost - 1]}"><div class="draft-card-top"><span>ERA ${c.cost}</span><button class="icon-button" data-character="${c.id}" aria-label="Inspecionar ${c.name}">${icon("expand")}</button></div><button class="draft-portrait" data-character="${c.id}" aria-label="Ver habilidade de ${c.name}">${portraitHTML(c, 1)}</button><div class="draft-identity"><small>${role.name}</small><h2>${c.name}</h2><p>${esc(c.title)}</p></div><div class="draft-traits">${fit.traits.map((t) => `<div><button data-coach-trait="${esc(t.name)}">${esc(t.name)}</button><b>${t.before} → ${t.after.count}<small> / ${t.after.next}</small></b><span class="threshold-dots">${t.after.thresholds.map((n) => `<i class="${t.after.count >= n ? "on" : ""}">${n}</i>`).join("")}</span></div>`).join("")}</div><div class="draft-fit ${fit.gained.length ? "gain" : ""}">${icon("network")}<span>${fit.gained.length ? "Ativa ou fortalece: " + fit.gained.join(", ") : "Aproxima o próximo patamar de laço."}${fit.lost.length ? `<small>Ao substituir, perde: ${esc(fit.lost.join(", "))}.</small>` : ""}</span></div><div class="draft-base-stats"><span>Vida <b>${c.hp[0]}</b></span><span>Ataque <b>${c.attack[0]}</b></span><span>Alcance <b>${c.range}</b></span></div><details class="draft-skill"><summary>${esc(c.ability.name)}</summary><p>${esc(c.ability.description)}</p><small>${fit.replace ? "Opção de troca: " + characters.find((c) => c.id === fit.replace!.characterId)!.name : "Pode preencher uma vaga."} A entrada na formação é manual.</small></details><button class="primary" data-recruit="${c.id}" ${locked ? "disabled" : ""}>${icon("plus")}Escolher ${c.name}</button><div class="draft-reroll"><button class="outline-button" data-draft-roll="${index}" ${locked || d.rerolled[index] || !draftPool(d.era, s.heroes.map(h=>h.characterId), d.offers).length ? "disabled" : ""} aria-label="Trocar carta ${index + 1}">${icon(d.rerolled[index] ? "check" : "refresh-cw")}${d.rerolled[index] ? "Troca gratuita usada" : "Trocar · grátis"}</button><small>${d.rerolled[index] ? "0 de 1 troca restante nesta carta" : "1 troca por carta · resultado aleatório"}</small></div></article>`;
          })
          .join("")
      : `<section class="draft-empty"><div class="draft-orbit">${icon("sparkles")}</div><p class="eyebrow">O ÂMBAR CARREGA UM CHAMADO</p><h2>${pool.length ? "Quem caminha com você?" : "Sua era está completa."}</h2><p>${pool.length ? "Pague um chamado e receba até três opções únicas. Escolha uma; as outras voltam ao conjunto disponível." : "Avance de era para abrir novas possibilidades."}</p><button class="primary" data-draft-open ${locked || !pool.length || s.amber < draftCost(s.era) ? "disabled" : ""}>${icon("gem")}Abrir draft · ${draftCost(s.era)} âmbar</button>${s.amber < draftCost(s.era) && pool.length ? '<button class="text-button" data-view="battle">Lutar por âmbar →</button>' : ""}</section>`
  }</div>
  <div class="draft-guide"><span>${icon("shield-check")}Sem cópias de guardiões possuídos ou repetidas entre as cartas.</span><span>${icon("refresh-cw")}Uma troca gratuita por carta. O novo guardião é aleatório, sem filtros.</span><span>${icon("crown")}Eras I–V abrem os respectivos conjuntos de personagens.</span></div></div>`;
}
