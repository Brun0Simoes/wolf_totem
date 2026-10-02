import './animation-preview.css';
import './style.css';
import './refinements.css';
import './ui.css';
import { createIcons, icons } from 'lucide';
import { SoundSystem, type Sfx } from './audio';
import { characters } from './data/characters';
import { ANIMALITY, ANIMALITY_RULES } from './data/animality';
import { FINAL_STAGE, REGIONS, STAGES, regionOf, stageById, stageReward } from './game/campaign';
import { COMPONENTS, ITEMS, MAX_ITEMS_PER_HERO, isComponent, itemById } from './game/items';
import { shopOdds, unlockedCost } from './game/roster';
import { ERA_NAMES, MEMORIES, memoryCost, spiritById, spiritsOfEra, type MemoryId, type SpiritId } from './game/spirits';
import { TRAIT_RULES } from './game/synergies';
import { QUESTS, openQuests, rewardText } from './game/quests';
import { EVENT_TEXT } from './game/events';
import {
  BUILDING_KEYS, Game, GATHER_AMOUNT, MAX_BUILDING_LEVEL, MAX_INVENTORY, REROLL_COST, SKILL_NOTES, WONDER_STAGES, WORK_AFFINITY,
  buildingCost, capacity, embersFor, forgeRate, getRates, getSynergies, pendingEra, recruitCost, shopSize, stageUnlocked, villageCost,
  wonderCost, workerBonus, workerSlots, type ActionResult, type BuildingId, type Hero, type Resource, type Resources,
} from './game/simulation';
import type { MotionClip } from './render/animationModel';
import { CharacterPreview } from './render/CharacterPreview';
import { artFor } from './render/artSource';
import { portraitHTML } from './render/portrait';
import { proceduralImage } from './render/proceduralArt';
import { CHARACTER_ANIMAL, glyphSVG, type AnimalId } from './render/spiritGlyphs';
import { createWorld } from './render/WorldScene';
import { DEFAULT_PREFS, loadPrefs, motionReduced, savePrefs, type Prefs } from './prefs';

const preview = new CharacterPreview();
const sound = new SoundSystem();
const SAVE_KEY = 'wolf-totem-v1';
/** Set right before a reload that starts a fresh journey, so the title screen is skipped once. */
const FRESH_KEY = 'wolf-totem-fresh';
let saved: unknown;
try { saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch { saved = undefined; }
const game = new Game(saved);
const hasJourney = !!saved && typeof saved === 'object';
let freshStart = false;
try { freshStart = sessionStorage.getItem(FRESH_KEY) === '1'; sessionStorage.removeItem(FRESH_KEY); } catch { freshStart = false; }

const storage = (() => { try { return window.localStorage; } catch { return null; } })();
const prefs: Prefs = storage ? loadPrefs(storage) : { ...DEFAULT_PREFS };
const systemMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const reducedMotion = () => motionReduced(prefs, systemMotion.matches);
sound.setVolumes(prefs.sfx, prefs.music);
document.documentElement.classList.toggle('reduce-motion', reducedMotion());

let view: 'village' | 'battle' = 'village';
let selectedHero: string | null = null;
let selectedBuilding: BuildingId = 'lumber';
let selectedItem: number | null = null;
let activeModal = '';
let lastBattleStatus = '';
let lastProgress = game.state.progress;
let lastVillage = game.state.villageLevel;
let lastEventId = 0;
let repeatTimer = 0;
let confirmAscend = false;
let confirmWipe = false;
let confirmNew = false;
let storageFailed = false;
/** While a journey is being erased, nothing may write the old save back. */
let wiping = false;
let titleOpen = !freshStart;

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const icon = (name: string, cls = '') => `<i data-lucide="${name}" class="${cls}"></i>`;
const esc = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const fmt = (value: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Math.floor(value));
const roman = (n: number) => ['I', 'II', 'III', 'IV', 'V'][n - 1] ?? String(n);
const refreshIcons = () => createIcons({ icons, attrs: { 'stroke-width': 1.6, 'aria-hidden': 'true' } });
const characterOf = (id: number) => characters.find(c => c.id === id)!;
const RESOURCES: { id: Resource; name: string; icon: string }[] = [
  { id: 'wood', name: 'Madeira', icon: 'tree-pine' }, { id: 'food', name: 'Alimento', icon: 'wheat' },
  { id: 'stone', name: 'Pedra', icon: 'mountain' }, { id: 'spirit', name: 'Espírito', icon: 'flame' },
];
const BUILDINGS: Record<BuildingId, { name: string; desc: string; icon: string; resource?: Resource }> = {
  lumber: { name: 'Bosque dos coletores', desc: 'A madeira sustenta o crescimento da aldeia.', icon: 'trees', resource: 'wood' },
  hunt: { name: 'Acampamento de caça', desc: 'Alimento para uma tribo cada vez maior.', icon: 'crosshair', resource: 'food' },
  quarry: { name: 'Pedreira ancestral', desc: 'Pedras para construir o que vai permanecer.', icon: 'mountain', resource: 'stone' },
  shrine: { name: 'Círculo dos espíritos', desc: 'A chama atrai novos guardiões para a tribo.', icon: 'flame', resource: 'spirit' },
  forge: { name: 'Forja de Osso', desc: 'Ossos, couro e penas viram componentes de itens. Também combina componentes na bolsa.', icon: 'anvil' },
};
const costHTML = (cost: Resources) => RESOURCES.filter(r => cost[r.id] > 0).map(r => `<span title="${r.name}">${icon(r.icon)}${fmt(cost[r.id])}</span>`).join('');
const costAttr = (cost: Resources) => `data-cost='${JSON.stringify(cost)}'`;
const itemChip = (id: string, attrs = '', extra = '') => {
  const item = itemById(id)!;
  return `<button class="item-chip ${item.kind}${extra}" style="--item:${item.color}" title="${esc(`${item.name}: ${item.text}`)}" ${attrs}><span class="item-gem"></span><span class="item-name">${esc(item.name)}</span></button>`;
};
const spiritGlyph = (id: SpiritId, label = true) => { const spirit = spiritById(id)!; return glyphSVG(spirit.animal as AnimalId, spirit.color, label ? spirit.name : ''); };

$('#app').innerHTML = `
 <header class="topbar">
  <a class="brand" href="#" aria-label="Wolf Totem, início"><span class="brand-mark">${icon('dog')}</span><span>WOLF <b>TOTEM</b><small>O DESPERTAR DA TRIBO</small></span></a>
  <div class="resources" aria-label="Recursos da aldeia">${RESOURCES.map(r => `<div class="resource ${r.id}" title="${r.name}"><span class="resource-icon">${icon(r.icon)}</span><div><small>${r.name}</small><strong id="res-${r.id}">0</strong></div><span class="rate" id="rate-${r.id}"></span></div>`).join('')}<div class="resource embers" id="embers-chip" title="Brasas ancestrais" hidden><span class="resource-icon">${icon('sparkles')}</span><div><small>Brasas</small><strong id="res-embers">0</strong></div></div></div>
  <div class="header-actions"><button class="icon-button" data-action="audio" aria-label="Ativar sons" title="Sons e música">${icon('volume-x')}</button><button class="icon-button" data-action="pause" aria-label="Pausar jogo" title="Pausar (P)">${icon('pause')}</button><button class="icon-button" data-action="settings" aria-label="Ajuda e salvamento" title="Ajuda e salvamento">${icon('settings-2')}</button></div>
 </header>
 <div class="game-shell">
  <nav class="rail" aria-label="Navegação principal"><div class="nav-group">
   <button class="nav-button active" data-view="village">${icon('tent-tree')}<span>Aldeia</span></button>
   <button class="nav-button" data-view="battle">${icon('swords')}<span>Expedição</span></button>
   <button class="nav-button" data-action="codex">${icon('book-open')}<span>Códice</span></button>
   <button class="nav-button" data-action="ancestors">${icon('landmark')}<span>Totem</span></button>
  </div><div class="rail-bottom"><span class="vertical-caption">SIGA O CHAMADO</span><span class="rail-seal" id="rail-era">I</span></div></nav>
  <main class="main-area">
   <div class="play-area"><section class="world-wrap" aria-label="Mundo da tribo">
    <div id="world"></div>
    <div class="world-heading"><p class="eyebrow" id="era-label"></p><h1 id="world-title"></h1><p id="world-subtitle"></p></div>
    <div class="world-badge"><span class="live-dot"></span><span id="world-badge-text">Clareira do Lobo</span>${icon('sun')}</div>
    <div class="world-caption"><span class="map-coordinate">23° N &nbsp; / &nbsp; 07° L</span><span id="world-hint"></span></div>
    <div id="power-bar" class="power-bar" hidden></div>
    <div id="event-card" class="event-card" hidden></div>
    <div id="pause-overlay" class="pause-overlay" hidden><span>${icon('pause')}O tempo descansa.</span><button class="primary" data-action="pause">Retomar jornada</button></div>
    <div id="battle-result" class="battle-result" hidden></div>
   </section><aside class="side-panel" id="side-panel" aria-label="Ações"></aside></div>
   <section class="camp-section"><div class="section-heading"><div><p class="eyebrow">HERÓIS & ESPÍRITOS</p><h2 id="camp-title">Ao redor da fogueira</h2></div><button class="text-button" data-action="reroll" id="reroll">${icon('refresh-cw')}Novos viajantes <span class="small-cost">${REROLL_COST.spirit} ${icon('flame')}</span></button></div><div id="camp-content"></div></section>
   <footer><span><span class="live-dot"></span><span id="save-status">Progresso salvo neste navegador</span></span><span>WOLF TOTEM <b>·</b> VERSÃO 1.2</span><button class="text-button" data-action="help">Guia da tribo ${icon('arrow-up-right')}</button></footer>
  </main>
 </div>
 <div id="toast" class="toast" role="status" aria-live="polite"></div>
 <div id="title-screen" class="title-screen" role="dialog" aria-modal="true" aria-labelledby="title-name" ${titleOpen ? '' : 'hidden'}></div>
 <dialog id="modal"><div id="modal-content"></div></dialog>
 <input id="save-file" type="file" accept="application/json,.json" hidden />`;

const world = createWorld($('#world'), game, {
  onBuilding(id) { selectedBuilding = id; if (view !== 'village') setView('village'); else renderSide(); },
  onSlot(slot) {
    if (!selectedHero) return toast('Escolha um herói abaixo e depois uma posição.');
    act(game.deploy(selectedHero, slot), 'click');
  },
}, { reducedMotion: reducedMotion(), numbers: prefs.numbers });

let toastTimer = 0;
function toast(message: string) {
  $('#toast').textContent = message; $('#toast').classList.add('show');
  window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => $('#toast').classList.remove('show'), 3500);
}
function save() {
  if (wiping) return;
  try { localStorage.setItem(SAVE_KEY, game.serialize()); storageFailed = false; }
  catch { storageFailed = true; }
  $('#save-status').textContent = storageFailed ? 'Salvamento indisponível · exporte sua jornada' : game.state.paused ? 'Jornada pausada' : 'Progresso salvo neste navegador';
}
function act(result: ActionResult, sfx: Sfx = 'upgrade') {
  toast(result.message);
  if (result.ok) { sound.play(sfx); save(); }
  renderAll();
}
function setView(next: typeof view) {
  view = next; selectedItem = null; sound.mood = next === 'battle' ? 'battle' : 'village';
  world.setView(view); renderAll();
}

