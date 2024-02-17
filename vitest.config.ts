import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/*.test.ts"],
    // browser: {
    //   provider: "playwright",
    //   enabled: true,
    //   name: "chromium",
    // },
    coverage: {
      provider: "istanbul",
      reportsDirectory: "reports/coverage",
    },
  },
});
