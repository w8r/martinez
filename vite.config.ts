import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

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