function renderMetrics() {
  const rates = getRates(game.state);
  for (const r of RESOURCES) {
    $(`#res-${r.id}`).textContent = fmt(game.state.resources[r.id]);
    $(`#rate-${r.id}`).textContent = `+${rates[r.id].toLocaleString('pt-BR', { maximumFractionDigits: 1 })}/s`;
  }
  $('#embers-chip').hidden = !game.state.embers && !game.state.rebirths;
  const claimable = openQuests(game.state).some(q => q.done(game.state));
  document.querySelector('.nav-button[data-view="village"]')?.classList.toggle('has-reward', claimable || !!game.state.event);
  for (const r of RESOURCES) {
    const omen = game.state.omen?.resource === r.id && game.state.clock < game.state.omen.until;
    document.querySelector(`.resource.${r.id}`)?.classList.toggle('omen', omen);
  }
  renderEvent();
  $('#res-embers').textContent = fmt(game.state.embers);
  $('#pause-overlay').hidden = !game.state.paused;
  const pause = $('[data-action="pause"]');
  if (pause.dataset.paused !== String(game.state.paused)) {
    pause.dataset.paused = String(game.state.paused); pause.innerHTML = icon(game.state.paused ? 'play' : 'pause');
    pause.setAttribute('aria-label', game.state.paused ? 'Retomar jogo' : 'Pausar jogo'); refreshIcons();
  }
  document.querySelectorAll<HTMLButtonElement>('[data-cost]').forEach(b => {
    const cost = JSON.parse(b.dataset.cost!) as Resources;
    b.disabled = b.dataset.max === 'true' || !game.canAfford(cost) || game.state.paused || !!(b.dataset.lockBattle && game.battle?.status === 'fighting');
  });
  const forge = document.querySelector<HTMLElement>('#forge-progress');
  if (forge) forge.style.setProperty('--progress', String(game.state.forgeProgress));
  const bag = document.querySelector<HTMLElement>('#bag-count');
  if (bag) bag.textContent = `${game.state.inventory.length}/${MAX_INVENTORY}`;
  renderPowers();
}

function objective(): { title: string; text: string } {
  const s = game.state;
  if (pendingEra(s)) return { title: 'Uma nova era desperta.', text: 'Escolha o Espírito Protetor desta era para receber seu poder.' };
  if (s.villageLevel === 1 && s.progress >= 4) return { title: 'Cresça antes do Alfa.', text: 'Evolua a aldeia: mais um herói na formação e viajantes de custo 2.' };
  if (s.progress < FINAL_STAGE) {
    const next = stageById(s.progress + 1)!, region = regionOf(next.id);
    if (region.village > s.villageLevel) return { title: `${region.name} aguarda.`, text: `Alcance a aldeia de nível ${region.village} para entrar nesta região.` };
    return { title: `Expedição ${region.id}·${next.index}: ${next.name}.`, text: next.index === 5 ? `Chefe: ${region.boss}. Prepare sua melhor formação.` : region.subtitle };
  }
  if (s.wonder < WONDER_STAGES) return { title: 'Erga o Grande Totem.', text: `Parte ${s.wonder + 1} de ${WONDER_STAGES}. Ao completá-lo, a tribo pode renascer mais forte.` };
  return { title: 'Os ancestrais chamam.', text: 'Renasça no Totem para ganhar brasas, ou aprofunde a Caçada Eterna.' };
}

/** The next journal objective, or the general next step once the journal is complete. */
function journalHTML(goal: { title: string; text: string }): string {
  const quest = openQuests(game.state)[0];
  const done = QUESTS.length - openQuests(game.state).length;
  if (!quest) return `<div class="objective"><span class="objective-symbol">${icon('compass')}</span><div><small>O PRÓXIMO PASSO</small><strong>${esc(goal.title)}</strong><p>${esc(goal.text)}</p></div></div>`;
  const ready = quest.done(game.state);
  return `<div class="objective journal ${ready ? 'ready' : ''}"><span class="objective-symbol">${icon(ready ? 'gift' : 'scroll-text')}</span><div>
   <small>DIÁRIO DA TRIBO · ${done}/${QUESTS.length}</small><strong>${esc(quest.title)}</strong><p>${esc(quest.hint)}</p>
   <p class="quest-reward">${icon('gift')} ${esc(rewardText(quest.reward))}</p>
   <div class="quest-actions">${ready ? `<button class="primary compact" data-quest="${quest.id}">Receber recompensa</button>` : ''}<button class="text-button" data-action="journal">Ver diário ${icon('arrow-right')}</button></div></div></div>`;
}

function showJournal() {
  const open = openQuests(game.state), next = open[0]?.id;
  showModal('journal', `<p class="eyebrow">DIÁRIO DA TRIBO</p><h2>Os caminhos da tribo</h2><p class="modal-intro">Objetivos em ordem: os primeiros ensinam o jogo, os últimos apontam o próximo grande marco. As recompensas recebidas valem para sempre, mesmo depois de um renascimento.</p>
   <ol class="journal-list">${QUESTS.map(q => {
     const claimed = game.state.quests.includes(q.id), ready = !claimed && q.done(game.state);
     return `<li class="${claimed ? 'claimed' : ready ? 'ready' : q.id === next ? 'current' : ''}"><span class="quest-mark">${claimed ? icon('check') : ready ? icon('gift') : ''}</span><div><b>${esc(q.title)}</b><p>${esc(q.hint)}</p><small>${icon('gift')} ${esc(rewardText(q.reward))}</small></div>${ready ? `<button class="primary compact" data-quest="${q.id}">Receber</button>` : ''}</li>`;
   }).join('')}</ol>`);
}

function renderSide() {
  if (view === 'village') renderVillageSide(); else renderBattleSide();
  refreshIcons(); renderMetrics();
}

