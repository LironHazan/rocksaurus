/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

/** `vite build --mode public` (`npm run build:public`): the site GitHub Pages serves, the watch player only. */
const PUBLIC_MODE = 'public';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: [
      // `three` and `three/webgpu` are two separate prebuilt bundles, each with its own copy of the core classes.
      // Importing both would ship the core twice and break `instanceof` across the seam, so every bare `three`
      // import resolves to the WebGPU build — it re-exports the whole core, and is the only build with
      // WebGPURenderer (the classic WebGLRenderer is not in it).
      { find: /^three$/, replacement: 'three/webgpu' },
      // The public site is built from the player alone: the studio's code is never even imported.
      ...(mode === PUBLIC_MODE
        ? [
            {
              find: /^\.\/app\/Root$/,
              replacement: fileURLToPath(new URL('./src/app/Root.public.ts', import.meta.url)),
            },
          ]
        : []),
    ],
  },
  build: {
    chunkSizeWarningLimit: 1500, // three.js is big; it is one cached vendor chunk
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'tools/oxlint/rocksaurus/**/*.test.ts'], // e2e/ is Playwright's
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
}));
