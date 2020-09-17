module.exports = {
  preset: 'ts-jest',
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
    '!**/coverage/**',
    '!*.config.js',
  ],
}
