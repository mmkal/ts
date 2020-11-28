import * as preset from '../monorepo-toc'
import dedent from 'dedent'
import * as glob from 'glob'
import minimatch from 'minimatch'

const mockFs: any = {}

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  Object.keys(mockFs).forEach(k => delete mockFs[k])
})

jest.mock('fs', () => {
  const actual = jest.requireActual('fs')
  const reader = (orig: string) => (...args: any[]) => {
    const path = args[0]
      .replace(process.cwd() + '\\', '')
      .replace(process.cwd() + '/', '')
      .replace(/\\/g, '/')
    // const fn = path in mockFs ? mockImpl : actual[orig]
    if (path in mockFs) {
      return mockFs[path]
    }
    return actual[orig](...args)
  }
  return {
    ...actual,
    readFileSync: reader('readFileSync'),
    existsSync: reader('existsSync'),
    readdirSync: (path: string) => Object.keys(mockFs).filter(k => k.startsWith(path.replace(/^\.\/?/, ''))),
    statSync: () => ({isFile: () => true, isDirectory: () => false}),
  }
})

jest.mock('glob')

jest.spyOn(glob, 'sync').mockImplementation((pattern, opts) => {
  const found = Object.keys(mockFs).filter(k => minimatch(k, pattern))
  const ignores = typeof opts?.ignore === 'string' ? [opts?.ignore] : opts?.ignore || []
  return found.filter(f => ignores.every(i => !minimatch(f, i)))
})

const emptyReadme = {filename: 'readme.md', existingContent: ''}

beforeEach(() => {
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

    'packages/package4/package.json': '{ "name": "package4", "description": "fourth package" }',
    'packages/package4/README.md': dedent`
        # Package 4

        ## Subheading

        More details about package 4. Package 4 has a detailed readme, with multiple sections

        ### Sub-sub-heading

        Here's another section, with more markdown content in it.
      `,
  })
})

test('generate markdown', () => {
  expect(
    preset.monorepoTOC({
      meta: emptyReadme,
      options: {},
    })
  ).toMatchInlineSnapshot(`
    "- [package1](./packages/package1) - first package with an inline package.json description. Quite a long inline description, in fact.
    - [package2](./packages/package2) - Readme for package 2
    - [package3](./packages/package3) - Readme for package 3
    - [package4](./packages/package4) - More details about package 4. Package 4 has a detailed readme, with multiple sections"
  `)
})

test('generate markdown with filter', () => {
  expect(
    preset.monorepoTOC({
      meta: emptyReadme,
      options: {filter: {'package.name': 'package1|package3'}},
    })
  ).toMatchInlineSnapshot(`
    "- [package1](./packages/package1) - first package with an inline package.json description. Quite a long inline description, in fact.
    - [package3](./packages/package3) - Readme for package 3"
  `)
})

test('generate markdown with sorting', () => {
  expect(
    preset.monorepoTOC({
      meta: emptyReadme,
      options: {sort: '-readme.length'},
    })
  ).toMatchInlineSnapshot(`
    "- [package4](./packages/package4) - More details about package 4. Package 4 has a detailed readme, with multiple sections
    - [package1](./packages/package1) - first package with an inline package.json description. Quite a long inline description, in fact.
    - [package2](./packages/package2) - Readme for package 2
    - [package3](./packages/package3) - Readme for package 3"
  `)
})

test('generate markdown default to lerna to find packages', () => {
  mockFs['package.json'] = '{}'
  expect(
    preset.monorepoTOC({
      meta: emptyReadme,
      options: {},
    })
  ).toMatchInlineSnapshot(`
    "- [package1](./packages/package1) - first package with an inline package.json description. Quite a long inline description, in fact.
    - [package2](./packages/package2) - Readme for package 2"
  `)
})

test('generate markdown fails when no package.json exists', () => {
  expect(() =>
    preset.monorepoTOC({
      meta: {filename: 'subdir/test.md', existingContent: ''},
      options: {},
    })
  ).toThrowError(/ENOENT: no such file or directory, open '.*subdir.*package.json'/)
})

test('generate markdown with separate rootDir', () => {
  expect(
    preset.monorepoTOC({
      meta: {filename: 'subdir/test.md', existingContent: ''},
      options: {repoRoot: '..'},
    })
  ).toMatchInlineSnapshot(`
    "- [package1](../packages/package1) - first package with an inline package.json description. Quite a long inline description, in fact.
    - [package2](../packages/package2) - Readme for package 2
    - [package3](../packages/package3) - Readme for package 3
    - [package4](../packages/package4) - More details about package 4. Package 4 has a detailed readme, with multiple sections"
  `)
})

test('invalid workspaces', () => {
  Object.assign(mockFs, {
    'package.json': '{ "workspaces": "package.json - not an array" }',
    'lerna.json': '{ "packages": "lerna.json - not an array" }',
  })

  expect(() =>
    preset.monorepoTOC({
      meta: emptyReadme,
      options: {},
    })
  ).toThrowError(/Expected to find workspaces array, got 'package.json - not an array'/)
})
