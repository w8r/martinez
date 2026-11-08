import { defineConfig } from "vitest/config";

// The packed-package test (test/package.test.ts) only: it needs a build and
// installs the tarball, so it is not part of `npm test`.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/package.test.ts"],
    testTimeout: 60_000,
  },
});
