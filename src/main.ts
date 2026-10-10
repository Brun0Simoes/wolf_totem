import "./game-shell.css";
import "./tactical-ui.css";
import { draftHall } from "./ui/DraftHall";
import { ritualHall } from "./ui/RitualHall";
import { arsenal } from "./ui/Arsenal";
import { itemGlyph } from "./ui/itemGlyph";
import { ritualCost } from "./game/economy";
import { armyCoach, type CoachTab } from "./ui/ArmyCoach";
import { journeyPage } from "./ui/AncestralJourney";
import {
  type JourneyBranch,
  TRIALS,
  trialProgress,
} from "./game/ancestralJourney";
import {
  armyWarnings,
  ROLE_GUIDE,
  roleOf,
  compositionPlans,
} from "./game/armyAdvisor";
import {
  RitualExperience,
  ritualExperienceMarkup,
} from "./ui/RitualExperience";
import { RITUAL_PLAY } from "./game/ritualPlay";
import type { PracticeId } from "./game/tribe";
import { HERO_PROOFS } from "./game/heroMastery";
import {
  growthBars,
  awakeningMarkup,
  updateGrowthBars,
} from "./ui/heroProgress";
import { environmentPortrait } from "./ui/environment";
import { createIcons, icons } from "lucide";
import { SoundSystem, type Sfx } from "./audio";
import { characters } from "./data/characters";
import { ANIMALITY, ANIMALITY_RULES } from "./data/animality";
import {
  endlessLevel,
  expectedLevel,
  FINAL_STAGE,
  REGIONS,
  STAGES,
  regionOf,
  stageById,
} from "./game/campaign";
import {
  COMPONENTS,
  ITEMS,
  MAX_ITEMS_PER_HERO,
  isComponent,
  itemById,
} from "./game/items";
import { unlockedCost } from "./game/roster";
import {
  ERA_NAMES,
  MEMORIES,
  memoryCost,
  spiritById,
  spiritsOfEra,
  type MemoryId,
  type SpiritId,
} from "./game/spirits";
import { TRAIT_RULES } from "./game/synergies";
import { QUESTS, openQuests, rewardText } from "./game/quests";
import {
  AWAKENING,
  ERA_GROWTH,
  MAX_RITUAL_LEVEL,
  RITUAL_XP,
  ritualXpToNext,
  CURA_NOTE,
  MAX_HERO_LEVEL,
  MAX_PANEMA,
  PRACTICES,
  practiceById,
  xpToNext,
  type Practice,
} from "./game/tribe";
import { project } from "./render/battleArena";
import { allySlotCenter, FORMATION_SLOTS } from "./game/board";
import {
  Game,
  MAX_INVENTORY,
  SKILL_NOTES,
  WONDER_STAGES,
  capacity,
  embersFor,
  getSynergies,
  pendingEra,
  stageUnlocked,
  totemLock,
  type ActionResult,
  type Hero,
} from "./game/simulation";
import type { MotionClip } from "./render/animationModel";
import { CharacterPreview } from "./render/CharacterPreview";
import { assetUrl } from "./render/animationAssets";
import { artFor } from "./render/artSource";
import { portraitHTML } from "./render/portrait";
import { proceduralImage } from "./render/proceduralArt";
import {
  CHARACTER_ANIMAL,
  glyphSVG,
  type AnimalId,
} from "./render/spiritGlyphs";
import { createWorld } from "./render/WorldScene";
import {
  DEFAULT_PREFS,
  loadPrefs,
  motionReduced,
  savePrefs,
  type Prefs,
} from "./prefs";

const preview = new CharacterPreview();
const sound = new SoundSystem();
const SAVE_KEY = "wolf-totem-v1";
/** Set right before a reload that starts a fresh journey, so the title screen is skipped once. */
const FRESH_KEY = "wolf-totem-fresh";
/** Set right before the reload that follows an import, to confirm it afterwards. */
const LOADED_KEY = "wolf-totem-loaded";
let saved: unknown;
try {
  saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
} catch {
  saved = undefined;
}
const journeySeed = crypto.getRandomValues(new Uint32Array(1))[0];
const game = new Game(saved, Date.now(), journeySeed);
const hasJourney = !!saved && typeof saved === "object";
let freshStart = false;
try {
  freshStart = sessionStorage.getItem(FRESH_KEY) === "1";
  sessionStorage.removeItem(FRESH_KEY);
} catch {
  freshStart = false;
}

const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();
const prefs: Prefs = storage ? loadPrefs(storage) : { ...DEFAULT_PREFS };
const systemMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const reducedMotion = () => motionReduced(prefs, systemMotion.matches);
sound.setVolumes(prefs.sfx, prefs.music);
document.documentElement.classList.toggle("reduce-motion", reducedMotion());

let view: "village" | "battle" | "heroes" | "ritual" | "arsenal" = "battle";
let selectedHero: string | null = null;
let villageMode: "paths" | "preparations" = "paths";
let journeyBranch: JourneyBranch = "war";
let journeyKey = "";
let coachTab: CoachTab = "plan";
let coachComposition = "auto";
let arsenalHero: string | null = null;
let arsenalTab = "formation";
let arsenalBuildRole = "";

let coachHero: string | null = null;
let coachTrait = "Caçador";
let selectedItem: number | null = null;
let activeModal = "";
let ritualExperience: RitualExperience | null = null;
let lastBattleStatus = "";
let lastProgress = game.state.progress;
let lastVillage = game.state.era;
let lastEventId = 0;
let repeatTimer = 0;
let confirmAscend = false;
let confirmWipe = false;
let curaHero: string | null = null;
let chosenPractice: PracticeId = "rape";
let tribeTab = "owned";
let heroDetailTab = "growth";
let guardianRenderKey = "";
let tribeQuery = "";
let panelOpen = true;
let inspectedHero: string | null = null;
let awayKey = "";
let coachStateKey = "";
let reportKey: string | null = null;
let confirmNew = false;
let storageFailed = false;
/** While a journey is being erased, nothing may write the old save back. */
let wiping = false;
let titleOpen = !freshStart;

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const icon = (name: string, cls = "") =>
  `<i data-lucide="${name}" class="${cls}"></i>`;
