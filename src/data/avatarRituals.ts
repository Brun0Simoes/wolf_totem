import type { Practice,PracticeId } from '../game/tribe';
export const AVATAR_RITES:PracticeId[]=['air-discipline','water-flow','earth-root','fire-breath','warrior-path','spirit-balance','avatar-convergence'];
const rite=(id:PracticeId,name:string,text:string,effect:string,era=1,minLevel=2,max=3):Practice=>({id,name,native:'treino do domínio',peoples:'Quatro Nações · cerimônia fictícia adaptada para Wolf Totem',text,effect,era,minLevel,max,rest:0});
export const AVATAR_PRACTICES:Practice[]=[
 rite('air-discipline','Disciplina do Ar','Controle o sopro e encontre três janelas de vento. Um treino simbólico inspirado na disciplina dos Nômades do Ar.','+4% de velocidade de ataque por treino, até três bônus.'),
 rite('water-flow','Fluxo da Água','Conduza a corrente de luz dentro do percurso. O treino representa a adaptação e o fluxo da dobra da água.','+4% de poder de habilidade e +0,25 mana/s por treino, até três bônus.'),
 rite('earth-root','Raiz da Terra','Memorize os quatro pilares e repita a sequência. Firmeza e leitura do terreno orientam a prática.','+5% de vida e +6 armadura por treino, até três bônus.'),
 rite('fire-breath','Respiração do Fogo','Acompanhe oito pulsações da chama com disciplina. O treino representa controle e intenção.','+5% de ataque e +3% de poder por treino, até três bônus.'),
 rite('warrior-path','Caminho do Guerreiro','Repita a sequência de técnicas e equipamentos. Um caminho próprio para quem luta sem dobrar elementos.','+4% de ataque e +4 armadura por treino, até três bônus.'),
 rite('spirit-balance','Equilíbrio Espiritual','Encontre quatro janelas de foco para harmonizar corpo e espírito. Uma cerimônia imaginária de meditação.','+8 RM e +4% de poder por participação, até três bônus.'),
 rite('avatar-convergence','Convergência dos Elementos','Conduza a centelha entre os quatro elementos. O domínio marca a forma desperta dos Avatares.','+15% de poder e +15 mana inicial, uma vez por Avatar.',3,14,1),
];
