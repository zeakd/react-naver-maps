/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/test/**/?(*.)+(spec|test).[t]s?(x)',
    '**/?(*.)+(spec|test).[t]s?(x)',
  ],
  setupFilesAfterEnv: ['./test/setupTests.ts'],
};
