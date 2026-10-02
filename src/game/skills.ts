import { characters } from '../data/characters';
import type { CombatApi, CombatEntity } from './simulation';
import { clampX, clampY } from './board';

/**
 * Prototype implementations of the 55 Set 1 abilities. The plan states intent and only a few numbers;
 * every number below is a prototype decision, documented for the codex in SKILL_NOTES.
 */
type StarValues = [number, number, number];
const byStar = (entity: CombatEntity, values: StarValues): number => values[Math.min(2, Math.max(0, entity.stars - 1))];
const distance = (a: { x: number; y: number }, b: { x: number; y: number }): number => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (entity: CombatEntity): void => { entity.x = clampX(entity.x); entity.y = clampY(entity.y); };
/** +1 moves toward the enemy half for allies (they stand on rows 3–5). */
const forward = (entity: CombatEntity): number => entity.team === 'ally' ? -1 : 1;
const nearest = (point: { x: number; y: number }, list: CombatEntity[]): CombatEntity[] => [...list].sort((a, b) => distance(point, a) - distance(point, b));
const farthest = (point: { x: number; y: number }, list: CombatEntity[]): CombatEntity[] => [...list].sort((a, b) => distance(point, b) - distance(point, a));
const lowestHealth = (list: CombatEntity[]): CombatEntity[] => [...list].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
function landBeside(entity: CombatEntity, target: CombatEntity): void { entity.x = target.x; entity.y = target.y - forward(entity) * 0.7; clamp(entity); }
function landBehind(entity: CombatEntity, target: CombatEntity): void { entity.x = target.x; entity.y = target.y + forward(entity) * 0.7; clamp(entity); }
function push(entity: CombatEntity, from: CombatEntity, cells: number): void {
  const gap = distance(entity, from);
  const dx = gap > 0.01 ? (entity.x - from.x) / gap : 0, dy = gap > 0.01 ? (entity.y - from.y) / gap : forward(from);
  entity.x += dx * cells; entity.y += dy * cells; clamp(entity);
}
/** Distance from p to the ray that starts at `from` and passes through `to`. */
function rayDistance(from: CombatEntity, to: CombatEntity, p: CombatEntity): number {
  const dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy) || 1;
  const along = ((p.x - from.x) * dx + (p.y - from.y) * dy) / length;
  if (along < 0) return Infinity;
  return Math.abs((p.x - from.x) * dy - (p.y - from.y) * dx) / length;
}
const densest = (list: CombatEntity[], radius: number): CombatEntity | undefined =>
  [...list].sort((a, b) => list.filter(o => distance(o, b) <= radius).length - list.filter(o => distance(o, a) <= radius).length)[0];
/** Keeps the stronger of an active poison and the new one. */
function poison(target: CombatEntity, seconds: number, perSecond: number): void {
  target.poisonDamage = target.poison > 0 ? Math.max(target.poisonDamage, perSecond) : perSecond;
  target.poison = Math.max(target.poison, seconds);
}
function cleanse(entity: CombatEntity): void { entity.stun = 0; entity.slow = 0; entity.poison = 0; entity.hex = 0; }
function mod(entity: CombatEntity, stat: CombatEntity['mods'][number]['stat'], value: number, time: number, tag?: string): void {
  if (tag) entity.mods = entity.mods.filter(entry => entry.tag !== tag);
  entity.mods.push({ stat, value, time, tag });
}