function renderVillageSide() {
  const s = game.state, id = selectedBuilding, b = BUILDINGS[id], level = s.buildings[id];
  const cost = buildingCost(id, level), vc = villageCost(s.villageLevel), goal = objective(), era = pendingEra(s);
  const rate = b.resource ? getRates(s)[b.resource] : 0;
  const workers = s.heroes.filter(h => h.work === id), slots = workerSlots(s, id);
  const idle = s.heroes.filter(h => h.slot === null && h.work === null);
  const forgeLine = id === 'forge'
    ? level ? `<div class="production-line">${icon('anvil')} 1 componente a cada ${Math.max(1, Math.round(1 / forgeRate(s) / 60))} min<span class="forge-bar" id="forge-progress" style="--progress:${s.forgeProgress}"></span></div>` : '<div class="production-line muted">Ainda não construída. Exige aldeia nível 2.</div>'
    : `<div class="production-line">${icon(b.icon)} +${rate.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${RESOURCES.find(r => r.id === b.resource)!.name.toLowerCase()}/s</div>`;
  $('#side-panel').innerHTML = `
   <div class="panel-kicker">SUA ALDEIA <span>ERA ${roman(s.villageLevel)}</span></div>
   <div class="village-summary"><span class="large-seal">${icon('tent-tree')}</span><h2>Clã da Primeira Chama</h2><p>${s.heroes.length} heróis · ${capacity(s)} vagas na formação</p>
    ${s.spirits.length ? `<div class="spirit-row">${s.spirits.map(sp => `<span class="spirit-badge" title="${esc(`${spiritById(sp)!.name}: ${spiritById(sp)!.passiveText}`)}">${spiritGlyph(sp)}</span>`).join('')}</div>` : ''}</div>
   ${era ? `<div class="objective urgent"><span class="objective-symbol">${icon('sparkles')}</span><div><small>O PRÓXIMO PASSO</small><strong>${esc(goal.title)}</strong><p>${esc(goal.text)}</p><button class="primary compact" data-action="spirit-choice">${icon('feather')}Escolher espírito da Era ${roman(era)}</button></div></div>` : journalHTML(goal)}
   <div class="building-tabs">${BUILDING_KEYS.map(key => `<button data-building="${key}" class="${key === id ? 'active' : ''}" title="${BUILDINGS[key].name}" aria-label="${BUILDINGS[key].name}">${icon(BUILDINGS[key].icon)}</button>`).join('')}</div>
   <div class="building-details"><div class="detail-heading"><h3>${b.name}</h3><span>${level ? `NV. ${level}` : 'A CONSTRUIR'}</span></div><p>${b.desc}</p>${forgeLine}
    <button class="outline-button" data-action="building-upgrade" data-max="${level >= MAX_BUILDING_LEVEL}" ${costAttr(cost)}>${icon('hammer')} ${level >= MAX_BUILDING_LEVEL ? 'Nível máximo' : level ? 'Melhorar' : 'Construir'} <span class="cost">${costHTML(cost)}</span></button>
    ${level ? `<div class="workers"><div class="workers-title">TRABALHADORES <b>${workers.length}/${slots}</b><span title="Afinidade: ${WORK_AFFINITY[id].join(', ')}">${icon('info')}</span></div>
     ${workers.map(h => `<div class="worker"><span class="worker-glyph">${glyphSVG(CHARACTER_ANIMAL[h.characterId], '#c9d3a8')}</span><span>${characterOf(h.characterId).name} ${'★'.repeat(h.stars)}</span><em>+${Math.round(workerBonus(h, id) * 100)}%</em><button class="icon-button tiny" data-unassign="${h.uid}" aria-label="Dispensar ${characterOf(h.characterId).name}">${icon('x')}</button></div>`).join('')}
     ${workers.length < slots ? idle.length ? `<div class="assign-row"><select id="worker-select" aria-label="Herói para trabalhar">${idle.map(h => `<option value="${h.uid}">${characterOf(h.characterId).name} ${'★'.repeat(h.stars)} · +${Math.round(workerBonus(h, id) * 100)}%</option>`).join('')}</select><button class="outline-button" data-action="assign">${icon('user-plus')}Designar</button></div>` : '<p class="muted small">Heróis na reserva podem trabalhar aqui.</p>' : ''}</div>` : ''}
   </div>
   <div class="gather-title">DA TERRA, NOSSO SUSTENTO</div>
   <div class="gather-buttons">${RESOURCES.filter(r => r.id !== 'spirit').map(r => `<button data-gather="${r.id}" title="Coletar ${r.name.toLowerCase()}">${icon(r.icon)}<span>${r.name}</span><b>+${GATHER_AMOUNT[r.id] * s.villageLevel}</b></button>`).join('')}</div>
   <div class="village-upgrade">${s.villageLevel < 5 ? `<button class="primary" data-action="village-upgrade" ${costAttr(vc)}>${icon('chevrons-up')}Avançar para a Era ${roman(s.villageLevel + 1)} <span>Nv. ${s.villageLevel + 1}</span></button><div class="upgrade-cost cost">${costHTML(vc)}</div>` : `<button class="outline-button" data-action="ancestors">${icon('landmark')} Grande Totem · ${s.wonder}/${WONDER_STAGES}</button>`}</div>`;
}

/** The battle on screen (an expedition, the endless hunt or a raid), else the next selected expedition. */
function encounter() {
  const b = game.battle;
  if (b) {
    const units = b.entities.filter(e => e.team === 'enemy' && !e.summon).map(e => ({ id: e.characterId, stars: e.stars, boss: e.boss }));
    return { id: b.stage, name: b.name, region: b.stage > 0 ? regionOf(b.stage) : b.stage < 0 ? regionOf(Math.max(1, b.region * 5)) : null, index: b.stage > 0 ? stageById(b.stage)!.index : 0, units, depth: b.depth, raid: b.stage < 0 };
  }
  const { stage, depth } = game.nextStage();
  return { id: stage.id, name: stage.name, region: stage.id ? regionOf(stage.id) : null, index: stage.index, units: stage.units, depth, raid: false };
}

function enemyPreview(): string {
  const stage = encounter();
  return `<div class="enemy-preview">${stage.units.map(u => `<span class="enemy-chip ${u.boss ? 'boss' : ''}" title="${characterOf(u.id).name} ${'★'.repeat(u.stars)}${u.boss ? ' · chefe' : ''}">${glyphSVG(CHARACTER_ANIMAL[u.id], u.boss ? '#e3b46b' : '#d0a38a')}<b>${'★'.repeat(u.stars)}</b></span>`).join('')}</div>`;
}

function renderBattleSide() {
  const s = game.state, deployed = s.heroes.filter(h => h.slot !== null), syn = getSynergies(s);
  const stage = encounter(), depth = stage.depth, region = stage.region;
  const fighting = game.battle?.status === 'fighting';
  const reward = stage.id > 0 ? stageReward(stage.id, stage.id <= s.progress && !(game.battle?.firstClear)) : null;
  $('#side-panel').innerHTML = `
   <div class="panel-kicker">${stage.raid ? 'DEFESA' : 'EXPEDIÇÃO'} <span>${stage.raid ? 'ALDEIA' : stage.id ? `${region!.id}·${stage.index} · ${s.progress}/${FINAL_STAGE}` : `∞ · ${depth}`}</span></div>
   <div class="stage-card">
    <p class="eyebrow">${stage.raid ? 'INCURSÃO NA ALDEIA' : stage.id ? esc(region!.name.toUpperCase()) : 'CAÇADA ETERNA'}</p>
    <h2>${esc(stage.name)}</h2>
    ${enemyPreview()}
    <p class="stage-reward">${stage.raid ? 'Vitória: recursos e um componente garantido.' : reward ? `${stage.id <= s.progress && !game.battle?.firstClear ? 'Repetição' : 'Primeira vitória'}: <span class="cost">${costHTML(reward)}</span>` : `Recorde: ${s.endlessBest} · cada vitória aprofunda a caçada`}</p>
    <button class="outline-button" data-action="map" ${fighting ? 'disabled' : ''}>${icon('map')}Mapa das expedições <kbd>M</kbd></button>
   </div>
   <div class="formation-count"><span>Sua formação</span><strong>${deployed.length}<small> / ${capacity(s)}</small></strong></div>
   <div class="synergies"><p class="eyebrow">LAÇOS DA TRIBO</p>${syn.length ? syn.slice(0, 5).map(t => `<div class="synergy ${t.active ? 'active' : ''}" title="${esc(t.description)}">${icon(t.active ? 'diamond' : 'hexagon')}<span>${esc(t.name)}${t.tier > 1 ? ` <i class="synergy-tier">${'◆'.repeat(t.tier)}</i>` : ''}</span><b>${t.count}/${t.threshold}</b></div>`).join('') : '<p>Reúna heróis que compartilham características.</p>'}</div>
   <div class="battle-controls">
    <button class="primary" data-action="battle-start" ${!deployed.length || game.battle !== null || s.paused || !stageUnlocked(s, s.selectedStage) ? 'disabled' : ''}>${icon('swords')}${fighting ? 'Expedição em andamento' : 'Iniciar expedição'}${icon('arrow-right')}</button>
    <div class="control-row">
     <button class="outline-button" data-action="speed" title="Velocidade do combate">${icon('fast-forward')}${s.settings.speed}×</button>
     <button class="outline-button ${s.settings.autoRepeat ? 'on' : ''}" data-action="auto-repeat" aria-pressed="${s.settings.autoRepeat}" title="Repetir automaticamente após cada vitória">${icon('repeat')}Repetir</button>
    </div>
   </div>`;
}

function renderPowers() {
  const bar = $('#power-bar'), battle = game.battle;
  const show = view === 'battle' && game.state.spirits.length > 0;
  bar.hidden = !show;
  if (!show) return;
  const key = `${battle?.status ?? 'none'}|${battle?.powersUsed.join(',') ?? ''}|${game.state.spirits.join(',')}|${game.state.paused}`;
  if (bar.dataset.key === key) return;
  bar.dataset.key = key;
  bar.innerHTML = `<span class="power-label">PODERES</span>${game.state.spirits.map(id => {
    const spirit = spiritById(id)!, used = battle?.powersUsed.includes(id) ?? false;
    return `<button class="power-button ${used ? 'used' : ''}" data-power="${id}" ${battle?.status !== 'fighting' || used || game.state.paused ? 'disabled' : ''} title="${esc(`${spirit.power.name}: ${spirit.power.text}`)}" style="--spirit:${spirit.color}">${spiritGlyph(id, false)}<span>${esc(spirit.power.name)}</span></button>`;
  }).join('')}`;
}

