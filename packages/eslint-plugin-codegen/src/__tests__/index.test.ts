import * as presets from '../presets'
import dedent from 'dedent'
import * as glob from 'glob'
import minimatch from 'minimatch'

const mockFs: any = {}

beforeEach(() => {
  Object.keys(mockFs).forEach(k => delete mockFs[k])
})

jest.mock('fs', () => {
  const actual = require.requireActual('fs')
  const reader = (orig: string, mockImpl: (...args: any[]) => any) => (...args: any[]) => {
    const path = args[0].replace(/\\/g, '/')
    // const fn = path in mockFs ? mockImpl : actual[orig]
    if (path in mockFs) {
      return mockFs[path]
    }
    return actual[orig](...args)
  }
  return {
    readFileSync: reader('readFileSync', path => mockFs[path]),
    existsSync: reader('existsSync', path => path in mockFs),
    readdirSync: (path: string) => Object.keys(mockFs).filter(k => k.startsWith(path.replace(/^\.\/?/, ''))),
    statSync: () => ({isFile: () => true, isDirectory: () => false}),
  }
})

jest.mock('glob')

jest.spyOn(glob, 'sync').mockImplementation(pattern => Object.keys(mockFs).filter(k => minimatch(k, pattern)))

const mdMeta = (existingContent = 'abc'): Parameters<presets.Preset<{}>>[0]['meta'] => ({
  filename: 'abc.md',
  existingContent,
})

describe('empty', () => {
  test('generates nothing', () => {
    expect(presets.empty({meta: mdMeta(), options: {}})).toEqual('')
  })
})

describe('markdownTOC', () => {
  test('generate markdown', () => {
    Object.assign(mockFs, {
      'abc.md': dedent`
        # H1
        Text
        ## H2
        More text
        ### H3
        Some content
        ![](an-image.png)
        ### Another H3
        #### H4 duplicate
        ##### H5
        ##### H5
        #### H4 duplicate
        More
        ## Another H2
      `,
    })

    expect(presets.markdownTOC({meta: mdMeta(`abc`), options: {}})).toMatchInlineSnapshot(`
      "- [H1](#h1)
         - [H2](#h2)
            - [H3](#h3)
            - [Another H3](#another-h3)
               - [H4 duplicate](#h4-duplicate)
                  - [H5](#h5)
                  - [H5](#h5-1)
               - [H4 duplicate](#h4-duplicate-1)
         - [Another H2](#another-h2)"
    `)

    expect(presets.markdownTOC({meta: mdMeta(`abc`), options: {minDepth: 2, maxDepth: 3}})).toMatchInlineSnapshot(`
      "- [H2](#h2)
      - [Another H2](#another-h2)"
    `)
  })

  test('calculates min hashes', () => {
    Object.assign(mockFs, {
      'abc.md': dedent`
        ### H3
        ### Another H3
        #### H4 duplicate
        ##### H5
        ##### H5
      `,
    })

    expect(presets.markdownTOC({meta: mdMeta(`abc`), options: {}})).toMatchInlineSnapshot(`
      "- [H3](#h3)
      - [Another H3](#another-h3)
         - [H4 duplicate](#h4-duplicate)
            - [H5](#h5)
            - [H5](#h5-1)"
    `)

    expect(presets.markdownTOC({meta: mdMeta(`abc`), options: {minDepth: 2, maxDepth: 3}})).toMatchInlineSnapshot(`""`)
  })
})

