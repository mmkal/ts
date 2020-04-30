module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {ecmaVersion: 2018, sourceType: 'module'},
  plugins: [
    '@typescript-eslint/eslint-plugin',
    'prettier',
    'codegen',
    'unicorn',
    'jest',
    'import',
  ],
  env: { 'jest/globals': true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    // 'plugin:unicorn/recommended',
    'plugin:import/typescript',
    'plugin:jest/recommended',
    'xo',
    // 'xo-typescript',
  ],
  ignorePatterns: ['dist', 'node_modules'],
  rules: {
    'prettier/prettier': ['warn', require('./.prettierrc')],
    'codegen/codegen': ['warn', {presets: {badges: require('./scripts/badges')}}],
    
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/prefer-readonly-parameter-types': 'off',	
    '@typescript-eslint/no-unsafe-member-access': 'off',	
    '@typescript-eslint/no-unsafe-call': 'off',	
    '@typescript-eslint/unified-signatures': 'off',

    '@typescript-eslint/no-unused-vars': ['error', {
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
      ignoreRestSiblings: true,
      args: 'after-used',
    }],

    // xo defaults that overlap with prettier
    'comma-dangle': 'off',
    'object-curly-spacing': 'off',
    'operator-linebreak': 'off',
    'no-mixed-spaces-and-tabs': 'off',
    '@typescript-eslint/indent': 'off',
    'indent': 'off',
    'semi': 'off',
    'quotes': 'off',
    'eol-last': 'off',
    'no-trailing-spaces': 'off',
    '@typescript-eslint/member-delimiter-style': 'off',
    'camelcase': 'off',

    'capitalized-comments': 'off',

    'jest/expect-expect': [
      'error',
      {assertFunctionNames: ['expect', 'expectTypeOf', 'expectLeft', 'expectRigh']}
    ],

    'no-else-return': ['warn', {allowElseIf: true}],

    '@typescript-eslint/camelcase': ['warn', {
      properties: 'never',
      ignoreDestructuring: true,
      ignoreImports: true,
    }],

    // maybe turn on later?
    'padding-line-between-statements': 'off',
    'lines-between-class-members': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/ban-ts-ignore': 'off',

    // covered by `@typescript-eslint/no-unsued-vars`
    'no-unused-vars': 'off',

    'no-warning-comments': 'off',
    'no-dupe-class-members': 'off',

    'unicorn/prevent-abbreviations': 'off',
    'unicorn/consistent-function-scoping': 'off',
  },
  overrides: [
    {
      files: ['**/*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      }
    }
  ]
}