export function castAbility(api: CombatApi, abilityId: number, source: CombatEntity, target: CombatEntity, power: number): void {
  const enemies = api.enemiesOf(source);
  const targetable = api.targetableEnemiesOf(source);
  const allies = api.alliesOf(source);
  const attack = power;
  switch (abilityId) {
    // ——— Custo 1 ———
    case 1:
      api.damage(source, target, power * byStar(source, [1.5, 2.25, 3.4])); target.huntMarked = 5;
      break;
    case 2: {
      api.addZone({ kind: 'web', team: source.team, sourceId: source.id, x: target.x, y: target.y, radius: 1.6, time: 5, dps: power * 0.3, slow: true });
      for (let i = 0; i < byStar(source, [2, 3, 5]); i++) api.summon(source, 'spider', { hp: source.maxHp * 0.22, attack: source.attack * 0.45, range: 1, lifetime: 8, attackSpeed: 0.9, x: target.x, y: target.y - forward(source) * 0.8 });
      break;
    }
    case 3:
      source.x = clampX(target.x); source.y = clampY(target.y - forward(source) * 0.7);
      api.damage(source, target, power * 1.5); target.stun = 1; api.shield(source, source, source.maxHp * 0.2);
      break;
    case 4:
      source.stun = 0; source.slow = 0; source.dodge = 1; source.empowered = 6;
      break;
    case 5: {
      api.damage(source, target, power * 1.6);
      const base = (entity: CombatEntity) => characters.find(c => c.id === entity.characterId)!.attack[entity.stars - 1];
      const stolen = target.attack * 0.12;
      target.attack = Math.max(base(target) * 0.4, target.attack - stolen);
      source.attack = Math.min(base(source) * 2, source.attack + stolen);
      break;
    }
    case 6:
      for (const ally of allies) api.heal(source, ally, power * 1.8);
      for (const enemy of enemies) { api.damage(source, enemy, power * 1.1, true); enemy.wet = Math.max(enemy.wet, 5); }
      break;
    case 7:
      api.damage(source, target, power * (target.hp / target.maxHp < 0.4 ? 3.4 : 1.7));
      if (target.hp <= 0) api.heal(source, source, source.maxHp * 0.25);
      break;
    case 8: {
      const far = farthest(source, targetable.length ? targetable : enemies)[0];
      if (!far) break;
      far.marked = 6; api.damage(source, far, power * 2);
      break;
    }
    case 9:
      source.guard = 4; source.guardBurst = true; api.shield(source, source, source.maxHp * 0.2);
      break;
    case 10:
      api.damage(source, target, power * 2.25); target.poison = 4; target.poisonDamage = power * 0.4;
      break;
    case 11:
      for (const ally of allies) { ally.haste = 5; if (ally.id !== source.id) ally.mana = Math.min(ally.manaMax, ally.mana + 15); }
      break;
    case 12:
      nearest(source, enemies).slice(0, 3).forEach((enemy, index) => api.damage(source, enemy, power * (index === 0 ? 1.8 : 1.2)));
      break;
    case 13:
      for (const enemy of nearest(source, enemies).slice(0, 3)) { api.damage(source, enemy, power * 1.8, true); enemy.slow = 5; }
      break;

    // ——— Custo 2 ———
    case 14: { // Jara — Entre as Folhas
      const isolated = [...(targetable.length ? targetable : enemies)].sort((a, b) =>
        Math.min(...enemies.filter(o => o !== b).map(o => distance(o, b)), 9) - Math.min(...enemies.filter(o => o !== a).map(o => distance(o, a)), 9))[0];
      if (!isolated) break;
      source.stealth = 1.5; landBeside(source, isolated);
      api.damage(source, isolated, attack * byStar(source, [2.2, 3, 4.8]));
      break;
    }
    case 15: // Grom — Peito de Guerra
      source.taunt = byStar(source, [3, 3.5, 4]);
      api.shield(source, source, source.maxHp * byStar(source, [0.3, 0.4, 0.6]));
      break;
    case 16: { // Ilya — Mergulho Celeste
      const prey = [...(targetable.length ? targetable : enemies)].sort((a, b) => a.armor - b.armor)[0];
      if (!prey) break;
      source.stealth = Math.max(source.stealth, 0.5);
      api.damage(source, prey, attack * byStar(source, [2, 2.8, 4.5]));
      break;
    }
    case 17: // Nask — Giro da Morte
      target.stun = Math.max(target.stun, 1.5); target.wet = Math.max(target.wet, 5);
      api.damage(source, target, attack * byStar(source, [1.8, 2.6, 4.2]));
      api.heal(source, source, source.maxHp * byStar(source, [0.15, 0.2, 0.3]));
      break;
    case 18: // Rava — Presságio
      for (let i = 0; i < byStar(source, [2, 3, 4]); i++) api.summon(source, 'crow', { hp: source.maxHp * 0.15, attack: source.attack * 0.55, range: 3, lifetime: 8, attackSpeed: 1 });
      source.omen = 8;
      break;
    case 19: { // Tembu — Linha Inquebrável
      const bonus = byStar(source, [25, 40, 70]);
      for (const ally of allies.filter(ally => distance(ally, source) <= 1.6)) { mod(ally, 'armor', bonus, 6, `tembu-armor-${source.id}`); mod(ally, 'magicResist', bonus, 6, `tembu-mr-${source.id}`); }
      for (const enemy of enemies.filter(enemy => distance(enemy, source) <= 1.5)) { api.damage(source, enemy, attack); push(enemy, source, 1); }
      break;
    }
    case 20: // Zakka — Ferrão Carmesim
      api.damage(source, target, attack * byStar(source, [2, 2.8, 4.5]));
      target.stun = Math.max(target.stun, 1.5); poison(target, 5, power * 0.4);
      break;
    case 21: { // Omi — Troca de Correnteza
      const wounded = lowestHealth(allies.filter(ally => ally !== source && !ally.summon))[0];
      const amount = power * byStar(source, [2, 2.8, 4.5]);
      if (wounded) {
        [source.x, wounded.x] = [wounded.x, source.x]; [source.y, wounded.y] = [wounded.y, source.y];
        wounded.stun = 0; wounded.slow = 0; wounded.poison = 0;
        api.shield(source, wounded, amount);
      }
      api.shield(source, source, amount);
      break;
    }
    case 22: { // Suri — Veneno Saltante
      const hit = new Set<string>();
      let current: CombatEntity | undefined = target;
      for (let bounce = 0; bounce < byStar(source, [4, 5, 7]) && current; bounce++) {
        hit.add(current.id);
        api.damage(source, current, power * 0.8, true); poison(current, 5, power * 0.35); current.antiheal = 6;
        const from: CombatEntity = current;
        const pool = enemies.filter(enemy => enemy.hp > 0 && enemy !== from && distance(enemy, from) <= 3);
        current = nearest(from, pool.filter(enemy => !hit.has(enemy.id)))[0] ?? nearest(from, pool)[0];
      }
      break;
    }
    case 23: { // Kesh — Salto entre Galhos
      const far = farthest(source, targetable.length ? targetable : enemies)[0];
      if (!far) break;
      landBeside(source, far);
      for (let i = 0; i < 2; i++) api.damage(source, far, attack * byStar(source, [1.5, 2.1, 3.5]));
      break;
    }
    case 24: // Brak — Carapaça de Guerra
      api.shield(source, source, source.maxHp * byStar(source, [0.35, 0.45, 0.65]));
      source.shieldBurst = power * byStar(source, [1.5, 2, 3.5]);
      break;
    case 25: // Sena — Passos da Primavera
      for (const ally of lowestHealth(allies).slice(0, 3)) api.heal(source, ally, power * byStar(source, [2, 2.8, 4.5]));
      for (const ally of allies) { ally.haste = Math.max(ally.haste, 4); mod(ally, 'attackSpeed', byStar(source, [0.15, 0.2, 0.3]), 4, 'sena'); }
      break;
    case 26: { // Uru — Rouba-Ossos
      api.damage(source, target, attack * byStar(source, [1.7, 2.5, 4]));
      const stolen = byStar(source, [8, 12, 20]);
      const armor = Math.min(stolen, target.armor), resist = Math.min(stolen, target.magicResist);
      target.armor -= armor; target.magicResist -= resist; source.armor += armor; source.magicResist += resist;
      break;
    }

    // ——— Custo 3 ———
    case 27: // Amaru — Forma Lunar
      source.transform = 8;
      mod(source, 'attackSpeed', byStar(source, [0.5, 0.6, 0.9]), 8, 'forma-lunar');
      for (const enemy of enemies.filter(enemy => enemy === target || rayDistance(source, target, enemy) <= 0.6 && distance(source, enemy) <= distance(source, target) + 0.8)) api.damage(source, enemy, attack * byStar(source, [1.5, 2, 3.2]));
      landBehind(source, target);
      break;
    case 28: // Duma — Chamado da Matriarca
      for (const ally of allies.filter(ally => distance(ally, source) <= 2.5)) api.shield(source, ally, source.maxHp * byStar(source, [0.12, 0.16, 0.25]));
      for (const enemy of enemies.filter(enemy => distance(enemy, source) <= 1.8)) { api.damage(source, enemy, power); push(enemy, source, 1); enemy.stun = Math.max(enemy.stun, 1); }
      break;
    case 29: { // Roko — Eco da Última Palavra
      const echoed = api.battle.lastCast[source.team];
      if (echoed && echoed !== 29) api.cast(echoed, source, target, power * byStar(source, [0.7, 0.8, 1]));
      else { api.damage(source, target, power * 2, true); for (const ally of allies) ally.mana = Math.min(ally.manaMax, ally.mana + 10); }
      break;
    }
    case 30: // Khepri — Ninhada Solar
      for (let i = 0; i < byStar(source, [2, 3, 4]); i++) api.summon(source, 'beetle', { hp: source.maxHp * 0.25, attack: source.attack * 0.4, range: 1, lifetime: 10, taunt: 3, deathBurst: power * byStar(source, [1.2, 1.6, 2.6]), x: source.x, y: source.y + forward(source) * 0.6 });
      break;
    case 31: // Vesh — Veneno do Rei
      for (const enemy of enemies.filter(enemy => enemy === target || rayDistance(source, target, enemy) <= 0.8)) {
        if (enemy.poison > 0) enemy.stun = Math.max(enemy.stun, byStar(source, [1.5, 2, 2.5]));
        api.damage(source, enemy, power, true); poison(enemy, 5, power * byStar(source, [0.5, 0.7, 1.1]));
      }
      break;
    case 32: // Toru — Remanso Violento
      api.addZone({ kind: 'water', team: source.team, sourceId: source.id, followId: source.id, x: source.x, y: source.y, radius: 1.6, time: 6, ownerHeal: byStar(source, [0.04, 0.05, 0.07]), allyHeal: 0.015, slow: true, wet: true });
      break;
    case 33: { // Asha — Penas dos Mortos
      const feathers = 3 + source.stacks; source.stacks = 0;
      const pool = lowestHealth(targetable.length ? targetable : enemies);
      for (let i = 0; i < feathers && pool.length; i++) api.damage(source, pool[i % pool.length], attack * byStar(source, [0.7, 1, 1.7]));
      break;
    }
    case 34: // Thari — Rompe-Linhas
      source.transform = 1.2;
      for (const enemy of enemies.filter(enemy => enemy === target || rayDistance(source, target, enemy) <= 0.8)) { api.damage(source, enemy, attack * byStar(source, [1.6, 2.4, 3.8])); enemy.stun = Math.max(enemy.stun, 1); }
      landBehind(source, target);
      break;
    case 35: // Mako — Véu de Água Negra
      api.addZone({ kind: 'veil', team: source.team, sourceId: source.id, x: (target.x + source.x) / 2, y: (target.y + source.y) / 2, radius: 2, time: 6, dps: power * byStar(source, [0.5, 0.7, 1.1]), wet: true, protect: 0.25 });
      break;
    case 36: // Sava — Frenesi Dourado
      source.transform = 6;
      mod(source, 'lifesteal', byStar(source, [0.25, 0.3, 0.45]), 6, 'frenesi-vida');
      mod(source, 'cleave', 0.6, 6, 'frenesi-cone'); mod(source, 'attack', 0.2, 6, 'frenesi-ataque');
      break;
    case 37: { // Nilo — Língua de Guerra
      const far = farthest(source, enemies)[0] ?? target;
      const struck = nearest(source, enemies.filter(enemy => enemy === far || rayDistance(source, far, enemy) <= 0.7));
      for (const enemy of struck) api.damage(source, enemy, power * byStar(source, [1.6, 2.3, 3.6]));
      const first = struck.find(enemy => enemy.hp > 0);
      if (first) { landBeside(first, source); first.stun = Math.max(first.stun, 1.25); }
      break;
    }
    case 38: // Yara — Ritual da Lua
      for (const ally of allies) { api.shield(source, ally, power * byStar(source, [1.6, 2.2, 3.6])); mod(ally, 'magicResist', byStar(source, [25, 35, 60]), 8, 'ritual-da-lua'); }
      break;

    // ——— Custo 4 ———
    case 39: { // Fenra — A Grande Caçada
      const prey = lowestHealth(targetable.length ? targetable : enemies)[0] ?? target;
      prey.huntMarked = 8; prey.marked = Math.max(prey.marked, 8);
      api.battle.prey[source.team] = { id: prey.id, time: 8 };
      for (const ally of allies) mod(ally, 'attackSpeed', byStar(source, [0.25, 0.35, 0.5]), 6, 'grande-cacada');
      landBeside(source, prey); api.damage(source, prey, attack * byStar(source, [2, 2.5, 4]));
      break;
    }
    case 40: // Koru — Domínio
      api.addZone({ kind: 'domain', team: source.team, sourceId: source.id, followId: source.id, x: source.x, y: source.y, radius: 1.8, time: 8, slow: true, ownerAttack: byStar(source, [0.4, 0.5, 0.8]), ownerArmor: byStar(source, [30, 40, 60]) });
      for (const enemy of enemies.filter(enemy => distance(enemy, source) <= 1.5)) { api.damage(source, enemy, power * 1.5); enemy.stun = Math.max(enemy.stun, 0.75); }
      break;
    case 41: // Makara — Giro Ancestral
      target.stun = Math.max(target.stun, byStar(source, [2, 2.25, 2.5])); target.wet = Math.max(target.wet, 5);
      api.damage(source, target, attack * byStar(source, [1.5, 2, 3]) + target.maxHp * byStar(source, [0.1, 0.14, 0.22]));
      api.heal(source, source, source.maxHp * 0.1);
      break;
    case 42: { // Nyala — Passo do Eclipse
      source.stealth = 1.2; source.transform = 1.5;
      let current: CombatEntity | undefined = target;
      for (let strike = 0; strike < byStar(source, [4, 5, 7]) && current; strike++) {
        api.damage(source, current, attack * byStar(source, [1.1, 1.5, 2.5]));
        landBeside(source, current);
        const from: CombatEntity = current;
        const living = enemies.filter(enemy => enemy.hp > 0);
        current = nearest(from, living.filter(enemy => enemy !== from))[0] ?? (from.hp > 0 ? from : undefined);
      }
      break;
    }
    case 43: { // Vahara — Marcha das Memórias
      source.y += forward(source); clamp(source);
      for (const ally of allies.filter(ally => ally !== source && distance(ally, source) <= 2.2 && (ally.y - source.y) * forward(source) <= 0.2)) {
        api.shield(source, ally, source.maxHp * byStar(source, [0.15, 0.2, 0.3])); mod(ally, 'damageTaken', -0.2, 5, 'marcha');
      }
      api.shield(source, source, source.maxHp * byStar(source, [0.15, 0.2, 0.3]));
      for (const enemy of enemies.filter(enemy => distance(enemy, source) <= 1.5)) { api.damage(source, enemy, attack * 1.5); push(enemy, source, 0.8); }
      break;
    }
    case 44: { // Zyri — Reino de Seda
      const center = densest(enemies, 1.5) ?? target;
      api.addZone({ kind: 'web', team: source.team, sourceId: source.id, x: center.x, y: center.y, radius: 2.2, time: 6, dps: power * byStar(source, [0.35, 0.5, 0.8]), slow: true });
      for (let i = 0; i < byStar(source, [3, 4, 6]); i++) api.summon(source, 'spider', { hp: source.maxHp * 0.22, attack: source.attack * 0.5, range: 1, lifetime: 9, attackSpeed: 0.95, x: center.x, y: center.y - forward(source) * 0.9 });
      break;
    }
    case 45: { // Orun — Três Máscaras
      const mask = source.stacks % 3; source.stacks++;
      if (mask === 0) {
        api.emit('skill', source, target, undefined, 'Máscara do Jaguar');
        api.damage(source, target, power * byStar(source, [2, 2.8, 4.5]), true);
        for (const ally of allies) mod(ally, 'attackSpeed', 0.3, 5, 'mascara-jaguar');
      } else if (mask === 1) {
        api.emit('skill', source, source, undefined, 'Máscara do Elefante');
        for (const ally of allies) api.shield(source, ally, power * byStar(source, [1.2, 1.7, 2.8]));
      } else {
        api.emit('skill', source, target, undefined, 'Máscara da Coruja');
        for (const enemy of farthest(source, enemies).slice(0, 2)) { enemy.marked = Math.max(enemy.marked, 6); api.damage(source, enemy, power * byStar(source, [1.2, 1.7, 2.8]), true); }
        for (const ally of allies) mod(ally, 'magicResist', 30, 6, 'mascara-coruja');
      }
      break;
    }
    case 46: { // Sakar — Muda Celeste
      source.stealth = 2.5; source.transform = 2.5;
      const pool = lowestHealth(enemies);
      for (let i = 0; i < byStar(source, [4, 5, 7]) && pool.length; i++) {
        const enemy = pool[i % pool.length];
        api.damage(source, enemy, power * byStar(source, [1.2, 1.6, 2.6]), true); poison(enemy, 4, power * 0.3);
      }
      break;
    }
    case 47: // Aruun — Predador da Corrente
      target.wet = Math.max(target.wet, 8);
      mod(source, 'wetBonus', byStar(source, [0.35, 0.5, 0.8]), 8, 'predador');
      api.damage(source, target, attack * byStar(source, [2.2, 3, 5]));
      break;
    case 48: // Boro — Estouro da Manada
      for (const enemy of enemies) { api.damage(source, enemy, attack * byStar(source, [1.1, 1.7, 3])); push(enemy, source, 0.8); enemy.stun = Math.max(enemy.stun, 0.75); }
      break;

    // ——— Custo 5 ———
    case 49: { // Uruq — Primeiro Inverno
      // The colossal body grows once per battle; later casts renew the form and heal.
      if (!source.stacks) { const extra = source.maxHp * byStar(source, [0.4, 0.5, 0.8]); source.maxHp += extra; api.heal(source, source, extra); source.stacks = 1; }
      else api.heal(source, source, source.maxHp * 0.2);
      source.transform = 10;
      const resist = byStar(source, [30, 40, 60]);
      mod(source, 'armor', resist, 10, 'inverno-armadura'); mod(source, 'magicResist', resist, 10, 'inverno-rm'); mod(source, 'cleave', 0.5, 10, 'inverno-golpe');
      api.addZone({ kind: 'frost', team: source.team, sourceId: source.id, followId: source.id, x: source.x, y: source.y, radius: 2.2, time: 10, dps: power * byStar(source, [0.4, 0.6, 1]), slow: true });
      break;
    }
    case 50: { // Akh'ra — Devorar o Sol
      source.transform = 2;
      let leaps = byStar(source, [3, 4, 6]), bonus = 0;
      for (let leap = 0; leap < leaps; leap++) {
        const prey = lowestHealth(api.enemiesOf(source))[0];
        if (!prey) break;
        landBeside(source, prey);
        api.damage(source, prey, attack * byStar(source, [1.7, 2.3, 4]));
        if (prey.hp <= 0 && bonus < 2) { bonus++; leaps++; }
      }
      break;
    }
    case 51: { // Mahari — Todos Caminham Conosco
      const fallen = api.fallen(source.team).slice(-byStar(source, [2, 3, 4]));
      for (const ally of fallen) {
        const character = characters.find(c => c.id === ally.characterId)!;
        api.summon(source, 'echo', { characterId: ally.characterId, stars: ally.stars, hp: ally.maxHp * 0.6, attack: ally.attack * 0.7, range: character.range, attackSpeed: character.attackSpeed, lifetime: 12, x: ally.x, y: ally.y });
      }
      for (let i = fallen.length; i < byStar(source, [1, 2, 3]); i++) api.summon(source, 'elephant', { hp: source.maxHp * 0.35, attack: source.attack * 0.6, range: 1, lifetime: 10, taunt: 2, attackSpeed: 0.6 });
      for (const ally of allies) api.shield(source, ally, source.maxHp * 0.08);
      break;
    }
    case 52: // Veyra — Noite Absoluta
      for (const enemy of enemies) { enemy.hex = 8; enemy.hexDamage = power * byStar(source, [2, 3, 5]); enemy.slow = Math.max(enemy.slow, 4); }
      api.damage(source, target, power * 1.5, true);
      break;
    case 53: // Ssar'ka — Pele Sem Fim (a muda ativa; o renascimento é passivo)
      cleanse(source);
      api.heal(source, source, source.maxHp * byStar(source, [0.2, 0.25, 0.35]));
      for (const enemy of enemies.filter(enemy => distance(enemy, source) <= 2.2)) { api.damage(source, enemy, power, true); poison(enemy, 5, power * byStar(source, [0.5, 0.7, 1.2])); }
      break;
    case 54: { // N'Goro — Conselho dos Primeiros Espíritos
      for (const ally of allies) {
        mod(ally, 'attack', byStar(source, [0.2, 0.3, 0.5]), 8, 'totem-lobo');
        api.shield(source, ally, power * byStar(source, [1.5, 2, 3]));
      }
      for (const enemy of farthest(source, enemies).slice(0, 3)) api.damage(source, enemy, power * byStar(source, [1.5, 2.2, 3.5]), true);
      break;
    }
    case 55: { // Karkun — O Pântano Tem Fome
      const center = densest(enemies, 1.5) ?? target;
      source.stealth = 0.8; source.transform = 1.5;
      landBeside(source, center);
      const threshold = byStar(source, [0.18, 0.22, 0.3]);
      for (const enemy of enemies.filter(enemy => distance(enemy, center) <= 1.6)) {
        api.damage(source, enemy, attack * byStar(source, [1.8, 2.5, 4]));
        enemy.wet = Math.max(enemy.wet, 5); enemy.stun = Math.max(enemy.stun, 1);
        if (enemy.hp > 0 && enemy.hp / enemy.maxHp <= threshold) {
          api.damage(source, enemy, enemy.hp + enemy.shield + 1, false, true);
          api.heal(source, source, source.maxHp * 0.15);
        }
      }
      break;
    }
  }
}

