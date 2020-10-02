require('./tools/rig/.eslintrc')
module.exports = {
  plugins: ['codegen'],
  ignorePatterns: ['!.github'],
  parserOptions: {
    extraFileExtensions: ['.yml'],
  },
  rules: {
    'codegen/codegen': 'error',
  }
}
