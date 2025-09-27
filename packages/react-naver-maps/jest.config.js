/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  verbose: true,
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/test/**/?(*.)+(spec|test).[t]s?(x)',
    '**/?(*.)+(spec|test).[t]s?(x)',
  ],
  setupFilesAfterEnv: ['./test/setupTests.ts'],
};
