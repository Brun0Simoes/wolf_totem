import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import ts from 'typescript';
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const context={exports:{},require:name=>load(path.resolve(path.dirname(file),name+'.ts'))};cache.set(file,context.exports);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context,{filename:file});return context.exports;}
export const {avatarCharacters,AVATAR_PROFILES,AVATAR_DESIGNS}=load('src/data/avatar.ts');
fs.mkdirSync('docs/production/avatar',{recursive:true});
fs.writeFileSync('docs/production/avatar/roster.json',JSON.stringify(avatarCharacters,null,2)+'\n');
fs.writeFileSync('docs/production/avatar/designs.json',JSON.stringify(AVATAR_DESIGNS,null,2)+'\n');
console.log(JSON.stringify({characters:avatarCharacters.length,profiles:AVATAR_PROFILES.size,eras:[1,2,3,4,5].map(n=>avatarCharacters.filter(c=>c.cost===n).length),traits:Object.fromEntries([...new Set(avatarCharacters.flatMap(c=>c.traits))].map(t=>[t,avatarCharacters.filter(c=>c.traits.includes(t)).length]))}));
