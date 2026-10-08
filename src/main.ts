import './animation-preview.css';
import './style.css';
import './refinements.css';
import './ui.css';
import './journey-ui.css';
import './ritual-experience.css';
import './settlement-ui.css';
import { armyCoach, constructionPanel, economyPanel, researchPanel, territoryPanel } from './ui/settlementPanels';
import { builderCount, constructionCount, INFRASTRUCTURE, populationCap, SETTLEMENT_MILESTONES, TERRITORIES, type CitizenJob, type InfrastructureId, type ResearchId } from './game/settlement';
import { armyWarnings, ROLE_GUIDE, roleOf } from './game/armyAdvisor';
import { RitualExperience, ritualExperienceMarkup } from './ui/RitualExperience';
import { RITUAL_PLAY } from './game/ritualPlay';
import type { PracticeId } from './game/tribe';
import { growthBars, awakeningMarkup, updateGrowthBars } from './ui/heroProgress';
import { environmentPortrait } from './ui/environment';
import { createIcons, icons } from 'lucide';
import { SoundSystem, type Sfx } from './audio';
import { characters } from './data/characters';
import { ANIMALITY, ANIMALITY_RULES } from './data/animality';
import { endlessLevel, expectedLevel, FINAL_STAGE, REGIONS, STAGES, regionOf, stageById, stageReward } from './game/campaign';
import { COMPONENTS, ITEMS, MAX_ITEMS_PER_HERO, isComponent, itemById } from './game/items';
import { shopOdds, unlockedCost } from './game/roster';
import { ERA_NAMES, MEMORIES, memoryCost, spiritById, spiritsOfEra, type MemoryId, type SpiritId } from './game/spirits';
import { TRAIT_RULES } from './game/synergies';
import { QUESTS, openQuests, rewardText } from './game/quests';
import { EVENT_TEXT } from './game/events';
import { AWAKENING, ERA_GROWTH, MAX_RITUAL_LEVEL, RITUAL_XP, ritualXpToNext, CURA_NOTE, huntChance, huntSlots, MAX_HERO_LEVEL, MAX_PANEMA, PRACTICES, practiceById, TRAILS, trailById, xpToNext, type Practice } from './game/tribe';
import { project } from './render/battleArena';
import { allySlotCenter, FORMATION_SLOTS } from './game/board';
import {
  BUILDING_KEYS, Game, GATHER_AMOUNT, MAX_BUILDING_LEVEL, MAX_INVENTORY, REROLL_COST, SKILL_NOTES, WONDER_STAGES, WORK_AFFINITY,
  buildingCost, capacity, embersFor, forgeRate, getRates, getSynergies, pendingEra, recruitCost, ritualSpeed, shopSize, stageUnlocked, villageCost,
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
/** Set right before the reload that follows an import, to confirm it afterwards. */
const LOADED_KEY = 'wolf-totem-loaded';
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
let villageMode:'economy'|'building'|'construct'|'territory'|'research'='economy';
let selectedTerritory=TERRITORIES[0].id;
let selectedCitizen:number|null=null;
let placement:InfrastructureId|null=null;
let settlementKey='';
let sideContext='';
let coachHero:string|null=null;
let coachTrait='Caçador';
let selectedItem: number | null = null;
let activeModal = '';
let ritualExperience: RitualExperience | null = null;
let lastBattleStatus = '';
let lastProgress = game.state.progress;
let lastVillage = game.state.villageLevel;
let lastEventId = 0;
let repeatTimer = 0;
let confirmAscend = false;
let confirmWipe = false;
let curaHero: string | null = null;
let chosenPractice = 'rape';
let tribeTab = 'owned';
let tribeQuery = '';
let panelOpen = !window.matchMedia('(max-width: 850px)').matches;
let eventOpen = false;
let inspectedHero: string | null = null;
let awayKey = '';
let coachStateKey='';
let reportKey: string | null = null;
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
/** m:ss until a village time; refreshed in place by renderMetrics through data-until. */
const timeLeft = (until: number) => { const left = Math.max(0, Math.ceil(until - game.state.clock)); return left >= 3600 ? `${Math.floor(left / 3600)}h ${Math.floor(left % 3600 / 60)}min` : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; };
const countdown = (until: number) => `<span class="countdown" data-until="${until}">${timeLeft(until)}</span>`;
const inFight = (h: Hero) => game.battle?.status === 'fighting' && game.battle.party.includes(h.uid);
const heroLabel = (h: Hero) => `${characterOf(h.characterId).name} ${'★'.repeat(h.stars)} · Nv ${h.level}${h.panema ? ` · panema ${h.panema}` : ''}`;
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
  cura: { name: 'Casa de Cura', desc: 'A maloca do pajé, onde a tribo faz as cerimônias de rapé, sananga, kambô e ayahuasca e a roda de cacau.', icon: 'leaf' },
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
   <button class="nav-button" data-view="battle">${icon('swords')}<span>Expedições</span></button>
   <button class="nav-button" data-action="tribe">${icon('users')}<span>Tribo</span></button><button class="nav-button" data-action="cura">${icon('flame')}<span>Rituais</span></button><button class="nav-button" data-action="codex">${icon('book-open')}<span>Códice</span></button>
  </div><div class="rail-bottom"><span class="vertical-caption">SIGA O CHAMADO</span><span class="rail-seal" id="rail-era">I</span></div></nav>
  <main class="main-area">
   <div class="settlement-toolbar" id="settlement-toolbar"><span class="settlement-population">${icon('users')}<b id="settlement-population">4 / 6</b><small>aldeões</small></span><div><button data-rts-mode="economy">${icon('users')}População</button><button data-rts-mode="construct">${icon('hammer')}Construir <kbd>B</kbd></button><button data-rts-mode="territory">${icon('map')}Territórios</button><button data-rts-mode="research">${icon('book-open')}Pesquisas</button><button data-action="army-coach">${icon('swords')}Conselheiro</button></div><span id="settlement-order-count"></span></div>
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
   <section class="camp-section"><div class="section-heading"><div><p class="eyebrow">HERÓIS & ESPÍRITOS</p><h2 id="camp-title">Ao redor da fogueira</h2></div><button class="outline-button" data-action="tribe" id="reroll">Abrir tribo ${icon('arrow-right')}</button></div><div id="camp-content"></div></section>
   <div id="journey-objective" class="journey-objective"></div><footer><span><span class="live-dot"></span><span id="save-status">Progresso salvo neste navegador</span></span><span>WOLF TOTEM <b>·</b> VERSÃO 2.0</span><button class="text-button" data-action="ancestors">Totem ancestral</button><button class="text-button" data-action="help">Guia da tribo ${icon('arrow-up-right')}</button></footer>
  </main>
 </div>
 <div id="toast" class="toast" role="status" aria-live="polite"></div>
 <div id="title-screen" class="title-screen" role="dialog" aria-modal="true" aria-labelledby="title-name" ${titleOpen ? '' : 'hidden'}></div>
 <dialog id="modal"><div id="modal-content"></div></dialog>
 <input id="save-file" type="file" accept="application/json,.json" hidden />`;

document.querySelector('.main-area')!.insertBefore($('#journey-objective'),document.querySelector('.camp-section'));
document.querySelector('.topbar')!.insertBefore(document.querySelector('.rail')!, document.querySelector('.resources'));

document.querySelector('.nav-group')!.insertBefore(document.querySelector('[data-action=tribe]')!,document.querySelector('[data-view=battle]'));
const world = createWorld($('#world'), game, {
  onHero(uid) { selectedHero = uid; panelOpen = true; renderCamp(); renderSide(); },
  onMove(uid, slot) { selectedHero = uid; act(game.deploy(uid, slot), 'click'); },
  onBuilding(id) {
    const resource=BUILDINGS[id].resource;
    if(selectedCitizen!==null&&resource){act(game.setCitizenJob(selectedCitizen,resource),'click');villageMode='economy';renderSide();return;}
    panelOpen = true; villageMode='building';selectedBuilding = id;placement=null;world.setBuildMode(null);if (view !== 'village') setView('village'); else renderSide();
  },
  onTerritory(id){if(id==='hearth'){villageMode='economy';world.setStrategic(false);}else{selectedTerritory=id;villageMode='territory';world.setStrategic(true);}panelOpen=true;renderSide();},
  onPlot(id){if(placement){const result=game.buildInfrastructure(placement,id);act(result);if(result.ok){placement=null;world.setBuildMode(null);}renderSide();}else{const type=game.state.settlement.sites[id];if(type)toast(`${INFRASTRUCTURE[type].name}: ${INFRASTRUCTURE[type].description}`);}},
  onCitizen(id){selectedCitizen=id;world.selectCitizen(id);villageMode='economy';panelOpen=true;renderSide();},
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
  $('#settlement-population').textContent=`${game.state.settlement.citizens.length} / ${populationCap(game.state)}`;
  $('#settlement-order-count').textContent=game.state.settlement.orders.length?`${game.state.settlement.orders.length} ordem(ns)`:'Aldeia em atividade';
  document.querySelectorAll<HTMLProgressElement>('[data-order-progress]').forEach(el=>{const o=game.state.settlement.orders.find(o=>o.id===Number(el.dataset.orderProgress));if(o)el.value=Math.min(1,(game.state.clock-o.started)/(o.until-o.started));});
  const civic=JSON.stringify([game.state.settlement.citizens,game.state.settlement.orders.map(o=>o.id),game.state.settlement.sites,game.state.settlement.research,game.state.settlement.discovered,game.state.settlement.claimed,game.state.settlement.milestones,game.state.buildings]);
  if(civic!==settlementKey){const first=!settlementKey;settlementKey=civic;if(!first){if(view==='village')renderVillageSide();if(activeModal==='army-coach')showArmyCoach();refreshIcons();}}
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
  updateGrowthBars(game.state.heroes);
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
  document.querySelectorAll<HTMLElement>('[data-until]').forEach(el => { el.textContent = timeLeft(Number(el.dataset.until)); });
  // Hunters coming home and ceremonies ending refresh the cards and any open panel.
  const away = game.state.heroes.map(h => `${h.uid}:${h.away?.until ?? ''}:${h.level}:${h.ritualLevel}:${h.stars}:${h.panema}:${game.state.clock>=h.ritualReadyAt}`).join('|') + `|${game.state.cacao}|${game.state.buildings.cura}`;
  if (away !== awayKey) {
    const first = awayKey === ''; awayKey = away;
    if (!first) { renderCamp(); renderSide(); if (activeModal === 'hunts') showHunts(); if (activeModal === 'cura') showCura(); if(activeModal==='hero'&&inspectedHero)showHero(inspectedHero); if(activeModal==='army-coach')showArmyCoach(); }
  }
  const last = game.state.reports.at(-1), key = last ? `${last.clock}:${last.uid}` : '';
  if (reportKey !== null && key !== reportKey && last) { toast(`${last.name} ${last.text}`); sound.play(last.ok ? 'recruit' : 'defeat'); }
  reportKey = key;
  const forge = document.querySelector<HTMLElement>('#forge-progress');
  if (forge) forge.style.setProperty('--progress', String(game.state.forgeProgress));
  const bag = document.querySelector<HTMLElement>('#bag-count');
  if (bag) bag.textContent = `${game.state.inventory.length}/${MAX_INVENTORY}`;
  renderPowers();
  if(activeModal==='army-coach'&&coachStateKey!==armyContextKey())showArmyCoach();
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
  document.body.dataset.villageMode=villageMode;
  const context=`${view}:${villageMode}:${selectedBuilding}:${selectedTerritory}:${selectedCitizen}:${placement}`;
  if(context!==sideContext){sideContext=context;$('#side-panel').scrollTop=0;}
  if(view==='village')$('#world-hint').textContent=placement?'Escolha um terreno marcado para construir.':selectedCitizen!==null?'Selecione um local de produção para dar a ordem.':villageMode==='territory'?'Toque em um território para reconhecer ou estabelecer um posto.':'Selecione aldeões, construções ou fronteiras no mapa.';
  $('#side-panel').hidden = !panelOpen;
  $('#journey-objective').innerHTML=journeyObjective();
  document.querySelector('.play-area')!.classList.toggle('panel-closed', !panelOpen);
  if (view === 'village') renderVillageSide(); else renderBattleSide();
  refreshIcons(); renderMetrics();
}

function renderVillageSide() {
  if(villageMode!=='building'){
    $('#side-panel').innerHTML=villageMode==='economy'?economyPanel(game.state,selectedCitizen):villageMode==='construct'?constructionPanel(game.state,placement):villageMode==='territory'?territoryPanel(game.state,selectedTerritory):researchPanel(game.state);
    refreshIcons();return;
  }
  const s=game.state,id=selectedBuilding,b=BUILDINGS[id],level=s.buildings[id],cost=buildingCost(id,level);
  const workers=s.heroes.filter(h=>h.work===id), idle=s.heroes.filter(h=>!h.away&&!inFight(h)&&h.work!==id);
  const rate=b.resource?getRates(s)[b.resource]:0;
  $('#side-panel').innerHTML=`<button class="panel-close icon-button" data-action="panel-close" aria-label="Recolher painel">${icon('x')}</button>
    <div class="building-art">${environmentPortrait(id)}</div><div class="context-title"><span class="context-icon">${icon(b.icon)}</span><h2>${b.name}</h2><span>${level?`Nível ${level}`:'A construir'}</span></div><p>${b.desc}</p>
    <div class="context-output">${b.resource?`${icon(b.icon)} ${RESOURCES.find(r=>r.id===b.resource)!.name} <b>+${rate.toLocaleString('pt-BR',{maximumFractionDigits:1})}/s</b>`:id==='cura'?'Cerimônias e integração do vínculo ritual.':`Forja de componentes · ${level?Math.round(1/forgeRate(s)/60):'—'} min`}</div>
    <button class="primary" data-action="building-upgrade" data-max="${level>=MAX_BUILDING_LEVEL||game.state.settlement.orders.some(o=>o.kind==='building'&&o.target===id)||constructionCount(s)>=builderCount(s)}" ${costAttr(cost)}>${icon('hammer')}${game.state.settlement.orders.some(o=>o.kind==='building'&&o.target===id)?'Obra em andamento':level?'Melhorar · obra '+(25+level*12)+'s':'Construir · 25s'}<span class="cost">${costHTML(cost)}</span></button>
    ${id==='cura'?'<button class="outline-button" data-action="cura">Abrir rituais</button>':id==='hunt'?'<button class="outline-button" data-action="hunts">Explorar caçadas</button>':''}
    <div class="context-workers"><h3>Trabalhadores <small>${workers.length}/${workerSlots(s,id)}</small></h3><p>Trabalho concede 40 XP por minuto. Designar retira o herói da formação.</p>
    ${workers.map(h=>`<div class="worker"><b>${characterOf(h.characterId).name}</b><span>+${Math.round(workerBonus(h,id)*100)}%</span><button class="icon-button" data-unassign="${h.uid}" aria-label="Retirar ${characterOf(h.characterId).name} do trabalho">${icon('x')}</button></div>`).join('')}
    ${level&&workers.length<workerSlots(s,id)?idle.length?`<div class="assign-row"><select id="worker-select" aria-label="Herói para trabalhar">${idle.map(h=>`<option value="${h.uid}">${characterOf(h.characterId).name}${h.slot!==null?' · no campo':h.work?' · trabalhando':''}</option>`).join('')}</select><button class="outline-button" data-action="assign">Designar</button></div>`:'<button class="outline-button" data-action="tribe">Escolher um companheiro</button>':''}</div>
    <details class="context-more"><summary>Coleta e construções</summary><div class="building-tabs">${BUILDING_KEYS.map(key=>`<button data-building="${key}" class="${key===id?'active':''}" aria-label="${BUILDINGS[key].name}">${icon(BUILDINGS[key].icon)}</button>`).join('')}</div><div class="gather-buttons">${RESOURCES.filter(r=>r.id!=='spirit').map(r=>`<button data-gather="${r.id}" aria-label="Coletar ${r.name}">${icon(r.icon)}${r.name} +${GATHER_AMOUNT[r.id]*s.villageLevel}</button>`).join('')}</div></details>
    <div class="context-links"><button class="text-button" data-action="panel-close">${icon('maximize')}Mais espaço no mapa</button><button class="text-button" data-action="ancestors">${icon('landmark')}Totem</button></div>`;
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
    <p class="stage-level" title="Nível para o qual os inimigos estão preparados">${icon('swords')}Inimigos de nível ${Math.round(expectedLevel(stage.raid ? Math.max(2, s.progress * 0.85) : stage.id ? stage.id : endlessLevel(depth)))} · sua tribo até o nível ${Math.max(...s.heroes.map(h => h.level))}</p>
    <p class="stage-reward">${stage.raid ? 'Vitória: recursos e um componente garantido.' : reward ? `${stage.id <= s.progress && !game.battle?.firstClear ? 'Repetição' : 'Primeira vitória'}: <span class="cost">${costHTML(reward)}</span>` : `Recorde: ${s.endlessBest} · cada vitória aprofunda a caçada`}</p>
    <button class="outline-button" data-action="map" ${fighting ? 'disabled' : ''}>${icon('map')}Mapa das expedições <kbd>M</kbd></button>
   </div>
   <div class="coach-launch"><button class="outline-button" data-action="army-coach">${icon('swords')}Conselheiro · classes e laços</button></div>${armyWarnings(s,stage.id).slice(0,2).map(w=>`<p class="battle-coach-note">${esc(w)}</p>`).join('')}<div class="formation-count"><span>Sua formação</span><strong>${deployed.length}<small> / ${capacity(s)}</small></strong></div>
   ${deployed.some(h => h.away) ? `<p class="away-note">${icon('footprints')}${deployed.filter(h => h.away).map(h => characterOf(h.characterId).name).join(', ')} fora da aldeia: luta${deployed.filter(h => h.away).length > 1 ? 'm' : ''} quando voltar${deployed.filter(h => h.away).length > 1 ? 'em' : ''}.</p>` : ''}
   <div class="synergies"><p class="eyebrow">LAÇOS DA TRIBO</p>${syn.length ? syn.slice(0, 5).map(t => `<div class="synergy ${t.active ? 'active' : ''}" title="${esc(t.description)}">${icon(t.active ? 'diamond' : 'hexagon')}<span>${esc(t.name)}${t.tier > 1 ? ` <i class="synergy-tier">${'◆'.repeat(t.tier)}</i>` : ''}</span><b>${t.count}/${t.threshold}</b></div>`).join('') : '<p>Reúna heróis que compartilham características.</p>'}</div>
   <div class="battle-controls">
    <button class="primary" data-action="battle-start" ${!deployed.some(h => !h.away) || game.battle !== null || s.paused || !stageUnlocked(s, s.selectedStage) ? 'disabled' : ''}>${icon('swords')}${fighting ? 'Expedição em andamento' : 'Iniciar expedição'}${icon('arrow-right')}</button>
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
  const show = eventOpen && !!event && (view === 'village' || (event.kind === 'raid' && !game.battle));
  card.hidden = !show;
  if (!show || !event) { card.dataset.key = ''; return; }
  const left = Math.max(0, Math.ceil(event.expires - game.state.clock));
  const key = `${event.kind}|${event.expires}|${game.state.paused}`;
  const timer=card.querySelector('.event-timer'); if(timer)timer.textContent=timeLeft(event.expires);
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
  if (h.away?.kind === 'hunt') return `${icon('footprints')}Caçando · ${countdown(h.away.until)}`;
  if (h.away?.kind === 'ritual') return `${icon('leaf')}${esc(practiceById(h.away.id)!.name)} · ${countdown(h.away.until)}`;
  if (h.slot !== null) return `Posição ${h.slot + 1}`;
  if (h.work) return `Trabalhando · ${BUILDINGS[h.work].name.split(' ')[0]}`;
  return 'Reserva';
}

function renderCamp() {
  $('#camp-title').textContent='Sua tribo'; $('#reroll').hidden=false;
  const party=view==='battle'?game.state.heroes.filter(h=>h.slot!==null):game.state.heroes.slice(0,5);
  $('#camp-content').innerHTML=`<div class="hero-dock">${party.map(h=>`<button class="dock-hero ${h.uid===selectedHero?'selected':''} ${h.away?'away':''}" data-${view==='battle'?'hero':'inspect'}="${h.uid}" draggable="${view==='battle'&&!h.away}" data-drag-hero="${h.uid}" aria-label="${view==='battle'?'Selecionar':'Ver'} ${characterOf(h.characterId).name}">${portraitHTML(characterOf(h.characterId),h.stars)}<span class="dock-copy"><span class="dock-name">${characterOf(h.characterId).name}<small>${'★'.repeat(h.stars)}</small></span><em>${heroStatus(h)}</em>${growthBars(h,true)}</span></button>`).join('')}
  <button class="dock-add" data-action="${view==='battle'?'formation':'tribe'}">${icon(view==='battle'?'move':'users')}<span>${view==='battle'?'Organizar formação':'Abrir tribo'}</span>${icon('arrow-right')}</button></div>`;
}

function showTribe(tab=tribeTab,query=tribeQuery) {
  tribeTab=tab;tribeQuery=query;const s=game.state;
  const list=tab==='owned'?characters.filter(c=>s.heroes.some(h=>h.characterId===c.id)):characters;
  showModal('tribe',`<h2>Os guardiões da tribo</h2><p class="modal-intro">Cada companheiro tem uma identidade e dois caminhos de crescimento. Novas eras e vínculos rituais abrem o catálogo.</p><div class="tribe-toolbar"><div class="segmented"><button data-tribe-tab="owned" aria-pressed="${tab==='owned'}">Sua tribo · ${s.heroes.length}</button><button data-tribe-tab="catalog" aria-pressed="${tab==='catalog'}">Companheiros · 55</button></div><label class="search">${icon('search')}<input id="tribe-search" aria-label="Buscar companheiro" placeholder="Buscar nome ou característica" value="${esc(query)}"></label></div>
    <div class="tribe-grid">${list.filter(c=>`${c.name} ${c.traits.join(' ')}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))).map(c=>{
      const h=s.heroes.find(h=>h.characterId===c.id),rite=[1,2,3,5,7][c.cost-1],open=c.cost<=s.villageLevel&&s.heroes.some(h=>h.ritualLevel>=rite);
      return `<article class="companion ${open||h?'':'locked'}"><button class="companion-art" ${h?`data-inspect="${h.uid}"`:`data-character="${c.id}"`} aria-label="Ver ${c.name}">${portraitHTML(c,h?.stars??1)}</button><div><h3>${c.name}<small>${h?'★'.repeat(h.stars):`Era ${roman(c.cost)}`}</small></h3><p>${c.title}</p>${h?growthBars(h,true):`<p class="recruit-requirement">Era ${roman(c.cost)} · vínculo ritual ${rite}</p>`}<button class="${h?'outline-button':'primary'}" ${h?`data-inspect="${h.uid}"`:`data-recruit="${c.id}" ${open?costAttr(recruitCost(c.id,s)):'disabled'}`} data-lock-battle="true">${h?'Acompanhar herói':open?'Acolher companheiro':'Vínculo a descobrir'}${h?'':open?`<span class="cost">${costHTML(recruitCost(c.id,s))}</span>`:''}</button></div></article>`;
    }).join('')||'<p>Nenhum companheiro com essa busca.</p>'}</div>`);
}

function showHero(uid:string) {
  const h=game.state.heroes.find(h=>h.uid===uid);if(!h)return;
  inspectedHero=uid;const c=characterOf(h.characterId),sheet=artFor(c,h.stars).sheet;
  showModal('hero',`<div class="hero-inspector"><aside class="inspector-roster">${game.state.heroes.map(member=>`<button data-inspect="${member.uid}" class="${uid===member.uid?'selected':''}" aria-label="Ver ${characterOf(member.characterId).name}">${portraitHTML(characterOf(member.characterId),member.stars)}</button>`).join('')}</aside><section class="inspector-art"><canvas id="character-preview" width="640" height="560" role="img" aria-label="${c.name}, ${h.stars} estrelas"></canvas><h2>${c.name}</h2><p>${c.title}</p><span class="inspector-stars">${'★'.repeat(h.stars)}</span><p>${heroStatus(h)}</p><button class="text-button" data-character="${c.id}" data-stars="${h.stars}">Conhecer o espírito ${icon('arrow-right')}</button></section><section class="inspector-path"><div class="hero-role-guidance"><b>${ROLE_GUIDE[roleOf(c)].name} · ${ROLE_GUIDE[roleOf(c)].position}</b><p>${ROLE_GUIDE[roleOf(c)].description}</p><button class="text-button" data-coach-hero="${h.uid}">Analisar laços e equipamentos</button></div><button class="text-button" data-action="tribe">${icon('arrow-left')}Sua tribo</button><h2>O caminho do despertar</h2><p>Atividades fortalecem o corpo. Cerimônias aprofundam o vínculo.</p>${growthBars(h)}${awakeningMarkup(h)}<div class="hero-action-row"><button class="primary" data-ritual-hero="${uid}" ${h.away||inFight(h)?'disabled':''}>${icon('flame')}Preparar ritual</button><button class="outline-button" data-hunt-hero="${uid}" ${h.away||inFight(h)?'disabled':''}>${icon('footprints')}Enviar para uma caçada</button><button class="outline-button" data-formation-hero="${uid}" ${h.away||inFight(h)?'disabled':''}>${icon('move')}Organizar posição</button></div><details class="hero-equipment"><summary>Equipamento · ${h.items.length}/3</summary><div class="equipment-items">${h.items.map((id,i)=>itemChip(id,`data-unequip="${h.uid}:${i}"`)).join('')||'<p>Escolha um item da bolsa para equipar.</p>'}</div><div class="bag-items">${game.state.inventory.map((id,i)=>itemChip(id,`data-equip-direct="${h.uid}:${i}"`)).join('')||'<p>A bolsa está vazia.</p>'}</div></details><p class="integration-note">${h.away?`Atividade em andamento · ${countdown(h.away.until)}`:game.state.clock<h.ritualReadyAt?`Integração ritual · próximo rito em ${countdown(h.ritualReadyAt)}`:'Disponível para uma nova atividade.'}</p></section></div>`);
  if(sheet)preview.mount($<HTMLCanvasElement>('#character-preview'),c.id,h.stars,sheet);
}

function showFormation(uid=selectedHero??game.state.heroes[0]?.uid) {
  const s=game.state; if(s.heroes.find(h=>h.uid===uid)?.away)uid=s.heroes.find(h=>!h.away)?.uid??''; selectedHero=uid||null;
  showModal('formation',`<h2>Prepare a expedição</h2><p class="modal-intro">Escolha um herói e toque em uma casa. Uma casa ocupada troca os dois companheiros de posição. No computador, você também pode arrastar os retratos para o campo.</p><div class="formation-layout"><div class="formation-roster">${s.heroes.map(h=>`<button data-formation-hero="${h.uid}" aria-pressed="${h.uid===uid}" ${h.away?'disabled':''}>${portraitHTML(characterOf(h.characterId),h.stars)}<span>${characterOf(h.characterId).name}<small>${h.slot!==null?`Casa ${h.slot+1}`:'Reserva'}</small></span></button>`).join('')}</div><div><div class="formation-guidance"><span>Frente: Guardiões e Brigões.</span><span>Retaguarda: Caçadores, Místicos, Xamãs e Invocadores.</span></div><div class="formation-grid" role="group" aria-label="Casas da formação">${Array.from({length:FORMATION_SLOTS},(_,slot)=>{const h=s.heroes.find(h=>h.slot===slot);return`<button class="${slot<7?'front-line':'rear-line'}" data-place-slot="${slot}" aria-label="Casa ${slot+1}${h?`, ${characterOf(h.characterId).name}`:', vazia'}"><small>${slot+1}</small>${h?portraitHTML(characterOf(h.characterId),h.stars):icon('plus')}</button>`;}).join('')}</div><div class="formation-actions"><button class="outline-button" data-action="army-coach">Entender classes e sinergias</button><button class="primary" data-action="auto-formation">${icon('wand-sparkles')}Organizar por função</button>${uid?`<button class="outline-button" data-bench="${uid}">Mover para reserva</button>`:''}<button class="outline-button" data-action="formation-done">Voltar ao campo</button></div><p class="muted">Frente nas primeiras casas; atiradores e místicos nas fileiras de trás.</p></div></div>`);
}

function renderAll() {
  if (selectedHero && !game.state.heroes.some(h => h.uid === selectedHero)) selectedHero = null;
  if (selectedItem !== null && selectedItem >= game.state.inventory.length) selectedItem = null;
  document.querySelectorAll<HTMLButtonElement>('.nav-button[data-view]').forEach(n => n.classList.toggle('active', n.dataset.view === view));
  const s = game.state, stage = encounter();
  document.body.dataset.view=view;
  $('#journey-objective').innerHTML=journeyObjective();
  $('#rail-era').textContent = roman(s.villageLevel);
  $('#era-label').textContent = view === 'village' ? `ERA ${ERA_NAMES[s.villageLevel - 1].toUpperCase()}` : stage.raid ? 'DEFESA DA ALDEIA' : `EXPEDIÇÕES · ${stage.region ? stage.region.name.toUpperCase() : 'CAÇADA ETERNA'}`;
  $('#world-title').textContent = view === 'village' ? 'Clareira do Lobo' : stage.name + '.';
  $('#world-subtitle').textContent = view === 'village' ? 'Comande a população, erga obras e abra caminhos na mata.' : stage.raid ? 'Saqueadores rondam as cabanas. A tribo defende o que construiu.' : stage.region ? stage.region.subtitle : 'Feras cada vez mais fortes. Até onde a tribo chega?';
  $('#world-badge-text').textContent = view === 'village' ? 'Clareira do Lobo' : game.battle?.status === 'fighting' ? `Em combate · ${s.settings.speed}×` : 'Preparação';
  $('#world-hint').textContent = view === 'village' ? placement?'Escolha um terreno marcado para construir.':selectedCitizen!==null?'Selecione um local de produção para dar a ordem.':'Selecione aldeões, construções ou fronteiras no mapa.' : 'Selecione um herói abaixo e uma posição no campo.';
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
   ${b.xp ? `<p class="xp-line">${icon('sparkles')}+${b.xp} XP para cada herói${b.levelUps.length ? ` · <b>${b.levelUps.map(esc).join(', ')}</b>` : ''}</p>` : ''}
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
  ritualExperience?.destroy(); ritualExperience = null;
  $('#modal').dataset.surface=name;
  preview.clear(); activeModal = name;
  $('#modal-content').innerHTML = `<button class="modal-close icon-button" data-action="close" aria-label="Fechar">${icon('x')}</button>${html}`;
  if (!$<HTMLDialogElement>('#modal').open) $<HTMLDialogElement>('#modal').showModal();
  $('#modal').scrollTop = 0; refreshIcons();
}
const closeModal = () => { ritualExperience?.destroy(); ritualExperience = null; $<HTMLDialogElement>('#modal').close(); activeModal = ''; };

function showRitualExperience(id: PracticeId) {
  const uid = curaHero;
  const hero = game.state.heroes.find(h => h.uid === uid);
  if (!hero && id !== 'cacau') return;
  showModal('ritual-play', ritualExperienceMarkup(id, id === 'cacau' ? 'Toda a tribo' : hero ? `${portraitHTML(characterOf(hero.characterId), hero.stars)}<span>${esc(characterOf(hero.characterId).name)}</span>` : 'Toda a tribo'));
  ritualExperience = new RitualExperience($('#modal-content'), id, sound, quality => {
    const result = id === 'cacau' ? game.holdCacaoCircle(quality) : game.performRitual(uid!, id, quality);
    act(result, 'heal'); showCura();
  }, () => updatePref('sound', !prefs.sound), reducedMotion());
}

function armyContextKey(){return JSON.stringify([game.battle?.status,game.state.selectedStage,game.state.inventory,game.state.heroes.map(h=>[h.uid,h.slot,h.work,h.away?.until,h.items])]);}
function showArmyCoach(){
  const alreadyOpen=activeModal==='army-coach',scroll=alreadyOpen?$('#modal').scrollTop:0;
  const focused=alreadyOpen?(document.activeElement as HTMLElement|null)?.id:'';
  const enemyOpen=alreadyOpen&&!!document.querySelector<HTMLDetailsElement>('.enemy-advice')?.open;
  showModal('army-coach',armyCoach(game.state,coachHero,coachTrait,game.battle?.status==='fighting'));
  if(enemyOpen)document.querySelector<HTMLDetailsElement>('.enemy-advice')!.open=true;
  if(focused?.startsWith('coach-'))document.getElementById(focused)?.focus({preventScroll:true});
  $('#modal').scrollTop=scroll;
  coachStateKey=armyContextKey();
}

function codexTabs(active: string) {
  return `<div class="codex-tabs">${[['heroes', 'Heróis', 'users'], ['items', 'Itens', 'backpack'], ['spirits', 'Espíritos', 'feather'], ['traits', 'Laços', 'diamond']].map(([id, label, ic]) => `<button data-codex="${id}" class="${id === active ? 'active' : ''}">${icon(ic)}${label}</button>`).join('')}</div>`;
}

function showCodex(cost = 0, query = '') {
  const list = characters.filter(c => (!cost || c.cost === cost) && `${c.name} ${c.title} ${c.traits.join(' ')}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  showModal('codex', `<p class="eyebrow">O MUNDO DE WOLF TOTEM</p><h2>Memórias dos espíritos</h2>${codexTabs('heroes')}
   <div class="codex-tools"><label class="search">${icon('search')}<input id="codex-search" placeholder="Buscar herói ou característica" value="${esc(query)}" aria-label="Buscar no códice"/></label><div class="cost-filters">${[0, 1, 2, 3, 4, 5].map(n => `<button data-filter="${n}" class="${cost === n ? 'active' : ''}">${n === 0 ? 'Todos' : `Era ${roman(n)}`}</button>`).join('')}</div></div>
   <div class="codex-grid">${list.map(c => `<button class="codex-card cost-${c.cost}" data-character="${c.id}">${portraitHTML(c)}<span class="codex-cost">${c.cost}</span><span class="codex-name">${c.name}<small>${c.title}</small></span><span class="codex-status">${c.cost <= unlockedCost(game.state.villageLevel) ? 'Vínculo acessível' : `Era ${roman(c.cost)}`} · ${ANIMALITY[c.id].category}</span></button>`).join('') || '<p>Nenhum espírito encontrado com essa busca.</p>'}</div>`);
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
   </div><div class="character-story"><button class="text-button" data-action="codex">${icon('arrow-left')}Voltar ao códice</button><p class="eyebrow">ERA ${roman(c.cost)} · ${c.range > 1 ? 'ATAQUE À DISTÂNCIA' : 'CORPO A CORPO'}</p><h2>${c.name}</h2><h3>${c.title}</h3><div class="trait-chips">${c.traits.map(t => `<span>${t}</span>`).join('')}</div>
   <div class="stat-grid"><div>${icon('heart')}<strong>${c.hp[stars - 1]}</strong><small>Vida</small></div><div>${icon('swords')}<strong>${c.attack[stars - 1]}</strong><small>Ataque</small></div><div>${icon('shield')}<strong>${c.armor}/${c.magicResist}</strong><small>Armadura/RM</small></div><div>${icon('zap')}<strong>${c.attackSpeed}</strong><small>Ataques/s</small></div></div>
   <h4>${c.ability.name}</h4><p>${c.ability.description}</p>
   <div class="evolution"><span class="eyebrow">O DESPERTAR · ${stars} ESTRELA${stars > 1 ? 'S' : ''}</span><p>${c.evolution[stars - 1]}</p></div>
   <div class="prototype-skill"><span class="eyebrow">EFEITO EM COMBATE</span><p>${SKILL_NOTES[c.id]}</p></div>
   <div class="animality"><span class="eyebrow">VÍNCULO PRIMAL · ${animality.category.toUpperCase()}${animality.source === 'proposta' ? ' · PROPOSTA' : ''}</span><p>${ANIMALITY_RULES[animality.category]}</p></div>
   <p class="development-note">${c.cost <= unlockedCost(game.state.villageLevel) ? 'Vínculo acessível desta aldeia.' : `Chega à fogueira na Era ${roman(c.cost)}.`} ${{ painted: 'Esta forma tem animação pintada.', illustration: 'Esta forma usa a ilustração original com movimentos programados.', standin: `A forma ${stars}★ ainda não tem folha pintada: o jogo mostra a forma ${art.sheet?.stars ?? 1}★ com a aura do espírito.`, procedural: 'Figura desenhada pelo próprio jogo enquanto a arte pintada não chega; ela é substituída automaticamente.' }[art.kind]}</p></div></div>`);
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

function showHunts(focus?: string) {
  const s = game.state, out = s.heroes.filter(h => h.away?.kind === 'hunt'), slots = huntSlots(s.buildings.hunt);
  const home = s.heroes.filter(h => !h.away && !inFight(h));
  showModal('hunts', `<p class="eyebrow">CAÇADAS · ${out.length}/${slots} NA MATA</p><h2>As trilhas da floresta</h2>
   <p class="modal-intro">Os heróis caçam mesmo com o jogo fechado e voltam com experiência, alimento e às vezes um componente. Quem está na mata guarda o lugar na formação, mas só luta quando volta. Caçadas sem sucesso trazem <b>panema</b>, o azar do caçador: menos chance e menos experiência nas próximas, até ser limpa com sananga ou kambô na Casa de Cura.</p>
   ${out.length ? `<div class="away-list">${out.map(h => `<div class="away-row">${portraitHTML(characterOf(h.characterId), h.stars)}<span><b>${characterOf(h.characterId).name}</b> · ${esc(trailById(h.away!.id)!.name)} · volta em ${countdown(h.away!.until)}</span><button class="text-button" data-recall="${h.uid}">Chamar de volta</button></div>`).join('')}</div>` : ''}
   <div class="trail-grid">${TRAILS.map(t => {
     const locked = s.villageLevel < t.era, eligible = home.filter(h => h.level >= t.minLevel);
     return `<article class="trail-card ${locked ? 'locked' : ''}"><header><h3>${t.name}</h3><span>${icon('hourglass')}${t.minutes} min</span></header><p>${t.text}</p>
      <div class="trail-gains"><span title="Experiência">${icon('sparkles')}${t.xp} XP</span><span title="Alimento">${icon('wheat')}${t.food}</span><span title="Chance de componente">${icon('gem')}${Math.round(t.component * 100)}%</span></div>
      <p class="trail-req">${locked ? `${icon('lock')}Abre na Era ${roman(t.era)}` : `Herói de nível ${t.minLevel} ou mais`}</p>
      ${locked ? '' : eligible.length ? `<div class="assign-row"><select id="trail-${t.id}" aria-label="Herói para ${t.name}">${eligible.map(h => `<option value="${h.uid}" ${h.uid === focus ? 'selected' : ''}>${esc(heroLabel(h))}${h.focus ? ' · foco' : ''} · ${Math.round(huntChance(h.stars, h.panema, h.rituals.sananga ?? 0) * 100)}%</option>`).join('')}</select><button class="primary compact" data-start-hunt="${t.id}" ${out.length >= slots ? 'disabled title="Todos os caçadores estão na mata"' : ''}>Enviar</button></div>` : '<p class="muted small">Nenhum herói disponível com esse nível.</p>'}</article>`;
   }).join('')}</div>
   ${s.reports.length ? `<h3 class="codex-section">Notícias da mata e da maloca</h3><ul class="report-list">${[...s.reports].reverse().map(r => `<li class="${r.ok ? 'ok' : 'miss'}"><b>${esc(r.name)}</b> ${esc(r.text)}</li>`).join('')}</ul>` : ''}`);
}

function practiceCard(p: Practice, hero: Hero | undefined): string {
  const s = game.state, done = hero && !p.tribe ? hero.rituals[p.id] ?? 0 : 0;
  const locks: string[] = [];
  if (s.buildings.cura < p.curaLevel) locks.push(`Casa de Cura nível ${p.curaLevel}`);
  if (s.villageLevel < p.era) locks.push(`Era ${roman(p.era)}`);
  if (!p.tribe && hero && hero.level < p.minLevel) locks.push(`herói de nível ${p.minLevel}`);
  if (!p.tribe && hero && p.requires && !hero.rituals[p.requires]) locks.push(`antes, ${practiceById(p.requires)!.name}`);
  const full = !p.tribe && done >= p.max, lit = p.tribe && s.clock < s.cacao, cost = p.cost(done);
  const rest = p.rest / ritualSpeed(s), duration = rest >= 60 ? `${Math.round(rest / 6) / 10} min` : `${Math.round(rest)} s`;
  const state = p.tribe ? lit ? `Roda acesa · ${countdown(s.cacao)}` : '10 min para toda a tribo' : `${done}/${p.max} · ${duration}`;
  const button = locks.length ? `<span class="practice-lock">${icon('lock')}${esc(locks.join(' · '))}</span>`
    : full ? '<span class="practice-done">Completa</span>'
    : `<button class="primary compact" ${p.tribe ? 'data-action="cacao"' : `data-ritual="${p.id}"`} ${costAttr(cost)} data-max="${lit || (!p.tribe && !hero)}">${p.tribe ? 'Reunir a tribo' : 'Iniciar cerimônia'}<span class="cost">${costHTML(cost)}</span></button>`;
  return `<article class="practice-card ${p.id}"><header><h3>${p.name}</h3><span class="practice-native">${esc(p.native)}</span></header>
   <p class="practice-peoples">${icon('users')}${esc(p.peoples)}</p><p>${esc(p.text)}</p><p class="practice-effect">${icon('sparkles')}${esc(p.effect)}</p>
   <div class="practice-foot"><span class="practice-state">${state}</span>${button}</div></article>`;
}

function showCura() {
  const s=game.state,level=s.buildings.cura;
  if(!curaHero||!s.heroes.some(h=>h.uid===curaHero))curaHero=s.heroes[0]?.uid??null;
  const hero=s.heroes.find(h=>h.uid===curaHero),p=practiceById(chosenPractice)!,build=buildingCost('cura',level);
  const locks:string[]=[];
  if(level<p.curaLevel)locks.push(`Casa de Cura nível ${p.curaLevel}`);
  if(s.villageLevel<p.era)locks.push(`Era ${roman(p.era)}`);
  if(!p.tribe&&hero){if(hero.level<p.minLevel)locks.push(`Experiência nível ${p.minLevel}`);if(p.requires&&!hero.rituals[p.requires])locks.push(`${practiceById(p.requires)!.name} antes`);if(hero.away)locks.push('Herói em atividade');if(inFight(hero))locks.push('Herói em combate');if(s.clock<hero.ritualReadyAt)locks.push(`Integração: ${timeLeft(hero.ritualReadyAt)}`);}
  const done=hero?.rituals[p.id]??0;
  showModal('cura',`<div class="ritual-layout"><aside class="ritual-roster"><h3>Sua tribo</h3>${s.heroes.map(h=>`<button data-cura-hero="${h.uid}" class="${h.uid===curaHero?'selected':''}" aria-label="Rituais de ${characterOf(h.characterId).name}">${portraitHTML(characterOf(h.characterId),h.stars)}<span>${characterOf(h.characterId).name}</span></button>`).join('')}</aside><section class="ritual-path"><h2>O caminho do despertar</h2><p>Atividades fortalecem o corpo. Cerimônias aprofundam o vínculo.</p>${hero?`<div class="ritual-growth"><div><h3>${characterOf(hero.characterId).name} ${'★'.repeat(hero.stars)}</h3>${growthBars(hero)}</div>${awakeningMarkup(hero)}</div>`:''}
    <div class="ritual-heading"><h3>Cerimônias do espírito</h3>${level<15?`<button class="outline-button" data-cura-build="1" ${costAttr(build)} data-max="${s.settlement.orders.some(o=>o.kind==='building'&&o.target==='cura')||constructionCount(s)>=builderCount(s)}">${s.settlement.orders.some(o=>o.kind==='building'&&o.target==='cura')?'Maloca em obra':level?'Ampliar maloca':'Construir Casa de Cura'}<span class="cost">${costHTML(build)}</span></button>`:''}</div>
    <div class="ritual-selection"><nav aria-label="Cerimônias">${PRACTICES.map(practice=>`<button data-practice-select="${practice.id}" aria-pressed="${p.id===practice.id}">${icon(({rape:'feather',sananga:'eye',kambo:'heart',ayahuasca:'leaf',cacau:'cup-soda'} as Record<string,string>)[practice.id])}<span>${practice.name}<small>+${RITUAL_XP[practice.id]} XP ritual</small></span>${icon('chevron-right')}</button>`).join('')}</nav><article class="ritual-detail"><div class="ritual-symbol">${icon('flame')}</div><h3>${p.name}</h3><p>${p.effect}</p><div class="ritual-values"><span>Duração <b>${p.tribe?'10 min de bênção':`${Math.round(p.rest/ritualSpeed(s)/60)} min`}</b></span><span>Vínculo <b>+${RITUAL_XP[p.id]} XP ritual</b></span></div><p class="ritual-mastery">${p.tribe?'XP ritual para quem concluiu a integração.':`Bônus aprendido: ${done}/${p.max}. Repetir continua concedendo XP ritual.`}</p><p class="ritual-participation">${RITUAL_PLAY[p.id].instruction} Até 20% de XP ritual extra pela sintonia. Também é possível seguir automaticamente.</p>${locks.length?`<p class="ritual-lock">${icon('lock')}${esc(locks.join(' · '))}</p>`:''}<button class="primary" ${p.tribe?'data-action="cacao"':`data-ritual="${p.id}"`} ${costAttr(p.cost(done))} data-max="${!!locks.length||!hero||(p.tribe&&s.clock<s.cacao)}">${p.tribe?'Participar da roda':'Participar da cerimônia'}<span class="cost">${costHTML(p.cost(done))}</span></button>${hero?`<button class="outline-button" data-hunt-hero="${hero.uid}" ${hero.away?'disabled':''}>Enviar para uma caçada ${icon('arrow-right')}</button>`:''}<details><summary>Tradição e contexto</summary><p>${esc(p.text)}</p><p>${esc(p.peoples)}</p><p>${esc(CURA_NOTE)}</p></details></article></div>${hero?.away?`<div class="integration-note">${hero.away.kind==='ritual'?'Cerimônia':'Caçada'} em andamento · ${countdown(hero.away.until)}${hero.away.returnWork?' · Retorna ao trabalho após o rito.':''}${hero.away.participationXp?` · +${hero.away.participationXp} XP extra pela participação.`:''}</div>`:hero&&s.clock<hero.ritualReadyAt?`<div class="integration-note">Integrando a experiência · próximo rito em ${countdown(hero.ritualReadyAt)}</div>`:''}</section></div>`);
}

function journeyObjective():string {
  if(view==='village'){
    const s=game.state,m=SETTLEMENT_MILESTONES.find(m=>!s.settlement.milestones.includes(m.id)),need=ERA_GROWTH[s.villageLevel-1];
    if(m)return`<div><span class="context-icon">${icon('flag')}</span><span><strong>${m.name}</strong><small>${m.hint}</small></span></div><div class="objective-actions">${m.done(s)?`<button class="primary" data-settlement-milestone="${m.id}">Receber recursos</button>`:`<button class="outline-button" data-rts-mode="${({hands:'economy',roof:'construct',frontier:'territory',knowledge:'research',village:'economy',lands:'territory'} as Record<string,string>)[m.id]}">Planejar próximo passo</button>`}${pendingEra(s)?'<button class="primary" data-action="spirit-choice">Escolher espírito</button>':''}${s.villageLevel<5?`<button class="outline-button" data-action="village-upgrade" ${costAttr(villageCost(s.villageLevel))} data-max="${!s.heroes.some(h=>h.level>=need.level&&h.ritualLevel>=need.ritualLevel)}">Avançar era · XP ${need.level} / rito ${need.ritualLevel}</button>`:''}<button class="text-button" data-action="journal">Diário da jornada</button></div>`;
  }
  const s=game.state,era=pendingEra(s),quest=openQuests(s)[0],need=ERA_GROWTH[s.villageLevel-1];
  return `<div><span class="context-icon">${icon(era?'sparkles':'compass')}</span><span><strong>${era?'Uma nova era desperta.':quest?esc(quest.title):objective().title}</strong><small>${era?'Escolha o espírito que acompanhará a tribo.':quest?esc(quest.hint):objective().text}</small></span></div><div class="objective-actions">${s.event?`<button class="outline-button" data-action="event-open">${icon('bell')}Acontecimento</button>`:''}${era?`<button class="primary" data-action="spirit-choice">Escolher espírito da Era ${roman(era)}</button>`:quest?.done(s)?`<button class="primary" data-quest="${quest.id}">Receber recompensa</button>`:'<button class="outline-button" data-action="journal">Ver diário</button>'}${s.villageLevel<5?`<button class="outline-button" data-action="village-upgrade" title="Experiência ${need.level} e ritual ${need.ritualLevel}" ${costAttr(villageCost(s.villageLevel))}>Avançar era · XP ${need.level} / rito ${need.ritualLevel}</button>`:''}${view==='battle'&&!panelOpen?`<button class="primary" data-action="battle-start" ${game.battle?.status==='fighting'||s.paused?'disabled':''}>${game.battle?.status==='fighting'?'Em expedição':'Iniciar expedição'}</button>`:''}${!panelOpen?`<button class="outline-button" data-action="panel-open">${view==='battle'?'Ações da expedição':'Ações da aldeia'}</button>`:''}</div>`;
}

function help() {
  showModal('help', `<p class="eyebrow">BEM-VINDO À PRIMEIRA CHAMA</p><h2>Uma tribo começa com você.</h2><div class="guide-steps">
   <div><span>01</span><h3>Comande a aldeia</h3><p>Akru chega com quatro aldeões. Distribua os ofícios em População e mantenha construtores disponíveis. Em Construir, escolha uma moradia, depósito ou roça e um terreno livre; as obras levam tempo. Reconheça Territórios, estabeleça postos e abra novos terrenos. Pesquisas melhoram a economia e a defesa. O trabalho continua enquanto você está fora.</p></div>
   <div><span>02</span><h3>Ouça os espíritos</h3><p>Acolha companheiros no catálogo: cada companheiro desperta estrelas ao alcançar os requisitos de experiência e ritualística. A cada era, escolha um Espírito Protetor: um bônus permanente e um poder para acionar em combate.</p></div>
   <div><span>03</span><h3>Prepare a expedição</h3><p>Abra o Conselheiro para entender funções, os 31 laços e os equipamentos dos seus heróis. Escolha duas prioridades e aplique uma formação sugerida, ou ajuste as casas manualmente. O conselho também analisa o próximo inimigo. Vitórias trazem recursos e componentes; depois do Primeiro Inverno, a Caçada Eterna e o Grande Totem aguardam.</p></div></div>
   <p class="development-note">Atalhos: G população · B construir · V territórios · R pesquisas · A conselheiro · 1 aldeia · 2 expedição · 3 códice · 4 totem · C caçadas · M campanha · P pausar · Esc fechar.</p><button class="primary" data-action="close">Seguir o chamado ${icon('arrow-right')}</button>`);
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
     <p class="modal-intro">O progresso é salvo automaticamente neste navegador. Ao voltar, a aldeia recebe até 12 horas de produção e atividades acumuladas, inclusive da forja. Uma jornada pausada não acumula recursos.</p>
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
     <div class="title-links"><button class="text-button" data-action="import">${icon('upload')}Carregar jornada salva</button><button class="text-button" data-action="settings">${icon('settings-2')}Configurações</button><button class="text-button" data-action="help">${icon('book-open')}Como jogar</button></div>
    </div>
    <p class="title-version">VERSÃO 2.0 · ${storage ? 'progresso salvo neste navegador' : 'salvamento indisponível neste navegador'}</p>
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
  // The objective strip keeps pending spirit choices available without interrupting another action.
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
  if (d.building) { panelOpen=true;villageMode='building'; selectedBuilding = d.building as BuildingId; renderSide(); return; }
  if(d.rtsMode){villageMode=d.rtsMode as typeof villageMode;panelOpen=true;world.setStrategic(villageMode==='territory');if(villageMode!=='construct'){placement=null;world.setBuildMode(null);}if(view!=='village')setView('village');else renderSide();return;}
  if(d.infrastructure){placement=d.infrastructure as InfrastructureId;villageMode='construct';world.setBuildMode(placement);renderSide();return;}
  if(d.placementCancel!==undefined){placement=null;world.setBuildMode(null);renderSide();return;}
  if(d.buildOnPlot!==undefined&&placement){const result=game.buildInfrastructure(placement,$<HTMLSelectElement>('#rts-plot').value);act(result);if(result.ok){placement=null;world.setBuildMode(null);}renderSide();return;}
  if(d.trainCitizen!==undefined){act(game.trainCitizen());return;}
  if(d.citizenAdjust){const [job,delta]=d.citizenAdjust.split(':');act(game.adjustCitizens(job as CitizenJob,Number(delta)),'click');return;}
  if(d.citizenJob){act(game.setCitizenJob(Number(d.citizenId),d.citizenJob as CitizenJob),'click');return;}
  if(d.citizenClear!==undefined){selectedCitizen=null;world.selectCitizen(null);renderSide();return;}
  if(d.territory){selectedTerritory=d.territory;villageMode='territory';renderSide();return;}
  if(d.scoutTerritory){act(game.scoutTerritory(d.scoutTerritory),'click');return;}
  if(d.claimTerritory){act(game.claimTerritory(d.claimTerritory));return;}
  if(d.research){act(game.researchVillage(d.research as ResearchId));return;}
  if(d.cancelOrder){act(game.cancelVillageOrder(Number(d.cancelOrder)),'click');return;}
  if(d.settlementMilestone){act(game.claimSettlementMilestone(d.settlementMilestone),'recruit');return;}
  if(d.villageTrade!==undefined){act(game.tradeResources($<HTMLSelectElement>('#trade-from').value as Resource,$<HTMLSelectElement>('#trade-to').value as Resource),'item');return;}
  if(d.coachHero){coachHero=d.coachHero;showArmyCoach();return;}
  if(d.coachTrait){coachTrait=d.coachTrait;showArmyCoach();return;}
  if(d.armyFocus){act(game.setArmyFocus(d.armyFocus),'click');showArmyCoach();return;}
  if(d.armyPreset){for(const trait of [...game.state.settlement.focusTraits])game.setArmyFocus(trait);for(const trait of d.armyPreset.split(','))game.setArmyFocus(trait);save();showArmyCoach();return;}
  if(d.advisorDeploy){const replacement=game.state.heroes.find(h=>h.uid===d.replaceHero);const slot=replacement?.slot??Array.from({length:FORMATION_SLOTS},(_,i)=>i).find(i=>!game.state.heroes.some(h=>h.slot===i))??0;act(game.deploy(d.advisorDeploy,slot),'click');showArmyCoach();return;}
  if(d.advisorEquip){const [uid,index]=d.advisorEquip.split(':');act(game.equipItem(uid,Number(index)),'item');showArmyCoach();return;}
  if(d.advisorRecipe){const [a,b]=d.advisorRecipe.split(':');act(game.combineItems(Number(a),Number(b)),'item');showArmyCoach();return;}
  if (d.gather) { act(game.gather(d.gather as Resource), 'click'); return; }
  if (d.recruit) { act(game.recruit(Number(d.recruit)), 'recruit'); if(activeModal==='tribe')showTribe(); return; }
  if (d.curaHero) { curaHero=d.curaHero; showCura(); return; }
  if (d.inspect) { showHero(d.inspect); return; }
  if (d.tribeTab) { showTribe(d.tribeTab); return; }
  if (d.ritualHero) { curaHero=d.ritualHero; showCura(); return; }
  if (d.practiceSelect) { chosenPractice=d.practiceSelect; showCura(); return; }
  if (d.formationHero) { showFormation(d.formationHero); return; }
  if (d.placeSlot!==undefined&&selectedHero) { const result=game.deploy(selectedHero,Number(d.placeSlot)); act(result,'click'); showFormation(); return; }
  if (d.equipDirect) { const [uid,i]=d.equipDirect.split(':'); act(game.equipItem(uid,Number(i)),'item'); showHero(uid); return; }
  if (d.hero) {
    if (selectedItem !== null) { const r = game.equipItem(d.hero, selectedItem); selectedItem = null; act(r, 'item'); return; }
    selectedHero = selectedHero === d.hero ? null : d.hero; sound.play('click'); renderCamp(); renderSide(); return;
  }
  if (d.inv !== undefined) {
    const index = Number(d.inv), current = selectedItem;
    if (current !== null && current !== index && isComponent(game.state.inventory[current]) && isComponent(game.state.inventory[index]) && game.state.buildings.forge > 0) {
      selectedItem = null; act(game.combineItems(current, index), 'item'); return;
    }
    selectedItem = current === index ? null : index; sound.play('click'); renderCamp(); return;
  }
  if (d.unequip) { const [uid, i] = d.unequip.split(':'); act(game.unequipItem(uid, Number(i)), 'item'); if(activeModal==='hero')showHero(uid); return; }
  if (d.bench) { act(game.deploy(d.bench, null), 'click'); if(activeModal==='formation')showFormation(d.bench); return; }
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
  if (d.startHunt) { const select = document.querySelector<HTMLSelectElement>(`#trail-${d.startHunt}`); if (select) { act(game.startHunt(select.value, d.startHunt), 'click'); showHunts(); } return; }
  if (d.recall) { act(game.recallHunt(d.recall), 'click'); showHunts(); return; }
  if (d.huntHero) { showHunts(d.huntHero); return; }
  if (d.ritual) { if (curaHero) showRitualExperience(d.ritual as PracticeId); return; }
  if (d.curaBuild) { act(game.queueBuilding('cura')); showCura(); return; }
  if (d.quest) { const r = game.claimQuest(d.quest); act(r, 'item'); if (activeModal === 'journal') showJournal(); return; }
  if (d.memory) { act(game.buyMemory(d.memory as MemoryId), 'upgrade'); showAncestors(); return; }
  switch (d.action) {
    case 'army-coach':showArmyCoach();break;
    case 'apply-army-plan':act(game.applyArmyPlan(),'click');showArmyCoach();break;
    case 'tribe': showTribe(); break;
    case 'formation': showFormation(); break;
    case 'auto-formation': act(game.autoFormation(),'click'); showFormation(); break;
    case 'formation-done': closeModal(); setView('battle'); break;
    case 'panel-close': panelOpen=false; renderSide(); break;
    case 'panel-open': panelOpen=true; renderSide(); break;
    case 'event-open': eventOpen=!eventOpen; renderEvent(); break;
    case 'preview-flip': preview.flip(); break;
    case 'preview-pause': target.textContent = preview.toggle() ? 'Retomar prévia' : 'Pausar prévia'; break;
    case 'place-selected': if (selectedHero) act(game.deploy(selectedHero, Number($<HTMLSelectElement>('#formation-slot').value)), 'click'); break;
    case 'sell-selected': if (selectedHero) { act(game.sellHero(selectedHero), 'click'); selectedHero = null; } break;
    case 'assign': act(game.assignWorker($<HTMLSelectElement>('#worker-select').value, selectedBuilding), 'upgrade'); break;
    case 'building-upgrade': act(game.queueBuilding(selectedBuilding)); break;
    case 'village-upgrade': { const r = game.upgradeVillage(); act(r, 'era'); if (r.ok) showSpiritChoice(); break; }
    case 'spirit-choice': showSpiritChoice(); break;
    case 'reroll': act(game.rerollShop(), 'click'); break;
    case 'battle-start': startNext(); break;
    case 'battle-again': window.clearTimeout(repeatTimer); startNext(); break;
    case 'battle-dismiss': window.clearTimeout(repeatTimer); game.dismissBattle(); renderAll(); break;
    case 'speed': game.setSpeed(game.state.settings.speed % 3 + 1); save(); renderAll(); break;
    case 'auto-repeat': toast(game.toggleAutoRepeat() ? 'Repetição automática ligada: após cada vitória a expedição recomeça.' : 'Repetição automática desligada.'); save(); renderAll(); break;
    case 'map': showMap(); break;
    case 'hunts': showHunts(); break;
    case 'cura': showCura(); break;
    case 'cacao': showRitualExperience('cacau'); break;
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
    case 'export': {
      const url = URL.createObjectURL(new Blob([game.serialize()], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = `wolf-totem-jornada-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Jornada exportada. Guarde o arquivo para continuar em outro navegador ou aparelho.');
      break;
    }
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
  if(input.id==='coach-trait'){coachTrait=input.value;showArmyCoach();return;}
  if(input.id==='coach-hero'){coachHero=input.value;showArmyCoach();return;}
  if (input.id === 'cura-hero') { curaHero = input.value; showCura(); return; }
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
  const input = event.target as HTMLInputElement, file = input.files?.[0];
  input.value = '';
  if (!file) return;
  let data: unknown;
  try {
    if (file.size > 500_000) throw new Error();
    data = JSON.parse(await file.text());
    const root = data as { version?: number; state?: { heroes?: unknown; resources?: unknown } };
    if (!root || ![1, 2, 3, 4, 5].includes(root.version as number) || !root.state || !Array.isArray(root.state.heroes) || !root.state.resources) throw new Error();
  } catch { toast('Arquivo de progresso inválido. Sua jornada atual foi preservada.'); return; }
  const imported = new Game(data);
  try {
    localStorage.setItem(SAVE_KEY, imported.serialize());
    sessionStorage.setItem(LOADED_KEY, '1');
  } catch { toast('Este navegador está bloqueando o salvamento local. Libere o armazenamento do site e tente de novo.'); return; }
  wiping = true; location.reload();
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
  if (key === 'c') showHunts();
  if (key === 'p') { game.togglePause(); save(); renderAll(); }
  if (key === 'b'||key === 'g'||key === 'v'||key === 'r') {villageMode=({b:'construct',g:'economy',v:'territory',r:'research'} as const)[key];if(villageMode!=='construct'){placement=null;world.setBuildMode(null);}panelOpen=true;world.setStrategic(villageMode==='territory');if(view!=='village')setView('village');else renderSide();}
  if (key === 'a') showArmyCoach();
});
$<HTMLDialogElement>('#modal').addEventListener('click', event => { if (event.target === $('#modal')) closeModal(); });
$('#modal').addEventListener('close', () => { ritualExperience?.destroy(); ritualExperience = null; preview.clear(); activeModal = ''; });
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
    const actor=game.battle?.entities.find(e=>e.id===event.sourceId);
    if(actor&&['prepare','attack','skill','damage','shield'].includes(event.type)){
      sound.combat(event.type as 'prepare'|'attack'|'skill'|'damage'|'shield',actor.characterId,actor.x/6.5*2-1,event.school==='magic',Math.min(1,(event.amount??30)/180));continue;
    }
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
try { if (sessionStorage.getItem(LOADED_KEY)) { sessionStorage.removeItem(LOADED_KEY); toast('Jornada carregada. Bem-vindo de volta à fogueira.'); } } catch { /* nothing to confirm */ }
requestAnimationFrame(frame);
window.addEventListener('beforeunload', () => { save(); world.destroy(); });

document.addEventListener('input',event=>{const input=event.target as HTMLInputElement;if(input.id==='tribe-search'){const position=input.selectionStart;showTribe(tribeTab,input.value);const next=$<HTMLInputElement>('#tribe-search');next.focus();next.setSelectionRange(position,position);}});
document.addEventListener('dragstart',event=>{const hero=(event.target as HTMLElement).closest<HTMLElement>('[data-drag-hero]');if(hero){event.dataTransfer?.setData('text/wolf-hero',hero.dataset.dragHero!);if(event.dataTransfer)event.dataTransfer.effectAllowed='move';}});
$('#world').addEventListener('dragover',event=>{if(view==='battle'&&!game.battle)event.preventDefault();});
$('#world').addEventListener('drop',async event=>{event.preventDefault();if(view!=='battle'||game.battle)return;const uid=event.dataTransfer?.getData('text/wolf-hero');if(!uid)return;const canvas=$<HTMLCanvasElement>('#world canvas'),r=canvas.getBoundingClientRect();const x=(event.clientX-r.left)/r.width*1200,y=(event.clientY-r.top)/r.height*740;const nearest=Array.from({length:FORMATION_SLOTS},(_,slot)=>{const cell=allySlotCenter(slot),[px,py]=project(cell.x,cell.y);return{slot,d:Math.hypot(x-px,y-py)};}).sort((a,b)=>a.d-b.d)[0];if(nearest.d<70){selectedHero=uid;act(game.deploy(uid,nearest.slot),'click');}else toast('Solte o herói em uma casa da sua metade do campo.');});
