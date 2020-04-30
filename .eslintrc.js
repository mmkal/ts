module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {ecmaVersion: 2018, sourceType: 'module', extraFileExtensions: ['.md']},
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
    'plugin:unicorn/recommended',
    'plugin:import/typescript',
    'plugin:jest/recommended',
    'xo',
    'xo-typescript',
  ],
  ignorePatterns: ['dist', 'node_modules', 'coverage'],
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
    '@typescript-eslint/semi': 'off',
    '@typescript-eslint/quotes': 'off',
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
    'unicorn/no-null': 'off',
    'unicorn/filename-case': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/prefer-regexp-exec': 'off',

    // covered by `@typescript-eslint/no-unsued-vars`
    'no-unused-vars': 'off',

    'no-warning-comments': 'off',
    'no-dupe-class-members': 'off',

    // Sindre Sorwho?
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/consistent-function-scoping': 'off',
    'unicorn/no-fn-reference-in-iterator': 'off',
    'unicorn/no-nested-ternary': 'off',
    'unicorn/new-for-builtins': 'off',
    'unicorn/throw-new-error': 'off',
    'unicorn/catch-error-name': 'off',
    'unicorn/prefer-trim-start-end': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/no-base-to-string': 'off',
  },
  overrides: [
    {
      files: ['**/*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      }
    },
    {
      files: ['**/*.md'],
      rules: {
        'unicorn/filename-case': 'off',
      }
    },
  ]
}