/** The village event card, with its countdown; raids can also be answered from the expedition view. */
function renderEvent() {
  const card = $('#event-card'), event = game.state.event;
  const show = !!event && (view === 'village' || (event.kind === 'raid' && !game.battle));
  card.hidden = !show;
  if (!show || !event) { card.dataset.key = ''; return; }
  const left = Math.max(0, Math.ceil(event.expires - game.state.clock));
  const key = `${event.kind}|${event.expires}|${left}|${game.state.paused}`;
  if (card.dataset.key === key) return;
  card.dataset.key = key;
  const text = EVENT_TEXT[event.kind];
  const detail = event.kind === 'merchant' ? `<div class="event-offer">${itemChip(event.item!)}<span class="cost">${costHTML(event.price!)}</span></div>`
    : event.kind === 'omen' ? `<p class="event-detail">+60% de ${RESOURCES.find(r => r.id === event.resource)!.name.toLowerCase()} por 3 minutos.</p>`
    : event.kind === 'traveler' ? `<p class="event-detail">${portraitHTML(characterOf(event.characterId!))}<span><b>${characterOf(event.characterId!).name}</b>, ${characterOf(event.characterId!).title} · custo ${characterOf(event.characterId!).cost}</span></p>`
    : '<p class="event-detail">Vencer rende recursos e um componente. O tributo custa 10% do alimento e do espírito; ignorar custa 6% da madeira e do alimento.</p>';
  card.className = `event-card ${event.kind}`;
  card.innerHTML = `<div class="event-head"><span class="eyebrow">ACONTECIMENTO</span><span class="event-timer">${icon('hourglass')}${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}</span></div><h3>${text.title}</h3><p>${text.text}</p>${detail}
   <div class="event-actions"><button class="primary compact" data-event="accept" ${event.kind === 'merchant' && !game.canAfford(event.price!) ? 'disabled' : ''}>${text.accept}</button><button class="outline-button" data-event="decline">${text.decline}</button></div>`;
  refreshIcons();
}

function heroStatus(h: Hero): string {
  if (h.slot !== null) return `Posição ${h.slot + 1}`;
  if (h.work) return `Trabalhando · ${BUILDINGS[h.work].name.split(' ')[0]}`;
  return 'Reserva';
}

function renderCamp() {
  $('#camp-title').textContent = view === 'village' ? 'Ao redor da fogueira' : 'A força da sua tribo';
  $('#reroll').hidden = view !== 'village';
  if (view === 'village') {
    const odds = shopOdds(game.state.villageLevel).map((p, i) => p ? `<span class="odds cost-${i + 1}" title="Custo ${i + 1}">${i + 1}<b>${p}%</b></span>` : '').join('');
    $('#camp-content').innerHTML = `<div class="recruit-grid" style="--shop:${shopSize(game.state)}">${game.state.shop.map(id => {
      const c = characterOf(id), cost = recruitCost(id, game.state);
      const owned = game.state.heroes.filter(h => h.characterId === id && h.stars === 1).length;
      return `<article class="recruit-card cost-${c.cost}"><div class="card-glow"></div><button class="hero-art-button" data-character="${id}" aria-label="Conhecer ${c.name}">${portraitHTML(c)}</button><div class="recruit-copy"><div class="hero-star">${'◆'.repeat(c.cost)} <span>CUSTO ${c.cost}${owned ? ` · ${owned}/3` : ''}</span></div><button class="hero-name" data-character="${id}">${c.name}</button><p>${c.title}</p><div class="trait-line">${icon(c.range > 1 ? 'crosshair' : 'swords')}${esc(c.traits.slice(0, 2).join(' · '))}</div><button class="recruit-button ${owned === 2 ? 'merge' : ''}" data-recruit="${id}" ${costAttr(cost)} data-lock-battle="true">${owned === 2 ? 'Evoluir' : 'Recrutar'} <span class="cost">${costHTML(cost)}</span></button></div></article>`;
    }).join('')}</div><div class="camp-note">${icon('combine')}3 cópias iguais se unem em um herói mais forte.<span class="shop-odds" aria-label="Chances de cada custo nesta aldeia">${odds}</span><button class="text-button" data-view="battle">Organizar minha tribo ${icon('arrow-right')}</button></div>`;
  } else {
    const inv = game.state.inventory, selected = selectedItem !== null ? inv[selectedItem] : undefined;
    $('#camp-content').innerHTML = `<div class="party-list">${game.state.heroes.map(h => {
      const c = characterOf(h.characterId);
      return `<div class="party-card ${h.uid === selectedHero ? 'selected' : ''} ${h.slot !== null ? 'deployed' : ''} ${h.work ? 'working' : ''} ${selected ? 'can-equip' : ''}">
       <button class="party-select" data-hero="${h.uid}" aria-pressed="${h.uid === selectedHero}">${portraitHTML(c, h.stars)}<span><b>${c.name}</b><small>${'★'.repeat(h.stars)}</small><em>${heroStatus(h)}</em></span></button>
       <div class="item-slots">${Array.from({ length: MAX_ITEMS_PER_HERO }, (_, i) => h.items[i] ? `<button class="slot filled" style="--item:${itemById(h.items[i])!.color}" data-unequip="${h.uid}:${i}" title="${esc(`${itemById(h.items[i])!.name}: ${itemById(h.items[i])!.text} · clique para guardar`)}"></button>` : '<span class="slot"></span>').join('')}</div>
       <button class="party-info" data-character="${c.id}" data-stars="${h.stars}" title="Ver ${c.name}" aria-label="Ver detalhes de ${c.name}">${icon('info')}</button>
       ${h.slot !== null ? `<button class="bench-button" data-bench="${h.uid}" title="Mover para reserva" aria-label="Mover ${c.name} para reserva">${icon('minus')}</button>` : ''}
      </div>`;
    }).join('')}</div>
    <div class="bag"><div class="bag-title">${icon('backpack')}BOLSA DA TRIBO <b id="bag-count">${inv.length}/${MAX_INVENTORY}</b><span>${selected ? isComponent(selected) && game.state.buildings.forge > 0 ? 'Toque num herói para equipar ou noutro componente para forjar.' : 'Toque num herói para equipar.' : 'Itens vêm das expedições e da Forja de Osso. Dois componentes no mesmo herói formam um item.'}</span></div>
     <div class="bag-items">${inv.length ? inv.map((id, i) => itemChip(id, `data-inv="${i}" aria-pressed="${i === selectedItem}"`, i === selectedItem ? ' selected' : selected && isComponent(selected) && isComponent(id) && i !== selectedItem ? ' combinable' : '')).join('') : '<p class="muted small">Vazia por enquanto.</p>'}</div></div>
    <div class="camp-note">${icon('mouse-pointer-2')}${selectedHero ? 'Agora escolha uma casa no campo.' : 'Escolha um herói para posicioná-lo no campo.'}${selectedHero ? `<div class="position-controls"><select id="formation-slot" aria-label="Posição no campo">${Array.from({ length: 12 }, (_, slot) => `<option value="${slot}">Posição ${slot + 1}${game.state.heroes.some(h => h.slot === slot) ? ' · ocupada' : ''}</option>`).join('')}</select><button class="outline-button" data-action="place-selected">Posicionar</button><button class="outline-button" data-action="sell-selected" title="Libera o herói e devolve espírito">${icon('user-minus')}Liberar</button></div>` : ''}<button class="text-button" data-view="village">Recrutar viajantes ${icon('arrow-right')}</button></div>`;
  }
  refreshIcons();
}

function renderAll() {
  if (selectedHero && !game.state.heroes.some(h => h.uid === selectedHero)) selectedHero = null;
  if (selectedItem !== null && selectedItem >= game.state.inventory.length) selectedItem = null;
  document.querySelectorAll<HTMLButtonElement>('.nav-button[data-view]').forEach(n => n.classList.toggle('active', n.dataset.view === view));
  const s = game.state, stage = encounter();
  $('#rail-era').textContent = roman(s.villageLevel);
  $('#era-label').textContent = view === 'village' ? `ERA ${ERA_NAMES[s.villageLevel - 1].toUpperCase()}` : stage.raid ? 'DEFESA DA ALDEIA' : `EXPEDIÇÕES · ${stage.region ? stage.region.name.toUpperCase() : 'CAÇADA ETERNA'}`;
  $('#world-title').textContent = view === 'village' ? ['O primeiro fogo.', 'O chamado dos espíritos.', 'A floresta desperta.', 'As grandes manadas.', 'A era dos ancestrais.'][s.villageLevel - 1] : stage.name + '.';
  $('#world-subtitle').textContent = view === 'village' ? 'Uma pequena chama. O início de uma grande tribo.' : stage.raid ? 'Saqueadores rondam as cabanas. A tribo defende o que construiu.' : stage.region ? stage.region.subtitle : 'Feras cada vez mais fortes. Até onde a tribo chega?';
  $('#world-badge-text').textContent = view === 'village' ? 'Clareira do Lobo' : game.battle?.status === 'fighting' ? `Em combate · ${s.settings.speed}×` : 'Preparação';
  $('#world-hint').textContent = view === 'village' ? 'Selecione uma construção para evoluir sua aldeia.' : 'Selecione um herói abaixo e uma posição no campo.';
  renderSide(); renderCamp(); renderMetrics(); renderResult();
}

function renderResult() {
  const b = game.battle, el = $('#battle-result');
  el.hidden = !b || b.status === 'fighting' || view !== 'battle';
  if (el.hidden || !b) return;
  const victory = b.status === 'victory';
  const repeating = victory && game.state.settings.autoRepeat;
  el.innerHTML = `<span class="result-icon">${icon(victory ? 'crown' : 'shield')}</span><p class="eyebrow">${victory ? b.firstClear ? 'PRIMEIRA VITÓRIA' : 'A TRIBO PERMANECE' : 'OS ESPÍRITOS ENSINAM'}</p><h2>${victory ? b.stage < 0 ? 'A aldeia está a salvo.' : b.stage === 0 ? `Profundidade ${b.depth} vencida.` : 'Uma nova conquista.' : b.stage < 0 ? 'Os saqueadores escaparam.' : 'É hora de reagrupar.'}</h2>
   <p>${victory ? `${esc(b.name)} concluída. Sua aldeia recebe os frutos da jornada.` : 'Evolua heróis, troque itens, busque sinergias ou use os poderes espirituais.'}</p>
   ${b.reward ? `<div class="reward cost">${costHTML(b.reward)}</div>` : ''}
   ${b.loot.length ? `<div class="loot">${b.loot.map(id => itemChip(id)).join('')}</div>` : ''}
   ${summaryHTML(b)}
   ${repeating ? `<p class="small muted">${icon('repeat')} Repetindo automaticamente…</p>` : ''}
   <div class="result-actions"><button class="outline-button" data-action="battle-dismiss">${b.stage < 0 ? 'Voltar à aldeia' : victory ? 'Voltar à preparação' : 'Preparar novamente'}</button>${victory && b.stage >= 0 ? `<button class="primary" data-action="battle-again">${b.stage === 0 ? 'Mais fundo' : game.state.selectedStage === b.stage ? 'Repetir' : 'Próxima expedição'}${icon('arrow-right')}</button>` : ''}</div>`;
  refreshIcons();
}

