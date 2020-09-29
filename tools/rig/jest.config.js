module.exports = {
  transform: {
    '^.+\\.tsx?$': `${__dirname}/node_modules/ts-jest`,
  },
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  testEnvironment: 'node',
  testMatch: ['**/*/*.test.ts'],
  collectCoverageFrom: [
    'src/*.{ts,js}',
    'src/**/*.{ts,js}',
  ],
}
