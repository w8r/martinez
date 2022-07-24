// vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      external: ['jsts', 'leaflet'],
      output: {
        inlineDynamicImports: true,
        format: 'iife',
        globals: {
          leaflet: 'L'
        }
      }
    },
    outDir: resolve(__dirname, '..', 'public'),
    emptyOutDir: true
  },
  publicDir: resolve(__dirname, 'data')
});
