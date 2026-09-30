import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";
import { copyFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { join } from "path";

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

  // Library build configuration
  return {
    plugins: [
      dts({
        include: ["src/**/*", "index.ts", "types/**/*"],
        exclude: ["test/**/*", "demo/**/*", "bench/**/*"],
        rollupTypes: true,
        bundledPackages: ["robust-predicates", "splaytree", "tinyqueue"],
      }),
    ],
    build: {
      lib: {
        entry: resolve(import.meta.dirname, "index.ts"),
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
