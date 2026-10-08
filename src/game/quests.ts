import { isComponent } from './items';
import type { GameState } from './simulation';
import { countTraits, traitStatus } from './synergies';

/**
 * The tribe's journal: an ordered trail of objectives that teaches the game and then
 * points at the next milestone. Claimed objectives survive rebirths.
 */
export interface QuestReward { knowledge?: number; components?: number; embers?: number }
export interface QuestDef { id: string; title: string; hint: string; done: (state: GameState) => boolean; reward: QuestReward }

const deployedTiers = (state: GameState) => [...countTraits(state.heroes.filter(h => h.slot !== null).map(h => h.characterId))].map(([name, count]) => traitStatus(name, count).tier);
const hasFinishedItem = (state: GameState) => [...state.inventory, ...state.heroes.flatMap(h => h.items)].some(id => !isComponent(id));

export const QUESTS: QuestDef[] = [
  { id: 'primeira-cacada', title: 'Vença a primeira expedição', hint: 'No Campo, toque em Iniciar expedição. O combate é automático.', done: s => s.progress >= 1, reward: { knowledge: 2 } },
  { id: 'recrutar', title: 'Acolha um companheiro', hint: 'Abra Guardiões → Descobrir e acolha um companheiro conforme a era e o vínculo ritual.', done: s => s.stats.recruits >= 1, reward: { knowledge: 2 } },
  { id: 'cacar', title: 'Mande um herói caçar', hint: 'Atividade opcional: Jornada → Atividades offline. Escolha uma trilha para quem ficará fora do campo.', done: s => s.stats.hunts >= 1, reward: { knowledge: 2 } },
  { id: 'nivel-3', title: 'Leve um herói ao nível 3', hint: 'Batalhas e caçadas dão experiência; cada nível fortalece a vida e o ataque.', done: s => s.heroes.some(h => h.level >= 3), reward: { knowledge: 2 } },
  { id: 'rape', title: 'Faça uma cerimônia de rapé', hint: 'O rapé firma o foco: um pouco mais de velocidade de ataque e uma caçada mais proveitosa.', done: s => s.heroes.some(h => (h.rituals.rape ?? 0) >= 1), reward: { knowledge: 2 } },
  { id: 'era-2', title: 'Avance para a Era II', hint: 'XP e vínculo ritual abrem uma vaga na formação e companheiros da Era II.', done: s => s.era >= 2, reward: { components: 1 } },
  { id: 'espirito', title: 'Honre um Espírito Protetor', hint: 'Cada nova era pede um espírito: um bônus permanente e um poder de combate.', done: s => s.spirits.length >= 1, reward: { knowledge: 2 } },
  { id: 'duas-estrelas', title: 'Forme um herói 2★', hint: 'Alcance experiência nível 8 e ritual nível 3 no mesmo herói.', done: s => s.heroes.some(h => h.stars >= 2), reward: { knowledge: 2 } },
  { id: 'alfa', title: 'Derrote o Alfa Cinzento', hint: 'O chefe da Clareira do Lobo fecha a primeira região.', done: s => s.progress >= 5, reward: { components: 1 } },
  { id: 'item', title: 'Forje um item completo', hint: 'Entregue dois componentes ao mesmo herói, ou combine-os nas receitas do Conselho de Guerra.', done: hasFinishedItem, reward: { components: 1 } },
  { id: 'cacau', title: 'Reúna a tribo na roda de cacau', hint: 'Na Era II, a roda de cacau acelera o aprendizado de toda a tribo.', done: s => s.cacao > 0, reward: { knowledge: 4 } },
  { id: 'poder', title: 'Chame um Poder Espiritual', hint: 'Durante uma expedição, use a barra de poderes no campo.', done: s => s.stats.powers >= 1, reward: { knowledge: 2 } },
  { id: 'era-3', title: 'Avance para a Era III', hint: 'Novos companheiros e mais uma vaga na formação.', done: s => s.era >= 3, reward: { knowledge: 4 } },
  { id: 'delta', title: 'Vença a Boca do Delta', hint: 'O chefe da Margem do Rio.', done: s => s.progress >= 10, reward: { components: 2 } },
  { id: 'laco-forte', title: 'Ative um laço no segundo nível', hint: 'Quatro personagens diferentes de um povo ou função na formação.', done: s => deployedTiers(s).some(tier => tier >= 2), reward: { knowledge: 2 } },
  { id: 'oraculo', title: 'Vença o Oráculo da Copa', hint: 'O chefe da Copa Alta repete as habilidades da tribo dele.', done: s => s.progress >= 15, reward: { components: 2 } },
  { id: 'nixi-pae', title: 'Conduza uma cerimônia de ayahuasca', hint: 'Nixi pae, o encanto do cipó: exige a Era III, nível de experiência 14 e um rapé antes.', done: s => s.heroes.some(h => (h.rituals.ayahuasca ?? 0) >= 1), reward: { knowledge: 2 } },
  { id: 'tres-estrelas', title: 'Desperte um herói 3★', hint: 'Alcance experiência nível 24, ritual nível 8 e conclua ayahuasca no mesmo herói.', done: s => s.heroes.some(h => h.stars >= 3), reward: { knowledge: 2 } },
  { id: 'era-4', title: 'Avance para a Era IV', hint: 'As grandes manadas e os companheiros da Era IV.', done: s => s.era >= 4, reward: { knowledge: 4 } },
  { id: 'nivel-7', title: 'Leve um herói ao nível 7', hint: 'As trilhas mais longas ensinam mais. Heróis atrás do mais forte da tribo aprendem mais depressa.', done: s => s.heroes.some(h => h.level >= 7), reward: { components: 2 } },
  { id: 'bufalos', title: 'Vença o Rei dos Búfalos', hint: 'O chefe da Savana de Marfim.', done: s => s.progress >= 20, reward: { components: 2 } },
  { id: 'era-5', title: 'Alcance a Era V', hint: 'A era dos ancestrais e dos lendários.', done: s => s.era >= 5, reward: { knowledge: 4 } },
  { id: 'leviata', title: 'Vença o Leviatã do Pântano', hint: 'Depois dele, o Grande Totem pode ser erguido.', done: s => s.progress >= 25, reward: { components: 3 } },
  { id: 'totem', title: 'Erga a primeira parte do Grande Totem', hint: 'Na aba Totem.', done: s => s.wonder >= 1, reward: { knowledge: 2 } },
  { id: 'inverno', title: 'Vença o Primeiro Inverno', hint: 'O último chefe exige heróis 3★ experientes, itens, cerimônias e poderes bem usados.', done: s => s.progress >= 30, reward: { components: 3 } },
  { id: 'cacada', title: 'Alcance a profundidade 5 da Caçada Eterna', hint: 'Cada vitória aprofunda a caçada e rende componentes.', done: s => s.endlessBest >= 5 || s.endlessRecord >= 5, reward: { knowledge: 4 } },
  { id: 'renascer', title: 'Renasça no Grande Totem', hint: 'Complete o Totem e recomece com brasas ancestrais.', done: s => s.rebirths >= 1, reward: { embers: 5 } },
];
export const questById = (id: string) => QUESTS.find(quest => quest.id === id);

/** Unclaimed objectives in journal order. */
export const openQuests = (state: GameState) => QUESTS.filter(quest => !state.quests.includes(quest.id));

export function rewardText(reward: QuestReward): string {
  const parts: string[] = [];
  if (reward.knowledge) parts.push(`${reward.knowledge} de conhecimento`);
  if (reward.components) parts.push(`${reward.components} componente${reward.components > 1 ? 's' : ''}`);
  if (reward.embers) parts.push(`${reward.embers} brasas`);
  return parts.join(', ');
}
