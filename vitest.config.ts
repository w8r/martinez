import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // Type-level tests of the public API (test/*.test-d.ts), checked with tsc
    typecheck: {
      enabled: true,
      include: ['test/**/*.test-d.ts'],
    },
    benchmark: {
      include: ['bench/**/*.bench.ts']
    }
  }
});