/** TFT-style recap: who dealt, absorbed and healed the most. */
function summaryHTML(b: NonNullable<typeof game.battle>): string {
  const allies = b.entities.filter(e => e.team === 'ally' && !e.summon).sort((x, y) => y.dealt - x.dealt);
  if (!allies.length) return '';
  const top = Math.max(1, ...allies.map(e => Math.max(e.dealt, e.taken, e.healed + e.shielded)));
  const bar = (value: number, kind: string, label: string) => `<span class="sum-bar ${kind}" style="--w:${Math.max(2, value / top * 100)}%" title="${label}: ${fmt(value)}"></span>`;
  return `<details class="battle-summary" ${allies.length ? 'open' : ''}><summary>Resumo da batalha</summary>
   <div class="sum-legend"><span class="dealt">Dano causado</span><span class="taken">Recebido</span><span class="support">Cura e escudo</span></div>
   ${allies.map((e, i) => `<div class="sum-row ${e.hp <= 0 ? 'fallen' : ''}"><span class="sum-name">${i === 0 && e.dealt > 0 ? icon('crown') : ''}${esc(characterOf(e.characterId).name)} <small>${'★'.repeat(e.stars)}</small></span>
    <span class="sum-bars">${bar(e.dealt, 'dealt', 'Dano causado')}${bar(e.taken, 'taken', 'Dano recebido')}${e.healed + e.shielded > 0 ? bar(e.healed + e.shielded, 'support', 'Cura e escudo') : ''}</span><b>${fmt(e.dealt)}</b></div>`).join('')}
  </details>`;
}

function showModal(name: string, html: string) {
  preview.clear(); activeModal = name;
  $('#modal-content').innerHTML = `<button class="modal-close icon-button" data-action="close" aria-label="Fechar">${icon('x')}</button>${html}`;
  if (!$<HTMLDialogElement>('#modal').open) $<HTMLDialogElement>('#modal').showModal();
  $('#modal').scrollTop = 0; refreshIcons();
}
const closeModal = () => { $<HTMLDialogElement>('#modal').close(); activeModal = ''; };

function codexTabs(active: string) {
  return `<div class="codex-tabs">${[['heroes', 'Heróis', 'users'], ['items', 'Itens', 'backpack'], ['spirits', 'Espíritos', 'feather'], ['traits', 'Laços', 'diamond']].map(([id, label, ic]) => `<button data-codex="${id}" class="${id === active ? 'active' : ''}">${icon(ic)}${label}</button>`).join('')}</div>`;
}