describe('monorepoTOC', () => {
  test('generate markdown', () => {
    Object.assign(mockFs, {
      'package.json': '{ "workspaces": ["packages/*"] }',

      'withBadWorkspaces/package.json': '{ "workspaces": "not an array!" }',

      'lerna.json': '{ "packages": ["packages/package1", "packages/package2"] }',

      'packages/package1/package.json':
        '{ "name": "package1", "description": "first package with an inline package.json description. Quite a long inline description, in fact." }',

      'packages/package2/package.json': '{ "name": "package2", "description": "package 2" }',
      'packages/package2/readme.md': dedent`
        # Package 2
        Readme for package 2
      `,

      'packages/package3/package.json': '{ "name": "package3", "description": "package 3" }',
      'packages/package3/readme.md': dedent`
        # Package 3
        Readme for package 3
      `,

      'packages/package4/package.json': '{ "name": "package3", "description": "fourth package" }',
      'packages/package4/README.md': dedent`
        # Package 4
        
        ## Subheading

        More details about package 4. This is a detailed readme, with multiple sections

        ### Sub-sub-heading

        There's another section, with more markdown content in it.
      `,
    })

    expect(presets.monorepoTOC({meta: mdMeta(`abc`), options: {}})).toMatchInlineSnapshot(`
      "- [package1](./packages/package1) - first package with an inline package.json description. Quite a long inline description, in fact.
      - [package2](./packages/package2) - Readme for package 2
      - [package3](./packages/package3) - Readme for package 3
      - [package3](./packages/package4) - More details about package 4. This is a detailed readme, with multiple sections"
    `)

    expect(presets.monorepoTOC({meta: mdMeta(`abc`), options: {filter: {'package.name': 'package1|package3'}}}))
      .toMatchInlineSnapshot(`
      "- [package1](./packages/package1) - first package with an inline package.json description. Quite a long inline description, in fact.
      - [package3](./packages/package3) - Readme for package 3
      - [package3](./packages/package4) - More details about package 4. This is a detailed readme, with multiple sections"
    `)

    expect(presets.monorepoTOC({meta: mdMeta(`abc`), options: {sort: '-readme.length'}})).toMatchInlineSnapshot(`
      "- [package3](./packages/package4) - More details about package 4. This is a detailed readme, with multiple sections
      - [package1](./packages/package1) - first package with an inline package.json description. Quite a long inline description, in fact.
      - [package2](./packages/package2) - Readme for package 2
      - [package3](./packages/package3) - Readme for package 3"
    `)

    expect(presets.monorepoTOC({meta: mdMeta(`abc`), options: {workspaces: 'lerna'}})).toMatchInlineSnapshot(`
      "- [package1](./packages/package1) - first package with an inline package.json description. Quite a long inline description, in fact.
      - [package2](./packages/package2) - Readme for package 2"
    `)

    expect(
      presets.monorepoTOC({meta: mdMeta(`abc`), options: {workspaces: ['packages/package1', 'packages/package3']}})
    ).toMatchInlineSnapshot(`
      "- [package1](./packages/package1) - first package with an inline package.json description. Quite a long inline description, in fact.
      - [package3](./packages/package3) - Readme for package 3"
    `)

    expect(() =>
      presets.monorepoTOC({
        meta: {filename: 'subdir/test.md', existingContent: ''},
        options: {},
      })
    ).toThrowError(/ENOENT: no such file or directory, open 'subdir.*package.json'/)

    expect(presets.monorepoTOC({meta: {filename: 'subdir/test.md', existingContent: ''}, options: {repoRoot: '..'}}))
      .toMatchInlineSnapshot(`
      "- [package1](./packages/package1) - first package with an inline package.json description. Quite a long inline description, in fact.
      - [package2](./packages/package2) - Readme for package 2
      - [package3](./packages/package3) - Readme for package 3
      - [package3](./packages/package4) - More details about package 4. This is a detailed readme, with multiple sections"
    `)
  })

  test('invalid workspaces', () => {
    Object.assign(mockFs, {
      'package.json': '{ "workspaces": "package.json - not an array" }',
      'lerna.json': '{ "packages": "lerna.json - not an array" }',
    })

    expect(() => presets.monorepoTOC({meta: {filename: 'readme.md', existingContent: ''}, options: {}})).toThrowError(
      /Expected to find workspaces array, got 'package.json - not an array'/
    )

    expect(() =>
      presets.monorepoTOC({meta: {filename: 'readme.md', existingContent: ''}, options: {workspaces: 'lerna'}})
    ).toThrowError(/Expected to find workspaces array, got 'lerna.json - not an array'/)
  })
})

