require('./tools/rig/.eslintrc')
module.exports = {
  plugins: ['codegen', 'prettier'],
  ignorePatterns: ['!.github'],
  parserOptions: {
    extraFileExtensions: ['.yml'],
  },
  rules: {
    'codegen/codegen': 'warn',
    'prettier/prettier': 'warn',
  },
}