const esc = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const fmt = (value: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(
    Math.floor(value),
  );
const roman = (n: number) => ["I", "II", "III", "IV", "V"][n - 1] ?? String(n);
const refreshIcons = () =>
  createIcons({ icons, attrs: { "stroke-width": 1.6, "aria-hidden": "true" } });
const characterOf = (id: number) => characters.find((c) => c.id === id)!;
const inFight = (h: Hero) =>
  game.battle?.status === "fighting" && game.battle.party.includes(h.uid);
const heroLabel = (h: Hero) =>
  `${characterOf(h.characterId).name} ${"★".repeat(h.stars)} · Nv ${h.level}${h.panema ? ` · panema ${h.panema}` : ""}`;
const itemChip = (id: string, attrs = "", extra = "") => {
  const item = itemById(id)!;
  return `<button class="item-chip ${item.kind}${extra}" style="--item:${item.color}" title="${esc(`${item.name}: ${item.text}`)}" ${attrs}>${itemGlyph(id)}<span class="item-name">${esc(item.name)}</span></button>`;
};
const spiritGlyph = (id: SpiritId, label = true) => {
  const spirit = spiritById(id)!;
  return glyphSVG(
    spirit.animal as AnimalId,
    spirit.color,
    label ? spirit.name : "",
  );
};

$("#app").innerHTML = `
 <div class="app-frame">
  <nav class="rail" aria-label="Navegação principal">
   <button class="brand" data-action="title-show" aria-label="Wolf Totem, início">${glyphSVG("wolf", "#e7c28b", "")}<span>WOLF<br><b>TOTEM</b></span></button>
   <div class="nav-group">
    <button class="nav-button" data-view="battle">${icon("swords")}<span>Campo</span></button>
    <button class="nav-button" data-view="heroes">${icon("users")}<span>Guardiões</span><i id="proof-notice" hidden></i></button>
    <button class="nav-button" data-view="ritual">${icon("flame")}<span>Rituais</span></button>
    <button class="nav-button" data-view="arsenal">${icon("anvil")}<span>Arsenal</span></button>
    <button class="nav-button" data-view="village">${icon("compass")}<span>Jornada</span></button>
   </div>
   <div class="rail-bottom"><button class="icon-button" data-action="codex" aria-label="Códice dos espíritos">${icon("book-open")}</button><button class="icon-button" data-action="help" aria-label="Como jogar">${icon("circle-help")}</button><span id="rail-era">I</span></div>
  </nav>
  <div class="app-body">
   <header class="topbar"><div class="chapter"><span class="live-dot"></span><span>O DESPERTAR DA TRIBO</span><button data-action="map">Campanha <b id="metric-campaign">0 / 30</b>${icon("chevron-down")}</button></div>
    <div class="journey-metrics"><button id="era-action" class="era-action" data-action="village-upgrade" title="Avançar era">Era <strong id="metric-era">I</strong>${icon("sparkles")}</button><span class="amber-purse compact" title="Recurso de combate para drafts, rituais e itens">${icon("gem")}<strong id="res-amber">80</strong></span><span id="embers-chip" hidden>Brasas <strong id="res-embers">0</strong></span><span id="metric-army" hidden></span></div>
    <div class="header-actions"><button class="icon-button" data-action="audio" aria-label="Ativar sons">${icon("volume-x")}</button><button class="icon-button" data-action="pause" aria-label="Pausar jogo">${icon("pause")}</button><button class="icon-button" data-action="settings" aria-label="Configurações e salvamento">${icon("settings-2")}</button></div>
   </header>
   <main class="main-area">
    <section class="battle-page">
     <header class="page-heading"><div><p class="eyebrow" id="era-label"></p><h1 id="world-title"></h1><p id="world-subtitle"></p></div><button class="outline-button" data-action="map">${icon("map")}Escolher expedição</button></header>
     <div class="play-area"><section class="world-wrap" aria-label="Campo de batalha">
      <div class="arena-top"><span class="world-badge"><span class="live-dot"></span><span id="world-badge-text">Preparação</span></span><button class="text-button" data-action="formation">${icon("move")}Posicionar</button></div>
      <div id="world"></div>
      <div class="world-caption"><span id="world-hint"></span><span class="map-coordinate">CLAREIRA DO LOBO</span></div>
      <div id="power-bar" class="power-bar" hidden></div>
      <div id="pause-overlay" class="pause-overlay" hidden><span>${icon("pause")}Jornada pausada</span><button class="primary" data-action="pause">Retomar</button></div>
      <div id="battle-result" class="battle-result" hidden></div>
     </section><aside class="side-panel" id="side-panel" aria-label="Plano da expedição"></aside></div>
     <section class="camp-section"><div class="section-heading"><h2 id="camp-title">Sua formação</h2><button class="text-button" data-action="tribe" id="reroll">Ver guardiões ${icon("arrow-right")}</button></div><div id="camp-content"></div></section>
    </section>
    <section id="guardian-hall" hidden aria-label="Guardiões"></section>
    <section id="ritual-hall" hidden aria-label="Rituais"></section>
    <section id="arsenal-hall" hidden aria-label="Arsenal"></section>
    <section class="journey-page" hidden><nav id="journey-toolbar" class="ancestral-toolbar" aria-label="Atividades da jornada"><div><button data-journey-tab="paths">${icon("route")}Legados</button><button data-journey-tab="preparations">${icon("sparkles")}Bênçãos</button><button data-view="arsenal">${icon("anvil")}Arsenal</button><button data-action="ancestors">${icon("landmark")}Grande Totem</button></div></nav><div id="journey-objective" class="journey-objective"></div><section id="ancestral-hall"></section></section>
   </main>
   <footer><span id="save-status">Progresso salvo neste navegador</span><button class="text-button" data-action="journal">${icon("scroll-text")}Diário da tribo</button><span>WOLF TOTEM · 3.3</span></footer>
  </div>
 </div>
 <div id="toast" class="toast" role="status" aria-live="polite"></div>
 <div id="title-screen" class="title-screen" role="dialog" aria-modal="true" aria-labelledby="title-name" ${titleOpen ? "" : "hidden"}></div>
 <dialog id="modal"><div id="modal-content"></div></dialog>
 <input id="save-file" type="file" accept="application/json,.json" hidden />`;

const world = createWorld(
  $("#world"),
  game,
  {
    onHero(uid) {
      selectedHero = uid;
      panelOpen = true;
      renderCamp();
      renderSide();
    },
    onMove(uid, slot) {
      selectedHero = uid;
      act(game.deploy(uid, slot), "click");
    },
    onSlot(slot) {
      if (!selectedHero)
        return toast("Escolha um herói abaixo e depois uma posição.");
      act(game.deploy(selectedHero, slot), "click");
    },
  },
  { reducedMotion: reducedMotion(), numbers: prefs.numbers },
);

let toastTimer = 0;
function toast(message: string) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(
    () => $("#toast").classList.remove("show"),
    3500,
  );
}
function save() {
  if (wiping) return;
  try {
    localStorage.setItem(SAVE_KEY, game.serialize());
    storageFailed = false;
  } catch {
    storageFailed = true;
  }
  $("#save-status").textContent = storageFailed
    ? "Salvamento indisponível · exporte sua jornada"
    : game.state.paused
      ? "Jornada pausada"
      : "Progresso salvo neste navegador";
}
function act(result: ActionResult, sfx: Sfx = "upgrade") {
  toast(result.message);
  if (result.ok) {
    sound.play(sfx);
    save();
  }
  renderAll();
}
function setView(next: typeof view) {
  if (activeModal) closeModal();
  if (next !== "heroes") preview.clear();
  view = next;
  if (next === "heroes") guardianRenderKey = "";
  selectedItem = null;
  sound.mood = next === "battle" ? "battle" : "village";
  world.setView(next === "battle" ? "battle" : "village");
  renderAll();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function renderMetrics() {
  $("#res-amber").textContent = fmt(game.state.amber);
  const journeyState = JSON.stringify([
    game.state.journey,
    game.state.stats,
    game.state.era,
    game.state.progress,
    game.state.heroes.map((h) => [
      h.uid,
      h.away?.until,
      h.slot,
      h.level,
      h.ritualLevel,
    ]),
    game.state.paused,
    game.battle?.status,
  ]);
  if (journeyState !== journeyKey) {
    journeyKey = journeyState;
    if (view === "village") renderVillageSide();
  }
  $("#metric-era").textContent = roman(game.state.era);
  const eraButton = $<HTMLButtonElement>("#era-action"),
    need = ERA_GROWTH[game.state.era - 1],
    pending = pendingEra(game.state);
  eraButton.dataset.action = pending ? "spirit-choice" : "village-upgrade";
  const canAdvance =
    !!pending ||
    (!!need &&
      game.state.heroes.some(
        (h) => h.level >= need.level && h.ritualLevel >= need.ritualLevel,
      ));
  eraButton.disabled =
    !canAdvance || game.state.paused || game.battle?.status === "fighting";
  eraButton.classList.toggle("ready", canAdvance);
  eraButton.title = pending
    ? "Escolher espírito protetor"
    : need
      ? `Próxima era: um guardião com experiência ${need.level} e ritualística ${need.ritualLevel}`
      : "Era dos Ancestrais alcançada";
  $("#metric-campaign").textContent = `${game.state.progress} / 30`;
  $("#metric-army").textContent =
    `${game.state.heroes.filter((h) => h.slot !== null && !h.away).length} / ${capacity(game.state)}`;
  $("#embers-chip").hidden = !game.state.embers && !game.state.rebirths;
  document.querySelector('.nav-button[data-view="village"]')?.classList.toggle(
    "has-reward",
    openQuests(game.state).some((q) => q.done(game.state)),
  );
  updateGrowthBars(game.state.heroes);
  $("#proof-notice").hidden = !game.state.heroes.some((h) =>
    HERO_PROOFS.some(
      (p) =>
        !h.mastery.claimed.includes(p.id) && p.progress(h.mastery) >= p.goal,
    ),
  );
  $("#res-embers").textContent = fmt(game.state.embers);
  $("#pause-overlay").hidden = !game.state.paused;
  const pause = $('[data-action="pause"]');
  if (pause.dataset.paused !== String(game.state.paused)) {
    pause.dataset.paused = String(game.state.paused);
    pause.innerHTML = icon(game.state.paused ? "play" : "pause");
    pause.setAttribute(
      "aria-label",
      game.state.paused ? "Retomar jogo" : "Pausar jogo",
    );
    refreshIcons();
  }
  updateCostButtons();
  // Changes to hero progression refresh cards and open panels.
  const away =
    game.state.heroes
      .map(
        (h) =>
          `${h.uid}:${h.away?.until ?? ""}:${h.level}:${h.ritualLevel}:${h.stars}:${h.panema}:${h.integrationWins}:${game.state.clock >= h.ritualReadyAt}`,
      )
      .join("|") + `|${game.state.cacao}`;
  if (away !== awayKey) {
    const first = awayKey === "";
    awayKey = away;
    if (!first) {
      renderCamp();
      renderSide();
      if (activeModal === "hunts") showHunts();
      if (activeModal === "cura") showCura();
      if (view === "heroes" && !activeModal) renderGuardians();
      if (view === "ritual" && !activeModal) showCura();
      if (activeModal === "army-coach") showArmyCoach();
    }
  }
  const last = game.state.reports.at(-1),
    key = last ? `${last.clock}:${last.uid}` : "";
  if (reportKey !== null && key !== reportKey && last) {
    toast(`${last.name} ${last.text}`);
    sound.play(last.ok ? "recruit" : "defeat");
  }
  reportKey = key;
  const bag = document.querySelector<HTMLElement>("#bag-count");
  if (bag) bag.textContent = `${game.state.inventory.length}/${MAX_INVENTORY}`;
  renderPowers();
  if (activeModal === "army-coach" && coachStateKey !== armyContextKey())
    showArmyCoach();
}

function objective(): { title: string; text: string } {
  const s = game.state;
  if (pendingEra(s))
    return {
      title: "Uma nova era desperta.",
      text: "Escolha o Espírito Protetor desta era para receber seu poder.",
    };
  if (s.era === 1 && s.progress >= 4)
    return {
      title: "Cresça antes do Alfa.",
      text: "Aprofunde XP e vínculo ritual: uma vaga a mais na formação e novos companheiros.",
    };
  if (s.progress < FINAL_STAGE) {
    const next = stageById(s.progress + 1)!,
      region = regionOf(next.id);
    if (region.village > s.era)
      return {
        title: `${region.name} aguarda.`,
        text: `Alcance a Era ${region.village} para entrar nesta região.`,
      };
    return {
      title: `Expedição ${region.id}·${next.index}: ${next.name}.`,
      text:
        next.index === 5
          ? `Chefe: ${region.boss}. Prepare sua melhor formação.`
          : region.subtitle,
    };
  }
  if (s.wonder < WONDER_STAGES)
    return {
      title: "Erga o Grande Totem.",
      text: `Parte ${s.wonder + 1} de ${WONDER_STAGES}. Ao completá-lo, a tribo pode renascer mais forte.`,
    };
  return {
    title: "Os ancestrais chamam.",
    text: "Renasça no Totem para ganhar brasas, ou aprofunde a Caçada Eterna.",
  };
}

/** The next journal objective, or the general next step once the journal is complete. */
function journalHTML(goal: { title: string; text: string }): string {
  const quest = openQuests(game.state)[0];
  const done = QUESTS.length - openQuests(game.state).length;
  if (!quest)
    return `<div class="objective"><span class="objective-symbol">${icon("compass")}</span><div><small>O PRÓXIMO PASSO</small><strong>${esc(goal.title)}</strong><p>${esc(goal.text)}</p></div></div>`;
  const ready = quest.done(game.state);
  return `<div class="objective journal ${ready ? "ready" : ""}"><span class="objective-symbol">${icon(ready ? "gift" : "scroll-text")}</span><div>
   <small>DIÁRIO DA TRIBO · ${done}/${QUESTS.length}</small><strong>${esc(quest.title)}</strong><p>${esc(quest.hint)}</p>
   <p class="quest-reward">${icon("gift")} ${esc(rewardText(quest.reward))}</p>
   <div class="quest-actions">${ready ? `<button class="primary compact" data-quest="${quest.id}">Receber recompensa</button>` : ""}<button class="text-button" data-action="journal">Ver diário ${icon("arrow-right")}</button></div></div></div>`;
}

function showJournal() {
  const open = openQuests(game.state),
    next = open[0]?.id;
  showModal(
    "journal",
    `<p class="eyebrow">DIÁRIO DA TRIBO</p><h2>Os caminhos da tribo</h2><p class="modal-intro">Objetivos em ordem: os primeiros ensinam o jogo, os últimos apontam o próximo grande marco. As recompensas recebidas valem para sempre, mesmo depois de um renascimento.</p>
   <ol class="journal-list">${QUESTS.map((q) => {
     const claimed = game.state.quests.includes(q.id),
       ready = !claimed && q.done(game.state);
     return `<li class="${claimed ? "claimed" : ready ? "ready" : q.id === next ? "current" : ""}"><span class="quest-mark">${claimed ? icon("check") : ready ? icon("gift") : ""}</span><div><b>${esc(q.title)}</b><p>${esc(q.hint)}</p><small>${icon("gift")} ${esc(rewardText(q.reward))}</small></div>${ready ? `<button class="primary compact" data-quest="${q.id}">Receber</button>` : ""}</li>`;
   }).join("")}</ol>`,
  );
}

function renderArsenal() {
  $("#arsenal-hall").innerHTML = arsenal(
    game.state,
    arsenalHero,
    arsenalTab,
    game.battle?.status === "fighting",
    arsenalBuildRole,
  );
  refreshIcons();
}

function renderSide() {
  document.body.dataset.view = view;
  document.querySelector<HTMLElement>(".battle-page")!.hidden =
    view !== "battle";
  document.querySelector<HTMLElement>(".journey-page")!.hidden =
    view !== "village";
  $("#guardian-hall").hidden = view !== "heroes";
  $("#ritual-hall").hidden = view !== "ritual";
  $("#arsenal-hall").hidden = view !== "arsenal";
  $("#journey-objective").innerHTML = journeyObjective();
  if (view === "village") renderVillageSide();
  if (view === "heroes") renderGuardians();
  if (view === "arsenal") renderArsenal();
  if (view === "ritual" && !activeModal) showCura();
  if (view === "battle") renderBattleSide();
  refreshIcons();
  renderMetrics();
}

function renderVillageSide() {
  $("#ancestral-hall").innerHTML = journeyPage(
    game.state,
    villageMode,
    journeyBranch,
  );
  document
    .querySelectorAll<HTMLElement>("[data-journey-tab]")
    .forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.journeyTab === villageMode),
      ),
    );
  refreshIcons();
}

function encounter() {
  const b = game.battle;
  if (b) {
    const units = b.entities
      .filter((e) => e.team === "enemy" && !e.summon)
      .map((e) => ({ id: e.characterId, stars: e.stars, boss: e.boss }));
    return {
      id: b.stage,
      name: b.name,
      region:
        b.stage > 0
          ? regionOf(b.stage)
          : b.stage < 0
            ? regionOf(Math.max(1, b.region * 5))
            : null,
      index: b.stage > 0 ? stageById(b.stage)!.index : 0,
      units,
      depth: b.depth,
      raid: b.stage < 0,
    };
  }
  const { stage, depth } = game.nextStage();
  return {
    id: stage.id,
    name: stage.name,
    region: stage.id ? regionOf(stage.id) : null,
    index: stage.index,
    units: stage.units,
    depth,
    raid: false,
  };
}

function enemyPreview(): string {
  const stage = encounter();
  return `<div class="enemy-preview">${stage.units.map((u) => `<span class="enemy-chip ${u.boss ? "boss" : ""}" title="${characterOf(u.id).name} ${"★".repeat(u.stars)}${u.boss ? " · chefe" : ""}">${glyphSVG(CHARACTER_ANIMAL[u.id], u.boss ? "#e3b46b" : "#d0a38a")}<b>${"★".repeat(u.stars)}</b></span>`).join("")}</div>`;
}

