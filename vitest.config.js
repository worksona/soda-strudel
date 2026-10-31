import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { defineConfig } from 'vitest/config';

// @kabelsalat/web (a dependency of @strudel/core) only exposes its ESM build via
// the "module" field, which Node-side resolution ignores. Point straight at it.
const fromCore = createRequire(createRequire(import.meta.url).resolve('@strudel/core/package.json'));
const kabelsalat = join(dirname(fromCore.resolve('@kabelsalat/web/package.json')), 'dist/index.mjs');

export default defineConfig({
  resolve: { alias: { '@kabelsalat/web': kabelsalat } },
  test: {
    environment: 'node',
    server: { deps: { inline: [/@strudel/, /@kabelsalat/, /superdough/] } },
  },
});
