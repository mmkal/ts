import {RuleTester} from 'eslint'
import * as codegen from '..'
import baseDedent from 'dedent'
import * as os from 'os'

jest.mock('fs', () => {
  const realFs: typeof import('fs') = jest.requireActual('fs')
  return {
    ...realFs,
    readdirSync: (path: string) => {
      if (path.endsWith('__tests__')) {
        return ['foo.ts', 'bar.ts']
      }
      return realFs.readdirSync(path)
    },
  }
})

/** wrapper for dedent which respects os.EOL */
const dedent = (...args: Parameters<typeof baseDedent>) => {
  const result = baseDedent(...args)
  return result.replace(/\r?\n/g, os.EOL)
}

Object.assign(RuleTester, {
  // eslint-disable-next-line jest/expect-expect
  it: (name: string, fn: any) => test(name.replace(/\r?\n/g, ' \\n ').trim(), fn),
})

const tester = new RuleTester()
tester.run('codegen', codegen.rules.codegen, {
  valid: [
    {
      filename: 'index.ts',
      code: '',
    },
    {
      filename: __filename,
      code: dedent`
        // codegen:start {preset: empty}
        // codegen:end
      `,
    },
  ],
  invalid: [
    {
      filename: 'index.ts',
      code: dedent`
        // codegen:start {preset: barrel}
      `,
      errors: [{message: `couldn't find end marker (expected regex /\\/\\/ codegen:end/g)`}],
      output: dedent`
        // codegen:start {preset: barrel}
        // codegen:end
      `,
    },
    {
      filename: __filename,
      code: dedent`
        // codegen:start ""
        // codegen:end
      `,
      errors: [{message: /unknown preset undefined./}],
    },
    {
      filename: __filename,
      code: dedent`
        // codegen:start {preset: doesNotExist}
        // codegen:end
      `,
      errors: [{message: /unknown preset doesNotExist. Available presets: .*/}],
    },
    {
      filename: __filename,
      code: dedent`
        // codegen:start {abc: !Tag: not valid yaml!}
        // codegen:end
      `,
      errors: [{message: /Error parsing options. YAMLException/}],
    },
    {
      filename: __filename,
      code: dedent`
        // codegen:start {preset: empty}
        // codegen:start {preset: empty}
        // codegen:end
      `,
      errors: [{message: /couldn't find end marker/}],
      output: dedent`
        // codegen:start {preset: empty}
        // codegen:end
        // codegen:start {preset: empty}
        // codegen:end
      `,
    },
    {
      filename: __filename,
      parserOptions: {ecmaVersion: 2015, sourceType: 'module'},
      code: dedent`
        // codegen:start {preset: barrel}
        // codegen:end
      `,
      errors: [{message: /content doesn't match/}],
      output: dedent`
        // codegen:start {preset: barrel}
        export * from './foo'
        export * from './bar'
        // codegen:end
      `,
    },
    {
      filename: __filename,
      code: dedent`
        // codegen:start {preset: custom, source: custom-preset.js, export: thrower}
        // codegen:end
      `,
      errors: [{message: /Error: test error!/}],
    },
  ],
})
