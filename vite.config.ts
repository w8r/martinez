import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const {
  name,
  version,
  author,
  license,
  description,
} = require("./package.json");

const banner = `\
/**
 * ${name} v${version}
 * ${description}
 *
 * @author ${author}
 * @license ${license}
 * @preserve
 */
`;

export default defineConfig({
  plugins: [
    dts({
      outDir: "dist/types",
      entryRoot: "src",
      exclude: ["**/*.test.ts"],
    }),
  ],
  publicDir: false,
  // server: {
  //   port: 3000,
  //   watch: {
  //     usePolling: true,
  //   },
  // },
  build: {
    target: "esnext",
    minify: true,
    rollupOptions: {
      output: { banner },
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: "/src/index.ts",
      name: "martinez",
      formats: ["cjs", "es", "umd"],
      // the proper extensions will be added
      fileName: "index",
    },
  },
});
