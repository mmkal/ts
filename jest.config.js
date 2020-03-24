module.exports = {
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
