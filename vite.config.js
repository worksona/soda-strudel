import { defineConfig } from 'vite';

// a per-build id: data URLs carry it, so no older cache can answer for them
const BUILD = Date.now().toString(36);

export default defineConfig({
  define: { __BUILD__: JSON.stringify(BUILD) },
  build: { target: 'es2022', chunkSizeWarningLimit: 4000 },
  esbuild: { target: 'es2022' },
  optimizeDeps: { esbuildOptions: { target: 'es2022' } },
});
