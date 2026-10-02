import { isComponent } from './items';
import type { GameState, Resources } from './simulation';
import { countTraits, traitStatus } from './synergies';

/**
 * The tribe's journal: an ordered trail of objectives that teaches the game and then
 * points at the next milestone. Claimed objectives survive rebirths.
 */
export interface QuestReward { resources?: Partial<Resources>; components?: number; embers?: number }
export interface QuestDef { id: string; title: string; hint: string; done: (state: GameState) => boolean; reward: QuestReward }

const deployedTiers = (state: GameState) => [...countTraits(state.heroes.filter(h => h.slot !== null).map(h => h.characterId))].map(([name, count]) => traitStatus(name, count).tier);
const hasFinishedItem = (state: GameState) => [...state.inventory, ...state.heroes.flatMap(h => h.items)].some(id => !isComponent(id));
const each = (amount: number): Partial<Resources> => ({ wood: amount, food: amount, stone: amount, spirit: amount });

export const QUESTS: QuestDef[] = [
  { id: 'primeira-cacada', title: 'Vença a primeira expedição', hint: 'Na Expedição, toque em Iniciar. O combate é automático.', done: s => s.progress >= 1, reward: { resources: { spirit: 40 } } },
  { id: 'cacar', title: 'Mande um herói caçar', hint: 'Em Caçadas, escolha uma trilha. O herói volta com experiência e alimento, mesmo com o jogo fechado.', done: s => s.stats.hunts >= 1, reward: { resources: { food: 60, spirit: 30 } } },
  { id: 'construir', title: 'Melhore uma construção', hint: 'Toque numa construção da aldeia e comece a obra. Cada nível leva mais tempo que o anterior.', done: s => s.buildings.lumber + s.buildings.hunt + s.buildings.quarry + s.buildings.shrine >= 5, reward: { resources: { wood: 60, stone: 40 } } },
  { id: 'chamado', title: 'Chame um herói', hint: 'Em Tribo › Chamado, o Círculo dos Espíritos chama um personagem. Cada um vem uma só vez e fica para sempre.', done: s => s.stats.calls >= 1, reward: { resources: { food: 80, spirit: 40 } } },
  { id: 'casa-de-cura', title: 'Construa a Casa de Cura', hint: 'A maloca do pajé, onde a tribo faz as cerimônias que enchem a barra ritual dos heróis.', done: s => s.buildings.cura >= 1, reward: { resources: { wood: 60, spirit: 40 } } },
  { id: 'rape', title: 'Faça uma cerimônia de rapé', hint: 'Em Rituais. O rapé dá força ritual e foco para a próxima caçada.', done: s => s.heroes.some(h => (h.rituals.rape ?? 0) >= 1), reward: { resources: { food: 80 } } },
  { id: 'trabalho', title: 'Coloque um herói para trabalhar', hint: 'Heróis fora da formação trabalham numa construção: produzem mais e ganham experiência com o ofício.', done: s => s.heroes.some(h => h.work !== null), reward: { resources: { food: 100, wood: 60 } } },
  { id: 'nivel-5', title: 'Leve um herói ao nível 5', hint: 'Caçadas, trabalho e expedições enchem a barra de experiência.', done: s => s.heroes.some(h => h.level >= 5), reward: { resources: { spirit: 80 } } },
  { id: 'era-2', title: 'Avance para a Era II', hint: 'A nova era abre uma vaga na formação, heróis de custo 2 e construções mais altas.', done: s => s.villageLevel >= 2, reward: { components: 1 } },
  { id: 'espirito', title: 'Honre um Espírito Protetor', hint: 'Cada nova era pede um espírito: um bônus permanente e um poder de combate.', done: s => s.spirits.length >= 1, reward: { resources: { spirit: 60 } } },
  { id: 'alfa', title: 'Derrote o Alfa Cinzento', hint: 'O chefe da Clareira do Lobo fecha a primeira região.', done: s => s.progress >= 5, reward: { components: 1 } },
  { id: 'ritual-3', title: 'Leve a tribo ao nível ritual 3', hint: 'Toda força ritual dos heróis soma no nível ritual da tribo, que decide quem atende ao chamado.', done: s => s.ritualTotal >= 60, reward: { resources: { spirit: 120 } } },
  { id: 'forja', title: 'Construa a Forja de Osso', hint: 'Na Era II, a forja produz componentes e combina-os na bolsa.', done: s => s.buildings.forge >= 1, reward: { resources: { stone: 150 } } },
  { id: 'item', title: 'Forje um item completo', hint: 'Entregue dois componentes ao mesmo herói, ou combine-os na bolsa com a forja.', done: hasFinishedItem, reward: { components: 1 } },
  { id: 'kambo', title: 'Faça uma cerimônia de kambô', hint: 'Na Era II, com a Casa de Cura no nível 2: muita força ritual e o fim da panema.', done: s => s.heroes.some(h => (h.rituals.kambo ?? 0) >= 1), reward: { resources: { food: 200, spirit: 120 } } },
  { id: 'nivel-10', title: 'Leve um herói ao nível 10', hint: 'O teto de um herói 1★. Daqui em diante, só o rito de ascensão abre novos níveis.', done: s => s.heroes.some(h => h.level >= 10), reward: { components: 1 } },
  { id: 'cacau', title: 'Reúna a tribo na roda de cacau', hint: 'Com a Casa de Cura no nível 2: força ritual para todos na aldeia e mais experiência por duas horas.', done: s => s.cacao > 0, reward: { resources: each(150) } },
  { id: 'ascensao-2', title: 'Desperte um herói 2★', hint: 'Com a barra de experiência e a barra ritual cheias, o rito de ascensão desperta o vínculo com o espírito.', done: s => s.heroes.some(h => h.stars >= 2), reward: { resources: { spirit: 300 }, components: 1 } },
  { id: 'poder', title: 'Chame um Poder Espiritual', hint: 'Durante uma expedição, use a barra de poderes no campo.', done: s => s.stats.powers >= 1, reward: { resources: { spirit: 100 } } },
  { id: 'era-3', title: 'Avance para a Era III', hint: 'Heróis de custo 3, mais uma vaga na formação e um segundo construtor.', done: s => s.villageLevel >= 3, reward: { resources: each(300) } },
  { id: 'delta', title: 'Vença a Boca do Delta', hint: 'O chefe da Margem do Rio.', done: s => s.progress >= 10, reward: { components: 2 } },
  { id: 'laco-forte', title: 'Ative um laço no segundo nível', hint: 'Quatro personagens diferentes de um povo ou função na formação.', done: s => deployedTiers(s).some(tier => tier >= 2), reward: { resources: { spirit: 200 } } },
  { id: 'nixi-pae', title: 'Conduza uma cerimônia de ayahuasca', hint: 'Nixi pae, o encanto do cipó: Casa de Cura nível 3 e um rapé antes. A cerimônia de maior força ritual.', done: s => s.heroes.some(h => (h.rituals.ayahuasca ?? 0) >= 1), reward: { resources: { spirit: 400 } } },
  { id: 'tribo-8', title: 'Reúna oito heróis', hint: 'Chamados, viajantes acolhidos: a tribo cresce um rosto de cada vez.', done: s => s.heroes.length >= 8, reward: { resources: each(400) } },
  { id: 'oraculo', title: 'Vença o Oráculo da Copa', hint: 'O chefe da Copa Alta repete as habilidades da tribo dele.', done: s => s.progress >= 15, reward: { components: 2 } },
  { id: 'era-4', title: 'Avance para a Era IV', hint: 'As grandes manadas e os heróis de custo 4.', done: s => s.villageLevel >= 4, reward: { resources: each(800) } },
  { id: 'nivel-20', title: 'Leve um herói ao nível 20', hint: 'O teto de um herói 2★. As trilhas longas ensinam mais.', done: s => s.heroes.some(h => h.level >= 20), reward: { components: 2 } },
  { id: 'ritual-6', title: 'Leve a tribo ao nível ritual 6', hint: 'Heróis de custo 4 pedem uma tribo de nível ritual 6.', done: s => s.ritualTotal >= 400, reward: { resources: { spirit: 1000 } } },
  { id: 'bufalos', title: 'Vença o Rei dos Búfalos', hint: 'O chefe da Savana de Marfim.', done: s => s.progress >= 20, reward: { components: 2 } },
  { id: 'ascensao-3', title: 'Desperte um herói 3★', hint: 'A forma primal: nível 20 e a barra ritual cheia de novo.', done: s => s.heroes.some(h => h.stars >= 3), reward: { resources: { spirit: 1500 }, components: 2 } },
  { id: 'era-5', title: 'Alcance a Era V', hint: 'A era dos ancestrais e dos lendários.', done: s => s.villageLevel >= 5, reward: { resources: each(2000) } },
  { id: 'leviata', title: 'Vença o Leviatã do Pântano', hint: 'Depois dele, o Grande Totem pode ser erguido.', done: s => s.progress >= 25, reward: { components: 3 } },
  { id: 'totem', title: 'Erga a primeira parte do Grande Totem', hint: 'Em Saber › Totem.', done: s => s.wonder >= 1, reward: { resources: { spirit: 3000 } } },
  { id: 'nivel-30', title: 'Leve um herói ao nível 30', hint: 'O auge de um avatar primal.', done: s => s.heroes.some(h => h.level >= 30), reward: { components: 3 } },
  { id: 'inverno', title: 'Vença o Primeiro Inverno', hint: 'O último chefe exige heróis 3★ experientes, itens, laços e poderes bem usados.', done: s => s.progress >= 30, reward: { components: 3 } },
  { id: 'cacada', title: 'Alcance a profundidade 5 da Caçada Eterna', hint: 'Cada vitória aprofunda a caçada e rende componentes.', done: s => s.endlessBest >= 5 || s.endlessRecord >= 5, reward: { resources: each(5000) } },
  { id: 'renascer', title: 'Renasça no Grande Totem', hint: 'Complete o Totem e recomece com brasas ancestrais.', done: s => s.rebirths >= 1, reward: { embers: 5 } },
];
export const questById = (id: string) => QUESTS.find(quest => quest.id === id);

/** Unclaimed objectives in journal order. */
export const openQuests = (state: GameState) => QUESTS.filter(quest => !state.quests.includes(quest.id));

export function rewardText(reward: QuestReward): string {
  const parts: string[] = [];
  const names: Record<string, string> = { wood: 'madeira', food: 'alimento', stone: 'pedra', spirit: 'espírito' };
  for (const [key, value] of Object.entries(reward.resources ?? {})) if (value) parts.push(`${value} de ${names[key]}`);
  if (reward.components) parts.push(`${reward.components} componente${reward.components > 1 ? 's' : ''}`);
  if (reward.embers) parts.push(`${reward.embers} brasas`);
  return parts.join(', ');
}
