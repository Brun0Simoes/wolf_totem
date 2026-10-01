import { defineConfig } from 'vite';
import { existsSync, mkdirSync, copyFileSync, readdirSync, createReadStream } from 'node:fs';
import { resolve } from 'node:path';

// Preserve originals in chars; copy assets verbatim for the deployable bundle.
export default defineConfig({
  plugins: [{ name: 'character-assets', configureServer(server) {
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
