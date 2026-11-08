import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts"],
    // Needs a build: run with `npm run check:package` (vitest.package.config.ts)
    exclude: ["test/package.test.ts"],
    // Type-level tests of the public API (test/*.test-d.ts), checked with tsc
    typecheck: {
      enabled: true,
      include: ["test/**/*.test-d.ts"],
    },
    benchmark: {
      include: ["bench/**/*.bench.ts"],
    },
  },
});
