import type { GameState } from "../game/simulation";
import { characters } from "../data/characters";
import { COMPONENTS, ITEMS, RELICS, itemById } from "../game/items";
import { BUILDS, buildTransaction } from "../game/builds";
import { componentCost } from "../game/economy";
import { ROLE_GUIDE, roleOf, itemFit, itemReason } from "../game/armyAdvisor";
import { portraitHTML } from "../render/portrait";
import { itemGlyph } from "./itemGlyph";
import { uiIcon as icon, uiEsc as esc } from "./AncestralJourney";

export function arsenal(
  s: GameState,
  uid: string | null,
  tab: string,
  fighting: boolean,
  buildRole = "",
): string {
  const h = s.heroes.find((h) => h.uid === uid) ?? s.heroes[0],
    c = characters.find((c) => c.id === h.characterId)!,
    role = roleOf(c),
    locked = fighting || s.paused;
  const bag = [...new Set(s.inventory)].map((id) => ({
    id,
    count: s.inventory.filter((v) => v === id).length,
    index: s.inventory.indexOf(id),
  }));
  const chosenRole = Object.hasOwn(ROLE_GUIDE, buildRole) ? buildRole : role;
  const templates = BUILDS.filter((b) => b.role === chosenRole),
    recipes = ITEMS.slice().sort((a, b) => {
      const ready = (d: typeof a) => {
        const pair = d.recipe!,
          i = s.inventory.indexOf(pair[0]);
        return i >= 0 && s.inventory.some((id, j) => j !== i && id === pair[1]);
      };
      return (
        Number(ready(b)) - Number(ready(a)) || itemFit(c, b) - itemFit(c, a)
      );
    });
  const marketplace = `<section class="component-market"><div><h3>Escolha seu componente.</h3><p>Compra garantida · ${componentCost(s.era)} âmbar cada.</p></div><div>${COMPONENTS.map((d) => `<button data-buy-component="${d.id}" ${locked || s.amber < componentCost(s.era) ? "disabled" : ""}>${itemGlyph(d.id)}<b>${d.name}</b><small>${d.text}</small></button>`).join("")}</div></section>`;
  const content =
    tab === "components"
      ? marketplace
      : tab === "builds"
        ? `<div class="build-role-picker"><label for="arsenal-build-role">Função da build</label><select id="arsenal-build-role">${Object.entries(
            ROLE_GUIDE,
          )
            .map(
              ([id, r]) =>
                `<option value="${id}" ${id === chosenRole ? "selected" : ""}>${r.name}</option>`,
            )
            .join(
              "",
            )}</select><small>Explore as 18 builds. O papel do guardião no campo continua sendo ${ROLE_GUIDE[role].name.toLowerCase()}.</small></div><div class="build-grid">${templates
            .map((b) => {
              const transaction = buildTransaction(
                s.era,
                s.inventory,
                h.items,
                b.items,
              )!;
              return `<article class="build-card"><p class="eyebrow">${ROLE_GUIDE[b.role].name}</p><h3>${b.name}</h3><p>${b.text}</p><div class="build-items">${b.items.map((id) => `<button data-item-detail="${id}" title="${esc(itemById(id)!.text)}">${itemGlyph(id)}<span>${itemById(id)!.name}</span></button>`).join("")}</div><div class="build-pieces">${b.items
                .map((id) => {
                  const d = itemById(id)!;
                  return `<span>${d.recipe?.map((id) => itemGlyph(id)).join("<i>+</i>") ?? ""}<small>${d.name}</small></span>`;
                })
                .join(
                  "",
                )}</div><button class="${s.amber >= transaction.cost ? "primary" : "outline-button"}" data-prepare-build="${h.uid}:${b.id}" ${locked || s.amber < transaction.cost ? "disabled" : ""}>${icon("anvil")}${transaction.cost ? "Completar e equipar · " + transaction.cost + " âmbar" : "Equipar build · peças disponíveis"}</button><small>Usa peças existentes, compra as que faltam e devolve os equipamentos anteriores.</small></article>`;
            })
            .join("")}</div>`
        : tab === "recipes"
          ? `<div class="recipe-gallery">${recipes
              .map((d) => {
                const pair = d.recipe!,
                  a = s.inventory.indexOf(pair[0]),
                  b = s.inventory.findIndex(
                    (id, i) => id === pair[1] && i !== a,
                  ),
                  ready = a >= 0 && b >= 0;
                return `<article class="recipe-card ${ready ? "ready" : ""}"><button class="recipe-art" data-item-detail="${d.id}">${itemGlyph(d.id)}</button><div><h3>${d.name}</h3><p>${d.text}</p><small>${itemReason(c, d, s)}</small></div><div class="recipe-formula">${pair.map((id) => itemGlyph(id)).join("<b>+</b>")}</div><button class="outline-button" data-advisor-recipe="${a}:${b}" ${locked || !ready ? "disabled" : ""}>${ready ? "Forjar com a bolsa" : "Faltam componentes"}</button></article>`;
              })
              .join("")}</div>`
          : `<div class="relic-gallery">${RELICS.map((d) => `<article class="relic-card ${s.era < d.era! ? "locked" : ""}"><span class="eyebrow">RELÍQUIA · ERA ${d.era}</span>${itemGlyph(d.id)}<h3>${d.name}</h3><p>${d.text}</p><small>${itemReason(c, d, s)}</small><button class="primary" data-buy-relic="${d.id}" ${locked || s.era < d.era! || s.amber < d.price! ? "disabled" : ""}>${s.era < d.era! ? "Abre na Era " + d.era : "Adquirir · " + d.price + " âmbar"}</button></article>`).join("")}</div>`;
  return `<header class="page-heading"><div><p class="eyebrow">FORJA DO ENCANTO</p><h1>Arsenal da tribo.</h1><p>Uma build muda o papel de um guardião. Escolha sua resposta ao adversário.</p></div><span class="amber-purse">${icon("gem")}<b>${s.amber}</b> âmbar</span></header><div class="arsenal-layout"><aside class="arsenal-loadout"><label for="arsenal-hero">Preparar guardião</label><select id="arsenal-hero">${s.heroes.map((v) => `<option value="${v.uid}" ${v.uid === h.uid ? "selected" : ""}>${characters.find((c) => c.id === v.characterId)!.name} · Nv ${v.level}</option>`).join("")}</select><div class="arsenal-hero-art">${portraitHTML(c, h.stars)}</div><h2>${c.name}<small>${ROLE_GUIDE[role].name}</small></h2><div class="arsenal-slots">${Array.from({ length: 3 }, (_, i) => (h.items[i] ? `<button data-unequip="${h.uid}:${i}" title="Devolver ${itemById(h.items[i])!.name}">${itemGlyph(h.items[i])}<small>${itemById(h.items[i])!.name}</small></button>` : '<span class="empty-slot">+</span>')).join("")}</div><h3>Bolsa · ${s.inventory.length}</h3><div class="arsenal-bag">${bag.map((v) => `<button data-equip-direct="${h.uid}:${v.index}" ${locked || h.items.length >= 3 ? "disabled" : ""} title="${itemById(v.id)!.name}: ${esc(itemById(v.id)!.text)}">${itemGlyph(v.id)}<b>×${v.count}</b></button>`).join("") || "<p>Receba itens em expedições ou compre componentes abaixo.</p>"}</div></aside><section class="arsenal-workbench"><nav class="detail-tabs">${[
    ["builds", "Builds por função"],
    ["recipes", "21 receitas"],
    ["relics", "Relíquias"],
    ["components", "Componentes"],
  ]
    .map(
      ([id, name]) =>
        `<button data-arsenal-tab="${id}" aria-pressed="${tab === id}">${name}</button>`,
    )
    .join("")}</nav>${content}</section></div>`;
}
