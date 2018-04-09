// import resolve from 'rollup-plugin-node-resolve';
// import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel'
import pkg from './package.json';

const peerDependencies = Object.keys(pkg.peerDependencies);
const dependencies = Object.keys(pkg.dependencies);

export default [
	// // browser-friendly UMD build
	// {
  //   input: 'src/index.js',
  //   external,
	// 	output: {
	// 		name: '',
	// 		file: pkg.browser,
	// 		format: 'umd'
	// 	},
	// 	plugins: [
	// 		resolve(), // so Rollup can find `ms`
	// 		commonjs() // so Rollup can convert `ms` to an ES module
	// 	]
	// },
	{
		input: 'src/index.js',
    external: peerDependencies.concat(dependencies).concat(['uuid/v4', 'react-dom/server']),
    plugins: [
      babel({
        exclude: 'node_modules/**'
      }),
    ],
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' }
		]
	}
]