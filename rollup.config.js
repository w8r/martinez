import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
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

module.exports = [
  {
    input: './src/index.ts',
    output: {
      file: 'dist/index.js',
      name: 'martinez',
      sourcemap: true,
      format: 'umd',
      banner
    },
    plugins: [
      resolve(), // so Rollup can find external libs
      commonjs(), // so Rollup can convert commonJS to an ES module
      typescript({
        useTsconfigDeclarationDir: true
      })
    ]
  },
  {
    input: './src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      name: 'martinez',
      sourcemap: true,
      format: 'esm',
      banner
    },
    plugins: [
      resolve(), // so Rollup can find external libs
      commonjs(), // so Rollup can convert commonJS to an ES module
      typescript({
        useTsconfigDeclarationDir: true
      })
    ]
  },
  {
    input: './src/index.ts',
    output: {
      file: 'dist/index.min.js',
      name: 'martinez',
      sourcemap: true,
      format: 'umd',
      banner
    },
    plugins: [
      resolve(), // so Rollup can find external libs
      commonjs(), // so Rollup can convert commonJS to an ES module
      typescript({
        useTsconfigDeclarationDir: true
      }),
      terser()
    ]
  },
  {
    input: 'web/index.ts',
    output: {
      file: 'web/index-bundle.js',
      format: 'iife',
      globals: {
        leaflet: 'L',
        jsts: 'jsts'
      }
    },
    external: ['jsts', 'leaflet', 'leaflet-editable'],
    plugins: [
      resolve(), // so Rollup can find external libs
      commonjs(), // so Rollup can convert commonJS to an ES module
      typescript({ tsconfig: 'web/tsconfig.json' })
    ]
  }
];
