import type { GameState } from "../game/simulation";
import { characters } from "../data/characters";
import { formationItemPlan, formationItemGoals } from "../game/formationItems";
import { activeArmy, planSignature, ROLE_GUIDE, roleOf } from "../game/armyAdvisor";
import { countTraits, traitStatus } from "../game/synergies";
import { itemById } from "../game/items";
import { componentCost } from "../game/economy";
import { portraitHTML } from "../render/portrait";
import { itemGlyph } from "./itemGlyph";
import { uiIcon as icon, uiEsc as esc } from "./AncestralJourney";

/** Shared by the Arsenal and Council: each button refers to the same reservation plan. */
export function formationItemsPanel(s: GameState, locked: boolean) {
  const party = activeArmy(s), plan = formationItemPlan(s), goals = formationItemGoals(s);
  const signature = esc(planSignature(s));
  const bonds = [...countTraits(party.map(h => h.characterId))]
    .filter(([name, n]) => traitStatus(name, n).tier > 0)
    .sort((a,b) => b[1] - a[1]);
  const cards = plan.map((step, index) => {
    const h = party.find(h => h.uid === step.heroUid)!, c = characters.find(c => c.id === h.characterId)!;
    const item = itemById(step.itemId)!;
    const components = step.bagIndices.map(i => ({id: s.inventory[i], source: "bolsa"}));
    if (step.equippedIndex !== undefined) components.unshift({id: h.items[step.equippedIndex], source: `em ${c.name}`});
    return `<article class="formation-item-card"><div class="formation-item-identity"><button data-item-detail="${item.id}" aria-label="Inspecionar ${item.name}">${itemGlyph(item.id)}</button><div><p class="eyebrow">${step.kind === "equip" ? "PRONTO PARA EQUIPAR" : step.kind === "complete" ? "COMPLETE O ITEM EQUIPADO" : "COMBINAÇÃO RECOMENDADA"}</p><h3>${item.name}</h3><span>${step.kind === "equip" ? "Já está na bolsa" : "Forja com suas peças"} · 0 âmbar</span></div></div><div class="formation-item-recipient">${portraitHTML(c, h.stars)}<div><b>${c.name}</b><small>${ROLE_GUIDE[roleOf(c)].name} · Nv ${h.level} · ${h.stars}★</small></div>${icon("arrow-up-right")}</div><p class="formation-item-reason">${esc(step.reason)}</p>${step.kind !== "equip" ? `<div class="formation-item-formula">${components.map(v => `<span>${itemGlyph(v.id)}<small>${esc(itemById(v.id)!.name)}<em>${esc(v.source)}</em></small></span>`).join('<b>+</b>')}</div>` : ""}<details><summary>Efeito do equipamento</summary><p>${esc(item.text)}</p></details><button class="outline-button" data-formation-item="${index}" data-item-signature="${signature}" ${locked ? "disabled" : ""}>${icon(step.kind === "equip" ? "plus" : "anvil")}${step.kind === "equip" ? "Equipar" : "Combinar e equipar"} em ${c.name}</button></article>`;
  });
  return `<section class="formation-items"><header class="formation-item-heading"><div><p class="eyebrow">ITENS PARA SUA FORMAÇÃO</p><h2>Prepare quem está em campo.</h2><p>${party.length} guardião(ões) · ${bonds.length ? bonds.slice(0,3).map(([name,n]) => `${esc(name)} ${n}`).join(" / ") : "Laços ainda em formação"}</p></div><button class="primary" data-formation-items="${signature}" ${locked || !plan.length ? "disabled" : ""}>${icon("anvil")}Aplicar plano · ${plan.length} ${plan.length === 1 ? "item" : "itens"}</button></header><p class="formation-item-note">As sugestões usam funções, laços ativos, equipamentos e o próximo adversário. Cada peça pertence a uma única receita. Aplicar o plano usa suas peças e equipa os heróis, sem gastar âmbar.</p>${!party.length ? '<div class="formation-item-empty">Leve guardiões ao campo para receber sugestões.<button class="outline-button" data-view="battle">Montar formação</button></div>' : cards.length ? `<div class="formation-item-grid">${cards.slice(0,3).join("")}</div>${cards.length > 3 ? `<details class="formation-item-more"><summary>Ver mais ${cards.length - 3} recomendações do plano</summary><div class="formation-item-grid">${cards.slice(3).join("")}</div></details>` : ""}` : '<p class="formation-item-empty">Nenhum item ou par disponível para equipar agora. As sugestões abaixo mostram as peças que faltam.</p>'}${goals.length ? `<div class="formation-item-goal-heading"><p class="eyebrow">PRÓXIMAS COMBINAÇÕES</p><h3>Uma direção para suas próximas peças.</h3><p>Objetivos alternativos. Escolha um; o plano se atualiza a cada compra.</p></div><div class="formation-item-goals">${goals.map(g => {
    const c = characters.find(c => c.id === party.find(h => h.uid === g.heroUid)!.characterId)!, item = itemById(g.itemId)!;
    return `<article><div><button data-item-detail="${item.id}" aria-label="Inspecionar ${item.name}">${itemGlyph(item.id)}</button><span><b>${item.name}</b><small>Para ${c.name} · faltam ${g.missing.length} ${g.missing.length === 1 ? "peça" : "peças"} · ${g.cost} âmbar</small></span></div><p>${esc(g.reason)}</p><div class="formation-item-missing">${[...new Set(g.missing)].map(id => `<button data-buy-component="${id}" ${locked || s.amber < componentCost(s.era) ? "disabled" : ""} title="${esc(itemById(id)!.text)}">${itemGlyph(id)}<span>Comprar ${itemById(id)!.name}${g.missing.filter(v => v === id).length > 1 ? ' · precisa de 2' : ''}<small>${componentCost(s.era)} âmbar por peça</small></span>${icon("plus")}</button>`).join("")}</div></article>`;
  }).join("")}</div>` : ""}</section>`;
}
