import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import buble from '@rollup/plugin-buble';
import { terser } from "rollup-plugin-terser";
import { version, author, license, description } from './package.json';

const name = 'martinez';

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

module.exports = [{
  input: './index.js',
  output: {
    file: `dist/${name}.umd.js`,
    name: 'martinez',
    sourcemap: true,
    format: 'umd',
    banner
  },
  plugins: [
    resolve(),  // so Rollup can find external libs
    commonjs(), // so Rollup can convert commonJS to an ES module
    buble()
  ]
},
{
  input: './index.js',
  output: {
    file: `dist/${name}.umd.min.js`,
    name: 'martinez',
    format: 'umd',
    banner
  },
  plugins: [
    resolve(),
    commonjs(),
    buble(),
    terser()
  ]
}
// {
//   input: 'demo/js/index.js',
//   output: {
//     file: 'demo/js/bundle.js',
//     format: 'iife',
//     globals: {
//       leaflet: 'L',
//       jsts: 'jsts'
//     }
//   },
//   external: ['jsts', 'leaflet'],
//   plugins: [
//     resolve(),  // so Rollup can find external libs
//     commonjs(), // so Rollup can convert commonJS to an ES module
//     buble()
//   ]
// }
];
