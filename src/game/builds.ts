import type { ArmyRole } from "./armyAdvisor";
import { COMPONENTS, itemById } from "./items";
import { componentCost } from "./economy";
export const BUILDS: {
  id: string;
  name: string;
  role: ArmyRole;
  items: string[];
  text: string;
}[] = [
  {
    id: "front-hold",
    name: "Muralha viva",
    role: "front",
    items: ["muralha", "pele-urso", "carvalho"],
    text: "Provocação, regeneração e vida para segurar a abertura.",
  },
  {
    id: "front-reflect",
    name: "Espinhos de guerra",
    role: "front",
    items: ["carapaca", "espinhos", "amuleto"],
    text: "Reflexão física e escudo quando a vida cai.",
  },
  {
    id: "front-aura",
    name: "Guarda do círculo",
    role: "front",
    items: ["escudo-totem", "pele-urso", "veu-coruja"],
    text: "Protege aliados próximos e resiste à conjuração.",
  },
  {
    id: "ranged-stack",
    name: "Fúria crescente",
    role: "ranged",
    items: ["garra", "tempestade", "talisma"],
    text: "Velocidade crescente, ataques em cadeia e roubo de vida.",
  },
  {
    id: "ranged-burst",
    name: "Presa certeira",
    role: "ranged",
    items: ["obsidiana", "flauta", "amuleto"],
    text: "Terceiro golpe forte e uma janela para sobreviver.",
  },
  {
    id: "ranged-shred",
    name: "Flechas do encanto",
    role: "ranged",
    items: ["corda", "flauta", "tempestade"],
    text: "Remove resistência para apoiar os conjuradores.",
  },
  {
    id: "caster-cycle",
    name: "Círculo de mana",
    role: "caster",
    items: ["coroa", "colar-lua", "lanca"],
    text: "Conjura cedo, recupera mana e fortalece a habilidade.",
  },
  {
    id: "caster-safe",
    name: "Voz protegida",
    role: "caster",
    items: ["colar-lua", "amuleto", "lanca"],
    text: "Conjuração sustentada com defesa contra explosões.",
  },
  {
    id: "caster-fast",
    name: "Primeiro chamado",
    role: "caster",
    items: ["coroa", "flauta", "lanca"],
    text: "Uma abertura rápida com mana de ataques e conjurações.",
  },
  {
    id: "support-heal",
    name: "Nascente da vida",
    role: "support",
    items: ["cajado-vida", "coroa", "colar-lua"],
    text: "Cura adicional a cada conjuração e mana constante.",
  },
  {
    id: "support-aura",
    name: "Círculo protetor",
    role: "support",
    items: ["escudo-totem", "cajado-vida", "amuleto"],
    text: "Escudos próximos, cura e segurança para a retaguarda.",
  },
  {
    id: "support-control",
    name: "Paz da coruja",
    role: "support",
    items: ["veu-coruja", "colar-lua", "coroa"],
    text: "Proteção contra controle para continuar sustentando a tribo.",
  },
  {
    id: "flank-strike",
    name: "Emboscada",
    role: "flank",
    items: ["vento", "obsidiana", "talisma"],
    text: "Inalvejável na abertura, dano de golpe e recuperação de vida.",
  },
  {
    id: "flank-sustain",
    name: "Predador persistente",
    role: "flank",
    items: ["garra", "mocassins", "amuleto"],
    text: "Ganha velocidade enquanto luta e cura a cada ataque.",
  },
  {
    id: "flank-magic",
    name: "Ruptura do véu",
    role: "flank",
    items: ["corda", "vento", "lanca"],
    text: "Reduz resistência e ameaça habilidades da retaguarda.",
  },
  {
    id: "summon-open",
    name: "Chamado da ninhada",
    role: "summon",
    items: ["coroa", "colar-lua", "cajado-vida"],
    text: "Invoca cedo e sustenta os aliados com cada conjuração.",
  },
  {
    id: "summon-power",
    name: "Enxame do encanto",
    role: "summon",
    items: ["lanca", "coroa", "amuleto"],
    text: "Poder, mana inicial e proteção para conjurar novamente.",
  },
  {
    id: "summon-safe",
    name: "Teia resistente",
    role: "summon",
    items: ["pele-urso", "colar-lua", "escudo-totem"],
    text: "Sobrevivência e escudos para apoiar a formação.",
  },
];
/** Plans a transaction on copies. Existing equipment is returned before pieces are reserved. */
export function buildTransaction(
  era: number,
  inventory: string[],
  equipped: string[],
  ids: string[],
) {
  const bag = [...inventory, ...equipped];
  let cost = 0;
  for (const id of ids) {
    const d = itemById(id);
    if (!d || d.kind !== "item" || (d.era && d.era > era)) return null;
    const found = bag.indexOf(id);
    if (found >= 0) {
      bag.splice(found, 1);
      continue;
    }
    if (d.price) {
      cost += d.price;
      continue;
    }
    if (!d.recipe) return null;
    for (const component of d.recipe) {
      const i = bag.indexOf(component);
      if (i >= 0) bag.splice(i, 1);
      else cost += componentCost(era);
    }
  }
  return { bag, cost, items: [...ids] };
}
export const buildPieces = (ids: string[]) =>
  ids
    .flatMap((id) => itemById(id)?.recipe ?? [])
    .map((id) => COMPONENTS.find((c) => c.id === id)!);
