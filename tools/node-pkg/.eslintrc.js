require('@rushstack/eslint-config/patch/modern-module-resolution')

patchModuleResolver()

module.exports = {
  plugins: [
    '@typescript-eslint/eslint-plugin',
    'prettier',
    'codegen',
    'unicorn',
    'jest',
    'import',
  ],
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
  ignorePatterns: [
    'dist',
    'node_modules',
    'coverage',
    '.eslintrc.js', // getting Parsing error: "parserOptions.project" has been set for @typescript-eslint/parser. Can be handled with overrides but probably worth just waiting for https://github.com/eslint/rfcs/9 and ignoring js completely until then
    '!.github', // https://github.com/eslint/eslint/issues/8429#issuecomment-355967308
  ],
  parserOptions: {
    project: './tsconfig.json', // https://github.com/typescript-eslint/typescript-eslint/issues/967#issuecomment-530907956
    ecmaVersion: 2018,
    sourceType: 'module',
    extraFileExtensions: ['.md', '.yml'],
  },
  settings: {
    jest: {
      version: 26, // vscode extension can't find jest - "Error while loading rule 'jest/no-deprecated-functions': Unable to detect Jest version - please ensure jest package is installed, or otherwise set version explicitly"
    },
  },
  // parserOptions: { tsconfigRootDir: __dirname }
  rules: {
    'prettier/prettier': ['warn', require('./.prettierrc')],

    // todo: enable
    // 'codegen/codegen': ['warn', {presets: {badges: require('./scripts/badges')}}],

    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/prefer-readonly-parameter-types': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/unified-signatures': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    '@typescript-eslint/no-unused-vars': [
      'off',
      {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        ignoreRestSiblings: true,
        args: 'after-used',
      },
    ],

    '@typescript-eslint/ban-ts-comment': ['error', {'ts-expect-error': false}],
    '@typescript-eslint/no-invalid-void-type': 'off',

    // xo defaults that overlap with prettier
    'comma-dangle': 'off',
    'object-curly-spacing': 'off',
    'operator-linebreak': 'off',
    'no-mixed-spaces-and-tabs': 'off',
    '@typescript-eslint/indent': 'off',
    indent: 'off',
    semi: 'off',
    quotes: 'off',
    '@typescript-eslint/semi': 'off',
    '@typescript-eslint/quotes': 'off',
    'eol-last': 'off',
    'no-trailing-spaces': 'off',
    '@typescript-eslint/member-delimiter-style': 'off',
    camelcase: 'off',

    'capitalized-comments': 'off',

    'jest/expect-expect': [
      'error', // br
      {assertFunctionNames: ['expect', 'expectTypeOf', 'expectLeft', 'expectRight']},
    ],

    'no-else-return': ['warn', {allowElseIf: true}],

    '@typescript-eslint/naming-convention': [
      'warn',
      {
        selector: 'variableLike',
        format: ['camelCase', 'PascalCase'],
        leadingUnderscore: 'allow',
      },
    ],

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

    // defaults from unicorn/xo that feel a bit restrictive, for now
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/consistent-function-scoping': 'off',
    'unicorn/no-fn-reference-in-iterator': 'off',
    'unicorn/no-nested-ternary': 'off',
    'unicorn/no-reduce': 'off',
    'unicorn/no-useless-undefined': 'off',
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
      parserOptions: {sourceType: 'script'},
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['**/*.md'],
      rules: {
        'unicorn/filename-case': 'off',
      },
    },
  ],
}

/** patch eslint's module resolver to abstract the need to use peer dependencies for every single plugin/config */
function patchModuleResolver() {
  // todo: when https://github.com/eslint/rfcs/pull/9 is implemented, none of this nonsense will be necessary.
  // plugins/configs will be loadable as objects then.
  const ModuleResolver = require('eslint/lib/shared/relative-module-resolver')
  if (!ModuleResolver.originalResolve) {
    ModuleResolver.originalResolve = ModuleResolver.resolve
    ModuleResolver.resolve = (req, relTo) => {
      try {
        return ModuleResolver.originalResolve(req, relTo)
      } catch (error) {
        const plugins = new Set(module.exports.plugins)
        const configs = new Set(module.exports.extends)
        if (
          plugins.has(req.replace('eslint-plugin-', ''))
          || plugins.has(req)
          || configs.has(req.replace('eslint-config-', ''))
        ) {
          return require.resolve(req)
        }
        throw error
      }
    }
  }
}
