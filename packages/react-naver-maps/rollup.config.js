import babel from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';

const peerDependencies = Object.keys(pkg.peerDependencies || {});
const dependencies = Object.keys(pkg.dependencies || {});
const external = peerDependencies.concat(dependencies);

const extensions = ['.ts', '.tsx'];

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
      },
      {
        file: pkg.module,
        format: 'es',
      },
    ],
    external,
    plugins: [
      typescript({ tsconfig: './tsconfig.json' }),
      babel({
        babelHelpers: 'bundled',
        extensions,
        presets: ['@babel/preset-env'],
      }),
    ],
  },
];
