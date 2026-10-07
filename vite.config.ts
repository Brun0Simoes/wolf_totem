import { defineConfig } from 'vite';
import { existsSync, mkdirSync, copyFileSync, readdirSync, createReadStream, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Preserve originals in chars; copy assets verbatim for the deployable bundle.
export default defineConfig({
  // Relative paths let the same build run at the site root or under a subpath such as GitHub Pages.
  base: './',
  plugins: [{name:'wolf-asset-metadata',enforce:'pre',resolveId(id){if(id==='virtual:wolf-animations'||id==='virtual:wolf-environment')return '\0'+id;},load(id){
    if(id==='\0virtual:wolf-animations'){
      const read=(dirs:string[])=>dirs.flatMap(dir=>readdirSync(dir).filter(name=>name.endsWith('.json')).sort().map(name=>{const path=resolve(dir,name);this.addWatchFile(path);return JSON.parse(readFileSync(path,'utf8'));}));
      return `export const heroes=${JSON.stringify(read(['public/assets/animations/v2','public/assets/animations/v3']))};export const summons=${JSON.stringify(read(['public/assets/animations/summons']))};`;
    }
    if(id==='\0virtual:wolf-environment'){
      const read=(name:string)=>{const path=resolve('public/assets/environment',name+'.json');this.addWatchFile(path);return readFileSync(path,'utf8');};
      return `export const props=${read('village-props')};export const fx=${read('combat-fx')};`;
    }
  }},{ name: 'character-assets', configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const match = req.url?.match(/^\/chars\/([A-Za-z]+-[123]star\.png)(?:\?.*)?$/);
      if (!match || !existsSync(resolve('chars', match[1]))) return next();
      res.setHeader('Content-Type', 'image/png');
      createReadStream(resolve('chars', match[1])).pipe(res);
    });
  }, closeBundle() {
    if (!existsSync('dist')) return;
    mkdirSync('dist/chars', { recursive: true });
    for (const name of readdirSync('chars')) if (name.endsWith('.png')) copyFileSync(resolve('chars', name), resolve('dist/chars', name));
  }}],
  build: { chunkSizeWarningLimit: 1600, rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } } },
});
