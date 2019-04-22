
import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

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
  input: './index.ts',
  output: {
    name, banner,
    format: 'es',
    file: esmBundle,
    sourcemap: true
  },
  plugins: [
    resolve(),  // so Rollup can find external libs,
    typescript({ outDir: "dist" })]
}, {
  input: './index.ts',
  output: {
    name, banner,
    format: 'umd',
    file: umdBundle,
    sourcemap: true
  },
  plugins: [
    resolve(),  // so Rollup can find external libs
    typescript({
    tsconfigOverride: {
      compilerOptions: { outDir: "dist", target: 'es5' }
    }
  })]
}, {
  input: 'demo/js/index.js',
  output: {
    file: 'demo/js/bundle.js',
    format: 'iife',
    globals: {
      leaflet: 'L',
      jsts: 'jsts'
    },
    sourcemap: true
  },
  external: ['jsts', 'leaflet'],
  plugins: [
    resolve(),  // so Rollup can find external libs
    commonjs(), // so Rollup can convert commonJS to an ES module
  ]
}];
