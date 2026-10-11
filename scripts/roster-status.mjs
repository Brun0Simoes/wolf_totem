import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(resolve(root, 'src/data/characters.ts'), 'utf8');
const start = source.indexOf('export const characters: Character[] = ') + 'export const characters: Character[] = '.length;
const characters = JSON.parse(source.slice(start, source.lastIndexOf('];') + 1));
const nightCharacters=JSON.parse(readFileSync(resolve(root,'docs/production/night/roster.json'),'utf8'));
characters.push(...nightCharacters);
const manifests = ['v2', 'v3', 'night'].flatMap(version => {
  const dir = resolve(root, 'public/assets/animations', version);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(n => n.endsWith('.json')).map(name => JSON.parse(readFileSync(resolve(dir, name), 'utf8')));
});
const keys = new Set(manifests.filter(s => existsSync(resolve(root, 'public', s.image.slice(1)))).map(s => `${s.characterId}:${s.stars ?? 1}`));
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
const summary = {characters:108, charactersWithAnimation:rows.filter(r=>r.stages.some(Boolean)).length, animatedStages:keys.size, targetStages:324, completeCharacters:finished, paintedStages:165, illustratedNightStages:159, motion:"night figures use programmed motion and supernatural auras", missing:absent, animatedSummons:summons.length-missingSummons.length, targetSummons:summons.length, missingSummons};
console.log(JSON.stringify(process.argv.includes('--complete') ? summary : {...summary,missing:absent.length},null,2));
if(process.argv.includes('--write')) {
  mkdirSync(resolve(root,'docs/production'),{recursive:true});
  const lines=['# Estado da produção de arte','',`Formas disponíveis: **${keys.size}/324**. Personagens com as três formas: **${finished}/108**.`, '', '**55 primais:** 165 atlas pintados, com quatro poses por sequência de repouso, caminhada e ataque/conjuração. Impacto, queda e vitória usam movimentos programados.', '', '**53 sobrenaturais:** 53 ilustrações transparentes, com 159 registros de estrelas. Repouso, caminhada, ataque, habilidade, impacto, queda e vitória usam movimento programado; as estrelas mudam as auras. Não são 159 desenhos distintos nem animações desenhadas quadro a quadro.','','| ID | Personagem | Era | 1★ | 2★ | 3★ |','| --- | --- | --- | --- | --- | --- |',...rows.map(r=>`| ${r.id} | ${r.name} | ${r.cost} | ${r.stages.map(s=>s?(r.id>=101?'Ilustração + movimento':'Atlas pintado'):'Pendente').join(' | ')} |`),'','Gerado por `npm run roster:status -- --write`. Os arquivos prontos são entregas de protótipo e continuam sujeitos a refinamento artístico.',''];
  lines.splice(lines.length-2,0,'## Criaturas invocadas','', '| Criatura | Atlas animado |','| --- | --- |',...summons.map(s => `| ${summonNames[s.kind]} | ${s.ready ? 'Pronto' : 'Pendente'} |`),'');
  writeFileSync(resolve(root,'docs/production/STATUS.md'),lines.join('\n'));
}
if(process.argv.includes('--complete') && (absent.length || missingSummons.length)) process.exitCode=1;
