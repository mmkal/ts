import * as preset from '../markdown-from-jsdoc'
import dedent from 'dedent'

const mockFs: any = {}

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  Object.keys(mockFs).forEach(k => delete mockFs[k])
})

jest.mock('fs', () => {
  const actual = jest.requireActual('fs')
  const reader = (orig: string) => (...args: any[]) => {
    const path = args[0].replace(/\\/g, '/')
    // const fn = path in mockFs ? mockImpl : actual[orig]
    if (path in mockFs) {
      return mockFs[path]
    }
    return actual[orig](...args)
  }
  return {
    readFileSync: reader('readFileSync'),
    existsSync: reader('existsSync'),
    readdirSync: (path: string) => Object.keys(mockFs).filter(k => k.startsWith(path.replace(/^\.\/?/, ''))),
    statSync: () => ({isFile: () => true, isDirectory: () => false}),
  }
})

const emptyReadme = {filename: 'readme.md', existingContent: ''}
test('generate markdown', () => {
  Object.assign(mockFs, {
    'index.ts': dedent`
        /**
         * Adds two numbers
         *
         * @example const example1 = fn(1, 2) // returns 3
         *
         * @description Uses js \`+\` operator
         *
         * @example const example1 = fn(1, 20) // returns 21
         *
         * @see subtract for the converse
         *
         * @link http://google.com has a calculator in it too
         *
         * @param a {number} the first number
         * @param b {number} the second number
         */
        export const add = (a: number, b: number) => a + b

        /**
         * Subtracts two numbers
         *
         * @example const example1 = subtract(5, 3) // returns 2
         *
         * @description Uses js \`-\` operator
         *
         * @param a {number} the first number
         * @param b {number} the second number
         */
        export const add = (a: number, b: number) => a - b
      `,
  })

  expect(
    preset.markdownFromJsdoc({
      meta: emptyReadme,
      options: {source: 'index.ts', export: 'add'},
    })
  ).toMatchInlineSnapshot(`
      "#### [add](./index.ts#L17)

      Adds two numbers

      ##### Example

      \`\`\`typescript
      const example1 = fn(1, 2) // returns 3
      \`\`\`

      Uses js \`+\` operator

      ##### Example

      \`\`\`typescript
      const example1 = fn(1, 20) // returns 21
      \`\`\`

      ##### Link

      http://google.com has a calculator in it too

      ##### Params

      |name|description|
      |-|-|
      |a|{number} the first number|
      |b|{number} the second number|"
    `)
})

test('not found export', () => {
  Object.assign(mockFs, {
    'index.ts': dedent`
        /** docs */
        export const add = (a: number, b: number) => a + b
      `,
  })

  expect(() =>
    preset.markdownFromJsdoc({
      meta: emptyReadme,
      options: {source: 'index.ts', export: 'subtract'},
    })
  ).toThrowError(/Couldn't find export in .*index.ts with jsdoc called subtract/)
})
