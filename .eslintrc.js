module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {ecmaVersion: 2018, sourceType: 'module'},
  plugins: [
    '@typescript-eslint/eslint-plugin',
    'prettier',
    'local',
  ],
  rules: {
    'prettier/prettier': ['warn', require('./.prettierrc.json')],
    'local/codegen': 'error',
  },
}