function renderBattleSide() {
  const s = game.state,
    stage = encounter(),
    fighting = game.battle?.status === "fighting";
  const party = s.heroes.filter((h) => h.slot !== null && !h.away),
    syn = getSynergies(s);
  $("#side-panel").innerHTML =
    `<div class="tactical-header"><span class="eyebrow">CONSELHO DE GUERRA</span>${icon("swords")}</div>
   <h2>${fighting ? "A tribo avança." : "Prepare o chamado."}</h2><p class="muted">${fighting ? "Use os poderes dos protetores no campo." : "Posições, laços e equipamentos fazem a diferença."}</p>
   <div class="tactical-enemy"><span>Adversários · nível ${Math.round(expectedLevel(stage.id || endlessLevel(stage.depth)))}</span>${enemyPreview()}</div>
   <div class="formation-count"><span>No campo</span><strong>${party.length}<small> / ${capacity(s)}</small></strong></div>
   <div class="synergies"><p class="eyebrow">LAÇOS ATIVOS</p>${
     syn
       .filter((t) => t.active)
       .map(
         (t) =>
           `<button class="synergy active" data-coach-trait="${esc(t.name)}" title="${esc(t.description)}">${icon("diamond")}<span>${esc(t.name)}</span><b>${t.count}</b></button>`,
       )
       .join("") ||
     '<p class="muted">Acolha companheiros com características em comum.</p>'
   }</div>
   ${!fighting ? `<button class="outline-button" data-action="army-coach">${icon("wand-sparkles")}Recomendar formação</button><div class="tactical-tip">${icon("lightbulb")}<p>${esc(armyWarnings(s, stage.id)[0] ?? "Confira os itens e escolha até duas bênçãos na Jornada.")}</p></div>` : ""}
   <div class="battle-controls"><button class="primary" data-action="battle-start" ${!party.length || game.battle !== null || s.paused || !stageUnlocked(s, s.selectedStage) ? "disabled" : ""}>${icon(fighting ? "swords" : "play")}${fighting ? "Em combate" : "Iniciar expedição"}</button><div class="control-row"><button class="outline-button" data-action="speed" aria-label="Velocidade do combate, ${s.settings.speed} vezes">${icon("fast-forward")}${s.settings.speed}×</button><button class="outline-button" data-action="auto-repeat" aria-pressed="${s.settings.autoRepeat}">${icon("repeat")}Repetir</button></div></div>
   <button class="text-button" data-view="heroes">${icon("sparkles")}Evoluir guardiões ${icon("arrow-right")}</button>`;
}

function renderPowers() {
  const bar = $("#power-bar"),
    battle = game.battle;
  const show = view === "battle" && game.state.spirits.length > 0;
  bar.hidden = !show;
  if (!show) return;
  const key = `${battle?.status ?? "none"}|${battle?.powersUsed.join(",") ?? ""}|${game.state.spirits.join(",")}|${game.state.paused}`;
  if (bar.dataset.key === key) return;
  bar.dataset.key = key;
  bar.innerHTML = `<span class="power-label">PODERES</span>${game.state.spirits
    .map((id) => {
      const spirit = spiritById(id)!,
        used = battle?.powersUsed.includes(id) ?? false;
      return `<button class="power-button ${used ? "used" : ""}" data-power="${id}" ${battle?.status !== "fighting" || used || game.state.paused ? "disabled" : ""} title="${esc(`${spirit.power.name}: ${spirit.power.text}`)}" style="--spirit:${spirit.color}">${spiritGlyph(id, false)}<span>${esc(spirit.power.name)}</span></button>`;
    })
    .join("")}`;
}

function heroStatus(h: Hero): string {
  if (h.slot !== null) return `Posição ${h.slot + 1}`;
  return "Reserva";
}

function renderCamp() {
  const party = game.state.heroes.filter((h) => h.slot !== null);
  $("#camp-title").textContent =
    `Sua formação · ${party.length}/${capacity(game.state)}`;
  $("#camp-content").innerHTML =
    `<div class="hero-dock">${party.map((h) => `<button class="dock-hero ${h.uid === selectedHero ? "selected" : ""} ${h.away ? "away" : ""}" data-hero="${h.uid}" draggable="${!h.away}" data-drag-hero="${h.uid}" aria-label="Selecionar ${characterOf(h.characterId).name}">${portraitHTML(characterOf(h.characterId), h.stars)}<span><b>${characterOf(h.characterId).name}</b><small>${"★".repeat(h.stars)} <em>Nv ${h.level} · Rito ${h.ritualLevel}</em></small></span></button>`).join("")}<button class="dock-add" data-action="formation">${icon("plus")}<span>Organizar</span></button></div>`;
}

function showTribe(tab = tribeTab, query = tribeQuery) {
  tribeTab = tab;
  tribeQuery = query;
  if (view !== "heroes") setView("heroes");
  else renderGuardians(true);
}
function showHero(uid: string) {
  inspectedHero = uid;
  tribeTab = "owned";
  if (view !== "heroes") setView("heroes");
  else {
    if (activeModal) closeModal();
    renderGuardians(true);
  }
}
function renderGuardians(force = false) {
  const s = game.state;
  const h = s.heroes.find((h) => h.uid === inspectedHero) ?? s.heroes[0];
  inspectedHero = h.uid;
  const key = JSON.stringify([
    h,
    s.heroes,
    s.era,
    s.inventory,
    s.amber,
    s.draft,
    s.paused,
    game.battle?.status,
    tribeTab,
    tribeQuery,
    heroDetailTab,
    s.clock < h.ritualReadyAt,
  ]);
  if (!force && key === guardianRenderKey) return;
  guardianRenderKey = key;
  if (tribeTab !== "owned") {
    preview.clear();
    $("#guardian-hall").innerHTML = draftHall(
      s,
      game.battle?.status === "fighting",
    );
    refreshIcons();
    return;
  }
  const c = characterOf(h.characterId),
    guide = ROLE_GUIDE[roleOf(c)];
  const list = characters
    .filter(
      (c) =>
        tribeTab !== "owned" || s.heroes.some((h) => h.characterId === c.id),
    )
    .filter((c) =>
      `${c.name} ${c.traits.join(" ")}`
        .toLocaleLowerCase("pt-BR")
        .includes(tribeQuery.toLocaleLowerCase("pt-BR")),
    );
  const owned = s.heroes.length,
    ready = HERO_PROOFS.filter(
      (p) =>
        !h.mastery.claimed.includes(p.id) && p.progress(h.mastery) >= p.goal,
    ).length;
  $("#guardian-hall").innerHTML =
    `<header class="page-heading"><div><p class="eyebrow">CADA ESPÍRITO TEM UM CAMINHO</p><h1>Seus guardiões.</h1><p>Aprenda lutando. Aprofunde o vínculo. Desperte uma nova forma.</p></div><span class="collection-count"><b>${owned}</b> / 55 acolhidos</span></header>
  <div class="guardian-workspace"><section class="guardian-library"><div class="segmented"><button data-tribe-tab="owned" aria-pressed="${tribeTab === "owned"}">Sua tribo</button><button data-tribe-tab="catalog" aria-pressed="${false}">Draft de guardiões</button></div><label class="search">${icon("search")}<input id="tribe-search" aria-label="Buscar companheiro" placeholder="Nome ou laço" value="${esc(tribeQuery)}"></label><div class="guardian-grid">${
    list
      .map((ch) => {
        const member = s.heroes.find((h) => h.characterId === ch.id),
          req = [1, 2, 3, 5, 7][ch.cost - 1],
          open = ch.cost <= s.era && s.heroes.some((h) => h.ritualLevel >= req);
        return `<article class="guardian-card ${member?.uid === h.uid ? "selected" : ""}"><button class="guardian-art" data-inspect="${member!.uid}" aria-label="Ver ${ch.name}">${portraitHTML(ch, member!.stars)}<span>${"★".repeat(member!.stars)}</span></button><div><h3>${ch.name}</h3><small>Nv ${member!.level} · Rito ${member!.ritualLevel}</small></div></article>`;
      })
      .join("") || '<p class="empty-state">Nenhum guardião encontrado.</p>'
  }</div></section>
  <section class="guardian-detail"><div class="guardian-showcase"><span class="hero-role">${icon("shield")}${guide.name}</span><div class="spirit-orbit" aria-hidden="true"></div><canvas id="guardian-preview" width="640" height="560" role="img" aria-label="${c.name}, animação de ${h.stars} ${h.stars === 1 ? "estrela" : "estrelas"}"></canvas><div class="guardian-identity"><p class="eyebrow">${"★".repeat(h.stars)} · ${esc(c.title)}</p><h2>${c.name}</h2><div class="trait-chips">${c.traits.map((t) => `<button data-coach-trait="${esc(t)}">${esc(t)}</button>`).join("")}</div><p>${heroStatus(h)}</p><div class="preview-actions"><button data-motion="idle" aria-pressed="true">Repouso</button><button data-motion="cast" aria-pressed="false">Habilidade</button><button data-character="${c.id}" data-stars="${h.stars}" aria-label="Todos os movimentos de ${c.name}">${icon("expand")}</button></div></div></div>
  <div class="guardian-growth"><nav class="detail-tabs" aria-label="Caminho do guardião">${[
    ["growth", "Evolução"],
    ["proofs", `Provas${ready ? " · " + ready : ""}`],
    ["equipment", "Equipar"],
  ]
    .map(
      ([id, label]) =>
        `<button data-hero-tab="${id}" aria-pressed="${heroDetailTab === id}">${label}</button>`,
    )
    .join("")}</nav>
   ${
     heroDetailTab === "growth"
       ? `<p class="eyebrow">DOIS CAMINHOS, UM DESPERTAR</p>${growthBars(h)}${awakeningMarkup(h)}<div class="next-action"><span>${icon("swords")}</span><div><h3>Seu próximo passo</h3><p>Ganhe XP com expedições e provas. Invista âmbar em rituais para fortalecer a segunda barra.</p></div></div><div class="hero-action-row"><button class="primary" data-hero-tab="proofs">${icon("target")}Ver provas pessoais</button><button class="outline-button" data-ritual-hero="${h.uid}" ${h.away || inFight(h) ? "disabled" : ""}>${icon("flame")}Conduzir ritual</button><button class="text-button" data-view="battle">${icon("swords")}Ir para o campo</button></div>`
       : heroDetailTab === "proofs"
         ? `<div class="proof-heading"><h3>Aprenda fazendo.</h3><p>Oito provas por guardião. Recompensas únicas, recebidas por ele.</p></div><div class="proof-list">${HERO_PROOFS.map(
             (p) => {
               const claimed = h.mastery.claimed.includes(p.id),
                 progress = Math.min(p.goal, p.progress(h.mastery)),
                 done = progress >= p.goal;
               return `<article class="hero-proof ${claimed ? "claimed" : done ? "ready" : ""}"><span class="proof-icon">${icon(claimed ? "check" : p.icon)}</span><div><h4>${p.name}</h4><p>${p.text}</p><progress max="${p.goal}" value="${progress}" aria-label="${p.name} de ${c.name}"></progress><small>${progress}/${p.goal} · +${fmt(p.xp)} XP</small></div><button class="${done && !claimed ? "primary" : "outline-button"}" data-proof="${h.uid}:${p.id}" ${done && !claimed && !s.paused && game.battle?.status !== "fighting" ? "" : "disabled"}>${claimed ? "Recebida" : done ? "Receber" : "Em curso"}</button></article>`;
             },
           ).join("")}</div>`
         : `<h3>Preparado para a batalha.</h3><p>${guide.description}</p><div class="equipment-slots">${h.items.map((id, i) => itemChip(id, `data-unequip="${h.uid}:${i}"`)).join("")}${Array.from({ length: 3 - h.items.length }, () => '<span class="empty-slot">+</span>').join("")}</div><h4>Sua bolsa · ${s.inventory.length}/${MAX_INVENTORY}</h4><div class="bag-items">${s.inventory.map((id, i) => itemChip(id, `data-equip-direct="${h.uid}:${i}"`)).join("") || '<p class="empty-state">Expedições e provas da jornada trazem equipamentos.</p>'}</div><button class="primary" data-arsenal-hero="${h.uid}">${icon("anvil")}Abrir builds no Arsenal</button><button class="text-button" data-formation-hero="${h.uid}">Ajustar posição no campo ${icon("arrow-right")}</button>`
   }
  </div></section></div>`;
  preview.clear();
  preview.select("idle");
  const sheet = artFor(c, h.stars).sheet;
  if (sheet)
    preview.mount(
      $<HTMLCanvasElement>("#guardian-preview"),
      c.id,
      h.stars,
      sheet,
    );
  refreshIcons();
}

