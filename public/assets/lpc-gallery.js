const $ = id => document.getElementById(id);
const controls = ['era', 'stars', 'motion', 'direction', 'search'].map($);
const durations = { idle:1.35, walk:.64, attack:.34, cast:.48, hurt:.23, death:.95, victory:1.2 };
const eras = ['','I','II','III','IV','V'];
const sheets = new Map();
let cards = [], elapsed = 0, last = performance.now(), needsDraw = true, paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
$('pause').setAttribute('aria-pressed',String(paused)); $('pause').textContent = paused ? 'Retomar' : 'Pausar';

async function load(card) {
  const stars = Number($('stars').value), key = `${card.hero.id}:${stars}`;
  if (!card.visible || card.element.hidden || card.key === key) return;
  card.key = key; card.sheet = undefined; card.image = undefined;
  card.element.dataset.state = 'loading'; card.note.textContent = 'Carregando…';
  try {
    let sheet = sheets.get(key);
    if (!sheet) {
      const response = await fetch(`assets/animations/lpc/${String(card.hero.id).padStart(2,'0')}-s${stars}.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      sheet = await response.json(); sheets.set(key,sheet);
    }
    const image = new Image(); image.src = sheet.image.replace(/^\//,''); await image.decode();
    if (card.key !== key) return;
    card.sheet = sheet; card.image = image; card.element.dataset.state = 'ready';
    needsDraw = true;
    card.note.textContent = `${'★'.repeat(stars)} · ${card.hero.themeLabel}`;
  } catch (error) {
    if (card.key !== key) return;
    card.key = ''; card.element.dataset.state = 'error'; card.note.textContent = 'Falha ao carregar a arte';
    console.error('LPC gallery:', key, error);
  }
}

function filter() {
  needsDraw = true;
  const era = Number($('era').value), term = $('search').value.trim().toLocaleLowerCase('pt-BR');
  let shown = 0;
  for (const card of cards) {
    card.element.hidden = !!((era && card.hero.era !== era) || !card.hero.name.toLocaleLowerCase('pt-BR').includes(term));
    if (!card.element.hidden) { shown++; void load(card); }
  }
  $('status').textContent = `${shown} de 55 guardiões · 165 formas · 7 movimentos · 4 direções`;
}

function draw(card) {
  if (!card.visible || card.element.hidden || !card.sheet || !card.image) return;
  const c = card.canvas.getContext('2d'), sheet = card.sheet, motion = $('motion').value;
  const frames = sheet.directions[$('direction').value][motion], duration = durations[motion];
  const loop = ['idle','walk','victory'].includes(motion);
  const phase = loop ? elapsed % duration / duration : Math.min(.999,(elapsed % (duration + .8)) / duration);
  const index = frames[Math.min(frames.length-1,Math.floor(phase*frames.length))];
  const rect = sheet.frameRects[index], anchor = sheet.frameAnchors[index];
  const above = Math.max(...frames.map(i => sheet.frameAnchors[i].y));
  const below = Math.max(...frames.map(i => sheet.frameRects[i].height - sheet.frameAnchors[i].y));
  const width = Math.max(...frames.map(i => sheet.frameRects[i].width));
  const scale = Math.min(2.65,210/(above+below),246/width), ground = Math.min(220,30+above*scale);
  c.clearRect(0,0,280,250);c.imageSmoothingEnabled=false;
  c.fillStyle='#040e1259';c.beginPath();c.ellipse(140,ground+4,32,8,0,0,Math.PI*2);c.fill();
  c.drawImage(card.image,rect.x,rect.y,rect.width,rect.height,140-anchor.x*scale,ground-anchor.y*scale,rect.width*scale,rect.height*scale);
}

try {
  const response = await fetch('assets/lpc-roster.json'); if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const heroes = await response.json();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const card = cards.find(c => c.element === entry.target);card.visible = entry.isIntersecting;
      if (card.visible) void load(card);
    }
  }, {rootMargin:'180px'});
  cards = heroes.map(hero => {
    const element=document.createElement('article'), canvas=document.createElement('canvas');canvas.width=280;canvas.height=250;
    canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`${hero.name}, animação LPC`);
    const number=document.createElement('span');number.className='number';number.textContent=String(hero.id).padStart(2,'0');
    const era=document.createElement('span');era.className='era';era.textContent=`ERA ${eras[hero.era]}`;
    const text=document.createElement('div');text.className='name';
    const title=document.createElement('h2');title.textContent=hero.name;
    const description=document.createElement('p');description.textContent=hero.title;
    const note=document.createElement('small');note.textContent='Arte disponível';
    text.append(title,description,note);element.append(number,era,canvas,text);$('gallery').append(element);
    const card={hero,element,canvas,note,key:'',visible:false};observer.observe(element);return card;
  });
  filter();
} catch (error) { $('status').textContent='Não foi possível carregar o catálogo.';console.error(error); }
for (const control of controls) control.addEventListener(control.id==='search'?'input':'change',() => {elapsed=0;filter();});
$('pause').addEventListener('click',() => {paused=!paused;$('pause').setAttribute('aria-pressed',String(paused));$('pause').textContent=paused?'Retomar':'Pausar';});
document.addEventListener('visibilitychange',() => {last=performance.now();});
function tick(now) {const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;if(!paused&&!document.hidden){elapsed+=dt;needsDraw=true;}if(needsDraw&&!document.hidden){for(const card of cards) draw(card);needsDraw=false;}requestAnimationFrame(tick);}
requestAnimationFrame(tick);
