
import typescript from 'rollup-plugin-typescript2';

import {
  version, author,
  module as esmBundle,
  main as umdBundle,
  name, license, description
} from './package.json';

const banner = `\
/**
 * ${moduleName} v${version}
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
  plugins: [typescript({ outDir: "dist" })]
}, {
  input: './src/index.ts',
  output: {
    name, banner,
    format: 'umd',
    file: umdBundle,
    sourcemap: true
  },
  plugins: [typescript({
    tsconfigOverride: {
      compilerOptions: { outDir: "dist", target: 'es5' }
    }
  })]
}, {
  input: './demo/js/index.js',
  output: {
    name, banner,
    format: 'umd',
    file: umdBundle,
    sourcemap: true
  },
  plugins: [])
}];
