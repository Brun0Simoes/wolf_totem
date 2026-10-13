import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(resolve(root, 'src/data/characters.ts'), 'utf8');
const start = source.indexOf('export const characters: Character[] = ') + 'export const characters: Character[] = '.length;
const characters = JSON.parse(source.slice(start, source.lastIndexOf('];') + 1));
const nightCharacters=JSON.parse(readFileSync(resolve(root,'docs/production/night/roster.json'),'utf8'));
characters.push(...nightCharacters);
const avatarCharacters=JSON.parse(readFileSync(resolve(root,'docs/production/avatar/roster.json'),'utf8'));characters.push(...avatarCharacters);
const manifests = ['v2', 'v3', 'night','avatar'].flatMap(version => {
  const dir = resolve(root, 'public/assets/animations', version);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(n => n.endsWith('.json')).map(name => JSON.parse(readFileSync(resolve(dir, name), 'utf8')));
});
const ready=manifests.filter(s=>existsSync(resolve(root,'public',s.image.slice(1)))&&(s.characterId<101||(!s.rigged&&s.frameRects?.length===6&&s.clips.cast?.length)));
const keys = new Set(ready.map(s => `${s.characterId}:${s.stars ?? 1}`));
const rows = characters.map(c => ({ id:c.id, name:c.name, cost:c.cost, stages:[1,2,3].map(stars => keys.has(`${c.id}:${stars}`)) }));
const finished = rows.filter(r => r.stages.every(Boolean)).length;
const absent = rows.flatMap(r => r.stages.flatMap((ready,index) => ready ? [] : [`${r.name} ${index+1}★`]));
const summonKinds = ['spider', 'crow', 'beetle', 'wolf', 'elephant'];
const summonNames = {spider:'Aranha',crow:'Corvo',beetle:'Escaravelho',wolf:'Lobo',elephant:'Elefante'};
const summonDirectory = resolve(root, 'public/assets/animations/summons');
const summons = summonKinds.map(kind => {
  const manifest = resolve(summonDirectory, kind + '.json');
  const sheet = existsSync(manifest) ? JSON.parse(readFileSync(manifest, 'utf8')) : undefined;
  return {kind, ready:!!sheet && sheet.summonId === kind && existsSync(resolve(root, 'public', sheet.image.slice(1)))};
});
const missingSummons = summons.filter(s => !s.ready).map(s => s.kind);
const summary = {characters:characters.length, charactersWithAnimation:rows.filter(r=>r.stages.some(Boolean)).length, animatedStages:keys.size, targetStages:characters.length*3, completeCharacters:finished, paintedPrimalStages:ready.filter(s=>s.characterId<101).length, paintedNightStages:ready.filter(s=>s.characterId>=101&&s.characterId<201).length, paintedAvatarStages:ready.filter(s=>s.characterId>=201).length, avatarDrawnPoses:ready.filter(s=>s.characterId>=201).length*6, nightDrawnPoses:ready.filter(s=>s.characterId>=101&&s.characterId<201).length*6, motion:"night: six drawn poses per stage; independent cast, two walk contacts and attack anticipation/release; impact, death and victory programmed", missing:absent, animatedSummons:summons.length-missingSummons.length, targetSummons:summons.length, missingSummons};
console.log(JSON.stringify(process.argv.includes('--complete') ? summary : {...summary,missing:absent.length},null,2));
if(process.argv.includes('--write')) {
  mkdirSync(resolve(root,'docs/production'),{recursive:true});
  const lines=['# Estado da produção de arte','',`Formas disponíveis: **${keys.size}/${characters.length*3}**. Personagens com as três formas: **${finished}/${characters.length}**.`, '', '**55 primais:** 165 atlas pintados, com quatro poses por sequência de repouso, caminhada e ataque/conjuração. Impacto, queda e vitória usam movimentos programados.', '', '**63 sobrenaturais:** 189 atlas com roupas, equipamentos e silhuetas próprias para 1★, 2★ e 3★. São 1.134 poses desenhadas: repouso, dois contatos de caminhada, preparação, golpe e gesto de habilidade. Caminhada alterna os contatos com a pose de passagem; ataque e habilidade têm quadros próprios. Respiração, recuperação, impacto, queda e vitória usam movimentos programados.','','**63 personagens de Avatar:** 189 atlas e 1.134 poses desenhadas, com três evoluções de roupa, equipamento e silhueta. Repouso, caminhada, preparação, golpe e conjuração usam quadros próprios; impacto, queda e vitória usam movimento programado.','','| ID | Personagem | Era | 1★ | 2★ | 3★ |','| --- | --- | --- | --- | --- | --- |',...rows.map(r=>`| ${r.id} | ${r.name} | ${r.cost} | ${r.stages.map(s=>s?(r.id>=101?'Atlas evolutivo':'Atlas pintado'):'Pendente').join(' | ')} |`),'','Gerado por `npm run roster:status -- --write`. Os arquivos prontos são entregas de protótipo e continuam sujeitos a refinamento artístico.',''];
  lines.splice(lines.length-2,0,'## Criaturas invocadas','', '| Criatura | Atlas animado |','| --- | --- |',...summons.map(s => `| ${summonNames[s.kind]} | ${s.ready ? 'Pronto' : 'Pendente'} |`),'');
  writeFileSync(resolve(root,'docs/production/STATUS.md'),lines.join('\n'));
}
if(process.argv.includes('--complete') && (absent.length || missingSummons.length)) process.exitCode=1;
