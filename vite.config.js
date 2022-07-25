// vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'martinez',
      fileName: (format) => `martinez.${format}.js`,
      formats: ['umd', 'cjs', 'esm']
    },
    target: 'es2015'
  },
  test: {
    dir: resolve(__dirname, 'test'),
    include: ['**/*.test.ts']
  },
  mode: 'development'
});
