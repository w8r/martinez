import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*', 'index.ts'],
      exclude: ['test/**/*', 'demo/**/*'],
      rollupTypes: true,
      bundledPackages: ['robust-predicates', 'splaytree', 'tinyqueue']
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'martinez',
      formats: ['es', 'cjs'],
      fileName: (format) => {
        if (format === 'es') return 'martinez.js';
        if (format === 'cjs') return 'martinez.cjs';
        return `martinez.${format}.js`;
      }
    },
    rollupOptions: {
      external: ['robust-predicates', 'splaytree', 'tinyqueue']
    }
  },
  test: {
    globals: true,
    environment: 'node'
  }
});