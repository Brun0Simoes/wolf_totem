import './style.css';
import './refinements.css';
import { createIcons, icons } from 'lucide';
import { characters, type Character } from './data/characters';
import { Game, getRates, buildingCost, villageCost, recruitCost, getSynergies, capacity, GATHER_AMOUNT, REROLL_COST, MAX_BUILDING_LEVEL, SKILL_NOTES, type BuildingId, type Resource, type Resources, type ActionResult } from './game/simulation';
import { createWorld } from './render/WorldScene';

const SAVE_KEY = 'wolf-totem-v1';
let saved: unknown;
try { saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch { saved = undefined; }
const game = new Game(saved);
let view: 'village' | 'battle' = 'village';
let selectedHero: string | null = null;
let selectedBuilding: BuildingId = 'lumber';
let activeModal = '';
let lastBattleStatus = '';
let lastWave = game.state.wave;
let muted = true;
let audioContext: AudioContext | undefined;
let storageFailed = false;
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const icon = (name: string, cls = '') => `<i data-lucide="${name}" class="${cls}"></i>`;
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Math.floor(v));
const resources: {id:Resource;name:string;icon:string}[] = [{id:'wood',name:'Madeira',icon:'tree-pine'},{id:'food',name:'Alimento',icon:'wheat'},{id:'stone',name:'Pedra',icon:'mountain'},{id:'spirit',name:'Espírito',icon:'flame'}];
const buildings: Record<BuildingId,{name:string;desc:string;icon:string;resource:Resource}> = {
 lumber:{name:'Bosque dos coletores',desc:'A madeira sustenta o crescimento da aldeia.',icon:'trees',resource:'wood'},
 hunt:{name:'Acampamento de caça',desc:'Alimento para uma tribo cada vez maior.',icon:'crosshair',resource:'food'},
 quarry:{name:'Pedreira ancestral',desc:'Pedras para construir o que vai permanecer.',icon:'mountain',resource:'stone'},
 shrine:{name:'Círculo dos espíritos',desc:'A chama atrai novos guardiões para a tribo.',icon:'flame',resource:'spirit'},
};
const costHTML = (cost:Resources) => resources.filter(r=>cost[r.id]>0).map(r=>`<span title="${r.name}">${icon(r.icon)}${fmt(cost[r.id])}</span>`).join('');
const canAfford = (cost:Resources) => resources.every(r=>game.state.resources[r.id]>=cost[r.id]);
const art = (c:Character,stars=1) => c.art ? `/chars/${c.art}-${stars}star.png` : '';
const refreshIcons = () => createIcons({icons,attrs:{'stroke-width':1.6,'aria-hidden':'true'}});

