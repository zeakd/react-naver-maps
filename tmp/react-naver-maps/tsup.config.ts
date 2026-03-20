import { defineConfig } from 'tsup';
import pkgJson from './package.json';

const external = [...Object.keys(pkgJson.dependencies || {}), ...Object.keys(pkgJson.peerDependencies || {})];

export default defineConfig({
  entry: ['src/**/*.ts?(x)', '!src/**/*.(spec|test).ts?(x)'],
  format: ['cjs', 'esm'],
  external,
  dts: true,
  sourcemap: true,
});
