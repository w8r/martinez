import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const isDemo = mode === "demo";

  if (isDemo) {
    // Demo build configuration
    return {
      root: "demo",
      base: "./",
      build: {
        outDir: "../dist/demo",
        emptyOutDir: true,
        rollupOptions: {
          input: {
            main: resolve(__dirname, "demo/index.html"),
            orthogonal: resolve(__dirname, "demo/orthogonal.html"),
          },
        },
      },
    };
  }

  // Library build configuration
  return {
    plugins: [
      dts({
        include: ["src/**/*", "index.ts"],
        exclude: ["test/**/*", "demo/**/*", "bench/**/*"],
        rollupTypes: true,
        bundledPackages: ["robust-predicates", "splaytree", "tinyqueue"],
      }),
    ],
    build: {
      lib: {
        entry: resolve(__dirname, "index.ts"),
        name: "martinez",
        formats: ["es", "cjs", "umd"],
        fileName: (format) => {
          if (format === "es") return "martinez.js";
          if (format === "cjs") return "martinez.cjs";
          return `martinez.${format}.js`;
        },
      },
      rollupOptions: {
        external: ["robust-predicates", "splaytree", "tinyqueue"],
      },
    },
  };
});