$('#app').innerHTML = `
 <header class="topbar">
  <a class="brand" href="#" aria-label="Wolf Totem, início"><span class="brand-mark">${icon('dog')}</span><span>WOLF <b>TOTEM</b><small>O DESPERTAR DA TRIBO</small></span></a>
  <div class="resources" aria-label="Recursos da aldeia">${resources.map(r=>`<div class="resource ${r.id}" title="${r.name}"><span class="resource-icon">${icon(r.icon)}</span><div><small>${r.name}</small><strong id="res-${r.id}">0</strong></div><span class="rate" id="rate-${r.id}"></span></div>`).join('')}</div>
  <div class="header-actions"><button class="icon-button" data-action="audio" aria-label="Ativar sons" title="Sons">${icon('volume-x')}</button><button class="icon-button" data-action="pause" aria-label="Pausar jogo" title="Pausar (P)">${icon('pause')}</button><button class="icon-button" data-action="settings" aria-label="Ajuda e salvamento" title="Ajuda e salvamento">${icon('settings-2')}</button></div>
 </header>
 <div class="game-shell">
  <nav class="rail" aria-label="Navegação principal"><div class="nav-group"><button class="nav-button active" data-view="village">${icon('tent-tree')}<span>Aldeia</span></button><button class="nav-button" data-view="battle">${icon('swords')}<span>Expedição</span></button><button class="nav-button" data-action="codex">${icon('book-open')}<span>Códice</span></button></div><div class="rail-bottom"><span class="vertical-caption">SIGA O CHAMADO</span><span class="rail-seal">I</span></div></nav>
  <main class="main-area">
   <div class="play-area"><section class="world-wrap" aria-label="Mundo da tribo">
    <div id="world"></div>
    <div class="world-heading"><p class="eyebrow" id="era-label">ERA I · AS PRIMEIRAS PEGADAS</p><h1 id="world-title">O primeiro fogo.</h1><p id="world-subtitle">Uma pequena chama. O início de uma grande tribo.</p></div>
    <div class="world-badge"><span class="live-dot"></span><span id="world-badge-text">Clareira do Lobo</span>${icon('sun')}</div>
    <div class="world-caption"><span class="map-coordinate">23° N &nbsp; / &nbsp; 07° L</span><span id="world-hint">Selecione uma construção para evoluir sua aldeia.</span></div>
    <div id="pause-overlay" class="pause-overlay" hidden><span>${icon('pause')}O tempo descansa.</span><button class="primary" data-action="pause">Retomar jornada</button></div>
    <div id="battle-result" class="battle-result" hidden></div>
   </section><aside class="side-panel" id="side-panel" aria-label="Ações da aldeia"></aside></div>
   <section class="camp-section"><div class="section-heading"><div><p class="eyebrow">HERÓIS & ESPÍRITOS</p><h2 id="camp-title">Ao redor da fogueira</h2></div><button class="text-button" data-action="reroll" id="reroll">${icon('refresh-cw')}Novos viajantes <span class="small-cost">${REROLL_COST.spirit} ${icon('flame')}</span></button></div><div id="camp-content"></div></section>
   <footer><span><span class="live-dot"></span><span id="save-status">Progresso salvo neste navegador</span></span><span>WOLF TOTEM <b>·</b> PROTÓTIPO 0.2</span><button class="text-button" data-action="help">Guia da tribo ${icon('arrow-up-right')}</button></footer>
  </main>
 </div>
 <div id="toast" class="toast" role="status" aria-live="polite"></div>
 <dialog id="modal"><div id="modal-content"></div></dialog>
 <input id="save-file" type="file" accept="application/json,.json" hidden />`;

const world = createWorld($('#world'), game, { onBuilding(id) { selectedBuilding=id; renderSide(); }, onSlot(slot) { if (!selectedHero) return toast('Escolha um herói abaixo e depois uma posição.'); act(game.deploy(selectedHero,slot)); renderAll(); } });

function toast(message:string) { $('#toast').textContent=message; $('#toast').classList.add('show'); window.clearTimeout(toastTimer); toastTimer=window.setTimeout(()=>$('#toast').classList.remove('show'),3500); }
let toastTimer=0;
function chime() { if(muted) return; try { audioContext ||= new AudioContext(); void audioContext.resume(); const o=audioContext.createOscillator(),g=audioContext.createGain(); o.type='sine'; o.frequency.setValueAtTime(440,audioContext.currentTime); o.frequency.exponentialRampToValueAtTime(660,audioContext.currentTime+.12); g.gain.setValueAtTime(.045,audioContext.currentTime); g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.28); o.connect(g); g.connect(audioContext.destination); o.start(); o.stop(audioContext.currentTime+.3); } catch {/* Audio is optional. */} }
function save() { try {localStorage.setItem(SAVE_KEY,game.serialize()); $('#save-status').textContent='Progresso salvo neste navegador'; storageFailed=false;}catch {storageFailed=true; $('#save-status').textContent='Salvamento indisponível · exporte sua jornada';} }
function act(result:ActionResult) {toast(result.message); if(result.ok){ chime(); save(); } renderAll();}
function setView(next:typeof view) {view=next; world.setView(view); renderAll();}

