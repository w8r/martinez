import { defineConfig, type Plugin } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";
import { copyFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { join } from "path";

// Rolldown marks every source module in unminified output (the ES build) with
// "//#region src/<file>.ts" ... "//#endregion": noise in a published bundle
const stripRegionComments = (): Plugin => ({
  name: "strip-region-comments",
  renderChunk: (code) => code.replace(/^\/\/#(?:end)?region\b.*\n/gm, ""),
});

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
            main: resolve(import.meta.dirname, "demo/index.html"),
            playground: resolve(import.meta.dirname, "demo/playground.html"),
            editor: resolve(import.meta.dirname, "demo/editor.html"),
            orthogonal: resolve(import.meta.dirname, "demo/orthogonal.html"),
            cases: resolve(import.meta.dirname, "demo/cases.html"),
          },
        },
      },
      plugins: [
        {
          name: "copy-fixtures",
          closeBundle() {
            const fixturesSource = resolve(import.meta.dirname, "test/fixtures");
            const fixturesDest = resolve(import.meta.dirname, "dist/demo/fixtures");

            // Create destination directory
            mkdirSync(fixturesDest, { recursive: true });

            // Copy all files from fixtures
            const files = readdirSync(fixturesSource);
            files.forEach((file) => {
              const sourcePath = join(fixturesSource, file);
              const destPath = join(fixturesDest, file);

              if (statSync(sourcePath).isFile()) {
                copyFileSync(sourcePath, destPath);
                console.log(`Copied fixture: ${file}`);
              }
            });
          },
        },
      ],
    };
  }

  // Library build configuration. The CommonJS build is a second pass
  // (`vite build --mode cjs`) because it bundles tinyqueue: tinyqueue is
  // ESM-only, and required from CommonJS its default export comes out wrapped
  // in the module namespace ("is not a constructor"). The ES and UMD builds
  // keep it external.
  const isCjs = mode === "cjs";
  return {
    plugins: isCjs
      ? []
      : [
          dts({
            include: ["src/**/*", "index.ts", "types/**/*"],
            exclude: ["test/**/*", "demo/**/*", "bench/**/*"],
            rollupTypes: true,
            bundledPackages: ["robust-predicates", "splaytree", "tinyqueue"],
            // The same declarations for the CommonJS build: .d.ts would be read as ESM under "require"
            afterBuild: () => copyFileSync("dist/index.d.ts", "dist/index.d.cts"),
          }),
          stripRegionComments(),
        ],
    build: {
      // The second pass adds to the output of the first
      emptyOutDir: !isCjs,
      lib: {
        entry: resolve(import.meta.dirname, "index.ts"),
        name: "martinez",
        formats: isCjs ? ["cjs"] : ["es", "umd"],
        fileName: (format) => {
          if (format === "es") return "martinez.js";
          if (format === "cjs") return "martinez.cjs";
          return `martinez.${format}.js`;
        },
      },
      rollupOptions: {
        external: isCjs
          ? ["robust-predicates", "splaytree"]
          : ["robust-predicates", "splaytree", "tinyqueue"],
        output: {
          // Browser globals of the dependencies, for the UMD build
          globals: {
            "robust-predicates": "predicates",
            splaytree: "SplayTree",
            tinyqueue: "TinyQueue",
          },
        },
      },
    },
  };
});