describe('markdownFromTests', () => {
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

    const withHeaders = presets.markdownFromTests({meta: mdMeta(`abc`), options: {source: 'test.ts', headerLevel: 4}})
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
    const withoutHeaders = presets.markdownFromTests({
      meta: mdMeta(`abc`),
      options: {source: 'test.ts'},
    })

    expect(withoutHeaders).toEqual(withHeaders.replace(/#### /g, ''))
  })
})

describe('barrel', () => {
  test('generates typescript', () => {
    Object.assign(mockFs, {
      'index.ts': '',
      'a.ts': '',
      'b.ts': '',
      'c.ts': '',
      'a-util.ts': '',
      'b-util.ts': '',
      'util.ts': '',
    })

    expect(presets.barrel({meta: {filename: 'index.ts', existingContent: ''}, options: {}})).toMatchInlineSnapshot(`
      "export * from './a'
      export * from './b'
      export * from './c'
      export * from './a-util'
      export * from './b-util'
      export * from './util'"
    `)

    expect(presets.barrel({meta: {filename: 'index.ts', existingContent: ''}, options: {exclude: 'util'}}))
      .toMatchInlineSnapshot(`
      "export * from './a'
      export * from './b'
      export * from './c'"
    `)

    expect(
      presets.barrel({meta: {filename: 'index.ts', existingContent: ''}, options: {include: 'a|b', exclude: 'util'}})
    ).toMatchInlineSnapshot(`
      "export * from './a'
      export * from './b'"
    `)
  })

  test('is unopinionated about quotes', () => {
    Object.assign(mockFs, {
      'index.ts': '',
      'a.ts': '',
      'b.ts': '',
      'c.ts': '',
    })

    const oldContent = dedent`
      export * from "./a"
      export * from "./b"
      export * from "./c"
    `
    expect(
      presets.barrel({
        meta: {
          filename: 'index.ts',
          existingContent: oldContent,
        },
        options: {},
      })
    ).toEqual(oldContent)
  })
})

describe('markdownFromJsdoc', () => {
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

    expect(presets.markdownFromJsdoc({meta: mdMeta(`abc`), options: {source: 'index.ts', export: 'add'}}))
      .toMatchInlineSnapshot(`
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
      presets.markdownFromJsdoc({
        meta: {filename: 'readme.md', existingContent: ''},
        options: {source: 'index.ts', export: 'subtract'},
      })
    ).toThrowError(/Couldn't find export in .*index.ts with jsdoc called subtract/)
  })
})

describe('custom', () => {
  test('loads custom export', () => {
    const customPreset = require('./custom-preset')

    expect(Object.keys(customPreset)).toEqual(['getText'])

    expect(customPreset.getText.toString().trim()).toMatch(/'Named export with input: ' \+ options.input/)

    expect(
      presets.custom({
        meta: {filename: __filename, existingContent: ''},
        options: {source: './custom-preset.js', export: 'getText', input: 'abc'},
      })
    ).toMatchInlineSnapshot(`"Named export with input: abc"`)

    expect(
      presets.custom({
        meta: {filename: __filename, existingContent: ''},
        options: {source: './custom-preset.js', input: 'def'},
      })
    ).toMatchInlineSnapshot(`"Whole module export with input: def"`)

    expect(() =>
      presets.custom({
        meta: {filename: __filename, existingContent: ''},
        options: {source: './does-not-exist.ts', export: 'getText', input: 'abc'},
      })
    ).toThrowError(/Source path doesn't exist: .*does-not-exist.ts/)

    expect(() =>
      presets.custom({
        meta: {filename: __filename, existingContent: ''},
        options: {source: './custom-preset.js', export: 'doesNotExist', input: 'abc'},
      })
    ).toThrowError(/Couldn't find export doesNotExist from .*custom-preset.js! Got undefined/)
  })
})