/** First-slice interpretations of the provided character plan; not full Set 1 rules. */
export const SKILL_NOTES: Record<number, string> = {
  1: 'Golpe de 150/225/340% do ataque; marca a presa e acelera aliados que a atacam.',
  2: 'Teia de 5 s que desacelera e fere inimigos; invoca 2/3/5 crias de seda por 8 s.',
  3: 'Avança até a presa, causa 150% do ataque, atordoa por 1 s e recebe escudo.',
  4: 'Remove o atordoamento, evita dano por 1 s e envenena os próximos ataques por 6 s.',
  5: 'Causa 160% do ataque e transfere 12% do ataque da presa para si, até um limite.',
  6: 'Cura aliados e causa dano mágico aos inimigos numa chuva sobre todo o campo; inimigos ficam molhados.',
  7: 'Causa 170% do ataque; o dano dobra contra presas abaixo de 40% de vida. Uma execução cura Taka.',
  8: 'Acerta e marca o inimigo mais distante, que recebe 20% de dano adicional por 6 s.',
  9: 'Recebe escudo e reduz o dano por 4 s; ao terminar, causa dano ao redor.',
  10: 'Três cortes causam 225% do ataque e aplicam sangramento por 4 s.',
  11: 'O totem concede 5 s de velocidade de ataque e 15 de mana para os outros aliados.',
  12: 'Um dardo perfura até três inimigos, causando 180% do ataque ao primeiro e 120% aos demais.',
  13: 'Uma onda atinge até três inimigos próximos e reduz sua velocidade de ataque por 5 s.',
  14: 'Fica inalvejável por 1,5 s, surge ao lado do inimigo mais isolado e causa 220/300/480% do ataque.',
  15: 'Provoca inimigos próximos por 3/3,5/4 s e recebe escudo de 30/40/60% da vida.',
  16: 'Mergulha no inimigo com menor armadura e causa 200/280/450% do ataque.',
  17: 'Agarra e atordoa o alvo por 1,5 s, causa 180/260/420% do ataque e recupera 15/20/30% da vida.',
  18: 'Invoca 2/3/4 corvos por 8 s; durante o presságio, cada inimigo derrotado dá 10 de mana aos aliados.',
  19: 'Aliados adjacentes recebem +25/40/70 de armadura e resistência por 6 s; inimigos próximos são empurrados.',
  20: 'Golpe de 200/280/450% do ataque que atordoa por 1,5 s e envenena por 5 s.',
  21: 'Troca de lugar com o aliado mais ferido, purifica-o e protege ambos com escudo.',
  22: 'O veneno salta 4/5/7 vezes entre inimigos e reduz a cura recebida pela metade por 6 s.',
  23: 'Salta até o inimigo mais distante e ataca duas vezes com 150/210/350% do ataque.',
  24: 'Escudo de 35/45/65% da vida; quando é destruído, explode em dano mágico ao redor.',
  25: 'Cura os três aliados mais feridos e acelera todos os ataques por 4 s.',
  26: 'Causa 170/250/400% do ataque e rouba 8/12/20 de armadura e de resistência mágica.',
  27: 'Transforma-se por 8 s com +50/60/90% de velocidade de ataque e atravessa a linha inimiga.',
  28: 'Escuda aliados próximos e empurra e atordoa inimigos ao redor por 1 s.',
  29: 'Repete a última habilidade aliada com 70/80/100% de força; sem eco, causa dano mágico e dá mana.',
  30: 'Invoca 2/3/4 escaravelhos que provocam inimigos e explodem ao morrer.',
  31: 'Veneno em linha; alvos já envenenados ficam paralisados por 1,5/2/2,5 s.',
  32: 'Cria um remanso de 6 s ao seu redor: regenera 4/5/7% da vida por segundo e molha e desacelera inimigos.',
  33: 'Cada morte no campo gera uma pena (até 12); dispara 3 penas mais as acumuladas.',
  34: 'Investe através da formação, ferindo e atordoando todos na linha por 1 s.',
  35: 'Véu de 6 s: aliados dentro recebem 25% menos dano; inimigos dentro ficam molhados e sofrem dano.',
  36: 'Transforma-se por 6 s: 25/30/45% de roubo de vida e ataques em cone.',
  37: 'Atinge inimigos em linha, puxa o primeiro para perto e o atordoa.',
  38: 'Escudo para toda a formação e +25/35/60 de resistência mágica por 8 s.',
  39: 'Marca a presa mais ferida por 8 s: toda a formação a persegue com velocidade de ataque adicional.',
  40: 'Território de 8 s que o acompanha: +40/50/80% de ataque e +30/40/60 de armadura; inimigos desaceleram.',
  41: 'Imobiliza o alvo por 2/2,25/2,5 s e causa dano físico mais 10/14/22% da vida máxima dele.',
  42: 'Desaparece e desfere 4/5/7 golpes, saltando entre inimigos.',
  43: 'Avança uma casa e protege aliados atrás dele com escudo e 20% de redução de dano.',
  44: 'Grande teia sobre o maior grupo inimigo e 3/4/6 crias de seda.',
  45: 'Alterna máscaras: Jaguar (dano e velocidade), Elefante (escudos) e Coruja (marcas e resistência).',
  46: 'Voa por 2,5 s, inalvejável, e dispara 4/5/7 penas venenosas.',
  47: 'Mergulha, molha o alvo e causa até 80% de dano extra contra inimigos molhados por 8 s.',
  48: 'Uma carga espiritual de búfalos fere, empurra e atordoa todos os inimigos.',
  49: 'Transforma-se por 10 s: mais vida, armadura e resistência, golpes em área e território congelado.',
  50: 'Executa 3/4/6 saltos sobre o inimigo mais ferido; cada abate concede um salto extra (até 2).',
  51: 'Invoca ecos de aliados caídos; sem mortos, invoca espíritos do marfim. Escuda toda a formação.',
  52: 'A noite cai por 8 s: inimigos desaceleram e sofrem dano e atordoamento ao conjurar.',
  53: 'Troca de pele: purifica, cura e envenena ao redor. Na primeira morte, renasce mais forte.',
  54: 'Totens do Lobo (ataque), do Urso (escudos) e da Águia (dano nos inimigos mais distantes).',
  55: 'Submerge e emerge no maior grupo inimigo; devora alvos abaixo de 18/22/30% da vida.',
};
