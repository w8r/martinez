
import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';
import noderesolve from 'rollup-plugin-node-resolve';
import buble from 'rollup-plugin-buble';

import {
  version, author,
  module as esmBundle,
  main as umdBundle,
  name, license, description
} from './package.json';

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

export default [{
  input: './src/index.ts',
  output: {
    name, banner,
    format: 'es',
    file: esmBundle,
    sourcemap: true
  },
  plugins: [
    noderesolve(),
    typescript({ 
    outDir: "dist",
    tsconfigOverride: {
      compilerOptions: {
        module: "ES2015"
      }
    }}),
    buble({ exclude: ["**/*.ts"] })
  ]
}, {
  input: './src/index.ts',
  output: {
    name, banner,
    format: 'umd',
    file: umdBundle,
    sourcemap: true
  },
  plugins: [
    noderesolve(),
    typescript({
      tsconfigOverride: {
        compilerOptions: { 
          target: 'es5',
          module: 'ES2015'
        }
      }
    }),
    buble({ exclude: ["**/*.ts"] })
  ]
}, {
  input: './demo/js/index.js',
  output: {
    name, banner,
    format: 'umd',
    file: './demo/js/bundle.js',
    sourcemap: true,
    globals: {
      leaflet: 'L'
    }
  },
  plugins: [commonjs()],
  external: ["leaflet"],
}];