function renderMetrics() {
 const rates=getRates(game.state);
 for(const r of resources) { $(`#res-${r.id}`).textContent=fmt(game.state.resources[r.id]); $(`#rate-${r.id}`).textContent=`+${rates[r.id].toLocaleString('pt-BR',{maximumFractionDigits:1})}/s`; }
 $('#pause-overlay').hidden=!game.state.paused;
 const pause=$('[data-action="pause"]');
 if(pause.dataset.paused!==String(game.state.paused)){
  pause.dataset.paused=String(game.state.paused);pause.innerHTML=icon(game.state.paused?'play':'pause'); pause.setAttribute('aria-label',game.state.paused?'Retomar jogo':'Pausar jogo');refreshIcons();
 }
 document.querySelectorAll<HTMLButtonElement>('[data-cost]').forEach(b=>{const c=JSON.parse(b.dataset.cost!) as Resources;b.disabled=b.dataset.max==='true'||!canAfford(c)||game.state.paused||!!(b.dataset.lockBattle && game.battle?.status==='fighting');});
 $('#save-status').textContent=storageFailed?'Salvamento indisponível · exporte sua jornada':game.state.paused?'Jornada pausada':'Progresso salvo neste navegador';
}
const costAttr=(c:Resources)=>`data-cost='${JSON.stringify(c)}'`;
function renderSide() {
 const s=game.state;
 if(view==='village') {
  const b=buildings[selectedBuilding],level=s.buildings[selectedBuilding],cost=buildingCost(selectedBuilding,level),vc=villageCost(s.villageLevel);
  $('#side-panel').innerHTML=`<div class="panel-kicker">SUA ALDEIA <span>NÍVEL ${s.villageLevel}</span></div><div class="village-summary"><span class="large-seal">${icon('tent-tree')}</span><h2>Clã da Primeira Chama</h2><p>${s.heroes.length} heróis reunidos · ${capacity(s)} vagas na formação</p></div><div class="objective"><span class="objective-symbol">${icon('sparkles')}</span><div><small>O PRÓXIMO PASSO</small><strong>${s.villageLevel===1?'Crie raízes. Expanda a aldeia.':s.wave<=12?'Os espíritos chamam por você.':'A floresta conhece seu nome.'}</strong><p>${s.villageLevel===1?'Colete recursos e alcance o nível 2 para levar mais um herói à expedição.':s.wave<=12?`Prepare sua formação para a expedição ${s.wave} de 12.`:'Você concluiu as 12 expedições. Continue evoluindo sua tribo.'}</p></div></div><div class="building-tabs">${(Object.keys(buildings) as BuildingId[]).map(id=>`<button data-building="${id}" class="${id===selectedBuilding?'active':''}" title="${buildings[id].name}" aria-label="${buildings[id].name}">${icon(buildings[id].icon)}</button>`).join('')}</div><div class="building-details"><div class="detail-heading"><h3>${b.name}</h3><span>NV. ${level}</span></div><p>${b.desc}</p><button class="outline-button" data-action="building-upgrade" data-max="${level>=MAX_BUILDING_LEVEL}" ${costAttr(cost)}>${icon('hammer')} ${level>=MAX_BUILDING_LEVEL?'Nível máximo':'Melhorar'} <span class="cost">${costHTML(cost)}</span></button></div><div class="gather-title">DA TERRA, NOSSO SUSTENTO</div><div class="gather-buttons">${resources.filter(r=>r.id!=='spirit').map(r=>`<button data-gather="${r.id}" title="Coletar ${r.name.toLowerCase()}">${icon(r.icon)}<span>${r.name}</span><b>+${GATHER_AMOUNT[r.id]}</b></button>`).join('')}</div><div class="village-upgrade">${s.villageLevel<5?`<button class="primary" data-action="village-upgrade" ${costAttr(vc)}>${icon('chevrons-up')}Evoluir aldeia <span>Nv. ${s.villageLevel+1}</span></button><div class="upgrade-cost cost">${costHTML(vc)}</div>`:`<p class="max-level">${icon('crown')} Aldeia no nível máximo</p>`}</div>`;
 } else {
 const deployed=s.heroes.filter(h=>h.slot!==null),syn=getSynergies(s);
 $('#side-panel').innerHTML=`<div class="panel-kicker">EXPEDIÇÃO <span>${Math.min(s.wave,12)} / 12</span></div><div class="village-summary"><span class="large-seal">${icon('swords')}</span><h2>${s.wave<=3?'Além da clareira':s.wave<=7?'Ecos da floresta':'Terras ancestrais'}</h2><p>${s.wave>12?'Jornada concluída':`Onda ${s.wave} · combate automático`}</p></div><div class="formation-count"><span>Sua formação</span><strong>${deployed.length}<small> / ${capacity(s)}</small></strong></div><p class="formation-help">Selecione um herói e toque numa casa da sua metade do campo. Guardiões à frente, caçadores atrás.</p><div class="synergies"><p class="eyebrow">LAÇOS DA TRIBO</p>${syn.length?syn.slice(0,5).map(t=>`<div class="synergy ${t.active?'active':''}" title="${esc(t.description)}">${icon(t.active?'diamond':'hexagon')}<span>${esc(t.name)}</span><b>${t.count}/${t.threshold}</b></div>`).join(''):'<p>Reúna heróis que compartilham características.</p>'}</div><div class="battle-controls"><button class="primary" data-action="battle-start" ${!deployed.length||game.battle!==null||s.wave>12||s.paused?'disabled':''}>${icon('swords')}${game.battle?.status==='fighting'?'Expedição em andamento':s.wave>12?'Campanha concluída':'Iniciar expedição'}${icon('arrow-right')}</button><p>Seus heróis retornam mesmo após uma derrota.</p></div>`;
 }
 refreshIcons(); renderMetrics();
}
function renderCamp() {
 $('#camp-title').textContent=view==='village'?'Ao redor da fogueira':'A força da sua tribo';
 $('#reroll').hidden=view!=='village';
 if(view==='village') $('#camp-content').innerHTML=`<div class="recruit-grid">${game.state.shop.map(id=>{const c=characters.find(c=>c.id===id)!,cost=recruitCost(id);return `<article class="recruit-card"><div class="card-glow"></div><button class="hero-art-button" data-character="${id}" aria-label="Conhecer ${c.name}"><img src="${art(c)}" alt="${c.name}"/></button><div class="recruit-copy"><div class="hero-star">★ <span>CUSTO ${c.cost}</span></div><button class="hero-name" data-character="${id}">${c.name}</button><p>${c.title}</p><div class="trait-line">${icon(c.range>1?'crosshair':'swords')}${esc(c.traits.slice(0,2).join(' · '))}</div><button class="recruit-button" data-recruit="${id}" ${costAttr(cost)} data-lock-battle="true">Recrutar <span class="cost">${costHTML(cost)}</span></button></div></article>`;}).join('')}</div><div class="camp-note">${icon('combine')}3 cópias iguais se unem em um herói mais forte.<button class="text-button" data-view="battle">Organizar minha tribo ${icon('arrow-right')}</button></div>`;
 else $('#camp-content').innerHTML=`<div class="party-list">${game.state.heroes.map(h=>{const c=characters.find(c=>c.id===h.characterId)!;return `<div class="party-card ${h.uid===selectedHero?'selected':''} ${h.slot!==null?'deployed':''}"><button class="party-select" data-hero="${h.uid}" aria-pressed="${h.uid===selectedHero}"><img src="${art(c,h.stars)}" alt=""/><span><b>${c.name}</b><small>${'★'.repeat(h.stars)}</small><em>${h.slot===null?'Reserva':`Posição ${h.slot+1}`}</em></span></button><button class="party-info" data-character="${c.id}" title="Ver ${c.name}" aria-label="Ver detalhes de ${c.name}">${icon('info')}</button>${h.slot!==null?`<button class="bench-button" data-bench="${h.uid}" title="Mover para reserva" aria-label="Mover ${c.name} para reserva">${icon('minus')}</button>`:''}</div>`;}).join('')}</div><div class="camp-note">${icon('mouse-pointer-2')}${selectedHero?'Agora escolha uma casa no campo.':'Escolha um herói para posicioná-lo no campo.'}${selectedHero?`<div class="position-controls"><select id="formation-slot" aria-label="Posição no campo">${Array.from({length:12},(_,slot)=>`<option value="${slot}">Posição ${slot+1}${game.state.heroes.some(h=>h.slot===slot)?' · ocupada':''}</option>`).join('')}</select><button class="outline-button" data-action="place-selected">Posicionar</button></div>`:''}<button class="text-button" data-view="village">Recrutar viajantes ${icon('arrow-right')}</button></div>`;
 refreshIcons();
}
function renderAll() {
 if(selectedHero&&!game.state.heroes.some(h=>h.uid===selectedHero))selectedHero=null;
 document.querySelectorAll<HTMLButtonElement>('.nav-button[data-view]').forEach(n=>n.classList.toggle('active',n.dataset.view===view));
 $('#era-label').textContent=view==='village'?`ERA ${['I','II','III','IV','V'][game.state.villageLevel-1]} · AS PRIMEIRAS PEGADAS`:'EXPEDIÇÕES · TERRAS SELVAGENS';
 $('#world-title').textContent=view==='village'?'O primeiro fogo.':'O chamado da floresta.';
 $('#world-subtitle').textContent=view==='village'?'Uma pequena chama. O início de uma grande tribo.':'Reúna seus heróis. Deixe os espíritos guiarem a batalha.';
 $('#world-badge-text').textContent=view==='village'?'Clareira do Lobo':game.battle?.status==='fighting'?'Em combate':'Preparação';
 $('#world-hint').textContent=view==='village'?'Selecione uma construção para evoluir sua aldeia.':'Selecione um herói abaixo e uma posição no campo.';
 renderSide();renderCamp();renderMetrics();renderResult();
}
function renderResult() {
 const b=game.battle; const el=$('#battle-result'); el.hidden=!b||b.status==='fighting'||view!=='battle';
 if(el.hidden||!b)return;
 const victory=b.status==='victory';el.innerHTML=`<span class="result-icon">${icon(victory?'crown':'shield')}</span><p class="eyebrow">${victory?'A TRIBO PERMANECE':'OS ESPÍRITOS ENSINAM'}</p><h2>${victory?'Uma nova conquista.':'É hora de reagrupar.'}</h2><p>${victory?`Expedição ${b.wave} concluída. Sua aldeia recebe os frutos da jornada.`:'Mude a formação, evolua seus heróis e tente novamente.'}</p>${b.reward?`<div class="reward cost">${costHTML(b.reward)}</div>`:''}<button class="primary" data-action="battle-dismiss">${victory?'Continuar jornada':'Preparar novamente'}${icon('arrow-right')}</button>`;refreshIcons();
}