function showCodex(cost = 0, query = '') {
  const list = characters.filter(c => (!cost || c.cost === cost) && `${c.name} ${c.title} ${c.traits.join(' ')}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  showModal('codex', `<p class="eyebrow">O MUNDO DE WOLF TOTEM</p><h2>Memórias dos espíritos</h2>${codexTabs('heroes')}
   <div class="codex-tools"><label class="search">${icon('search')}<input id="codex-search" placeholder="Buscar herói ou característica" value="${esc(query)}" aria-label="Buscar no códice"/></label><div class="cost-filters">${[0, 1, 2, 3, 4, 5].map(n => `<button data-filter="${n}" class="${cost === n ? 'active' : ''}">${n === 0 ? 'Todos' : `Custo ${n}`}</button>`).join('')}</div></div>
   <div class="codex-grid">${list.map(c => `<button class="codex-card cost-${c.cost}" data-character="${c.id}">${portraitHTML(c)}<span class="codex-cost">${c.cost}</span><span class="codex-name">${c.name}<small>${c.title}</small></span><span class="codex-status">${c.cost <= unlockedCost(game.state.villageLevel) ? 'Recrutável na fogueira' : `Era ${roman(c.cost)}`} · ${ANIMALITY[c.id].category}</span></button>`).join('') || '<p>Nenhum espírito encontrado com essa busca.</p>'}</div>`);
  $('#modal').dataset.filter = String(cost);
}

function showItemsCodex() {
  showModal('codex', `<p class="eyebrow">O MUNDO DE WOLF TOTEM</p><h2>Itens da tribo</h2>${codexTabs('items')}
   <p class="modal-intro">Seis componentes surgem das expedições e da Forja de Osso. Dois componentes no mesmo herói — ou combinados na bolsa, com a forja construída — formam um dos 21 itens. Cada herói carrega até três.</p>
   <h3 class="codex-section">Componentes</h3><div class="item-grid">${COMPONENTS.map(c => `<div class="item-card" style="--item:${c.color}"><span class="item-gem big"></span><div><b>${c.name}</b><p>${c.text}</p></div></div>`).join('')}</div>
   <h3 class="codex-section">Receitas</h3><div class="recipe-table">${ITEMS.map(it => `<div class="recipe" style="--item:${it.color}"><span class="item-gem"></span><div><b>${it.name}</b><small>${itemById(it.recipe![0])!.name} + ${itemById(it.recipe![1])!.name}</small><p>${it.text}</p></div></div>`).join('')}</div>`);
}

function showSpiritsCodex() {
  showModal('codex', `<p class="eyebrow">O MUNDO DE WOLF TOTEM</p><h2>Espíritos protetores</h2>${codexTabs('spirits')}
   <p class="modal-intro">Ao alcançar uma nova era, a tribo honra um de três espíritos. Cada um concede um bônus permanente e um Poder Espiritual, que você aciona uma vez por expedição.</p>
   ${[2, 3, 4, 5].map(era => `<h3 class="codex-section">Era ${roman(era)} · ${ERA_NAMES[era - 1].split('· ')[1]}</h3><div class="spirit-grid">${spiritsOfEra(era).map(sp => `<div class="spirit-card small ${game.state.spirits.includes(sp.id) ? 'chosen' : ''}" style="--spirit:${sp.color}"><span class="spirit-art">${spiritGlyph(sp.id)}</span><b>${sp.name}</b><p>${sp.passiveText}</p><p class="power-text"><strong>${sp.power.name}.</strong> ${sp.power.text}</p></div>`).join('')}</div>`).join('')}`);
}

function showTraitsCodex() {
  const groups: [string, string][] = [['povo', 'Povos'], ['função', 'Funções'], ['espírito', 'Espíritos animais']];
  showModal('codex', `<p class="eyebrow">O MUNDO DE WOLF TOTEM</p><h2>Laços da tribo</h2>${codexTabs('traits')}
   <p class="modal-intro">Personagens diferentes na formação que compartilham uma característica ativam seu laço. Cópias do mesmo herói contam uma vez.</p>
   ${groups.map(([kind, label]) => `<h3 class="codex-section">${label}</h3><div class="trait-table">${Object.entries(TRAIT_RULES).filter(([, r]) => r.kind === kind).map(([name, r]) => `<div class="trait-row"><b>${name}</b><span class="trait-thresholds">${r.thresholds.join(' / ')}</span><p>${r.effects.map(e => esc(e)).join('<br>')}</p><small>${characters.filter(c => c.traits.includes(name)).map(c => c.name).join(', ')}</small></div>`).join('')}</div>`).join('')}`);
}

function showCharacter(id: number, stars = 1) {
  const c = characterOf(id), art = artFor(c, stars);
  const sheet = art.kind === 'procedural' ? { ...art.sheet!, image: proceduralImage(id, stars) } : art.sheet;
  const motions: [MotionClip, string][] = [['idle', 'Repouso'], ['walk', 'Caminhar'], ['attack', 'Atacar'], ['cast', 'Habilidade'], ['hurt', 'Impacto'], ['death', 'Queda'], ['victory', 'Vitória']];
  const animality = ANIMALITY[c.id];
  showModal('character', `<div class="character-detail"><div class="preview-column"><div class="character-portrait">
   ${sheet ? `<canvas id="character-preview" class="character-preview" width="640" height="560" role="img" aria-label="${c.name}, animação de ${stars} estrelas"></canvas>` : portraitHTML(c, stars)}
   <div class="star-selector">${[1, 2, 3].map(n => `<button data-detail="${id}" data-stars="${n}" aria-label="${n} estrela${n > 1 ? 's' : ''}" aria-pressed="${n === stars}" class="${n === stars ? 'active' : ''}">${'★'.repeat(n)}</button>`).join('')}</div></div>
   ${sheet ? `<p class="preview-status" id="preview-status" role="status">Carregando animação…</p><div class="motion-controls" aria-label="Movimentos de ${c.name}">${motions.map(([clip, label]) => `<button data-motion="${clip}" aria-pressed="${preview.currentClip === clip}">${label}</button>`).join('')}</div><div class="preview-actions"><button data-action="preview-flip">Virar personagem</button><button data-action="preview-pause">${preview.isPaused ? 'Retomar prévia' : 'Pausar prévia'}</button></div>` : ''}
   </div><div class="character-story"><button class="text-button" data-action="codex">${icon('arrow-left')}Voltar ao códice</button><p class="eyebrow">CUSTO ${c.cost} · ${c.range > 1 ? 'ATAQUE À DISTÂNCIA' : 'CORPO A CORPO'}</p><h2>${c.name}</h2><h3>${c.title}</h3><div class="trait-chips">${c.traits.map(t => `<span>${t}</span>`).join('')}</div>
   <div class="stat-grid"><div>${icon('heart')}<strong>${c.hp[stars - 1]}</strong><small>Vida</small></div><div>${icon('swords')}<strong>${c.attack[stars - 1]}</strong><small>Ataque</small></div><div>${icon('shield')}<strong>${c.armor}/${c.magicResist}</strong><small>Armadura/RM</small></div><div>${icon('zap')}<strong>${c.attackSpeed}</strong><small>Ataques/s</small></div></div>
   <h4>${c.ability.name}</h4><p>${c.ability.description}</p>
   <div class="evolution"><span class="eyebrow">O DESPERTAR · ${stars} ESTRELA${stars > 1 ? 'S' : ''}</span><p>${c.evolution[stars - 1]}</p></div>
   <div class="prototype-skill"><span class="eyebrow">EFEITO EM COMBATE</span><p>${SKILL_NOTES[c.id]}</p></div>
   <div class="animality"><span class="eyebrow">VÍNCULO PRIMAL · ${animality.category.toUpperCase()}${animality.source === 'proposta' ? ' · PROPOSTA' : ''}</span><p>${ANIMALITY_RULES[animality.category]}</p></div>
   <p class="development-note">${c.cost <= unlockedCost(game.state.villageLevel) ? 'Recrutável na fogueira desta aldeia.' : `Chega à fogueira na Era ${roman(c.cost)}.`} ${{ painted: 'Esta forma tem animação pintada.', illustration: 'Esta forma usa a ilustração original com movimentos programados.', standin: `A forma ${stars}★ ainda não tem folha pintada: o jogo mostra a forma ${art.sheet?.stars ?? 1}★ com a aura do espírito.`, procedural: 'Figura desenhada pelo próprio jogo enquanto a arte pintada não chega; ela é substituída automaticamente.' }[art.kind]}</p></div></div>`);
  if (sheet) preview.mount($<HTMLCanvasElement>('#character-preview'), id, stars, sheet);
}

function showMap() {
  const s = game.state;
  showModal('map', `<p class="eyebrow">MAPA DAS EXPEDIÇÕES</p><h2>Terras selvagens</h2><p class="modal-intro">Vença cada expedição para abrir a próxima. Expedições já vencidas podem ser repetidas por metade da recompensa e uma chance de componente. Cada região exige uma era da aldeia.</p>
   <div class="map">${REGIONS.map(region => {
     const open = region.village <= s.villageLevel;
     return `<section class="map-region ${open ? '' : 'locked'}" style="--floor:#${region.palette.floor.toString(16)};--line:#${region.palette.line.toString(16)}"><header><b>${region.id}. ${region.name}</b><span>${open ? region.subtitle : `Exige a Era ${roman(region.village)}`}</span></header>
      <div class="map-nodes">${STAGES.filter(st => st.region === region.id).map(st => {
        const cleared = st.id <= s.progress, available = stageUnlocked(s, st.id), current = st.id === s.selectedStage;
        return `<button class="map-node ${cleared ? 'cleared' : ''} ${current ? 'current' : ''} ${st.index === 5 ? 'boss' : ''}" data-stage="${st.id}" ${available ? '' : 'disabled'} title="${esc(st.name)}"><span class="node-mark">${st.index === 5 ? icon('crown') : cleared ? icon('check') : available ? st.index : icon('lock')}</span><span class="node-name">${esc(st.name)}</span></button>`;
      }).join('')}</div></section>`;
   }).join('')}
   <section class="map-region endless ${stageUnlocked(s, 0) ? '' : 'locked'}"><header><b>∞ Caçada Eterna</b><span>${stageUnlocked(s, 0) ? `Recorde desta jornada: ${s.endlessBest} · de todas: ${s.endlessRecord}` : 'Desperta após vencer o Primeiro Inverno.'}</span></header>
    <div class="map-nodes"><button class="map-node ${s.selectedStage === 0 ? 'current' : ''}" data-stage="0" ${stageUnlocked(s, 0) ? '' : 'disabled'}><span class="node-mark">${icon('infinity')}</span><span class="node-name">Profundidade ${s.endlessBest + 1}</span></button></div></section>
   </div>`);
}

function showSpiritChoice() {
  const era = pendingEra(game.state);
  if (!era) return;
  showModal('spirit', `<p class="eyebrow">ERA ${roman(era)} · ${ERA_NAMES[era - 1].split('· ')[1].toUpperCase()}</p><h2>Qual espírito guiará a tribo?</h2><p class="modal-intro">A escolha é permanente nesta jornada. O bônus vale sempre; o poder pode ser chamado uma vez em cada expedição, na barra de poderes do campo.</p>
   <div class="spirit-grid">${spiritsOfEra(era).map(sp => `<div class="spirit-card" style="--spirit:${sp.color}"><span class="spirit-art">${spiritGlyph(sp.id)}</span><h3>${sp.name}</h3><p>${sp.passiveText}</p><p class="power-text"><strong>${icon('zap')} ${sp.power.name}.</strong> ${sp.power.text}</p><button class="primary" data-spirit="${sp.id}">Honrar o ${sp.name}</button></div>`).join('')}</div>`);
}

function showAncestors() {
  const s = game.state, complete = s.wonder >= WONDER_STAGES, cost = wonderCost(s.wonder);
  const canBuild = s.villageLevel >= 5 && s.progress >= 25;
  const canAscend = complete && s.progress >= FINAL_STAGE;
  showModal('ancestors', `<p class="eyebrow">O GRANDE TOTEM</p><h2>A memória da tribo</h2><p class="modal-intro">Na Era V, depois de vencer o Leviatã do Pântano, a tribo pode erguer o Grande Totem. Completo e com o Primeiro Inverno vencido, ele permite o renascimento: a aldeia recomeça e as brasas ancestrais compram memórias permanentes.</p>
   <div class="wonder"><div class="wonder-stages">${Array.from({ length: WONDER_STAGES }, (_, i) => `<span class="${i < s.wonder ? 'done' : ''}">${roman(i + 1)}</span>`).join('')}</div>
    ${complete ? '<p class="wonder-note">O Grande Totem está completo.</p>' : `<button class="primary" data-action="wonder" ${canBuild ? costAttr(cost) : 'disabled'}>${icon('landmark')}Erguer a parte ${s.wonder + 1}<span class="cost">${costHTML(cost)}</span></button>${canBuild ? '' : '<p class="small muted">Exige a Era V e a vitória na expedição 5·5.</p>'}`}
    <div class="ascend"><p>Renascer agora concede <b>${embersFor(s)} brasas</b> (8 + 2 por profundidade da Caçada Eterna + 2 por renascimento anterior).</p><button class="primary ${confirmAscend ? 'danger' : ''}" data-action="ascend" ${canAscend ? '' : 'disabled'}>${icon('flame')}${confirmAscend ? 'Confirmar: recomeçar a aldeia' : 'Renascer da chama'}</button>${canAscend ? '' : '<p class="small muted">Exige o Grande Totem completo e o Primeiro Inverno vencido.</p>'}</div></div>
   <h3 class="codex-section">Memórias ancestrais · ${fmt(s.embers)} brasas · ${s.rebirths} renascimento${s.rebirths === 1 ? '' : 's'}</h3>
   <div class="memory-grid">${MEMORIES.map(m => { const level = s.memories[m.id] ?? 0, price = memoryCost(m, level); return `<div class="memory-card"><b>${m.name}</b><span class="memory-level">${level}/${m.max}</span><p>${m.text}</p><button class="outline-button" data-memory="${m.id}" ${level >= m.max || s.embers < price ? 'disabled' : ''}>${level >= m.max ? 'Completa' : `${icon('sparkles')}${price} brasas`}</button></div>`; }).join('')}</div>`);
}

function help() {
  showModal('help', `<p class="eyebrow">BEM-VINDO À PRIMEIRA CHAMA</p><h2>Uma tribo começa com você.</h2><div class="guide-steps">
   <div><span>01</span><h3>Crie raízes</h3><p>A aldeia produz madeira, alimento, pedra e espírito sozinha. Melhore construções, coloque heróis da reserva para trabalhar nelas e avance de era para abrir vagas e heróis de custo maior.</p></div>
   <div><span>02</span><h3>Ouça os espíritos</h3><p>Recrute viajantes na fogueira: três cópias iguais se fundem numa estrela superior. A cada era, escolha um Espírito Protetor: um bônus permanente e um poder para acionar em combate.</p></div>
   <div><span>03</span><h3>Explore o desconhecido</h3><p>No mapa, escolha a expedição. Posicione até sete heróis, combine sinergias e itens da bolsa. O combate é automático; vitórias trazem recursos e componentes. Depois do Primeiro Inverno, a Caçada Eterna e o Grande Totem aguardam.</p></div></div>
   <p class="development-note">Atalhos: 1 aldeia · 2 expedição · 3 códice · 4 totem · M mapa · P pausar · Esc fechar.</p><button class="primary" data-action="close">Seguir o chamado ${icon('arrow-right')}</button>`);
}

function settings() {
  const percent = (value: number) => `${Math.round(value * 100)}%`;
  const slider = (key: 'sfx' | 'music', label: string) => `<label class="pref-row"><span>${label}</span><input type="range" min="0" max="100" step="5" value="${Math.round(prefs[key] * 100)}" data-pref="${key}" aria-label="${label}" ${prefs.sound ? '' : 'disabled'}><output>${percent(prefs[key])}</output></label>`;
  const toggle = (key: 'sound' | 'numbers', label: string, hint: string) => `<label class="pref-row toggle"><span>${label}<small>${hint}</small></span><input type="checkbox" data-pref="${key}" ${prefs[key] ? 'checked' : ''}><i class="switch" aria-hidden="true"></i></label>`;
  const motion = (value: Prefs['motion'], label: string) => `<option value="${value}" ${prefs.motion === value ? 'selected' : ''}>${label}</option>`;
  showModal('settings', `<p class="eyebrow">CONFIGURAÇÕES</p><h2>A fogueira da tribo</h2>
   <div class="settings-grid">
    <section><h3>${icon('volume-2')}Som</h3>
     ${toggle('sound', 'Sons e música', 'Efeitos de combate e a música da aldeia')}
     ${slider('sfx', 'Efeitos')}${slider('music', 'Música')}
    </section>
    <section><h3>${icon('eye')}Visual</h3>
     <label class="pref-row"><span>Movimento<small>Reduzido acalma tremores, ondas e animações da interface</small></span><select data-pref="motion">${motion('system', 'Seguir o sistema')}${motion('full', 'Completo')}${motion('reduced', 'Reduzido')}</select></label>
     ${toggle('numbers', 'Números de dano e cura', 'Desligue para um campo mais limpo em lutas cheias')}
    </section>
    <section class="wide"><h3>${icon('book-marked')}Jornada</h3>
     <p class="modal-intro">O progresso é salvo automaticamente neste navegador. Ao voltar, a aldeia recebe até 2 horas de produção acumulada, inclusive da forja. Uma jornada pausada não acumula recursos.</p>
     <div class="settings-buttons"><button class="outline-button" data-action="export">${icon('download')}Exportar progresso</button><button class="outline-button" data-action="import">${icon('upload')}Importar progresso</button><button class="outline-button" data-action="help">${icon('book-open')}Como jogar</button><button class="outline-button" data-action="title-show">${icon('flame')}Tela inicial</button></div>
     <p class="development-note">Importar substitui o progresso deste navegador. Saves da versão 0.x são convertidos automaticamente.</p>
     <div class="danger-zone">${confirmWipe
       ? `<p><b>Apagar tudo?</b> A aldeia, os heróis, as expedições, os renascimentos e as memórias deste navegador serão perdidos. Exporte antes se quiser guardar uma cópia.</p><div class="settings-buttons"><button class="outline-button" data-action="wipe-cancel">Manter a jornada</button><button class="primary danger" data-action="wipe-confirm">${icon('trash-2')}Apagar para sempre</button></div>`
       : `<p>Recomeçar do zero apaga todo o progresso deste navegador.</p><button class="outline-button danger" data-action="wipe">${icon('trash-2')}Apagar jornada</button>`}</div>
    </section>
   </div>`);
}

/** Erases the journey and reloads into a fresh one, skipping the title screen once. */
function wipeJourney() {
  wiping = true;
  try { localStorage.removeItem(SAVE_KEY); sessionStorage.setItem(FRESH_KEY, '1'); } catch { /* reload still starts clean */ }
  location.reload();
}

function updatePref(key: string, value: string | boolean) {
  if (key === 'sound') { prefs.sound = !!value; sound.setMuted(!prefs.sound); if (prefs.sound) sound.play('click'); }
  else if (key === 'sfx' || key === 'music') { prefs[key] = Math.max(0, Math.min(1, Number(value) / 100)); sound.setVolumes(prefs.sfx, prefs.music); if (key === 'sfx') sound.play('hit'); }
  else if (key === 'motion' && (value === 'system' || value === 'full' || value === 'reduced')) prefs.motion = value;
  else if (key === 'numbers') prefs.numbers = !!value;
  if (storage) savePrefs(storage, prefs);
  document.documentElement.classList.toggle('reduce-motion', reducedMotion());
  world.setOptions({ reducedMotion: reducedMotion(), numbers: prefs.numbers });
  renderAudioButton();
}

function renderAudioButton() {
  const button = $('[data-action="audio"]');
  button.innerHTML = icon(sound.muted ? 'volume-x' : 'volume-2');
  button.setAttribute('aria-label', sound.muted ? 'Ativar sons' : 'Silenciar sons');
  refreshIcons();
}

function renderTitle() {
  const s = game.state;
  const summary = hasJourney
    ? `<div class="title-journey"><span>Era ${roman(s.villageLevel)}</span><span>${s.progress}/${FINAL_STAGE} expedições</span><span>${s.heroes.length} herói${s.heroes.length === 1 ? '' : 's'}</span>${s.rebirths ? `<span>${s.rebirths} renascimento${s.rebirths === 1 ? '' : 's'}</span>` : ''}</div>`
    : '';
  $('#title-screen').innerHTML = `<div class="title-embers" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
   <div class="title-card">
    <div class="title-emblem">${glyphSVG('wolf', '#d6ba79', '')}</div>
    <p class="eyebrow">O DESPERTAR DA TRIBO</p>
    <h1 id="title-name">WOLF <b>TOTEM</b></h1>
    <div class="title-story">
     <p>Antes das cidades e dos nomes escritos, as tribos caminhavam ao lado dos espíritos. Cada clã guardava um animal: o lobo que ensina a caçar em matilha, a coruja que enxerga no escuro, o urso que atravessa o inverno.</p>
     <p>Agora o Primeiro Inverno desce das montanhas. Os rios congelam, as manadas fogem e os clãs se dispersam. Na Clareira do Lobo, uma pequena tribo acende a última fogueira e ouve um uivo antigo chamando por guardiões.</p>
     <p>Faça a aldeia crescer pelas cinco eras, honre os Espíritos Protetores, reúna heróis de todos os povos e leve a tribo além do inverno, até erguer o Grande Totem.</p>
    </div>
    ${summary}
    <div class="title-actions">
     <button class="primary" data-action="title-continue">${icon(hasJourney ? 'play' : 'flame')}${hasJourney ? 'Continuar jornada' : 'Começar jornada'}</button>
     ${hasJourney ? `<button class="outline-button ${confirmNew ? 'danger' : ''}" data-action="title-new">${icon(confirmNew ? 'triangle-alert' : 'sparkles')}${confirmNew ? 'Confirmar: apagar a jornada atual' : 'Nova jornada'}</button>` : ''}
     <div class="title-links"><button class="text-button" data-action="settings">${icon('settings-2')}Configurações</button><button class="text-button" data-action="help">${icon('book-open')}Como jogar</button></div>
    </div>
    <p class="title-version">VERSÃO 1.2 · ${storage ? 'progresso salvo neste navegador' : 'salvamento indisponível neste navegador'}</p>
   </div>`;
  refreshIcons();
}

function closeTitle() {
  titleOpen = false; confirmNew = false;
  $('#title-screen').hidden = true;
  // The click that leaves the title is the gesture browsers need before playing sound.
  if (prefs.sound && sound.muted) { sound.setMuted(false); renderAudioButton(); }
  lastTime = performance.now();
  if (!hasJourney) help();
  welcomeBack();
}

function showTitle() {
  closeModal(); confirmNew = false; titleOpen = true; save();
  renderTitle(); $('#title-screen').hidden = false;
  $<HTMLButtonElement>('#title-screen .primary').focus();
}

let welcomed = false;
function welcomeBack() {
  if (welcomed) return;
  welcomed = true;
  if (game.offlineGains && game.offlineSeconds > 60) toast(`A aldeia trabalhou por ${Math.round(game.offlineSeconds / 60)} min enquanto você esteve fora.`);
  if (pendingEra(game.state)) window.setTimeout(showSpiritChoice, 600);
}

function startNext() {
  if (game.battle && game.battle.status !== 'fighting') game.dismissBattle();
  const result = game.startBattle();
  if (!result.ok) toast(result.message); else sound.play('power');
  renderAll();
}

document.addEventListener('click', event => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!target || target.disabled) return;
  const d = target.dataset;
  if (d.view) { setView(d.view as typeof view); return; }
  if (d.building) { selectedBuilding = d.building as BuildingId; renderSide(); return; }
  if (d.gather) { act(game.gather(d.gather as Resource), 'click'); return; }
  if (d.recruit) { act(game.recruit(Number(d.recruit)), 'recruit'); return; }
  if (d.hero) {
    if (selectedItem !== null) { const r = game.equipItem(d.hero, selectedItem); selectedItem = null; act(r, 'item'); return; }
    selectedHero = selectedHero === d.hero ? null : d.hero; sound.play('click'); renderCamp(); return;
  }
  if (d.inv !== undefined) {
    const index = Number(d.inv), current = selectedItem;
    if (current !== null && current !== index && isComponent(game.state.inventory[current]) && isComponent(game.state.inventory[index]) && game.state.buildings.forge > 0) {
      selectedItem = null; act(game.combineItems(current, index), 'item'); return;
    }
    selectedItem = current === index ? null : index; sound.play('click'); renderCamp(); return;
  }
  if (d.unequip) { const [uid, i] = d.unequip.split(':'); act(game.unequipItem(uid, Number(i)), 'item'); return; }
  if (d.bench) { act(game.deploy(d.bench, null), 'click'); return; }
  if (d.unassign) { act(game.assignWorker(d.unassign, null), 'click'); return; }
  if (d.character) { showCharacter(Number(d.character), Number(d.stars ?? 1)); return; }
  if (d.detail) { showCharacter(Number(d.detail), Number(d.stars)); return; }
  if (d.motion) { preview.select(d.motion as MotionClip); document.querySelectorAll<HTMLButtonElement>('[data-motion]').forEach(b => b.setAttribute('aria-pressed', String(b === target))); return; }
  if (d.filter) { showCodex(Number(d.filter), $<HTMLInputElement>('#codex-search').value); return; }
  if (d.codex) { ({ heroes: () => showCodex(), items: showItemsCodex, spirits: showSpiritsCodex, traits: showTraitsCodex } as Record<string, () => void>)[d.codex](); return; }
  if (d.stage !== undefined) { const r = game.selectStage(Number(d.stage)); toast(r.message); if (r.ok) { save(); closeModal(); if (view !== 'battle') setView('battle'); else renderAll(); } return; }
  if (d.spirit) { const r = game.chooseSpirit(d.spirit as SpiritId); if (r.ok) closeModal(); act(r, 'era'); return; }
  if (d.power) { const r = game.usePower(d.power as SpiritId); toast(r.message); if (r.ok) sound.play('power'); renderPowers(); return; }
  if (d.event) {
    const accept = d.event === 'accept', raid = game.state.event?.kind === 'raid';
    const r = game.answerEvent(accept);
    if (r.ok && raid && accept) { setView('battle'); sound.play('power'); }
    act(r, accept ? 'recruit' : 'click'); return;
  }
  if (d.quest) { const r = game.claimQuest(d.quest); act(r, 'item'); if (activeModal === 'journal') showJournal(); return; }
  if (d.memory) { act(game.buyMemory(d.memory as MemoryId), 'upgrade'); showAncestors(); return; }
  switch (d.action) {
    case 'preview-flip': preview.flip(); break;
    case 'preview-pause': target.textContent = preview.toggle() ? 'Retomar prévia' : 'Pausar prévia'; break;
    case 'place-selected': if (selectedHero) act(game.deploy(selectedHero, Number($<HTMLSelectElement>('#formation-slot').value)), 'click'); break;
    case 'sell-selected': if (selectedHero) { act(game.sellHero(selectedHero), 'click'); selectedHero = null; } break;
    case 'assign': act(game.assignWorker($<HTMLSelectElement>('#worker-select').value, selectedBuilding), 'upgrade'); break;
    case 'building-upgrade': act(game.upgradeBuilding(selectedBuilding)); break;
    case 'village-upgrade': { const r = game.upgradeVillage(); act(r, 'era'); if (r.ok) showSpiritChoice(); break; }
    case 'spirit-choice': showSpiritChoice(); break;
    case 'reroll': act(game.rerollShop(), 'click'); break;
    case 'battle-start': startNext(); break;
    case 'battle-again': window.clearTimeout(repeatTimer); startNext(); break;
    case 'battle-dismiss': window.clearTimeout(repeatTimer); game.dismissBattle(); renderAll(); break;
    case 'speed': game.setSpeed(game.state.settings.speed % 3 + 1); save(); renderAll(); break;
    case 'auto-repeat': toast(game.toggleAutoRepeat() ? 'Repetição automática ligada: após cada vitória a expedição recomeça.' : 'Repetição automática desligada.'); save(); renderAll(); break;
    case 'map': showMap(); break;
    case 'journal': showJournal(); break;
    case 'ancestors': confirmAscend = false; showAncestors(); break;
    case 'wonder': act(game.buildWonder(), 'era'); showAncestors(); break;
    case 'ascend':
      if (!confirmAscend) { confirmAscend = true; showAncestors(); break; }
      confirmAscend = false; act(game.ascend(), 'era'); selectedHero = null; selectedItem = null; lastProgress = game.state.progress; lastVillage = game.state.villageLevel; showAncestors(); break;
    case 'pause': game.togglePause(); save(); renderAll(); break;
    case 'codex': showCodex(); break;
    case 'help': help(); break;
    case 'settings': confirmWipe = false; settings(); break;
    case 'close': closeModal(); break;
    case 'audio': updatePref('sound', sound.muted); break;
    case 'title-continue': closeTitle(); break;
    case 'title-new':
      if (!confirmNew) { confirmNew = true; renderTitle(); break; }
      wipeJourney(); break;
    case 'title-show': showTitle(); break;
    case 'wipe': confirmWipe = true; settings(); break;
    case 'wipe-cancel': confirmWipe = false; settings(); break;
    case 'wipe-confirm': wipeJourney(); break;
    case 'export': { const url = URL.createObjectURL(new Blob([game.serialize()], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = 'wolf-totem-jornada.json'; a.click(); URL.revokeObjectURL(url); break; }
    case 'import': $<HTMLInputElement>('#save-file').click(); break;
  }
});

document.addEventListener('input', event => {
  const input = event.target as HTMLInputElement;
  if (input.dataset.pref !== 'sfx' && input.dataset.pref !== 'music') return;
  updatePref(input.dataset.pref, input.value);
  const output = input.nextElementSibling;
  if (output) output.textContent = `${input.value}%`;
});
document.addEventListener('change', event => {
  const input = event.target as HTMLInputElement | HTMLSelectElement;
  const key = input.dataset.pref;
  if (key === 'sound' || key === 'numbers') { updatePref(key, (input as HTMLInputElement).checked); if (key === 'sound') settings(); }
  else if (key === 'motion') updatePref(key, input.value);
});
let searchTimer = 0;
document.addEventListener('input', event => {
  const input = event.target as HTMLInputElement;
  if (input.id !== 'codex-search') return;
  clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    const value = input.value, position = input.selectionStart;
    showCodex(Number($('#modal').dataset.filter || 0), value);
    const next = $<HTMLInputElement>('#codex-search'); next.focus(); next.setSelectionRange(position, position);
  }, 180);
});
$<HTMLInputElement>('#save-file').addEventListener('change', async event => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    if (file.size > 500_000) throw new Error();
    const data = JSON.parse(await file.text());
    if (!data || (data.version !== 1 && data.version !== 2) || !data.state || !Array.isArray(data.state.heroes) || !data.state.resources) throw new Error();
    const imported = new Game(data);
    game.state = imported.state; game.battle = null;
    localStorage.setItem(SAVE_KEY, game.serialize()); location.reload();
  } catch { toast('Arquivo de progresso inválido. Sua jornada atual foi preservada.'); }
});
document.addEventListener('keydown', event => {
  if ((event.target as HTMLElement).matches('input,textarea,select') || event.repeat) return;
  if ($<HTMLDialogElement>('#modal').open) return;
  if (titleOpen) return;
  const key = event.key.toLowerCase();
  if (key === '1') setView('village');
  if (key === '2') setView('battle');
  if (key === '3') showCodex();
  if (key === '4') { confirmAscend = false; showAncestors(); }
  if (key === 'm' && game.battle?.status !== 'fighting') showMap();
  if (key === 'p') { game.togglePause(); save(); renderAll(); }
});
$<HTMLDialogElement>('#modal').addEventListener('click', event => { if (event.target === $('#modal')) closeModal(); });
$('#modal').addEventListener('close', () => { preview.clear(); activeModal = ''; });
window.addEventListener('pagehide', save);
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); save(); }
  else if (hiddenAt) { game.catchUp((Date.now() - hiddenAt) / 1000); hiddenAt = 0; save(); renderMetrics(); }
  lastTime = performance.now();
});

/** Battle events also drive the sound, throttled inside the sound system. */
function playBattleSounds() {
  for (const event of game.events) {
    if (event.id <= lastEventId) continue;
    lastEventId = event.id;
    const sfx: Partial<Record<typeof event.type, Sfx>> = { damage: 'hit', skill: 'cast', heal: 'heal', death: 'death', summon: 'summon', revive: 'era', power: 'power', phase: 'power', overtime: 'era' };
    if (sfx[event.type]) sound.play(sfx[event.type]!);
  }
}

let lastTime = performance.now(), uiElapsed = 0, saveElapsed = 0;
function frame(now: number) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  if (!document.hidden && !titleOpen) {
    game.tick(dt);
    if (game.battle?.status === 'fighting' && game.state.settings.speed > 1) game.advanceBattle(dt * (game.state.settings.speed - 1));
    playBattleSounds();
  }
  preview.update(dt);
  uiElapsed += dt; saveElapsed += dt;
  if (uiElapsed > 0.4) { renderMetrics(); uiElapsed = 0; }
  if (saveElapsed > 5) { save(); saveElapsed = 0; }
  const status = game.battle?.status || '';
  if (status !== lastBattleStatus || game.state.progress !== lastProgress) {
    const previous = lastBattleStatus;
    lastBattleStatus = status; lastProgress = game.state.progress;
    renderAll();
    if (status === 'victory' || status === 'defeat') {
      save();
      if (previous === 'fighting') sound.play(status === 'victory' ? 'victory' : 'defeat');
      if (status === 'victory' && game.state.settings.autoRepeat && (game.battle?.stage ?? 0) >= 0) repeatTimer = window.setTimeout(() => { if (game.battle?.status === 'victory') startNext(); }, 1600);
      if (status === 'defeat' && game.state.settings.autoRepeat) { game.toggleAutoRepeat(); toast('Derrota: a repetição automática foi desligada.'); }
    }
  }
  if (game.state.villageLevel !== lastVillage) { lastVillage = game.state.villageLevel; renderAll(); }
  requestAnimationFrame(frame);
}

renderAll();
renderAudioButton();
if (titleOpen) { renderTitle(); $<HTMLButtonElement>('#title-screen .primary').focus(); }
else { help(); welcomeBack(); }
requestAnimationFrame(frame);
window.addEventListener('beforeunload', () => { save(); world.destroy(); });