function showFormation(uid = selectedHero ?? game.state.heroes[0]?.uid) {
  const s = game.state;
  if (s.heroes.find((h) => h.uid === uid)?.away)
    uid = s.heroes.find((h) => !h.away)?.uid ?? "";
  selectedHero = uid || null;
  showModal(
    "formation",
    `<h2>Prepare a expedição</h2><p class="modal-intro">Escolha um herói e toque em uma casa. Uma casa ocupada troca os dois companheiros de posição. No computador, você também pode arrastar os retratos para o campo.</p><div class="formation-layout"><div class="formation-roster">${s.heroes.map((h) => `<button data-formation-hero="${h.uid}" aria-pressed="${h.uid === uid}" ${h.away ? "disabled" : ""}>${portraitHTML(characterOf(h.characterId), h.stars)}<span>${characterOf(h.characterId).name}<small>${h.slot !== null ? `Casa ${h.slot + 1}` : "Reserva"}</small></span></button>`).join("")}</div><div><div class="formation-guidance"><span>Frente: Guardiões e Brigões.</span><span>Retaguarda: Caçadores, Místicos, Xamãs e Invocadores.</span></div><div class="formation-grid" role="group" aria-label="Casas da formação">${Array.from(
      { length: FORMATION_SLOTS },
      (_, slot) => {
        const h = s.heroes.find((h) => h.slot === slot);
        return `<button class="${slot < 7 ? "front-line" : "rear-line"}" data-place-slot="${slot}" aria-label="Casa ${slot + 1}${h ? `, ${characterOf(h.characterId).name}` : ", vazia"}"><small>${slot + 1}</small>${h ? portraitHTML(characterOf(h.characterId), h.stars) : icon("plus")}</button>`;
      },
    ).join(
      "",
    )}</div><div class="formation-actions"><button class="outline-button" data-action="army-coach">Entender classes e sinergias</button><button class="primary" data-action="auto-formation">${icon("wand-sparkles")}Organizar por função</button>${uid ? `<button class="outline-button" data-bench="${uid}">Mover para reserva</button>` : ""}<button class="outline-button" data-action="formation-done">Voltar ao campo</button></div><p class="muted">Frente nas primeiras casas; atiradores e místicos nas fileiras de trás.</p></div></div>`,
  );
}

function renderAll() {
  if (selectedHero && !game.state.heroes.some((h) => h.uid === selectedHero))
    selectedHero = null;
  if (selectedItem !== null && selectedItem >= game.state.inventory.length)
    selectedItem = null;
  document
    .querySelectorAll<HTMLButtonElement>(".nav-button[data-view]")
    .forEach((n) => n.classList.toggle("active", n.dataset.view === view));
  const s = game.state,
    stage = encounter();
  document.body.dataset.view = view;
  $("#journey-objective").innerHTML = journeyObjective();
  $("#rail-era").textContent = roman(s.era);
  $("#era-label").textContent =
    view === "village"
      ? `ERA ${ERA_NAMES[s.era - 1].toUpperCase()}`
      : stage.raid
        ? "DEFESA DA ALDEIA"
        : `EXPEDIÇÕES · ${stage.region ? stage.region.name.toUpperCase() : "CAÇADA ETERNA"}`;
  $("#world-title").textContent =
    view === "village" ? "Clareira do Lobo" : stage.name + ".";
  $("#world-subtitle").textContent =
    view === "village"
      ? "Escolha legados e bênçãos para aprofundar a jornada."
      : stage.raid
        ? "Saqueadores rondam as cabanas. A tribo se prepara para o encontro."
        : stage.region
          ? stage.region.subtitle
          : "Feras cada vez mais fortes. Até onde a tribo chega?";
  $("#world-badge-text").textContent =
    view === "village"
      ? "Clareira do Lobo"
      : game.battle?.status === "fighting"
        ? `Em combate · ${s.settings.speed}×`
        : "Preparação";
  $("#world-hint").textContent =
    "Selecione um herói abaixo e uma posição no campo.";
  renderSide();
  renderCamp();
  renderMetrics();
  renderResult();
}

function renderResult() {
  const b = game.battle,
    el = $("#battle-result");
  el.hidden = !b || b.status === "fighting" || view !== "battle";
  if (el.hidden || !b) return;
  const victory = b.status === "victory";
  const repeating = victory && game.state.settings.autoRepeat;
  el.innerHTML = `<span class="result-icon">${icon(victory ? "crown" : "shield")}</span><p class="eyebrow">${victory ? (b.firstClear ? "PRIMEIRA VITÓRIA" : "A TRIBO PERMANECE") : "OS ESPÍRITOS ENSINAM"}</p><h2>${victory ? (b.stage < 0 ? "A aldeia está a salvo." : b.stage === 0 ? `Profundidade ${b.depth} vencida.` : "Uma nova conquista.") : b.stage < 0 ? "Os saqueadores escaparam." : "É hora de reagrupar."}</h2>
   <p>${victory ? `${esc(b.name)} concluída. Sua tribo recebe XP e equipamentos da jornada.` : "Evolua heróis, troque itens, busque sinergias ou use os poderes espirituais."}</p>
   ${b.loot.length ? `<div class="loot">${b.loot.map((id) => itemChip(id)).join("")}</div>` : ""}
   <p class="amber-reward">${icon("gem")}+${b.amber} âmbar</p>
   ${b.xp ? `<p class="xp-line">${icon("sparkles")}+${b.xp} XP para cada herói${b.levelUps.length ? ` · <b>${b.levelUps.map(esc).join(", ")}</b>` : ""}</p>` : ""}
   ${victory ? `<button class="text-button" data-action="tribe">${icon("target")}Conferir provas dos guardiões ${icon("arrow-right")}</button>` : ""}${summaryHTML(b)}
   ${repeating ? `<p class="small muted">${icon("repeat")} Repetindo automaticamente…</p>` : ""}
   <div class="result-actions"><button class="outline-button" data-action="battle-dismiss">${b.stage < 0 ? "Voltar à aldeia" : victory ? "Voltar à preparação" : "Preparar novamente"}</button>${victory && b.stage >= 0 ? `<button class="primary" data-action="battle-again">${b.stage === 0 ? "Mais fundo" : game.state.selectedStage === b.stage ? "Repetir" : "Próxima expedição"}${icon("arrow-right")}</button>` : ""}</div>`;
  refreshIcons();
}

/** TFT-style recap: who dealt, absorbed and healed the most. */
function summaryHTML(b: NonNullable<typeof game.battle>): string {
  const allies = b.entities
    .filter((e) => e.team === "ally" && !e.summon)
    .sort((x, y) => y.dealt - x.dealt);
  if (!allies.length) return "";
  const top = Math.max(
    1,
    ...allies.map((e) => Math.max(e.dealt, e.taken, e.healed + e.shielded)),
  );
  const bar = (value: number, kind: string, label: string) =>
    `<span class="sum-bar ${kind}" style="--w:${Math.max(2, (value / top) * 100)}%" title="${label}: ${fmt(value)}"></span>`;
  return `<details class="battle-summary"><summary>Resumo da batalha</summary>
   <div class="sum-legend"><span class="dealt">Dano causado</span><span class="taken">Recebido</span><span class="support">Cura e escudo</span></div>
   ${allies
     .map(
       (
         e,
         i,
       ) => `<div class="sum-row ${e.hp <= 0 ? "fallen" : ""}"><span class="sum-name">${i === 0 && e.dealt > 0 ? icon("crown") : ""}${esc(characterOf(e.characterId).name)} <small>${"★".repeat(e.stars)}</small></span>
    <span class="sum-bars">${bar(e.dealt, "dealt", "Dano causado")}${bar(e.taken, "taken", "Dano recebido")}${e.healed + e.shielded > 0 ? bar(e.healed + e.shielded, "support", "Cura e escudo") : ""}</span><b>${fmt(e.dealt)}</b></div>`,
     )
     .join("")}
  </details>`;
}

function updateCostButtons() {
  document
    .querySelectorAll<HTMLButtonElement>("[data-lock-battle]")
    .forEach((b) => {
      if (game.state.paused || game.battle?.status === "fighting")
        b.disabled = true;
    });
}
function showModal(name: string, html: string) {
  ritualExperience?.destroy();
  ritualExperience = null;
  $("#modal").dataset.surface = name;
  preview.clear();
  activeModal = name;
  $("#modal-content").innerHTML =
    `<button class="modal-close icon-button" data-action="close" aria-label="Fechar">${icon("x")}</button>${html}`;
  if (!$<HTMLDialogElement>("#modal").open)
    $<HTMLDialogElement>("#modal").showModal();
  $("#modal").scrollTop = 0;
  refreshIcons();
  updateCostButtons();
}
const closeModal = () => {
  ritualExperience?.destroy();
  ritualExperience = null;
  $<HTMLDialogElement>("#modal").close();
  activeModal = "";
};

function showRitualExperience(id: PracticeId) {
  const uid = curaHero;
  const hero = game.state.heroes.find((h) => h.uid === uid);
  if (!hero && id !== "cacau") return;
  showModal(
    "ritual-play",
    ritualExperienceMarkup(
      id,
      id === "cacau"
        ? "Toda a tribo"
        : hero
          ? `${portraitHTML(characterOf(hero.characterId), hero.stars)}<span>${esc(characterOf(hero.characterId).name)}</span>`
          : "Toda a tribo",
      ritualCost(id, id === "cacau" ? 0 : (hero?.rituals[id] ?? 0)),
    ),
  );
  ritualExperience = new RitualExperience(
    $("#modal-content"),
    id,
    sound,
    (quality) => {
      const result =
        id === "cacau"
          ? game.holdCacaoCircle(quality)
          : game.performActiveRitual(uid!, id, quality);
      act(result, "heal");
      if (result.ok) closeModal();
      showCura();
    },
    () => updatePref("sound", !prefs.sound),
    reducedMotion(),
  );
}

function armyContextKey() {
  return JSON.stringify([
    game.battle?.status,
    game.state.paused,
    game.state.journey,
    game.state.spirits,
    game.state.era,
    game.state.selectedStage,
    game.state.inventory,
    game.state.heroes.map((h) => [
      h.uid,
      h.level,
      h.ritualLevel,
      h.rituals,
      h.stars,
      h.slot,
      h.away?.until,
      h.items,
    ]),
  ]);
}
function showArmyCoach() {
  if (
    coachComposition !== "auto" &&
    !compositionPlans(game.state).some((p) => p.id === coachComposition)
  )
    coachComposition = "auto";
  const alreadyOpen = activeModal === "army-coach",
    scroll = alreadyOpen ? $("#modal").scrollTop : 0;
  const focused = alreadyOpen
    ? (document.activeElement as HTMLElement | null)?.id
    : "";
  const enemyOpen =
    alreadyOpen &&
    !!document.querySelector<HTMLDetailsElement>(".enemy-advice")?.open;
  showModal(
    "army-coach",
    armyCoach(
      game.state,
      coachHero,
      coachTrait,
      game.battle?.status === "fighting",
      coachTab,
      game.battle?.preparations ?? [],
      coachComposition,
    ),
  );
  if (enemyOpen)
    document.querySelector<HTMLDetailsElement>(".enemy-advice")!.open = true;
  if (focused?.startsWith("coach-"))
    document.getElementById(focused)?.focus({ preventScroll: true });
  $("#modal").scrollTop = scroll;
  coachStateKey = armyContextKey();
}

function codexTabs(active: string) {
  return `<div class="codex-tabs">${[
    ["heroes", "Heróis", "users"],
    ["items", "Itens", "backpack"],
    ["spirits", "Espíritos", "feather"],
    ["traits", "Laços", "diamond"],
  ]
    .map(
      ([id, label, ic]) =>
        `<button data-codex="${id}" class="${id === active ? "active" : ""}">${icon(ic)}${label}</button>`,
    )
    .join("")}</div>`;
}

function showCodex(cost = 0, query = "") {
  const list = characters.filter(
    (c) =>
      (!cost || c.cost === cost) &&
      `${c.name} ${c.title} ${c.traits.join(" ")}`
        .toLocaleLowerCase("pt-BR")
        .includes(query.toLocaleLowerCase("pt-BR")),
  );
  showModal(
    "codex",
    `<p class="eyebrow">O MUNDO DE WOLF TOTEM</p><h2>Memórias dos espíritos</h2>${codexTabs("heroes")}
   <div class="codex-tools"><label class="search">${icon("search")}<input id="codex-search" placeholder="Buscar herói ou característica" value="${esc(query)}" aria-label="Buscar no códice"/></label><div class="cost-filters">${[0, 1, 2, 3, 4, 5].map((n) => `<button data-filter="${n}" class="${cost === n ? "active" : ""}">${n === 0 ? "Todos" : `Era ${roman(n)}`}</button>`).join("")}</div></div>
   <div class="codex-grid">${list.map((c) => `<button class="codex-card cost-${c.cost}" data-character="${c.id}">${portraitHTML(c)}<span class="codex-cost">${c.cost}</span><span class="codex-name">${c.name}<small>${c.title}</small></span><span class="codex-status">${c.cost <= unlockedCost(game.state.era) ? "Vínculo acessível" : `Era ${roman(c.cost)}`} · ${ANIMALITY[c.id].category}</span></button>`).join("") || "<p>Nenhum espírito encontrado com essa busca.</p>"}</div>`,
  );
  $("#modal").dataset.filter = String(cost);
}

