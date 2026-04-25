/** @type {import('jest').Config} */
const config = {
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2022',
          parser: { syntax: 'typescript' },
        },
        module: {
          type: 'es6',
        },
      },
    ],
  },
  testMatch: ['**/tests/**/*.test.ts'],
  setupFiles: ['./src/tests/setup.ts'],
}

export default config
