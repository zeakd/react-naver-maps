import babel from '@rollup/plugin-babel';
// import resolve from '@rollup/plugin-node-resolve';
// import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';

const peerDependencies = Object.keys(pkg.peerDependencies || {});
const dependencies = Object.keys(pkg.dependencies || {});
const external = peerDependencies.concat(dependencies);

console.log('external', external);

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
      // resolve({ extensions }),
      // commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      babel({
        babelHelpers: 'bundled',
        extensions,
        presets: [
          '@babel/preset-env',
          // '@babel/preset-typescript',
          // '@babel/preset-react',
        ],
        // plugins: ['babel-plugin-typescript-to-proptypes'],
      }),
    ],
  },
];

// import typescript from '@rollup/plugin-typescript';

// import pkg from './package.json';

// export default [
//   {
//     input: './src/index.ts',
//     output: [
//       {
//         file: pkg.main,
//         format: 'cjs',
//       },
//       {
//         file: pkg.module,
//         format: 'es',
//       },
//     ],
//     plugins: [typescript({ tsconfig: './tsconfig.json' })],
//     external: [...Object.keys(pkg.dependencies)],
//   },
// ];
