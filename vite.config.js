// vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'martinez',
      fileName: (format) => `martinez.${format}.js`
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'web/index.html'),
        orthogonal: resolve(__dirname, 'web/orthogonal.html')
      }
    }
  },
  test: {
    dir: resolve(__dirname, 'test'),
    include: ['**/*.test.ts']
  }
});
