import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel'
import pkg from './package.json';

const peerDependencies = Object.keys(pkg.peerDependencies);
const dependencies = Object.keys(pkg.dependencies);

export default [
	{
		input: {
			'react-naver-maps': 'src/index.js',
			hocs: 'src/hocs/index.js',
		},
		experimentalCodeSplitting: true,
    external: peerDependencies.concat(dependencies),
    plugins: [
			babel({
				exclude: 'node_modules/**',
				runtimeHelpers: true,
			}),
			resolve(),	
    ],
		// output: [
		// 	{ file: pkg.main, format: 'cjs' },
		// 	{ file: pkg.module, format: 'es' }
		// ]
		output: [
			{
				dir: 'dist',
				format: 'cjs',
				entryFileNames: '[name].[format].js',
			},
			{
				dir: 'dist',
				format: 'esm',
				entryFileNames: '[name].[format].js',
			},
		]
	}
]