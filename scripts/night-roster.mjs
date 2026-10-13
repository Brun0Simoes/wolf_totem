import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
const cache=new Map();
function load(file){
  file=path.resolve(file);if(cache.has(file))return cache.get(file);
  const context={exports:{},require:(name)=>load(path.resolve(path.dirname(file),name+'.ts'))};
  cache.set(file,context.exports);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,context,{filename:file});return context.exports;
}
export const {nocturneCharacters,NIGHT_PROFILES}=load('src/data/nocturne.ts');
fs.writeFileSync('docs/production/night/roster.json',JSON.stringify(nocturneCharacters,null,2)+'\n');
console.log(JSON.stringify({characters:nocturneCharacters.length,profiles:NIGHT_PROFILES.size}));
