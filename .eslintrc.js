module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {ecmaVersion: 2018, sourceType: 'module'},
  plugins: [
    '@typescript-eslint/eslint-plugin',
    'prettier',
    'codegen'
  ],
  ignorePatterns: ['dist', 'node_modules'],
  rules: {
    'prettier/prettier': ['warn', require('./.prettierrc')],
    'codegen/codegen': ['warn', {presets: {badges: require('./scripts/badges')}}],
  },
}
