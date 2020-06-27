import * as preset from '../markdown-from-tests'
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
    'test.ts': dedent`
        import {calculator} from '..'

        beforeEach(() => {
          calculator.setup()
        })

        test('addition', () => {
          expect(calculator.add(1, 1)).toEqual(2)
        })

        it('subtraction', () => {
          expect(calculator.subtract(1, 1)).toEqual(0)
        })

        const nonLiteralTestName = 'also subtraction'
        it(nonLiteralTestName, () => {
          expect(calculator.subtract(1, 1)).toEqual(0)
        })

        test('multiplication', () => {
          expect(calculator.multiply(2, 3)).toEqual(6)
        })

        test.skip('division', () => {
          expect(calculator.divide(1, 0)).toEqual(Infinity)
        })
      `,
  })

  const withHeaders = preset.markdownFromTests({
    meta: emptyReadme,
    options: {source: 'test.ts', headerLevel: 4},
  })
  expect(withHeaders).toMatchInlineSnapshot(`
      "#### addition:

      \`\`\`typescript
      expect(calculator.add(1, 1)).toEqual(2)
      \`\`\`

      #### subtraction:

      \`\`\`typescript
      expect(calculator.subtract(1, 1)).toEqual(0)
      \`\`\`

      #### multiplication:

      \`\`\`typescript
      expect(calculator.multiply(2, 3)).toEqual(6)
      \`\`\`"
    `)
  const withoutHeaders = preset.markdownFromTests({
    meta: emptyReadme,
    options: {source: 'test.ts'},
  })

  expect(withoutHeaders).toEqual(withHeaders.replace(/#### /g, ''))
})
