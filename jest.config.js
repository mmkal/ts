module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*/*.test.ts'],
  setupFilesAfterEnv: ['jest-inline-snapshots/register'],
  collectCoverageFrom: [
    '**/*.{ts,js}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/scripts/**',
    '!**/coverage/**',
    '!*.config.js',
  ],
}