function showItemsCodex() {
  showModal(
    "codex",
    `<p class="eyebrow">O MUNDO DE WOLF TOTEM</p><h2>Itens da tribo</h2>${codexTabs("items")}
   <p class="modal-intro">Seis componentes surgem das expedições ou são comprados no Arsenal. Dois componentes no mesmo herói ou combinados na bolsa formam um dos 21 itens. Cada herói carrega até três.</p>
   <h3 class="codex-section">Componentes</h3><div class="item-grid">${COMPONENTS.map((c) => `<div class="item-card" style="--item:${c.color}"><span class="item-gem big"></span><div><b>${c.name}</b><p>${c.text}</p></div></div>`).join("")}</div>
   <h3 class="codex-section">Receitas</h3><div class="recipe-table">${ITEMS.map((it) => `<div class="recipe" style="--item:${it.color}">${itemGlyph(it.id)}<div><b>${it.name}</b><small>${itemById(it.recipe![0])!.name} + ${itemById(it.recipe![1])!.name}</small><p>${it.text}</p></div></div>`).join("")}</div>`,
  );
}

function showSpiritsCodex() {
  showModal(
    "codex",
    `<p class="eyebrow">O MUNDO DE WOLF TOTEM</p><h2>Espíritos protetores</h2>${codexTabs("spirits")}
   <p class="modal-intro">Ao alcançar uma nova era, a tribo honra um de três espíritos. Cada um concede um bônus permanente e um Poder Espiritual, que você aciona uma vez por expedição.</p>
   ${[2, 3, 4, 5]
     .map(
       (era) =>
         `<h3 class="codex-section">Era ${roman(era)} · ${ERA_NAMES[era - 1].split("· ")[1]}</h3><div class="spirit-grid">${spiritsOfEra(
           era,
         )
           .map(
             (sp) =>
               `<div class="spirit-card small ${game.state.spirits.includes(sp.id) ? "chosen" : ""}" style="--spirit:${sp.color}"><span class="spirit-art">${spiritGlyph(sp.id)}</span><b>${sp.name}</b><p>${sp.passiveText}</p><p class="power-text"><strong>${sp.power.name}.</strong> ${sp.power.text}</p></div>`,
           )
           .join("")}</div>`,
     )
     .join("")}`,
  );
}

function showTraitsCodex() {
  const groups: [string, string][] = [
    ["povo", "Povos"],
    ["função", "Funções"],
    ["espírito", "Espíritos animais"],
  ];
  showModal(
    "codex",
    `<p class="eyebrow">O MUNDO DE WOLF TOTEM</p><h2>Laços da tribo</h2>${codexTabs("traits")}
   <p class="modal-intro">Personagens diferentes na formação que compartilham uma característica ativam seu laço. Cópias do mesmo herói contam uma vez.</p>
   ${groups
     .map(
       ([kind, label]) =>
         `<h3 class="codex-section">${label}</h3><div class="trait-table">${Object.entries(
           TRAIT_RULES,
         )
           .filter(([, r]) => r.kind === kind)
           .map(
             ([name, r]) =>
               `<div class="trait-row"><b>${name}</b><span class="trait-thresholds">${r.thresholds.join(" / ")}</span><p>${r.effects.map((e) => esc(e)).join("<br>")}</p><small>${characters
                 .filter((c) => c.traits.includes(name))
                 .map((c) => c.name)
                 .join(", ")}</small></div>`,
           )
           .join("")}</div>`,
     )
     .join("")}`,
  );
}

function showCharacter(id: number, stars = 1) {
  const c = characterOf(id),
    art = artFor(c, stars);
  const sheet =
    art.kind === "procedural"
      ? { ...art.sheet!, image: proceduralImage(id, stars) }
      : art.sheet;
  const motions: [MotionClip, string][] = [
    ["idle", "Repouso"],
    ["walk", "Caminhar"],
    ["attack", "Atacar"],
    ["cast", "Habilidade"],
    ["hurt", "Impacto"],
    ["death", "Queda"],
    ["victory", "Vitória"],
  ];
  const animality = ANIMALITY[c.id];
  showModal(
    "character",
    `<div class="character-detail"><div class="preview-column"><div class="character-portrait">
   ${sheet ? `<canvas id="character-preview" class="character-preview" width="640" height="560" role="img" aria-label="${c.name}, animação de ${stars} estrelas"></canvas>` : portraitHTML(c, stars)}
   <div class="star-selector">${[1, 2, 3].map((n) => `<button data-detail="${id}" data-stars="${n}" aria-label="${n} estrela${n > 1 ? "s" : ""}" aria-pressed="${n === stars}" class="${n === stars ? "active" : ""}">${"★".repeat(n)}</button>`).join("")}</div></div>
   ${sheet ? `<p class="preview-status" id="preview-status" role="status">Carregando animação…</p><div class="motion-controls" aria-label="Movimentos de ${c.name}">${motions.map(([clip, label]) => `<button data-motion="${clip}" aria-pressed="${preview.currentClip === clip}">${label}</button>`).join("")}</div><div class="preview-actions"><button data-action="preview-flip">Virar personagem</button><button data-action="preview-pause">${preview.isPaused ? "Retomar prévia" : "Pausar prévia"}</button></div>` : ""}
   </div><div class="character-story"><button class="text-button" data-action="codex">${icon("arrow-left")}Voltar ao códice</button><p class="eyebrow">ERA ${roman(c.cost)} · ${c.range > 1 ? "ATAQUE À DISTÂNCIA" : "CORPO A CORPO"}</p><h2>${c.name}</h2><h3>${c.title}</h3><div class="trait-chips">${c.traits.map((t) => `<span>${t}</span>`).join("")}</div>
   <div class="stat-grid"><div>${icon("heart")}<strong>${c.hp[stars - 1]}</strong><small>Vida</small></div><div>${icon("swords")}<strong>${c.attack[stars - 1]}</strong><small>Ataque</small></div><div>${icon("shield")}<strong>${c.armor}/${c.magicResist}</strong><small>Armadura/RM</small></div><div>${icon("zap")}<strong>${c.attackSpeed}</strong><small>Ataques/s</small></div></div>
   <h4>${c.ability.name}</h4><p>${c.ability.description}</p>
   <div class="evolution"><span class="eyebrow">O DESPERTAR · ${stars} ESTRELA${stars > 1 ? "S" : ""}</span><p>${c.evolution[stars - 1]}</p></div>
   <div class="prototype-skill"><span class="eyebrow">EFEITO EM COMBATE</span><p>${SKILL_NOTES[c.id]}</p></div>
   <div class="animality"><span class="eyebrow">VÍNCULO PRIMAL · ${animality.category.toUpperCase()}${animality.source === "proposta" ? " · PROPOSTA" : ""}</span><p>${ANIMALITY_RULES[animality.category]}</p></div>
   <p class="development-note">${c.cost <= unlockedCost(game.state.era) ? "Companheiro disponível nesta era." : `Chega à fogueira na Era ${roman(c.cost)}.`} ${sheet?.style === 'lpc' ? 'Sete movimentos em pixel art e quatro direções. Use Virar personagem para ver cada lado.' : { painted: "Esta forma tem animação pintada.", illustration: "Esta forma usa a ilustração original com movimentos programados.", standin: `A forma ${stars}★ ainda não tem folha pintada: o jogo mostra a forma ${art.sheet?.stars ?? 1}★ com a aura do espírito.`, procedural: "Figura desenhada pelo próprio jogo enquanto a arte pintada não chega; ela é substituída automaticamente." }[art.kind]}</p></div></div>`,
  );
  if (sheet)
    preview.mount($<HTMLCanvasElement>("#character-preview"), id, stars, sheet);
}

function showMap() {
  const s = game.state;
  showModal(
    "map",
    `<p class="eyebrow">MAPA DAS EXPEDIÇÕES</p><h2>Terras selvagens</h2><p class="modal-intro">Vença cada expedição para abrir a próxima. Expedições já vencidas podem ser repetidas com XP reduzido e uma chance de componente. Cada região exige uma era da tribo.</p>
   <div class="map">${REGIONS.map((region) => {
     const open = region.village <= s.era;
     return `<section class="map-region ${open ? "" : "locked"}" style="--floor:#${region.palette.floor.toString(16)};--line:#${region.palette.line.toString(16)}"><header><b>${region.id}. ${region.name}</b><span>${open ? region.subtitle : `Exige a Era ${roman(region.village)}`}</span></header>
      <div class="map-nodes">${STAGES.filter((st) => st.region === region.id)
        .map((st) => {
          const cleared = st.id <= s.progress,
            available = stageUnlocked(s, st.id),
            current = st.id === s.selectedStage;
          return `<button class="map-node ${cleared ? "cleared" : ""} ${current ? "current" : ""} ${st.index === 5 ? "boss" : ""}" data-stage="${st.id}" ${available ? "" : "disabled"} title="${esc(st.name)}"><span class="node-mark">${st.index === 5 ? icon("crown") : cleared ? icon("check") : available ? st.index : icon("lock")}</span><span class="node-name">${esc(st.name)}</span></button>`;
        })
        .join("")}</div></section>`;
   }).join("")}
   <section class="map-region endless ${stageUnlocked(s, 0) ? "" : "locked"}"><header><b>∞ Caçada Eterna</b><span>${stageUnlocked(s, 0) ? `Recorde desta jornada: ${s.endlessBest} · de todas: ${s.endlessRecord}` : "Desperta após vencer o Primeiro Inverno."}</span></header>
    <div class="map-nodes"><button class="map-node ${s.selectedStage === 0 ? "current" : ""}" data-stage="0" ${stageUnlocked(s, 0) ? "" : "disabled"}><span class="node-mark">${icon("infinity")}</span><span class="node-name">Profundidade ${s.endlessBest + 1}</span></button></div></section>
   </div>`,
  );
}

function showSpiritChoice() {
  const era = pendingEra(game.state);
  if (!era) return;
  showModal(
    "spirit",
    `<p class="eyebrow">ERA ${roman(era)} · ${ERA_NAMES[era - 1].split("· ")[1].toUpperCase()}</p><h2>Qual espírito guiará a tribo?</h2><p class="modal-intro">A escolha é permanente nesta jornada. O bônus vale sempre; o poder pode ser chamado uma vez em cada expedição, na barra de poderes do campo.</p>
   <div class="spirit-grid">${spiritsOfEra(era)
     .map(
       (sp) =>
         `<div class="spirit-card" style="--spirit:${sp.color}"><span class="spirit-art">${spiritGlyph(sp.id)}</span><h3>${sp.name}</h3><p>${sp.passiveText}</p><p class="power-text"><strong>${icon("zap")} ${sp.power.name}.</strong> ${sp.power.text}</p><button class="primary" data-spirit="${sp.id}">Honrar o ${sp.name}</button></div>`,
     )
     .join("")}</div>`,
  );
}

