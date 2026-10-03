/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // `three` and `three/webgpu` are two separate prebuilt bundles, each with its own copy of the core classes.
  // Importing both would ship the core twice and break `instanceof` across the seam, so every bare `three`
  // import resolves to the WebGPU build — it re-exports the whole core, and is the only build with
  // WebGPURenderer (the classic WebGLRenderer is not in it).
  resolve: { alias: [{ find: /^three$/, replacement: 'three/webgpu' }] },
  build: {
    chunkSizeWarningLimit: 1500, // three.js is big; it is one cached vendor chunk
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});
