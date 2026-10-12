import { Game, type ActionResult } from '../game/simulation';
import { characters } from '../data/characters';
import { CROSSING_RELICS, itemById } from '../game/items';
import { GUIDES, GUIDE_STORIES, ROUTES, AFFINITIES, SPECIALIZATIONS, SCENARIOS, NODE_NAMES, PUZZLE_SYMBOLS, affinityOffers, atCrossingNode, crossingEvent, puzzleSequence, routeOf, crossingStage, type RouteId } from '../game/crossings';
import { objectiveAdvice } from '../game/battleObjectives';
import { assetUrl } from '../render/animationAssets';
import { createCrossingWorld } from '../render/CrossingScene';
import { portraitHTML as gamePortrait } from '../render/portrait';
import { itemGlyph } from './itemGlyph';

const icon=(name:string)=>`<i data-lucide="${name}" aria-hidden="true"></i>`;
const hero=(id:number)=>characters.find(c=>c.id===id)!;
const portraitHTML=(character:ReturnType<typeof hero>,stars=1)=>`<span class="crossing-portrait">${gamePortrait(character,stars)}</span>`;
const symbolIcons=['footprints','waves','sprout','moon'];
export class CrossingsUI {
  private guide=1;
  private route:RouteId='river';
  private tier=1;
  private tab:'explore'|'journal'|'scenarios'='explore';
  private panel:'puzzle'|'event'|'affinity'|null=null;
  private order:number[]=[];
  private solved=false;
  private error='';
  private pendingChoice='';
  private nodeKey='';
  private near=false;
  private selectedScenario=SCENARIOS[0].id;
  private scenarioSlots=[1,5,9,12,22,25];
  private selectedUnit=0;
  private world?:ReturnType<typeof createCrossingWorld>;
  constructor(private root:HTMLElement,private game:Game,private callbacks:{changed:()=>void;prepare:()=>void;icons:()=>void;toast:(message:string)=>void;enabled:()=>boolean;reduced:()=>boolean}){
    root.innerHTML=`<header class="crossing-page-heading"><div><p class="eyebrow">TRAVESSIAS DO ENCANTO</p><h1>Igarapé ancestral<span>.</span></h1></div><nav aria-label="Atividades da travessia"><button data-cross-tab="explore">${icon('compass')}Explorar</button><button data-cross-tab="journal">${icon('book-open')}Descobertas</button><button data-cross-tab="scenarios">${icon('swords')}Cenários táticos</button></nav></header><div class="crossing-stage"><div class="crossing-canvas"></div><div class="crossing-cover"></div><div class="crossing-hud"></div><div class="crossing-context"></div><div class="crossing-panel" hidden></div></div><div class="crossing-secondary" hidden></div>`;
    root.querySelector<HTMLElement>('.crossing-cover')!.style.backgroundImage=`url("${assetUrl('/assets/travessias/igarape.webp')}")`;
    root.addEventListener('click',event=>{
      const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button||button.disabled)return;
      const d=button.dataset;if(!Object.keys(d).some(k=>k.startsWith('cross')))return;
      event.stopPropagation();
      if(d.crossTab){this.tab=d.crossTab as typeof this.tab;this.panel=null;this.render();}
      if(d.crossGuide){this.guide=Number(d.crossGuide);this.render();}
      if(d.crossRoute){this.route=d.crossRoute as RouteId;this.render();}
      if(d.crossTier){this.tier=Number(d.crossTier);this.render();}
      if(d.crossStart!==undefined)this.act(game.startCrossing(this.guide,this.route,this.tier));
      if(d.crossTravel!==undefined)this.world?.travel();
      if(d.crossInteract!==undefined)this.interact();
      if(d.crossClose!==undefined){this.panel=null;this.render();}
      if(d.crossReturn!==undefined)this.act(game.endCrossing());
      if(d.crossPrepare!==undefined)callbacks.prepare();
      if(d.crossSymbol!==undefined){
        this.order.push(Number(d.crossSymbol));const run=game.state.crossings.active!;
        if(this.order.length===puzzleSequence(run).length){this.solved=this.order.every((n,i)=>n===puzzleSequence(run)[i]);if(!this.solved){this.error='A ordem ainda não corresponde à pista. Observe os sinais e tente novamente.';this.order=[];}}
        this.renderPanel();
      }
      if(d.crossReset!==undefined){this.order=[];this.solved=false;this.error='';this.renderPanel();}
      if(d.crossAffinity){this.act(this.pendingChoice?game.crossingChoice(this.pendingChoice,d.crossAffinity):game.crossingPuzzle(this.order,d.crossAffinity));}
      if(d.crossChoice){
        const run=game.state.crossings.active!,choice=crossingEvent(run).choices.find(c=>c.id===d.crossChoice)!;
        if(choice.effect==='risk'){this.pendingChoice=choice.id;this.panel='affinity';this.renderPanel();}
        else this.act(game.crossingChoice(choice.id));
      }
      if(d.crossSpec){const [id,spec]=d.crossSpec.split(':');this.act(game.selectSpecialization(Number(id),spec));}
      if(d.crossForge)this.act(game.forgeCrossingRelic(d.crossForge));
      if(d.crossScenario){this.selectedScenario=d.crossScenario;this.scenarioSlots=[1,5,9,12,22,25];this.selectedUnit=0;this.render();}
      if(d.crossUnit!==undefined){this.selectedUnit=Number(d.crossUnit);this.render();}
      if(d.crossSlot!==undefined){const slot=Number(d.crossSlot),other=this.scenarioSlots.indexOf(slot);if(other>=0)this.scenarioSlots[other]=this.scenarioSlots[this.selectedUnit];this.scenarioSlots[this.selectedUnit]=slot;this.render();}
      if(d.crossScenarioStart!==undefined){const result=game.startScenario(this.selectedScenario,this.scenarioSlots);this.act(result);if(result.ok)callbacks.prepare();}
    });
  }
  private ensureWorld(){
    if(this.world)return;
    this.world=createCrossingWorld(this.root.querySelector('.crossing-canvas')!,()=>this.game.state.crossings.active,{
      position:(x,y)=>{this.game.moveCrossing(x,y);const run=this.game.state.crossings.active;if(run&&atCrossingNode(run)!==this.near){this.near=atCrossingNode(run);this.renderContext();}},
      arrived:()=>{if(!this.near){this.near=true;this.renderContext();}},interact:()=>this.interact(),
      enabled:()=>!document.hidden&&!this.root.hidden&&this.tab==='explore'&&!this.panel&&!this.game.state.paused&&this.callbacks.enabled(),reduced:this.callbacks.reduced,
    });
  }
  private act(result:ActionResult){this.callbacks.toast(result.message);if(result.ok){this.panel=null;this.pendingChoice='';this.order=[];this.solved=false;this.error='';this.callbacks.changed();}this.render();}
  private interact(){
    const run=this.game.state.crossings.active;
    if(!run||run.mode!=='explore'||this.panel||this.game.state.paused||!this.callbacks.enabled())return;
    if(!atCrossingNode(run)){this.world?.travel();return;}
    if([2,5].includes(run.node)){const result=this.game.prepareCrossing();this.act(result);if(result.ok)this.callbacks.prepare();return;}
    this.order=[];this.solved=false;this.error='';this.pendingChoice='';this.panel=[0,3].includes(run.node)?'puzzle':'event';this.render();
  }
  render(){
    const c=this.game.state.crossings,run=c.active,key=`${run?.seed}:${run?.node}:${run?.mode}`;
    if(key!==this.nodeKey){this.nodeKey=key;this.panel=null;this.order=[];this.solved=false;this.pendingChoice='';this.error='';}
    this.root.querySelectorAll<HTMLButtonElement>('[data-cross-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.crossTab===this.tab)));
    const stage=this.root.querySelector<HTMLElement>('.crossing-stage')!,secondary=this.root.querySelector<HTMLElement>('.crossing-secondary')!;
    stage.hidden=this.tab!=='explore';secondary.hidden=this.tab==='explore';
    if(this.tab!=='explore'){secondary.innerHTML=this.tab==='journal'?this.journal():this.scenarios();this.callbacks.icons();return;}
    const cover=this.root.querySelector<HTMLElement>('.crossing-cover')!;cover.hidden=!!run;
    if(!run)cover.innerHTML=this.landing();
    this.root.querySelector<HTMLElement>('.crossing-canvas')!.hidden=!run;
    if(run)this.ensureWorld();
    const hud=this.root.querySelector<HTMLElement>('.crossing-hud')!;hud.hidden=!run;
    if(run)hud.innerHTML=`<div class="crossing-route-chip">${icon(routeOf(run.route).icon)}<span><b>${routeOf(run.route).name}</b><small>${run.mode==='complete'?'Travessia concluída':`Marco ${Math.min(6,run.node+1)} de 6 · ${['Bruma','Correnteza','Tormenta'][run.tier-1]}`}</small></span></div><button class="crossing-quiet" data-cross-return>${icon('log-out')}${run.mode==='complete'?'Concluir':'Retornar'}<span class="sr-only"> e guardar o progresso</span></button>`;
    this.near=!!run&&atCrossingNode(run);this.renderContext();this.renderPanel();this.callbacks.icons();
  }
  private landing(){
    const c=this.game.state.crossings,max=Math.min(3,1+Math.floor(this.game.state.progress/5));
    return `<div class="crossing-cover-shade"></div><section class="crossing-intro"><span class="crossing-kicker">UMA NOVA JORNADA</span><h2>O rio guarda<br>outros caminhos.</h2><p>Investigue rastros, escolha seu destino e leve a formação ao encontro dos espíritos.</p><div class="crossing-guide-label">Quem conduz a travessia?</div><div class="crossing-guides">${GUIDES.map(id=>`<button data-cross-guide="${id}" aria-pressed="${this.guide===id}">${portraitHTML(hero(id),1)}<span>${hero(id).name}<small>${GUIDE_STORIES[id].gift}</small></span></button>`).join('')}</div><p class="crossing-small">O guia acompanha a exploração. Seus guardiões acolhidos formam a equipe de combate.</p><div class="crossing-difficulty" aria-label="Dificuldade da travessia">${['Bruma','Correnteza','Tormenta'].map((name,i)=>`<button data-cross-tier="${i+1}" aria-pressed="${this.tier===i+1}" ${i+1>max?'disabled':''}>${i+1>max?icon('lock'):''}${name}</button>`).join('')}</div><p class="crossing-small">Correnteza abre na expedição 5; Tormenta, na 10. ${c.visits?`${c.visits} travessias concluídas.`:'Disponível desde o início.'}</p></section><section class="crossing-route-picker" aria-label="Escolher caminho"><p class="eyebrow">TRÊS ROTAS · ESCOLHAS QUE PERMANECEM</p>${ROUTES.map(r=>`<button class="crossing-route-option" data-cross-route="${r.id}" aria-pressed="${this.route===r.id}"><span class="crossing-route-icon">${icon(r.icon)}</span><span><b>${r.name}</b><small>${r.subtitle}</small><em>${r.reward} · ${r.challenge}</em></span><span class="crossing-route-check">${icon(this.route===r.id?'check':'chevron-right')}</span></button>`).join('')}<button class="crossing-primary" data-cross-start ${this.game.battle||this.game.state.paused?'disabled':''}>Explorar o Igarapé ${icon('arrow-right')}</button><p class="crossing-reassurance">${icon('bookmark')}Salvo entre descobertas. Retorne quando quiser.</p></section>`;
  }
  private renderContext(){
    const run=this.game.state.crossings.active,el=this.root.querySelector<HTMLElement>('.crossing-context')!;
    el.hidden=!run||!!this.panel;if(!run)return;
    if(run.mode==='complete'){el.innerHTML=`<div class="crossing-completion"><p class="eyebrow">O IGARAPÉ LEMBRA</p><h2>Um caminho se abriu.</h2><p>${hero(run.guide).name} concluiu seu segundo capítulo. Duas especializações podem ser escolhidas nas Descobertas.</p><div class="crossing-tally"><span>+${run.amber} âmbar</span><span>+${run.xp} XP por guardião</span><span>${run.loot.length} componentes</span></div><div><button class="crossing-primary" data-cross-tab="journal">Ver descobertas ${icon('arrow-right')}</button><button class="crossing-quiet" data-cross-return>Concluir travessia</button></div></div>`;}
    else if(run.mode==='prepare'||run.mode==='battle'){el.innerHTML=`<div class="crossing-prompt"><span class="crossing-prompt-icon">${icon('swords')}</span><div><b>${run.mode==='battle'?'A formação está em combate':'Seu próximo confronto aguarda'}</b><small>Objetivo: ${run.objective==='altar'?'proteger o altar':'romper os três selos'}.</small></div><button class="crossing-primary" data-cross-prepare>Ir ao campo ${icon('arrow-right')}</button></div>`;}
    else{const puzzle=[0,3].includes(run.node),fight=[2,5].includes(run.node);
      el.innerHTML=`<div class="crossing-prompt"><span class="crossing-prompt-icon">${icon(fight?'swords':puzzle?'footprints':'sparkles')}</span><div><small>${this.game.battle?'CONCLUA O CONFRONTO NO CAMPO':this.near?'VOCÊ ENCONTROU UMA PISTA':'SIGA O CAMINHO ILUMINADO'}</small><b>${NODE_NAMES[run.node]}</b></div><button class="crossing-primary" ${this.game.state.paused||this.game.battle?'disabled':''} ${this.near?'data-cross-interact':'data-cross-travel'}>${this.near?(fight?'Preparar confronto':puzzle?'Investigar':'Interagir'):'Ir até o marco'}${icon(this.near?'sparkles':'arrow-right')}</button></div><p class="crossing-controls">${icon('mouse-pointer-2')}Clique no mapa ou use WASD / setas · E para interagir</p><div class="crossing-affinity-strip">${run.affinities.map(id=>{const a=AFFINITIES.find(d=>d.id===id)!;return `<span title="${a.text}">${icon(a.icon)}${a.name}</span>`;}).join('')}</div>`;}
    this.callbacks.icons();
  }
  private renderPanel(){
    const el=this.root.querySelector<HTMLElement>('.crossing-panel')!,run=this.game.state.crossings.active;
    const newlyOpened=el.hidden;el.hidden=!this.panel||!run;if(el.hidden||!run)return;
    const close=`<button class="crossing-panel-close" data-cross-close aria-label="Fechar encontro">${icon('x')}</button>`;
    if(this.panel==='affinity'||this.solved){
      el.innerHTML=`${close}<p class="eyebrow">${this.pendingChoice?'RISCO ESCOLHIDO · +15% DE DANO INIMIGO':'A PISTA FOI REVELADA'}</p><h2>Um espírito acompanha.</h2><p>Escolha uma afinidade para esta travessia. ${run.affinities.length>=2?'Ela substitui sua segunda afinidade.':'Você pode levar até duas.'}</p><div class="crossing-affinity-choices">${affinityOffers(run,this.pendingChoice?1:0).map(a=>`<button data-cross-affinity="${a.id}"><span>${icon(a.icon)}<b>${a.name}</b></span><p>${a.text}</p><small>${a.advice}</small></button>`).join('')}</div>`;
    }else if(this.panel==='puzzle'){
      const order=puzzleSequence(run);
      el.innerHTML=`${close}<p class="eyebrow">${run.node===0?'RASTROS NA MARGEM':'GLIFOS SOB A PEDRA'}</p><h2>${run.node===0?'Siga as pegadas.':'Leia a memória do rio.'}</h2><details class="crossing-guide-story"><summary>Memória de ${hero(run.guide).name}</summary><p>${run.node===0?GUIDE_STORIES[run.guide].tracks:GUIDE_STORIES[run.guide].glyphs}</p></details><p>${run.node===0?'Observe a pista. Toque nos sinais na mesma ordem.':'Reconheça os sinais da margem na ordem gravada na pedra.'}</p><div class="crossing-clue" aria-label="Sequência da pista">${order.map(n=>`<span>${icon(symbolIcons[n])}<small>${PUZZLE_SYMBOLS[n]}</small></span>`).join('')}</div><div class="crossing-symbols" aria-label="Responder à pista">${PUZZLE_SYMBOLS.map((name,n)=>`<button data-cross-symbol="${n}" aria-label="Sinal ${name}">${icon(symbolIcons[n])}<span>${name}</span></button>`).join('')}</div><div class="crossing-answer" aria-live="polite">${this.order.length?this.order.map(n=>icon(symbolIcons[n])).join(''):'Sua sequência aparece aqui'}</div>${this.error?`<p class="crossing-error" role="status">${this.error}</p>`:''}<button class="crossing-quiet" data-cross-reset>Recomeçar a sequência</button><p class="crossing-small">Sem cronômetro. A pista continua visível para consultar.</p>`;
    }else{
      const event=crossingEvent(run);
      el.innerHTML=`${close}<p class="eyebrow">UM ENCONTRO NO CAMINHO</p><h2>${event.title}</h2><p>${event.text}</p><div class="crossing-event-choices">${event.choices.map(c=>`<button data-cross-choice="${c.id}"><b>${c.name}${icon('arrow-right')}</b><span>${c.text}</span></button>`).join('')}</div><p class="crossing-small">A consequência vale nos próximos confrontos desta travessia.</p>`;
    }
    this.root.querySelector<HTMLElement>('.crossing-context')!.hidden=true;
    el.setAttribute('tabindex','-1');el.setAttribute('role','region');el.setAttribute('aria-label','Encontro da travessia');const phase=this.pendingChoice||this.solved?'affinity':this.panel;el.classList.toggle('crossing-affinity-panel',phase==='affinity');if(newlyOpened||el.dataset.phase!==phase){el.scrollTop=0;el.focus({preventScroll:true});el.dataset.phase=phase??'';}this.callbacks.icons();
  }
  private journal(){
    const c=this.game.state.crossings;
    return `<div class="crossing-journal-heading"><p class="eyebrow">MEMÓRIAS QUE ATRAVESSAM RENASCIMENTOS</p><h2>O que a margem ensinou.</h2><p>Histórias, receitas e especializações permanecem. Escolha outra forma de usar seus guardiões.</p></div><div class="crossing-journal-grid">${GUIDES.map(id=>{const chapter=c.chapters[id]??0;return `<article class="crossing-story-card">${portraitHTML(hero(id),1)}<div><p class="eyebrow">CAPÍTULO ${chapter} / 2</p><h3>${hero(id).name}</h3><p>${chapter===0?'Uma história espera por um guia. Investigue a primeira pista com este guardião.':chapter===1?'Os sinais da margem revelaram uma lembrança. Conclua o caminho para conhecer o que aconteceu.':id===1?'Akru devolveu um sinal à antiga matilha. Agora sabe quando avançar sozinho e quando chamar os companheiros.':id===2?'Nima encontrou a trama que unia as duas margens. Pode preservar os aliados ou fortalecer sua ninhada.':'Boru ergueu a pedra que guardava a passagem. Sua força pode acolher a manada ou abrir o caminho.'}</p><div class="crossing-specs">${SPECIALIZATIONS.filter(s=>s.hero===id).map(s=>`<button data-cross-spec="${id}:${s.id}" aria-pressed="${c.specializations[id]===s.id}" ${chapter<2?'disabled':''}><b>${chapter<2?icon('lock'):icon(c.specializations[id]===s.id?'check':'sparkles')}${s.name}</b><span>${s.text}</span></button>`).join('')}</div><small>Troca gratuita entre combates. Aplica-se ao guardião quando acolhido e em campo.</small></div></article>`;}).join('')}</div><div class="crossing-recipes"><div><p class="eyebrow">ARSENAL DA MARGEM</p><h2>Receitas descobertas.</h2><p>Os componentes vêm das rotas e do Arsenal. Forje aqui e equipe no Arsenal.</p></div><div class="crossing-recipe-grid">${CROSSING_RELICS.map(item=>{const found=c.discoveries.includes(`recipe:${item.route}`),ready=found&&item.ingredients.every(id=>this.game.state.inventory.includes(id));return `<article>${itemGlyph(item.id)}<h3>${item.name}</h3><p>${item.text}</p><div>${item.ingredients.map(id=>`<span>${itemGlyph(id)}${itemById(id)!.name}</span>`).join('<b>+</b>')}</div><button class="crossing-primary" data-cross-forge="${item.id}" ${!ready?'disabled':''}>${!found?'Investigue a forja da rota':!ready?'Reúna os componentes':'Forjar equipamento'}</button><small>${routeOf(item.route as RouteId).name}</small></article>`;}).join('')}</div></div><div class="crossing-records"><span>${c.visits} travessias concluídas</span><span>${c.routes.length}/3 rotas conhecidas</span><span>${c.discoveries.length} descobertas</span><span>${c.scenarios.length}/4 cenários vencidos</span></div>`;
  }
  private scenarios(){
    const def=SCENARIOS.find(s=>s.id===this.selectedScenario)!;
    return `<div class="crossing-journal-heading"><p class="eyebrow">ESTRATÉGIA EM PEQUENAS FORMAÇÕES</p><h2>Cada posição conta.</h2><p>Equipes convidadas de seis guardiões, com nível 1 e atributos padronizados. Seus heróis e itens permanecem na jornada. A primeira vitória concede um conhecimento.</p></div><div class="crossing-scenario-layout"><nav class="crossing-scenario-list" aria-label="Cenários disponíveis">${SCENARIOS.map(s=>`<button data-cross-scenario="${s.id}" aria-pressed="${s.id===def.id}">${icon(this.game.state.crossings.scenarios.includes(s.id)?'check':s.objective==='altar'?'shield':'crosshair')}<span><b>${s.name}</b><small>${s.description}</small></span></button>`).join('')}</nav><section class="crossing-scenario-prep"><div class="crossing-scenario-title"><span>${icon(def.objective==='altar'?'shield':'crosshair')}</span><div><p class="eyebrow">${def.objective==='altar'?'PROTEGER O ALTAR':'ROMPER OS SELOS'}</p><h3>${def.name}</h3></div></div><p>Escolha um guardião e toque em uma casa. Casas ocupadas trocam os dois personagens.</p><div class="crossing-scenario-roster">${def.heroes.map((id,i)=>`<button data-cross-unit="${i}" aria-pressed="${i===this.selectedUnit}">${portraitHTML(hero(id),1)}<b>${hero(id).name}</b><small>${hero(id).traits.slice(0,2).join(' · ')}</small></button>`).join('')}</div><div class="crossing-mini-board" role="group" aria-label="Posições da equipe do cenário">${Array.from({length:28},(_,slot)=>{const index=this.scenarioSlots.indexOf(slot);return `<button data-cross-slot="${slot}" aria-label="Casa ${slot+1}${index>=0?', '+hero(def.heroes[index]).name:''}">${index>=0?portraitHTML(hero(def.heroes[index]),1):`<span>${slot+1}</span>`}</button>`;}).join('')}</div><div class="crossing-board-labels"><span>Frente ↑</span><span>Retaguarda ↓</span></div><button class="crossing-primary" data-cross-scenario-start ${this.game.battle||this.game.state.paused?'disabled':''}>Entrar no cenário ${icon('swords')}</button></section></div>`;
  }
  destroy(){this.world?.destroy();}
}