function showAncestors() {
  const s = game.state,
    complete = s.wonder >= WONDER_STAGES;
  const canBuild = !totemLock(s);
  const canAscend = complete && s.progress >= FINAL_STAGE;
  showModal(
    "ancestors",
    `<p class="eyebrow">O GRANDE TOTEM</p><h2>A memória da tribo</h2><p class="modal-intro">Na Era V, depois de vencer o Leviatã do Pântano, a tribo inicia cinco consagrações do Grande Totem por conquistas de campanha e rituais. Completo e com o Primeiro Inverno vencido, ele permite o renascimento: a jornada recomeça e as brasas ancestrais compram memórias permanentes.</p>
   <div class="wonder"><div class="wonder-stages">${Array.from({ length: WONDER_STAGES }, (_, i) => `<span class="${i < s.wonder ? "done" : ""}">${roman(i + 1)}</span>`).join("")}</div>
    ${complete ? '<p class="wonder-note">O Grande Totem está completo.</p>' : `<button class="primary" data-action="wonder" ${canBuild && !s.paused && game.battle?.status !== "fighting" ? "" : "disabled"}>${icon("landmark")}Consagrar a parte ${s.wonder + 1}</button>${canBuild ? "" : `<p class="small muted">${esc(totemLock(s) ?? "")}</p>`}`}
    <div class="ascend"><p>Renascer agora concede <b>${embersFor(s)} brasas</b> (8 + 2 por profundidade da Caçada Eterna + 2 por renascimento anterior).</p><button class="primary ${confirmAscend ? "danger" : ""}" data-action="ascend" ${canAscend ? "" : "disabled"}>${icon("flame")}${confirmAscend ? "Confirmar: recomeçar a jornada" : "Renascer da chama"}</button>${canAscend ? "" : '<p class="small muted">Exige o Grande Totem completo e o Primeiro Inverno vencido.</p>'}</div></div>
   <h3 class="codex-section">Memórias ancestrais · ${fmt(s.embers)} brasas · ${s.rebirths} renascimento${s.rebirths === 1 ? "" : "s"}</h3>
   <div class="memory-grid">${MEMORIES.map((m) => {
     const level = s.memories[m.id] ?? 0,
       price = memoryCost(m, level);
     return `<div class="memory-card"><b>${m.name}</b><span class="memory-level">${level}/${m.max}</span><p>${m.text}</p><button class="outline-button" data-memory="${m.id}" ${level >= m.max || s.embers < price ? "disabled" : ""}>${level >= m.max ? "Completa" : `${icon("sparkles")}${price} brasas`}</button></div>`;
   }).join("")}</div>`,
  );
}

