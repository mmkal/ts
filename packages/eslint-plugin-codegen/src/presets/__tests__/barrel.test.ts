import * as preset from '../barrel'
import * as glob from 'glob'
import minimatch from 'minimatch'

const mockFs: any = {}

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  Object.keys(mockFs).forEach(k => delete mockFs[k])
})

jest.mock('glob')

jest.spyOn(glob, 'sync').mockImplementation((pattern, opts) => {
  const found = Object.keys(mockFs).filter(k => minimatch(k, pattern))
  const ignores = typeof opts?.ignore === 'string' ? [opts?.ignore] : opts?.ignore || []
  return found.filter(f => ignores.every(i => !minimatch(f, i)))
})

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

  expect(
    preset.barrel({
      meta: {filename: 'index.ts', existingContent: ''},
      options: {},
    })
  ).toMatchInlineSnapshot(`
      "export * from './a'
      export * from './b'
      export * from './c'
      export * from './a-util'
      export * from './b-util'
      export * from './util'"
    `)

  expect(
    preset.barrel({
      meta: {filename: 'index.ts', existingContent: ''},
      options: {include: '{a,b}*'},
    })
  ).toMatchInlineSnapshot(`
      "export * from './a'
      export * from './b'
      export * from './a-util'
      export * from './b-util'"
    `)

  expect(
    preset.barrel({
      meta: {filename: 'index.ts', existingContent: ''},
      options: {exclude: '*'},
    })
  ).toMatchInlineSnapshot(`""`)

  expect(
    preset.barrel({
      meta: {filename: 'index.ts', existingContent: ''},
      options: {include: '{a,b}*', exclude: ['*util*']},
    })
  ).toMatchInlineSnapshot(`
      "export * from './a'
      export * from './b'"
    `)

  expect(
    preset.barrel({
      meta: {filename: 'index.ts', existingContent: ''},
      options: {include: '{a,b}.ts', import: 'star'},
    })
  ).toMatchInlineSnapshot(`
      "import * as a from './a'
      import * as b from './b'

      export {
       a,
       b
      }
      "
    `)

  expect(
    preset.barrel({
      meta: {filename: 'index.ts', existingContent: ''},
      options: {include: '{a,b}.ts', import: 'default'},
    })
  ).toMatchInlineSnapshot(`
      "import a from './a'
      import b from './b'

      export {
       a,
       b
      }
      "
    `)

  expect(
    preset.barrel({
      meta: {filename: 'index.ts', existingContent: ''},
      options: {include: '{a,b}.ts', import: 'star', export: 'default'},
    })
  ).toMatchInlineSnapshot(`
      "import * as a from './a'
      import * as b from './b'

      export default {
       a,
       b
      }
      "
    `)

  expect(
    preset.barrel({
      meta: {filename: 'index.ts', existingContent: ''},
      options: {include: '{a,b}.ts', import: 'star', export: 'foo'},
    })
  ).toMatchInlineSnapshot(`
      "import * as a from './a'
      import * as b from './b'

      export const foo = {
       a,
       b
      }
      "
    `)

  expect(
    preset.barrel({
      meta: {filename: 'index.ts', existingContent: ''},
      options: {include: '{a,b}.ts', import: 'star', export: {name: 'foo', keys: 'path'}},
    })
  ).toMatchInlineSnapshot(`
      "import * as a from './a'
      import * as b from './b'

      export const foo = {
       \\"./a\\": a,
       \\"./b\\": b
      }
      "
    `)

  expect(
    preset.barrel({
      meta: {filename: 'index.ts', existingContent: ''},
      options: {include: '{a,b}.ts', import: 'star', export: {name: 'foo', keys: 'camelCase'}},
    })
  ).toMatchInlineSnapshot(`
      "import * as a from './a'
      import * as b from './b'

      export const foo = {
       a,
       b
      }
      "
    `)

  expect(
    preset.barrel({
      meta: {filename: 'index.ts', existingContent: ''},
      options: {include: '{a,b}.ts', import: 'star', export: {name: 'default', keys: 'path'}},
    })
  ).toMatchInlineSnapshot(`
      "import * as a from './a'
      import * as b from './b'

      export default {
       \\"./a\\": a,
       \\"./b\\": b
      }
      "
    `)
})

test('is unopinionated about formatting', () => {
  Object.assign(mockFs, {
    'index.ts': '',
    'a.ts': '',
    'b.ts': '',
    'c.ts': '',
  })

  const oldContent = [
    `export * from './a';\n`, // breakme
    `export * from "./b";\r\n`,
    `export * from "./c"`,
  ].join('')

  expect(
    preset.barrel({
      meta: {
        filename: 'index.ts',
        existingContent: oldContent,
      },
      options: {},
    })
  ).toEqual(oldContent)
})