export function crossingBattlePanel(game:Game):string {
  const run=game.state.crossings.active,battle=game.battle,scenario=battle?.scenario?SCENARIOS.find(s=>s.id===battle.scenario):undefined;
  const kind=battle?.objective?.kind??run?.objective??'altar',preparing=!battle&&run?.mode==='prepare';
  const affinities=(battle?battle.affinities??[]:run?.affinities??[]).map(id=>AFFINITIES.find(a=>a.id===id)!);
  const units=battle?battle.entities.filter(e=>e.team==='enemy'&&!e.structure&&!e.summon).map(e=>({id:e.characterId,stars:e.stars})):run?crossingStage(run).stage.units:[];
  return `<div class="crossing-battle-overview">
    <div class="crossing-battle-header"><p class="eyebrow">${scenario?'CENÁRIO TÁTICO':'TRAVESSIA DO IGARAPÉ'}</p><h2>${kind==='altar'?'Guarde a passagem.':'Abra a passagem.'}</h2><p>${kind==='altar'?'O altar precisa permanecer de pé. Vença os invasores ou resista por 45 segundos.':'Destrua os três selos em até 65 segundos. A vitória vem dos selos, mesmo com inimigos vivos.'}</p></div>
    <div class="crossing-enemies" aria-label="Adversários">${units.slice(0,12).map(u=>`<span title="${hero(u.id).name}">${portraitHTML(hero(u.id),u.stars)}</span>`).join('')}</div>
    ${preparing?`<div class="crossing-directives"><p class="eyebrow">PRIORIDADE DE ALVOS</p>${[['guard','Cobrir altar'],['focus','Romper selos'],['balanced','Alvo próximo']].map(([id,name])=>`<button data-cross-directive="${id}" aria-pressed="${run?.directive===id}">${name}</button>`).join('')}</div>`:''}
    ${affinities.length?`<div class="crossing-battle-affinities"><p class="eyebrow">AFINIDADES DA TRAVESSIA</p>${affinities.map(a=>`<span title="${a.text}">${icon(a.icon)}${a.name}</span>`).join('')}</div>`:''}
    ${!scenario&&run?`<p class="crossing-small">Ameaça: +${run.threat}% de dano inimigo${run.strain?` · Desgaste: −${Math.max(0,run.strain-(run.guide===2?4:0))}% de vida inicial`:''}.</p>`:''}
    <details class="crossing-battle-help"><summary>${icon('lightbulb')}Conselhos para este objetivo${icon('chevron-down')}</summary><div class="crossing-battle-advice">${objectiveAdvice(kind).map(a=>`<div>${icon(a.icon)}<span><b>${a.name}</b><small>${a.text}</small></span></div>`).join('')}</div></details>
  </div>
  <div class="crossing-field-controls">
    ${preparing?`<button class="primary" data-action="battle-start" ${game.state.paused?'disabled':''}>${icon('swords')}Iniciar confronto</button><div class="crossing-control-row"><button class="outline-button" data-action="formation">${icon('move')}Posições</button><button class="outline-button" data-action="army-coach">${icon('wand-sparkles')}Itens e sinergias</button></div>`:''}
    <div class="crossing-control-row"><button class="outline-button" data-action="speed">${icon('fast-forward')}${game.state.settings.speed}×</button><button class="text-button" data-view="crossing">${icon('arrow-left')}Voltar ao Igarapé</button></div>
  </div>`;
}