function showModal(name:string,html:string) {activeModal=name;$('#modal-content').innerHTML=`<button class="modal-close icon-button" data-action="close" aria-label="Fechar">${icon('x')}</button>${html}`; if(!$<HTMLDialogElement>('#modal').open)$<HTMLDialogElement>('#modal').showModal();refreshIcons();}
function showCodex(cost=0,query='') { const list=characters.filter(c=>(!cost||c.cost===cost)&&`${c.name} ${c.title} ${c.traits.join(' ')}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));showModal('codex',`<p class="eyebrow">O MUNDO DE WOLF TOTEM</p><h2>Memórias dos espíritos</h2><p class="modal-intro">55 destinos. Uma floresta ancestral. Os 13 primeiros heróis já podem se juntar à sua tribo.</p><div class="codex-tools"><label class="search">${icon('search')}<input id="codex-search" placeholder="Buscar herói ou característica" value="${esc(query)}" aria-label="Buscar no códice"/></label><div class="cost-filters">${[0,1,2,3,4,5].map(n=>`<button data-filter="${n}" class="${cost===n?'active':''}">${n===0?'Todos':`Custo ${n}`}</button>`).join('')}</div></div><div class="codex-grid">${list.map(c=>`<button class="codex-card cost-${c.cost}" data-character="${c.id}">${c.art?`<img src="${art(c)}" alt="" loading="lazy"/>`:`<span class="unknown-art">${icon('fingerprint')}</span>`}<span class="codex-cost">${c.cost}</span><span class="codex-name">${c.name}<small>${c.title}</small></span><span class="codex-status">${c.art?'Disponível na tribo':'Em desenvolvimento'}</span></button>`).join('')||'<p>Nenhum espírito encontrado com essa busca.</p>'}</div>`);$('#modal').dataset.filter=String(cost); }
function showCharacter(id:number,stars=1) {const c=characters.find(c=>c.id===id)!;showModal('character',`<div class="character-detail"><div class="character-portrait">${c.art?`<img src="${art(c,stars)}" alt="${c.name}, ${stars} estrelas"/>`:`<span class="unknown-art">${icon('fingerprint')}</span>`}<div class="star-selector">${[1,2,3].map(n=>`<button data-detail="${id}" data-stars="${n}" class="${n===stars?'active':''}">${'★'.repeat(n)}</button>`).join('')}</div></div><div class="character-story"><button class="text-button" data-action="codex">${icon('arrow-left')}Voltar ao códice</button><p class="eyebrow">CUSTO ${c.cost} · ${c.range>1?'ATAQUE À DISTÂNCIA':'CORPO A CORPO'}</p><h2>${c.name}</h2><h3>${c.title}</h3><div class="trait-chips">${c.traits.map(t=>`<span>${t}</span>`).join('')}</div><div class="stat-grid"><div>${icon('heart')}<strong>${c.hp[stars-1]}</strong><small>Vida</small></div><div>${icon('swords')}<strong>${c.attack[stars-1]}</strong><small>Ataque</small></div><div>${icon('shield')}<strong>${c.armor}</strong><small>Armadura</small></div><div>${icon('zap')}<strong>${c.attackSpeed}</strong><small>Ataques/s</small></div></div><h4>${c.ability.name}</h4><p>${c.ability.description}</p><div class="evolution"><span class="eyebrow">O DESPERTAR · ${stars} ESTRELA${stars>1?'S':''}</span><p>${c.evolution[stars-1]}</p></div>${c.art?`<div class="prototype-skill"><span class="eyebrow">EFEITO NESTA VERSÃO</span><p>${SKILL_NOTES[c.id]}</p></div>`:''}<p class="development-note">${c.art?'Descrição original do seu plano. Os efeitos de combate usam uma primeira adaptação para o protótipo.':'Personagem registrado no plano; arte e habilidades jogáveis ainda em desenvolvimento.'}</p></div></div>`);}
function help() {showModal('help',`<p class="eyebrow">BEM-VINDO À PRIMEIRA CHAMA</p><h2>Uma tribo começa com você.</h2><div class="guide-steps"><div><span>01</span><h3>Crie raízes</h3><p>A aldeia coleta madeira, alimento, pedra e espírito automaticamente. Os botões de coleta ajudam a acelerar o início. Melhore as construções para aumentar a produção.</p></div><div><span>02</span><h3>Ouça os espíritos</h3><p>Recrute os viajantes da fogueira. Três cópias com as mesmas estrelas se combinam. Evoluir a aldeia abre mais vagas na formação.</p></div><div><span>03</span><h3>Explore o desconhecido</h3><p>Na expedição, selecione um herói e uma casa da sua metade do campo. O combate é automático. Vitória traz recursos; derrota permite tentar outra formação.</p></div></div><p class="development-note">Atalhos: 1 aldeia · 2 expedição · 3 códice · P pausar · Esc fechar.<br>Protótipo: 13 heróis jogáveis, 12 expedições, catálogo com os 55 personagens. Os efeitos de habilidades e o equilíbrio ainda estão em desenvolvimento.</p><button class="primary" data-action="close">Seguir o chamado ${icon('arrow-right')}</button>`);}
function settings() {showModal('settings',`<p class="eyebrow">SUA JORNADA</p><h2>Memórias da tribo</h2><p class="modal-intro">O progresso é salvo automaticamente neste navegador. Ao voltar, sua aldeia recebe até 2 horas de produção acumulada. Uma jornada pausada não acumula recursos.</p><div class="settings-buttons"><button class="outline-button" data-action="export">${icon('download')}Exportar progresso</button><button class="outline-button" data-action="import">${icon('upload')}Importar progresso</button><button class="outline-button" data-action="help">${icon('book-open')}Como jogar</button></div><p class="development-note">Importar substitui o progresso deste navegador. Exporte sua jornada atual antes de trocar o arquivo.</p>`);}

document.addEventListener('click',e=>{
 const target=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!target||target.disabled)return;
 if(target.dataset.view){setView(target.dataset.view as typeof view);return;}
 if(target.dataset.building){selectedBuilding=target.dataset.building as BuildingId;renderSide();return;}
 if(target.dataset.gather){act(game.gather(target.dataset.gather as Resource));return;}
 if(target.dataset.recruit){act(game.recruit(Number(target.dataset.recruit)));return;}
 if(target.dataset.hero){selectedHero=target.dataset.hero;renderCamp();return;}
 if(target.dataset.bench){act(game.deploy(target.dataset.bench,null));return;}
 if(target.dataset.character){showCharacter(Number(target.dataset.character));return;}
 if(target.dataset.detail){showCharacter(Number(target.dataset.detail),Number(target.dataset.stars));return;}
 if(target.dataset.filter){showCodex(Number(target.dataset.filter),$<HTMLInputElement>('#codex-search').value);return;}
 switch(target.dataset.action){
 case 'place-selected':if(selectedHero)act(game.deploy(selectedHero,Number($<HTMLSelectElement>('#formation-slot').value)));break;
 case 'building-upgrade':act(game.upgradeBuilding(selectedBuilding));break;
 case 'village-upgrade':act(game.upgradeVillage());break;
 case 'reroll':act(game.rerollShop());break;
 case 'battle-start':act(game.startBattle());break;
 case 'battle-dismiss':game.dismissBattle();renderAll();break;
 case 'pause':game.togglePause();save();renderAll();break;
 case 'codex':showCodex();break;
 case 'help':help();break;
 case 'settings':settings();break;
 case 'close':$<HTMLDialogElement>('#modal').close();activeModal='';break;
 case 'audio':muted=!muted;target.innerHTML=icon(muted?'volume-x':'volume-2');target.setAttribute('aria-label',muted?'Ativar sons':'Silenciar sons');chime();refreshIcons();break;
 case 'export':{const url=URL.createObjectURL(new Blob([game.serialize()],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='wolf-totem-jornada.json';a.click();URL.revokeObjectURL(url);break;}
 case 'import':$<HTMLInputElement>('#save-file').click();break;
 }
});
let searchTimer=0;
document.addEventListener('input',e=>{const input=e.target as HTMLInputElement;if(input.id==='codex-search'){clearTimeout(searchTimer);searchTimer=window.setTimeout(()=>{const value=input.value,pos=input.selectionStart;showCodex(Number($('#modal').dataset.filter||0),value);const next=$<HTMLInputElement>('#codex-search');next.focus();next.setSelectionRange(pos,pos);},180);}});
$<HTMLInputElement>('#save-file').addEventListener('change',async e=>{const f=(e.target as HTMLInputElement).files?.[0];if(!f)return;try{if(f.size>500_000)throw new Error();const data=JSON.parse(await f.text());if(!data||data.version!==1||!data.state||!Array.isArray(data.state.heroes)||!data.state.resources)throw new Error();const imported=new Game(data);game.state=imported.state;game.battle=null;localStorage.setItem(SAVE_KEY,game.serialize());location.reload();}catch{toast('Arquivo de progresso inválido. Sua jornada atual foi preservada.');}});
document.addEventListener('keydown',e=>{if((e.target as HTMLElement).matches('input,textarea')||e.repeat)return;if($<HTMLDialogElement>('#modal').open)return;if(e.key==='1')setView('village');if(e.key==='2')setView('battle');if(e.key==='3')showCodex();if(e.key.toLowerCase()==='p'){game.togglePause();save();renderAll();}});
$<HTMLDialogElement>('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){$<HTMLDialogElement>('#modal').close();activeModal='';}});
window.addEventListener('pagehide',save);
let hiddenAt = 0;
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){hiddenAt=Date.now();save();}
 else if(hiddenAt){
  const elapsed=game.state.paused?0:Math.min(7200,Math.max(0,(Date.now()-hiddenAt)/1000));
  const rates=getRates(game.state);
  for(const r of resources)game.state.resources[r.id]=Math.min(10_000_000,game.state.resources[r.id]+rates[r.id]*elapsed);
  hiddenAt=0;save();renderMetrics();
 }
 lastTime=performance.now();
});
let lastTime=performance.now(),uiElapsed=0,saveElapsed=0;
function frame(now:number){const dt=Math.min((now-lastTime)/1000,.1);lastTime=now;if(!document.hidden)game.tick(dt);uiElapsed+=dt;saveElapsed+=dt;if(uiElapsed>.4){renderMetrics();uiElapsed=0;}if(saveElapsed>5){save();saveElapsed=0;}const status=game.battle?.status||'';if(status!==lastBattleStatus||game.state.wave!==lastWave){lastBattleStatus=status;lastWave=game.state.wave;renderAll();if(status==='victory'||status==='defeat')save();}requestAnimationFrame(frame);}
renderAll();requestAnimationFrame(frame);
window.addEventListener('beforeunload',()=>{save();world.destroy();});
