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
  // dist/ tem uma cópia do Prisma Client gerado (copy-generated.mjs); sem isto
  // o haste map do jest reclama de package.json duplicado depois de um build
  modulePathIgnorePatterns: ['<rootDir>/dist'],
}

export default config