function showHunts() {
  setView("battle");
  toast("Caçadas foram retiradas. Lute por experiência e âmbar.");
}
function showCura() {
  const entering = view !== "ritual",
    s = game.state;
  if (!curaHero || !s.heroes.some((h) => h.uid === curaHero))
    curaHero = s.heroes[0].uid;
  const p = practiceById(chosenPractice)!;
  let lock: string | null = p.tribe
    ? s.era < 2
      ? "Exige Era II."
      : s.paused || game.battle?.status === "fighting"
        ? "Conduza a roda entre os combates."
        : s.cacaoBattles > 0
          ? `Cacau ativo por ${s.cacaoBattles} batalhas.`
          : s.amber < ritualCost("cacau")
            ? "Âmbar insuficiente."
            : null
    : game.ritualLock(curaHero, p.id);
  if (activeModal) closeModal();
  if (entering) {
    preview.clear();
    sound.mood = "village";
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  view = "ritual";
  document.body.dataset.view = view;
  document.querySelector<HTMLElement>(".battle-page")!.hidden = true;
  document.querySelector<HTMLElement>(".journey-page")!.hidden = true;
  $("#guardian-hall").hidden = true;
  $("#arsenal-hall").hidden = true;
  $("#ritual-hall").hidden = false;
  document
    .querySelectorAll<HTMLElement>(".nav-button[data-view]")
    .forEach((n) => n.classList.toggle("active", n.dataset.view === view));
  $("#ritual-hall").innerHTML = ritualHall(s, curaHero, chosenPractice, lock);
  refreshIcons();
}

function journeyObjective(): string {
  const s = game.state,
    era = pendingEra(s),
    quest =
      openQuests(s).find((q) => q.done(s)) ??
      openQuests(s).find((q) => q.id !== "cacar") ??
      openQuests(s)[0],
    need = ERA_GROWTH[s.era - 1];
  return `<div><span class="context-icon">${icon(era ? "sparkles" : "compass")}</span><span><strong>${era ? "Uma nova era desperta." : quest ? esc(quest.title) : objective().title}</strong><small>${era ? "Escolha o espírito que acompanhará a tribo." : quest ? esc(quest.hint) : objective().text}</small></span></div><div class="objective-actions">${era ? `<button class="primary" data-action="spirit-choice">Escolher espírito da Era ${roman(era)}</button>` : quest?.done(s) ? `<button class="primary" data-quest="${quest.id}">Receber recompensa</button>` : '<button class="outline-button" data-action="journal">Ver diário</button>'}${s.era < 5 ? `<button class="outline-button" data-action="village-upgrade" title="Experiência ${need.level} e ritual ${need.ritualLevel}" ${s.paused || game.battle?.status === "fighting" || !s.heroes.some((h) => h.level >= need.level && h.ritualLevel >= need.ritualLevel) ? "disabled" : ""}>Avançar era · XP ${need.level} / rito ${need.ritualLevel}</button>` : ""}${view === "battle" && !panelOpen ? `<button class="primary" data-action="battle-start" ${game.battle?.status === "fighting" || s.paused ? "disabled" : ""}>${game.battle?.status === "fighting" ? "Em expedição" : "Iniciar expedição"}</button>` : ""}${!panelOpen ? `<button class="outline-button" data-action="panel-open">${view === "battle" ? "Ações da expedição" : "Ações da jornada"}</button>` : ""}</div>`;
}

function help() {
  showModal(
    "help",
    `<p class="eyebrow">BEM-VINDO À PRIMEIRA CHAMA</p><h2>Uma tribo começa com você.</h2><div class="guide-steps">
   <div><span>01</span><h3>Reúna a formação</h3><p>Em Guardiões → Draft, pague âmbar para escolher um entre até três companheiros inéditos. Cada carta tem uma troca gratuita, com resultado aleatório. O herói inicial também é sorteado entre os guardiões da Era I. No Campo, o Conselho de Guerra compara composições e organiza as posições.</p></div>
   <div><span>02</span><h3>Aprenda fazendo</h3><p>Vitórias rendem XP. Na aba Provas de cada guardião, receba recompensas por explorar expedições, usar habilidades, equipamentos e laços. As duas barras precisam alcançar os requisitos para despertar estrelas.</p></div>
   <div><span>03</span><h3>Aprofunde o vínculo</h3><p>Combates rendem âmbar para rituais, drafts e equipamentos. Participe de uma cerimônia e confirme para pagar e receber XP ritual. No Arsenal, escolha builds, compre componentes e combine receitas. As novas eras ampliam o elenco e liberam relíquias.</p></div></div>
   <p class="development-note">Atalhos: J caminhos · R bênçãos · A conselheiro · 1 jornada · 2 expedição · 3 códice · 4 totem · C Arsenal · M campanha · P pausar · Esc fechar.</p><button class="primary" data-action="close">Seguir o chamado ${icon("arrow-right")}</button>`,
  );
}

function settings() {
  const percent = (value: number) => `${Math.round(value * 100)}%`;
  const slider = (key: "sfx" | "music", label: string) =>
    `<label class="pref-row"><span>${label}</span><input type="range" min="0" max="100" step="5" value="${Math.round(prefs[key] * 100)}" data-pref="${key}" aria-label="${label}" ${prefs.sound ? "" : "disabled"}><output>${percent(prefs[key])}</output></label>`;
  const toggle = (key: "sound" | "numbers", label: string, hint: string) =>
    `<label class="pref-row toggle"><span>${label}<small>${hint}</small></span><input type="checkbox" data-pref="${key}" ${prefs[key] ? "checked" : ""}><i class="switch" aria-hidden="true"></i></label>`;
  const motion = (value: Prefs["motion"], label: string) =>
    `<option value="${value}" ${prefs.motion === value ? "selected" : ""}>${label}</option>`;
  showModal(
    "settings",
    `<p class="eyebrow">CONFIGURAÇÕES</p><h2>A fogueira da tribo</h2>
   <div class="settings-grid">
    <section><h3>${icon("volume-2")}Som</h3>
     ${toggle("sound", "Sons e música", "Efeitos de combate e a música da tribo")}
     ${slider("sfx", "Efeitos")}${slider("music", "Música")}
    </section>
    <section><h3>${icon("eye")}Visual</h3>
     <label class="pref-row"><span>Movimento<small>Reduzido acalma tremores, ondas e animações da interface</small></span><select data-pref="motion">${motion("system", "Seguir o sistema")}${motion("full", "Completo")}${motion("reduced", "Reduzido")}</select></label>
     ${toggle("numbers", "Números de dano e cura", "Desligue para um campo mais limpo em lutas cheias")}
     <p class="modal-intro"><a class="text-button" href="${assetUrl('characters.html')}" target="_blank" rel="noopener">Galeria dos 55 guardiões ${icon("external-link")}</a><br><a class="text-button" href="${assetUrl('credits/lpc-credits.html')}" target="_blank" rel="noopener">Créditos dos personagens LPC ${icon("external-link")}</a></p>
    </section>
    <section class="wide"><h3>${icon("book-marked")}Jornada</h3>
     <p class="modal-intro">O progresso é salvo automaticamente. Âmbar e experiência são conquistados em combates. Rituais concedem XP ao confirmar, sem espera ou atividades offline.</p>
     <div class="settings-buttons"><button class="outline-button" data-action="export">${icon("download")}Exportar progresso</button><button class="outline-button" data-action="import">${icon("upload")}Importar progresso</button><button class="outline-button" data-action="help">${icon("book-open")}Como jogar</button><button class="outline-button" data-action="title-show">${icon("flame")}Tela inicial</button></div>
     <p class="development-note">Importar substitui o progresso deste navegador. Saves anteriores são convertidos automaticamente para a nova jornada.</p>
     <div class="danger-zone">${
       confirmWipe
         ? `<p><b>Apagar tudo?</b> Os heróis, as expedições, os renascimentos e as memórias deste navegador serão perdidos. Exporte antes se quiser guardar uma cópia.</p><div class="settings-buttons"><button class="outline-button" data-action="wipe-cancel">Manter a jornada</button><button class="primary danger" data-action="wipe-confirm">${icon("trash-2")}Apagar para sempre</button></div>`
         : `<p>Recomeçar do zero apaga todo o progresso deste navegador.</p><button class="outline-button danger" data-action="wipe">${icon("trash-2")}Apagar jornada</button>`
     }</div>
    </section>
   </div>`,
  );
}

/** Erases the journey and reloads into a fresh one, skipping the title screen once. */
function wipeJourney() {
  wiping = true;
  try {
    localStorage.removeItem(SAVE_KEY);
    sessionStorage.setItem(FRESH_KEY, "1");
  } catch {
    /* reload still starts clean */
  }
  location.reload();
}

function updatePref(key: string, value: string | boolean) {
  if (key === "sound") {
    prefs.sound = !!value;
    sound.setMuted(!prefs.sound);
    if (prefs.sound) sound.play("click");
  } else if (key === "sfx" || key === "music") {
    prefs[key] = Math.max(0, Math.min(1, Number(value) / 100));
    sound.setVolumes(prefs.sfx, prefs.music);
    if (key === "sfx") sound.play("hit");
  } else if (
    key === "motion" &&
    (value === "system" || value === "full" || value === "reduced")
  )
    prefs.motion = value;
  else if (key === "numbers") prefs.numbers = !!value;
  if (storage) savePrefs(storage, prefs);
  document.documentElement.classList.toggle("reduce-motion", reducedMotion());
  world.setOptions({ reducedMotion: reducedMotion(), numbers: prefs.numbers });
  preview.setReducedMotion(reducedMotion());
  renderAudioButton();
}

function renderAudioButton() {
  const button = $('[data-action="audio"]');
  button.innerHTML = icon(sound.muted ? "volume-x" : "volume-2");
  button.setAttribute(
    "aria-label",
    sound.muted ? "Ativar sons" : "Silenciar sons",
  );
  refreshIcons();
}

function renderTitle() {
  document.body.classList.add("title-open");
  $<HTMLElement>(".app-frame").inert = true;
  const s = game.state, first = s.heroes[0], starter = characterOf(first.characterId);
  $("#title-screen").innerHTML =
    `<div class="title-landscape"><div class="title-orbit"></div>${portraitHTML(starter, first.stars)}<span class="title-landscape-label">${esc(starter.name)} · ${esc(starter.title)}</span></div><div class="title-card"><div class="title-emblem">${glyphSVG("wolf", "#e8c58e", "")}</div><p class="eyebrow">O DESPERTAR DA TRIBO</p><h1 id="title-name">WOLF<br><b>TOTEM</b></h1><p class="title-story">Reúna os guardiões. Honre os espíritos.<br>Leve sua tribo além do Primeiro Inverno.</p><div class="title-tags"><span>${icon("swords")}Combate tático</span><span>${icon("flame")}Rituais interativos</span><span>${icon("sparkles")}55 guardiões</span></div>${!hasJourney ? `<div class="title-journey">${esc(starter.name)} inicia sua tribo · guardião sorteado da Era I</div>` : ""}${hasJourney ? `<div class="title-journey">Era ${roman(s.era)} · ${s.progress}/30 expedições · ${s.heroes.length} ${s.heroes.length === 1 ? "guardião" : "guardiões"}</div>` : ""}<div class="title-actions"><button class="primary" data-action="title-continue">${icon("play")}${hasJourney ? "Continuar jornada" : "Começar jornada"}${icon("arrow-right")}</button>${hasJourney ? `<button class="text-button ${confirmNew ? "danger" : ""}" data-action="title-new">${confirmNew ? "Confirmar: apagar a jornada atual" : "Nova jornada"}</button>` : ""}<div class="title-links"><button class="text-button" data-action="import">Carregar jornada</button><button class="text-button" data-action="settings">Configurações</button><button class="text-button" data-action="help">Como jogar</button></div></div><p class="title-version">VERSÃO 3.3 · ${storage ? "progresso salvo neste navegador" : "exporte sua jornada para salvar"}</p></div>`;
  refreshIcons();
}

function closeTitle() {
  document.body.classList.remove("title-open");
  $<HTMLElement>(".app-frame").inert = false;
  titleOpen = false;
  confirmNew = false;
  $("#title-screen").hidden = true;
  // The click that leaves the title is the gesture browsers need before playing sound.
  if (prefs.sound && sound.muted) {
    sound.setMuted(false);
    renderAudioButton();
  }
  lastTime = performance.now();
  if (!hasJourney)
    toast(
      "Comece no campo. Cada vitória evolui seus guardiões e desbloqueia provas.",
    );
  welcomeBack();
}

function showTitle() {
  closeModal();
  confirmNew = false;
  titleOpen = true;
  save();
  renderTitle();
  $("#title-screen").hidden = false;
  $<HTMLButtonElement>("#title-screen .primary").focus();
}

let welcomed = false;
function welcomeBack() {
  if (welcomed) return;
  welcomed = true;
  // The objective strip keeps pending spirit choices available without interrupting another action.
}

function startNext() {
  if (game.battle && game.battle.status !== "fighting") game.dismissBattle();
  const result = game.startBattle();
  if (!result.ok) toast(result.message);
  else sound.play("power");
  renderAll();
}

document.addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
    "button",
  );
  if (!target || target.disabled) return;
  const d = target.dataset;
  if (d.heroTab) {
    heroDetailTab = d.heroTab;
    renderGuardians(true);
    return;
  }
  if (d.proof) {
    const [uid, id] = d.proof.split(":");
    act(game.claimHeroProof(uid, id), "recruit");
    return;
  }
  if (d.draftOpen !== undefined) {
    act(game.openDraft(), "recruit");
    renderGuardians(true);
    return;
  }
  if (d.draftRoll !== undefined) {
    act(game.rerollDraft(Number(d.draftRoll)), "click");
    renderGuardians(true);
    return;
  }
  if (d.arsenalHero) {
    arsenalBuildRole = "";
    arsenalHero = d.arsenalHero;
    setView("arsenal");
    return;
  }
  if (d.arsenalTab) {
    arsenalTab = d.arsenalTab;
    renderArsenal();
    return;
  }
  if (d.buyComponent) {
    act(game.buyComponent(d.buyComponent), "item");
    if (activeModal === "army-coach") showArmyCoach();
    return;
  }
  if (d.buyRelic) {
    act(game.buyRelic(d.buyRelic), "item");
    return;
  }
  if (d.prepareBuild) {
    const [uid, id] = d.prepareBuild.split(":");
    act(game.prepareBuild(uid, id), "item");
    return;
  }
  if (d.itemDetail) {
    const item = itemById(d.itemDetail)!;
    showModal(
      "item-detail",
      `<div class="item-inspection">${itemGlyph(item.id)}<p class="eyebrow">${item.era ? "RELÍQUIA · ERA " + item.era : "EQUIPAMENTO"}</p><h2>${item.name}</h2><p>${item.text}</p>${item.recipe ? `<div class="recipe-formula">${item.recipe.map((id) => itemGlyph(id)).join("<b>+</b>")}</div>` : ""}<button class="outline-button" data-action="close">Voltar ao Arsenal</button></div>`,
    );
    return;
  }
  if (d.composition) {
    coachComposition = d.composition;
    showArmyCoach();
    return;
  }
  if (d.view) {
    setView(d.view as typeof view);
    return;
  }
  if (d.journeyTab) {
    villageMode = d.journeyTab as typeof villageMode;
    if (view !== "village") setView("village");
    else renderSide();
    return;
  }
  if (d.journeyBranch) {
    journeyBranch = d.journeyBranch as JourneyBranch;
    renderVillageSide();
    return;
  }
  if (d.acceptTrial) {
    act(game.acceptTrial(d.acceptTrial), "click");
    return;
  }
  if (d.claimTrial !== undefined) {
    act(game.claimTrial(), "recruit");
    return;
  }
  if (d.learnLegacy) {
    act(game.learnLegacy(d.learnLegacy));
    return;
  }
  if (d.selectPreparation) {
    act(game.selectPreparation(d.selectPreparation), "click");
    if (activeModal === "army-coach") showArmyCoach();
    return;
  }
  if (d.coachTab) {
    coachTab = d.coachTab as CoachTab;
    $("#modal").scrollTop = 0;
    showArmyCoach();
    return;
  }
  if (d.applyArmy) {
    act(game.applyArmyPlan(d.applyArmy, coachComposition), "click");
    showArmyCoach();
    return;
  }
  if (d.formationItems || d.formationItem !== undefined) {
    act(game.applyFormationItems(d.formationItems ?? d.itemSignature ?? "", d.formationItem !== undefined ? Number(d.formationItem) : undefined), "item");
    if (activeModal === "army-coach") showArmyCoach();
    else renderArsenal();
    return;
  }
  if (d.distributeItems) {
    act(game.applyEquipmentPlan(d.distributeItems), "item");
    showArmyCoach();
    return;
  }
  if (d.coachHero) {
    coachHero = d.coachHero;
    coachTab = "equipment";
    showArmyCoach();
    return;
  }
  if (d.coachTrait) {
    coachTrait = d.coachTrait;
    coachTab = "synergies";
    showArmyCoach();
    return;
  }
  if (d.armyFocus) {
    coachComposition = "auto";
    act(game.setArmyFocus(d.armyFocus), "click");
    showArmyCoach();
    return;
  }
  if (d.armyPreset) {
    coachComposition = "auto";
    for (const trait of [...game.state.journey.focusTraits])
      game.setArmyFocus(trait);
    for (const trait of d.armyPreset.split(",")) game.setArmyFocus(trait);
    save();
    showArmyCoach();
    return;
  }
  if (d.advisorDeploy) {
    const replacement = game.state.heroes.find((h) => h.uid === d.replaceHero);
    const slot =
      replacement?.slot ??
      Array.from({ length: FORMATION_SLOTS }, (_, i) => i).find(
        (i) => !game.state.heroes.some((h) => h.slot === i),
      ) ??
      0;
    act(game.deploy(d.advisorDeploy, slot), "click");
    showArmyCoach();
    return;
  }
  if (d.advisorEquip) {
    const [uid, index] = d.advisorEquip.split(":");
    act(game.equipItem(uid, Number(index)), "item");
    showArmyCoach();
    return;
  }
  if (d.advisorRecipe) {
    const [a, b] = d.advisorRecipe.split(":");
    act(game.combineItems(Number(a), Number(b)), "item");
    if (view === "arsenal") renderArsenal();
    else showArmyCoach();
    return;
  }
  if (d.recruit) {
    act(game.recruit(Number(d.recruit)), "recruit");
    if (!game.state.draft) {
      tribeTab = "owned";
      inspectedHero =
        game.state.heroes.find((h) => h.characterId === Number(d.recruit))
          ?.uid ?? inspectedHero;
      renderGuardians(true);
    }
    return;
  }
  if (d.curaHero) {
    curaHero = d.curaHero;
    showCura();
    return;
  }
  if (d.inspect) {
    showHero(d.inspect);
    return;
  }
  if (d.tribeTab) {
    showTribe(d.tribeTab);
    return;
  }
  if (d.ritualHero) {
    curaHero = d.ritualHero;
    showCura();
    return;
  }
  if (d.practiceSelect) {
    chosenPractice = d.practiceSelect as PracticeId;
    showCura();
    return;
  }
  if (d.formationHero) {
    showFormation(d.formationHero);
    return;
  }
  if (d.placeSlot !== undefined && selectedHero) {
    const result = game.deploy(selectedHero, Number(d.placeSlot));
    act(result, "click");
    showFormation();
    return;
  }
  if (d.equipDirect) {
    const [uid, i] = d.equipDirect.split(":");
    act(game.equipItem(uid, Number(i)), "item");
    showHero(uid);
    return;
  }
  if (d.hero) {
    if (selectedItem !== null) {
      const r = game.equipItem(d.hero, selectedItem);
      selectedItem = null;
      act(r, "item");
      return;
    }
    selectedHero = selectedHero === d.hero ? null : d.hero;
    sound.play("click");
    renderCamp();
    renderSide();
    return;
  }
  if (d.inv !== undefined) {
    const index = Number(d.inv),
      current = selectedItem;
    if (
      current !== null &&
      current !== index &&
      isComponent(game.state.inventory[current]) &&
      isComponent(game.state.inventory[index])
    ) {
      selectedItem = null;
      act(game.combineItems(current, index), "item");
      return;
    }
    selectedItem = current === index ? null : index;
    sound.play("click");
    renderCamp();
    return;
  }
  if (d.unequip) {
    const [uid, i] = d.unequip.split(":");
    act(game.unequipItem(uid, Number(i)), "item");
    if (view === "heroes") renderGuardians(true);
    return;
  }
  if (d.bench) {
    act(game.deploy(d.bench, null), "click");
    if (activeModal === "formation") showFormation(d.bench);
    return;
  }
  if (d.character) {
    showCharacter(Number(d.character), Number(d.stars ?? 1));
    return;
  }
  if (d.detail) {
    showCharacter(Number(d.detail), Number(d.stars));
    return;
  }
  if (d.motion) {
    preview.select(d.motion as MotionClip);
    document
      .querySelectorAll<HTMLButtonElement>("[data-motion]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b === target)));
    return;
  }
  if (d.filter) {
    showCodex(Number(d.filter), $<HTMLInputElement>("#codex-search").value);
    return;
  }
  if (d.codex) {
    (
      ({
        heroes: () => showCodex(),
        items: showItemsCodex,
        spirits: showSpiritsCodex,
        traits: showTraitsCodex,
      }) as Record<string, () => void>
    )[d.codex]();
    return;
  }
  if (d.stage !== undefined) {
    const r = game.selectStage(Number(d.stage));
    toast(r.message);
    if (r.ok) {
      save();
      closeModal();
      if (view !== "battle") setView("battle");
      else renderAll();
    }
    return;
  }
  if (d.spirit) {
    const r = game.chooseSpirit(d.spirit as SpiritId);
    if (r.ok) closeModal();
    act(r, "era");
    return;
  }
  if (d.power) {
    const r = game.usePower(d.power as SpiritId);
    toast(r.message);
    if (r.ok) sound.play("power");
    renderPowers();
    return;
  }
  if (d.ritual) {
    if (curaHero) showRitualExperience(d.ritual as PracticeId);
    return;
  }
  if (d.quest) {
    const r = game.claimQuest(d.quest);
    act(r, "item");
    if (activeModal === "journal") showJournal();
    return;
  }
  if (d.memory) {
    act(game.buyMemory(d.memory as MemoryId), "upgrade");
    showAncestors();
    return;
  }
  switch (d.action) {
    case "army-coach":
      showArmyCoach();
      break;
    case "apply-army-plan":
      act(game.applyArmyPlan(), "click");
      showArmyCoach();
      break;
    case "tribe":
      showTribe();
      break;
    case "formation":
      showFormation();
      break;
    case "auto-formation":
      act(game.autoFormation(), "click");
      showFormation();
      break;
    case "formation-done":
      closeModal();
      setView("battle");
      break;
    case "panel-close":
      panelOpen = false;
      renderSide();
      break;
    case "panel-open":
      panelOpen = true;
      renderSide();
      break;
    case "preview-flip":
      preview.flip();
      break;
    case "preview-pause":
      target.textContent = preview.toggle()
        ? "Retomar prévia"
        : "Pausar prévia";
      break;
    case "place-selected":
      if (selectedHero)
        act(
          game.deploy(
            selectedHero,
            Number($<HTMLSelectElement>("#formation-slot").value),
          ),
          "click",
        );
      break;
    case "village-upgrade": {
      const r = game.advanceEra();
      act(r, "era");
      if (r.ok) showSpiritChoice();
      break;
    }
    case "spirit-choice":
      showSpiritChoice();
      break;
    case "battle-start":
      startNext();
      break;
    case "battle-again":
      window.clearTimeout(repeatTimer);
      startNext();
      break;
    case "battle-dismiss":
      window.clearTimeout(repeatTimer);
      game.dismissBattle();
      renderAll();
      break;
    case "speed":
      game.setSpeed((game.state.settings.speed % 3) + 1);
      save();
      renderAll();
      break;
    case "auto-repeat":
      toast(
        game.toggleAutoRepeat()
          ? "Repetição automática ligada: após cada vitória a expedição recomeça."
          : "Repetição automática desligada.",
      );
      save();
      renderAll();
      break;
    case "map":
      showMap();
      break;
    case "hunts":
      showHunts();
      break;
    case "cura":
      showCura();
      break;
    case "cacao":
      showRitualExperience("cacau");
      break;
    case "journal":
      showJournal();
      break;
    case "ancestors":
      confirmAscend = false;
      showAncestors();
      break;
    case "wonder":
      act(game.buildWonder(), "era");
      showAncestors();
      break;
    case "ascend":
      if (!confirmAscend) {
        confirmAscend = true;
        showAncestors();
        break;
      }
      confirmAscend = false;
      act(game.ascend(), "era");
      selectedHero = null;
      selectedItem = null;
      lastProgress = game.state.progress;
      lastVillage = game.state.era;
      showAncestors();
      break;
    case "pause":
      game.togglePause();
      save();
      renderAll();
      break;
    case "codex":
      showCodex();
      break;
    case "help":
      help();
      break;
    case "settings":
      confirmWipe = false;
      settings();
      break;
    case "close":
      closeModal();
      break;
    case "audio":
      updatePref("sound", sound.muted);
      break;
    case "title-continue":
      closeTitle();
      break;
    case "title-new":
      if (!confirmNew) {
        confirmNew = true;
        renderTitle();
        break;
      }
      wipeJourney();
      break;
    case "title-show":
      showTitle();
      break;
    case "wipe":
      confirmWipe = true;
      settings();
      break;
    case "wipe-cancel":
      confirmWipe = false;
      settings();
      break;
    case "wipe-confirm":
      wipeJourney();
      break;
    case "export": {
      const url = URL.createObjectURL(
        new Blob([game.serialize()], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `wolf-totem-jornada-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast(
        "Jornada exportada. Guarde o arquivo para continuar em outro navegador ou aparelho.",
      );
      break;
    }
    case "import":
      $<HTMLInputElement>("#save-file").click();
      break;
  }
});

document.addEventListener("input", (event) => {
  const input = event.target as HTMLInputElement;
  if (input.dataset.pref !== "sfx" && input.dataset.pref !== "music") return;
  updatePref(input.dataset.pref, input.value);
  const output = input.nextElementSibling;
  if (output) output.textContent = `${input.value}%`;
});
document.addEventListener("change", (event) => {
  const changed = event.target as HTMLSelectElement;
  if (changed.id === "ritual-hero-picker") {
    curaHero = changed.value;
    showCura();
    return;
  }
  if (changed.id === "arsenal-hero") {
    arsenalHero = changed.value;
    arsenalBuildRole = "";
    renderArsenal();
    return;
  }
  if (changed.id === "arsenal-build-role") {
    arsenalBuildRole = changed.value;
    renderArsenal();
    return;
  }

  const input = event.target as HTMLInputElement | HTMLSelectElement;
  if (input.id === "coach-trait") {
    coachTrait = input.value;
    showArmyCoach();
    return;
  }
  if (input.id === "coach-hero") {
    coachHero = input.value;
    showArmyCoach();
    return;
  }
  if (input.id === "cura-hero") {
    curaHero = input.value;
    showCura();
    return;
  }
  const key = input.dataset.pref;
  if (key === "sound" || key === "numbers") {
    updatePref(key, (input as HTMLInputElement).checked);
    if (key === "sound") settings();
  } else if (key === "motion") updatePref(key, input.value);
});
let searchTimer = 0;
document.addEventListener("input", (event) => {
  const input = event.target as HTMLInputElement;
  if (input.id !== "codex-search") return;
  clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    const value = input.value,
      position = input.selectionStart;
    showCodex(Number($("#modal").dataset.filter || 0), value);
    const next = $<HTMLInputElement>("#codex-search");
    next.focus();
    next.setSelectionRange(position, position);
  }, 180);
});
$<HTMLInputElement>("#save-file").addEventListener("change", async (event) => {
  const input = event.target as HTMLInputElement,
    file = input.files?.[0];
  input.value = "";
  if (!file) return;
  let data: unknown;
  try {
    if (file.size > 500_000) throw new Error();
    data = JSON.parse(await file.text());
    const root = data as { version?: number; state?: { heroes?: unknown } };
    if (
      !root ||
      ![1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(root.version as number) ||
      !root.state ||
      !Array.isArray(root.state.heroes)
    )
      throw new Error();
  } catch {
    toast("Arquivo de progresso inválido. Sua jornada atual foi preservada.");
    return;
  }
  const imported = new Game(data);
  try {
    localStorage.setItem(SAVE_KEY, imported.serialize());
    sessionStorage.setItem(LOADED_KEY, "1");
  } catch {
    toast(
      "Este navegador está bloqueando o salvamento local. Libere o armazenamento do site e tente de novo.",
    );
    return;
  }
  wiping = true;
  location.reload();
});
document.addEventListener("keydown", (event) => {
  if (
    (event.target as HTMLElement).matches("input,textarea,select") ||
    event.repeat
  )
    return;
  if ($<HTMLDialogElement>("#modal").open) return;
  if (titleOpen) return;
  const key = event.key.toLowerCase();
  if (key === "1") setView("village");
  if (key === "2") setView("battle");
  if (key === "3") showCodex();
  if (key === "4") {
    confirmAscend = false;
    showAncestors();
  }
  if (key === "m" && game.battle?.status !== "fighting") showMap();
  if (key === "c") setView("arsenal");
  if (key === "p") {
    game.togglePause();
    save();
    renderAll();
  }
  if (key === "j" || key === "r") {
    villageMode = key === "j" ? "paths" : "preparations";
    if (view !== "village") setView("village");
    else renderSide();
  }
  if (key === "a") showArmyCoach();
});
$<HTMLDialogElement>("#modal").addEventListener("click", (event) => {
  if (event.target === $("#modal")) closeModal();
});
$("#modal").addEventListener("close", () => {
  if ($<HTMLDialogElement>("#modal").open) return;
  ritualExperience?.destroy();
  ritualExperience = null;
  preview.clear();
  activeModal = "";
  if (view === "heroes") renderGuardians(true);
});
window.addEventListener("pagehide", save);
let hiddenAt = 0;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    hiddenAt = Date.now();
    save();
  } else if (hiddenAt) {
    game.catchUp((Date.now() - hiddenAt) / 1000);
    hiddenAt = 0;
    save();
    renderMetrics();
  }
  lastTime = performance.now();
});

/** Battle events also drive the sound, throttled inside the sound system. */
function playBattleSounds() {
  for (const event of game.events) {
    if (event.id <= lastEventId) continue;
    lastEventId = event.id;
    const actor = game.battle?.entities.find((e) => e.id === event.sourceId);
    if (
      actor &&
      ["prepare", "attack", "skill", "damage", "shield"].includes(event.type)
    ) {
      sound.combat(
        event.type as "prepare" | "attack" | "skill" | "damage" | "shield",
        actor.characterId,
        (actor.x / 6.5) * 2 - 1,
        event.school === "magic",
        Math.min(1, (event.amount ?? 30) / 180),
      );
      continue;
    }
    const sfx: Partial<Record<typeof event.type, Sfx>> = {
      damage: "hit",
      skill: "cast",
      heal: "heal",
      death: "death",
      summon: "summon",
      revive: "era",
      power: "power",
      phase: "power",
      overtime: "era",
    };
    if (sfx[event.type]) sound.play(sfx[event.type]!);
  }
}

let lastTime = performance.now(),
  uiElapsed = 0,
  saveElapsed = 0;
function frame(now: number) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  if (!document.hidden && !titleOpen) {
    game.tick(dt);
    if (game.battle?.status === "fighting" && game.state.settings.speed > 1)
      game.advanceBattle(dt * (game.state.settings.speed - 1));
    playBattleSounds();
  }
  preview.update(dt);
  uiElapsed += dt;
  saveElapsed += dt;
  if (uiElapsed > 0.4) {
    renderMetrics();
    uiElapsed = 0;
  }
  if (saveElapsed > 5) {
    save();
    saveElapsed = 0;
  }
  const status = game.battle?.status || "";
  if (status !== lastBattleStatus || game.state.progress !== lastProgress) {
    const previous = lastBattleStatus;
    guardianRenderKey = "";
    lastBattleStatus = status;
    lastProgress = game.state.progress;
    renderAll();
    if (status === "victory" || status === "defeat") {
      save();
      if (previous === "fighting")
        sound.play(status === "victory" ? "victory" : "defeat");
      if (
        status === "victory" &&
        game.state.settings.autoRepeat &&
        (game.battle?.stage ?? 0) >= 0
      )
        repeatTimer = window.setTimeout(() => {
          if (game.battle?.status === "victory") startNext();
        }, 1600);
      if (status === "defeat" && game.state.settings.autoRepeat) {
        game.toggleAutoRepeat();
        toast("Derrota: a repetição automática foi desligada.");
      }
    }
  }
  if (game.state.era !== lastVillage) {
    lastVillage = game.state.era;
    renderAll();
  }
  requestAnimationFrame(frame);
}

renderAll();
preview.setReducedMotion(reducedMotion());
renderAudioButton();
if (titleOpen) {
  renderTitle();
  $<HTMLButtonElement>("#title-screen .primary").focus();
} else {
  welcomeBack();
}
try {
  if (sessionStorage.getItem(LOADED_KEY)) {
    sessionStorage.removeItem(LOADED_KEY);
    toast("Jornada carregada. Bem-vindo de volta à fogueira.");
  }
} catch {
  /* nothing to confirm */
}
requestAnimationFrame(frame);
window.addEventListener("beforeunload", () => {
  save();
  world.destroy();
});

document.addEventListener("input", (event) => {
  const input = event.target as HTMLInputElement;
  if (input.id === "tribe-search") {
    const position = input.selectionStart;
    showTribe(tribeTab, input.value);
    const next = $<HTMLInputElement>("#tribe-search");
    next.focus();
    next.setSelectionRange(position, position);
  }
});
document.addEventListener("dragstart", (event) => {
  const hero = (event.target as HTMLElement).closest<HTMLElement>(
    "[data-drag-hero]",
  );
  if (hero) {
    event.dataTransfer?.setData("text/wolf-hero", hero.dataset.dragHero!);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
  }
});
$("#world").addEventListener("dragover", (event) => {
  if (view === "battle" && !game.battle) event.preventDefault();
});
$("#world").addEventListener("drop", async (event) => {
  event.preventDefault();
  if (view !== "battle" || game.battle) return;
  const uid = event.dataTransfer?.getData("text/wolf-hero");
  if (!uid) return;
  const canvas = $<HTMLCanvasElement>("#world canvas"),
    r = canvas.getBoundingClientRect();
  const x = ((event.clientX - r.left) / r.width) * 1200,
    y = ((event.clientY - r.top) / r.height) * 740;
  const nearest = Array.from({ length: FORMATION_SLOTS }, (_, slot) => {
    const cell = allySlotCenter(slot),
      [px, py] = project(cell.x, cell.y);
    return { slot, d: Math.hypot(x - px, y - py) };
  }).sort((a, b) => a.d - b.d)[0];
  if (nearest.d < 70) {
    selectedHero = uid;
    act(game.deploy(uid, nearest.slot), "click");
  } else toast("Solte o herói em uma casa da sua metade do campo.");
});
