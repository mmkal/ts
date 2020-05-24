module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*/*.test.ts'],
  setupFiles: ['<rootDir>/scripts/badges'],
  setupFilesAfterEnv: ['jest-inline-snapshots/register'],
  reporters: ['default', 'jest-inline-snapshots/reporter'],
  collectCoverageFrom: [
    '**/*.{ts,js}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/scripts/**',
    '!**/coverage/**',
    '!*.config.js',
  ],
}
