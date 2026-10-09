import { itemById } from "../game/items";
const paths: Record<string, string> = {
  presa: "M18 11 Q39 14 37 27 Q35 39 18 46 Q27 30 18 11",
  arco: "M15 12 Q47 28 15 45 M15 12 L15 45 M10 29 H43 M38 24 L43 29 L38 34",
  couro:
    "M13 13 L24 17 L31 13 L42 20 L38 33 L43 41 L30 46 L21 42 L12 45 L16 30 Z",
  manto: "M22 12 H34 L42 44 H14 Z M22 12 L28 24 L34 12 M28 24 V44",
  pena: "M16 44 L39 13 Q46 13 43 23 L35 34 L24 37 M23 34 L23 23 M29 27 L37 26 M34 20 L41 20",
  raiz: "M28 12 V29 M28 24 L16 18 M28 24 L40 18 M28 29 L17 40 L12 41 M28 29 L37 41 L44 42 M28 29 V46",
  obsidiana: "M14 44 L35 10 L42 18 L22 43 Z M18 32 L31 38",
  garra: "M13 38 L21 14 L25 34 L31 12 L33 34 L41 16 L43 38 Z",
  espinhos:
    "M16 17 L28 12 L40 17 V30 Q39 40 28 45 Q17 40 16 30 Z M12 20 L6 17 M44 20 L50 17 M13 30 L6 33 M43 30 L50 33",
  talisma: "M16 14 Q28 34 40 14 M28 27 L36 37 L28 46 L20 37 Z",
  lanca: "M16 45 L37 12 M31 17 L37 8 L43 15 L38 22 Z",
  machado: "M19 45 L34 12 M27 17 Q39 8 46 20 L34 29 Z",
  tempestade: "M14 12 Q43 28 14 45 M14 12 L14 45 M23 18 L31 26 L25 29 L34 40",
  vento: "M15 22 Q30 10 42 22 M12 29 Q34 17 45 29 M15 37 Q30 25 42 37",
  corda:
    "M16 14 Q42 12 40 28 Q39 45 21 42 Q10 39 16 28 Q22 18 32 24 Q41 33 31 37",
  flauta: "M16 43 L39 12 L44 17 L21 48 Z M24 34 H25 M29 27 H30 M34 20 H35",
  mocassins: "M18 13 H29 V30 L40 35 Q47 44 36 45 H14 V35 L18 30 Z",
  carapaca:
    "M28 10 L43 19 V34 L28 46 L13 34 V19 Z M28 10 V46 M13 19 L43 34 M43 19 L13 34",
  "pele-urso":
    "M19 16 L16 10 L25 14 H31 L40 10 L37 18 L43 33 L37 43 H19 L13 33 Z M22 24 H23 M33 24 H34 M24 34 H32",
  "escudo-totem":
    "M14 13 H42 V31 Q38 43 28 47 Q18 43 14 31 Z M20 22 L28 29 L36 22 M28 29 V38",
  muralha:
    "M13 18 H43 V42 H13 Z M13 26 H43 M13 34 H43 M23 18 V26 M35 26 V34 M23 34 V42",
  "veu-coruja":
    "M15 16 L20 11 L28 18 L36 11 L41 16 V35 L28 46 L15 35 Z M18 26 A5 5 0 1 0 28 26 A5 5 0 1 0 18 26 M28 26 A5 5 0 1 0 38 26 A5 5 0 1 0 28 26",
  "colar-lua":
    "M14 13 Q28 33 42 13 M32 29 Q21 30 22 40 Q24 49 35 43 Q28 39 32 29",
  amuleto: "M16 13 Q28 29 40 13 M28 24 L39 35 L28 47 L17 35 Z M28 31 V40",
  coroa: "M13 37 L11 17 L21 27 L28 11 L35 27 L45 17 L43 37 Z M13 43 H43",
  "cajado-vida":
    "M20 46 L32 20 M32 20 Q21 13 29 8 Q41 5 44 15 Q42 25 32 20 M18 23 L27 29",
  carvalho:
    "M28 16 Q13 8 11 23 Q3 35 22 36 M28 16 Q43 8 45 23 Q53 35 34 36 M28 23 V45 M21 45 H36",
  "dente-eclipse":
    "M16 12 Q42 12 36 30 L18 45 L25 28 Z M40 11 A8 8 0 0 0 43 27",
  "orbe-aurora":
    "M28 15 A13 13 0 1 0 28 41 A13 13 0 1 0 28 15 M28 8 V12 M28 44 V48 M8 28 H12 M44 28 H48 M23 23 L33 33 M33 23 L23 33",
  "egide-tronco":
    "M14 13 H42 V31 L28 46 L14 31 Z M28 18 V38 M20 23 L28 29 L36 23",
  "asa-tempestade":
    "M12 37 Q15 12 45 14 L37 21 L42 24 L31 29 L33 33 L20 39 Z M18 35 L35 21",
  "raiz-luz": "M28 11 V38 M16 19 L28 28 L40 19 M15 44 L28 35 L41 44 M22 12 H34",
  "coroa-inverno":
    "M12 39 L10 17 L21 27 L28 10 L35 27 L46 17 L44 39 Z M13 44 H43 M28 24 V37 M23 28 L33 33 M33 28 L23 33",
};
export function itemGlyph(id: string): string {
  const d = itemById(id);
  return `<svg class="item-art" viewBox="0 0 56 56" role="img" aria-label="${d?.name ?? "Item"}" style="--item:${d?.color ?? "#d8b273"}"><circle cx="28" cy="28" r="25" fill="currentColor" opacity=".08"/><circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" opacity=".25"/><path d="${paths[id] ?? paths.presa}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
