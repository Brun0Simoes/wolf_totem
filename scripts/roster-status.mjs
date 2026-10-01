import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(resolve(root, 'src/data/characters.ts'), 'utf8');
const start = source.indexOf('export const characters: Character[] = ') + 'export const characters: Character[] = '.length;
const characters = JSON.parse(source.slice(start, source.lastIndexOf('];') + 1));
const manifests = ['v2', 'v3'].flatMap(version => {
  const dir = resolve(root, 'public/assets/animations', version);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(n => n.endsWith('.json')).map(name => JSON.parse(readFileSync(resolve(dir, name), 'utf8')));
});
const keys = new Set(manifests.filter(s => existsSync(resolve(root, 'public', s.image.slice(1)))).map(s => `${s.characterId}:${s.stars ?? 1}`));
const rows = characters.map(c => ({ id:c.id, name:c.name, cost:c.cost, stages:[1,2,3].map(stars => keys.has(`${c.id}:${stars}`)) }));
const finished = rows.filter(r => r.stages.every(Boolean)).length;
const absent = rows.flatMap(r => r.stages.flatMap((ready,index) => ready ? [] : [`${r.name} ${index+1}★`]));
const summary = {characters:55, charactersWithAnimation:rows.filter(r=>r.stages.some(Boolean)).length, animatedStages:keys.size, targetStages:165, completeCharacters:finished, sequences:keys.size*3, poses:keys.size*12, missing:absent};
console.log(JSON.stringify(process.argv.includes('--complete') ? summary : {...summary,missing:absent.length},null,2));
if(process.argv.includes('--write')) {
  mkdirSync(resolve(root,'docs/production'),{recursive:true});
  const lines=['# Estado da produção de arte','',`Formas animadas: **${keys.size}/165**. Personagens com as três formas: **${finished}/55**.`, '', 'Cada forma tem repouso, caminhada e ataque/conjuração, com quatro poses por sequência. Impacto, queda e vitória usam movimentos programados.','','| ID | Personagem | Custo | 1★ | 2★ | 3★ |','| --- | --- | --- | --- | --- | --- |',...rows.map(r=>`| ${r.id} | ${r.name} | ${r.cost} | ${r.stages.map(s=>s?'Pronto':'Pendente').join(' | ')} |`),'','Gerado por `npm run roster:status -- --write`. Os arquivos prontos são entregas de protótipo e continuam sujeitos a refinamento artístico.',''];
  writeFileSync(resolve(root,'docs/production/STATUS.md'),lines.join('\n'));
}
if(process.argv.includes('--complete') && absent.length) process.exitCode=1;
