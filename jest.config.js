module.exports = {
  transform: {
    '^.+\\.tsx?$': '<rootDir>/tools/rig/node_modules/ts-jest',
  },
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  testEnvironment: 'node',
  testMatch: ['**/*/*.test.ts'],
  collectCoverageFrom: [
    '**/*.{ts,js}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/scripts/**',
    '!common/**', // rush files
    '!tools/rig/*.js', // todo: tests. this package is internal-only, for now
    '!**/coverage/**',
    '!**/*.config.js',
    '!**/.prettierrc.js',
    '!**/.eslintrc.js',
  ],
}
