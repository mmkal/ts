module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/node_modules/jest-inline-snapshots/register.js'],
  collectCoverageFrom: [
    '**/*.{ts,js}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/scripts/**',
    '!**/coverage/**',
    '!*.config.js',
  ],
}
