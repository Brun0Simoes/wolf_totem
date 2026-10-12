import type { CombatEntity } from './simulation';
import type { ObjectiveKind } from './crossings';

export interface BattleObjective {
  kind:ObjectiveKind; title:string; limit:number; ids:string[];
  directive:'guard'|'focus'|'balanced'; telegraph:number; hazard:number;
  warning:string; resolved:boolean;
  sourceId?:string;
}
export function createObjective(kind:ObjectiveKind,directive:BattleObjective['directive']):BattleObjective {
  return {kind,title:kind==='altar'?'Proteja o altar':'Rompa os três selos',limit:kind==='altar'?45:65,
    ids:kind==='altar'?['objective-altar']:['objective-seal-1','objective-seal-2','objective-seal-3'],
    directive,telegraph:0,hazard:12,warning:'',resolved:false};
}
/** Returns early objective outcomes; ordinary combat still handles army defeat. */
export function objectiveOutcome(o:BattleObjective,entities:CombatEntity[],time:number):boolean|null {
  const structures=entities.filter(e=>o.ids.includes(e.id));
  if(o.kind==='altar'){
    if(!structures.some(e=>e.hp>0))return false;
    if(time>=o.limit)return true;
  }else{
    if(structures.length===3&&structures.every(e=>e.hp<=0))return true;
    if(time>=o.limit)return false;
  }return null;
}
export function objectiveAdvice(kind:ObjectiveKind):{name:string;icon:string;text:string}[] {
  return kind==='altar'?[
    {name:'Cobrir os flancos',icon:'shield',text:'Coloque Guardiões na frente, separados. Os invasores procuram o altar quando chegam perto.'},
    {name:'Sustentar a defesa',icon:'heart',text:'Cura e escudos também alcançam o altar. Itens de proteção ajudam a segurar a passagem.'},
    {name:'Interromper a ameaça',icon:'zap',text:'Use controle e o poder espiritual durante o aviso de impacto, a cada 12 segundos.'},
  ]:[
    {name:'Priorizar os selos',icon:'crosshair',text:'O plano Romper selos dirige aliados às estruturas. Ataques à distância abrem a passagem mais cedo.'},
    {name:'Preservar a retaguarda',icon:'shield',text:'Tanques recebem a pressão dos guardiões enquanto conjuradores alcançam os selos.'},
    {name:'Responder à conjuração',icon:'zap',text:'Selos vivos emitem uma onda anunciada. Destrua-os para reduzir a ameaça.'},
  ];
}
