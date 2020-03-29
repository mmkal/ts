import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import * as t from 'io-ts'
import * as lodash from 'lodash'
import * as glob from 'glob'
import {match} from 'io-ts-extra'
import {parse} from '@babel/parser'
import traverse from '@babel/traverse'
import {inspect} from 'util'

export type Preset<Options> = (params: {meta: {filename: string; existingContent: string}; options: Options}) => string

/**
 * Rollup exports from several modules into a single convenient module, typically named `index.ts`
 *
 * ##### Example
 *
 * `// codegen:start {preset: barrel, include: foo, exclude: bar}`
 *
 * @param include [optional] If specified, the barrel will only include filenames that match this regex
 * @param exclude [optional] If specified, the barrel will only include filenames that don't match this regex
 */
export const barrel: Preset<{include?: string; exclude?: string}> = ({meta, options: {include, exclude}}) => {
  const barrelDir = path.dirname(meta.filename)
  const filesToBarrel = fs
    .readdirSync(barrelDir)
    .filter(file => path.resolve(barrelDir, file) !== path.resolve(meta.filename))
    .filter(file => !exclude || !file.match(exclude))
    .filter(file => file.match(include || /.*/))
    .filter(file => ['.js', '.ts', '.tsx'].includes(path.extname(file)))
    .map(file => file.replace(/\.\w+$/, ''))

  const expectedBarrelLines = filesToBarrel.map(f => `export * from './${f}'`)
  const expectedContent = expectedBarrelLines.join(os.EOL)

  // ignore differences that are just semicolons and quotemarks
  // prettier-ignore
  const normalise = (s: string) => s.replace(/['"`]/g, `'`).replace(/;/g, '').replace(/\r?\n/g, '\n').trim()
  if (normalise(expectedContent) === normalise(meta.existingContent)) {
    return meta.existingContent
  }

  return expectedContent
}

/**
 * Convert jsdoc for an es export from a javascript/typescript file to markdown.
 *
 * ##### Example
 *
 * `<!-- codegen:start {preset: markdownFromJsdoc, source: src/foo.ts, export: bar} -->`
 *
 * @param source {string} relative file path containing the export with jsdoc that should be copied to markdown
 * @param export {string} the name of the export
 */
export const markdownFromJsdoc: Preset<{source: string; export?: string}> = ({
  meta,
  options: {source: relativeFile, export: exportName},
}) => {
  const targetFile = path.join(path.dirname(meta.filename), relativeFile)
  const targetContent = fs.readFileSync(targetFile).toString()
  const lines = targetContent.split('\n').map(line => line.trim())
  const exportLineIndex = lines.findIndex(line => line.startsWith(`export const ${exportName}`))
  if (exportLineIndex < 2 || lines[exportLineIndex - 1] !== '*/') {
    throw Error(`Couldn't find export in ${relativeFile} with jsdoc called ${exportName}`)
  }
  const contentUpToExport = lines.slice(0, exportLineIndex).join('\n')
  const jsdoc = contentUpToExport
    .slice(contentUpToExport.lastIndexOf('/**'))
    .split('\n')
    .map(line => line.trim())
    .map(line => {
      return line
        .replace(/^\/\*\*$/, '') // clean up: /**
        .replace(/^\* /g, '') // clean up:     * blah
        .replace(/^\*$/g, '') // clean up:     *
        .replace(/^\*\/$/, '') // clean up     */
    })
    .join(os.EOL)
  const sections = `\n@description ${jsdoc}`
    .split(/\n@/)
    .map(section => section.trim())
    .filter(Boolean)
    .map((section, index) => {
      const firstSpace = section.search(/\s/)
      return {type: section.slice(0, firstSpace), index, content: section.slice(firstSpace).trim()}
    })
  const formatted = sections.map((sec, i, arr) => {
    if (sec.type === 'example') {
      return ['##### Example', '', '```typescript', sec.content, '```'].join(os.EOL)
    }
    if (sec.type === 'param') {
      const allParams = arr.filter(other => other.type === sec.type)
      if (sec !== allParams[0]) {
        return null
      }
      return [
        '##### Params',
        '',
        '|name|description|',
        '|-|-|',
        ...allParams.map(p => {
          const firstSpace = p.content.indexOf(' ')
          const name = p.content.slice(0, firstSpace)
          const description = p.content.slice(firstSpace + 1)
          return `|${name}|${description}|`
        }),
      ].join(os.EOL)
    }
    if (sec.type === 'description') {
      // line breaks that run into letters aren't respected by jsdoc, so shouldn't be in markdown either
      return sec.content.replace(/\r?\n\s*([a-zA-Z])/g, ' $1')
    }
    if (sec.type === 'see') {
      return null
    }
    return [`##### ${lodash.startCase(sec.type)}`, sec.content].join(os.EOL + os.EOL)
  })
  return [`#### [${exportName}](./${relativeFile}#L${exportLineIndex + 1})`, ...formatted]
    .filter(Boolean)
    .join(os.EOL + os.EOL)
}

/**
 * Generate a table of contents from the current markdown file, based on markdown headers (e.g. `### My section title`)
 *
 * ##### Example
 *
 * `<!-- codegen:start {preset: markdownTOC, minDepth: 2, maxDepth: 5} -->`
 *
 * @param minDepth exclude headers with lower "depth". e.g. if set to 2, `# H1` would be excluded but `## H2` would be included.
 * @param maxDepth exclude headers with higher "depth". e.g. if set to 3, `#### H4` would be excluded but `### H3` would be included.
 */
export const markdownTOC: Preset<{minDepth?: number; maxDepth?: number}> = ({meta, options}) => {
  const lines = fs
    .readFileSync(meta.filename)
    .toString()
    .split('\n')
    .map(line => line.trim())
  const headings = lines
    .filter(line => line.match(/^#+ /))
    .filter(line => line.startsWith('#'.repeat(options.minDepth || 1)))
    .filter(line => line.split(' ')[0].length < (options.maxDepth || Infinity))
  const minHashes = lodash.min(headings.map(h => h.split(' ')[0].length))
  return headings
    .map(h => {
      const hashes = h.split(' ')[0]
      const indent = ' '.repeat(3 * (hashes.length - minHashes!))
      const text = h
        .slice(hashes.length + 1)
        .replace(/\]\(.*\)/g, '')
        .replace(/[\[\]]/g, '')
      const href = text
        .toLowerCase()
        .replace(/\s/g, '-')
        .replace(/[^\w-]/g, '')
      return {indent, text, href}
    })
    .map(({indent, text, href}, i, arr) => {
      const previousDupes = arr.filter((x, j) => x.href === href && j < i)
      const fixedHref = previousDupes.length === 0 ? href : `${href}-${previousDupes.length}`
      return `${indent}- [${text}](#${fixedHref})`
    })
    .join(os.EOL)
}

/**
 * Use a test file to generate library usage documentation.
 *
 * Note: this has been tested with jest. It _might_ also work fine with mocha, and maybe ava, but those haven't been tested.
 *
 * ##### Example
 *
 * `<!-- codegen:start {preset: markdownFromTests, source: test/foo.test.ts, headerLevel: 3} -->`
 *
 * @param source the jest test file
 * @param headerLevel The number of `#` characters to prefix each title with
 */
export const markdownFromTests: Preset<{source: string; headerLevel?: number}> = ({meta, options}) => {
  const sourcePath = path.join(path.dirname(meta.filename), options.source)
  const sourceCode = fs.readFileSync(sourcePath).toString()
  const ast = parse(sourceCode, {sourceType: 'module', plugins: ['typescript']})
  const specs: any[] = []
  // todo: fix types/babel package versions - shouldn't need any here
  const t = traverse(ast as any, {
    CallExpression(ce) {
      const identifier: any = lodash.get(ce, 'node')
      const isSpec = identifier && ['it', 'test'].includes(lodash.get(identifier, 'callee.name'))
      if (!isSpec) return
      const hasArgs =
        identifier.arguments.length >= 2 &&
        identifier.arguments[0].type === 'StringLiteral' &&
        identifier.arguments[1].body
      if (!hasArgs) return
      const func = identifier.arguments[1]
      const lines = sourceCode.slice(func.start, func.end).split(/\r?\n/).slice(1, -1)
      const indent = lodash.min(lines.filter(Boolean).map(line => line.length - line.trim().length))!
      const body = lines.map(line => line.replace(' '.repeat(indent), '')).join(os.EOL)
      specs.push({title: identifier.arguments[0].value, code: body})
    },
  })
  return specs
    .map(s => {
      const lines = [
        `${'#'.repeat(options.headerLevel || 0)} ${s.title}${lodash.get(s, 'suffix', ':')}${os.EOL}`.trimLeft(),
        '```typescript',
        s.code,
        '```',
      ]
      return lines.join(os.EOL).trim()
    })
    .join(os.EOL + os.EOL)
}

/**
 * Generate a table of contents for a monorepo.
 *
 * ##### Example (basic)
 *
 * `<!-- codegen:start {preset: monorepoTOC} -->`
 *
 * ##### Example (using config options)
 *
 * `<!-- codegen:start {preset: monorepoTOC, repoRoot: .., workspaces: lerna, filter: {package.name: foo}, sort: -readme.length} -->`
 *
 * @param repoRoot [optional] the relative path to the root of the git repository. Defaults to the current md file directory.
 * @param workspaces [optional] a string or array of globs matching monorepo workspace packages. Defaults to the `workspaces` key in package.json. Set to `lerna` to parse `lerna.json`.
 * @param filter [optional] a dictionary of filter rules to whitelist packages. Filters can be applied based on package.json keys, e.g. `filter: { package.name: someRegex, path: some/relative/path }`
 * @param sort [optional] sort based on package properties (see `filter`), or readme length. Use `-` as a prefix to sort descending. e.g. `sort: -readme.length`
 */
export const monorepoTOC: Preset<{
  repoRoot?: string
  workspaces?: string | string[]
  filter?: string | Record<string, string>
  sort?: string
}> = ({meta, options}) => {
  const contextDir = match(options.repoRoot)
    .case(t.string, s => path.join(path.dirname(meta.filename), s))
    .default(() => path.dirname(meta.filename))
    .get()
  const readJsonFile = (f: string) => JSON.parse(fs.readFileSync(path.join(contextDir, f)).toString())
  const packageGlobs = match(options.workspaces)
    .case(t.array(t.string), arr => arr)
    .case(t.literal('lerna'), () => readJsonFile('lerna.json').packages)
    .default(() => {
      const pkg = readJsonFile('package.json')
      return (pkg.workspaces && pkg.workspaces.packages) || pkg.workspaces
    })
    .get()
  if (!Array.isArray(packageGlobs)) {
    throw Error(`Expected to find workspaces array, got ${inspect(packageGlobs)}`)
  }
  const leafPackages = lodash
    .flatMap(packageGlobs, pattern => glob.sync(`${pattern}/package.json`))
    .map(leafPath => {
      const dirname = path.dirname(leafPath)
      const relativePath = dirname.replace(contextDir, '').replace(/\\/g, '/')
      const leafPkg = readJsonFile(leafPath)
      const readmePath = [
        path.join(contextDir, relativePath, 'readme.md'),
        path.join(contextDir, relativePath, 'README.md'),
      ].find(p => fs.existsSync(p))
      const readme = [readmePath && fs.readFileSync(readmePath).toString(), leafPkg.description]
        .filter(Boolean)
        .join(os.EOL + os.EOL)
      return {package: leafPkg, path: relativePath, readme}
    })
    .filter(props => {
      const filter =
        typeof options.filter === 'object'
          ? options.filter
          : ({'package.name': options.filter!} as Record<string, string>)
      return Object.keys(filter)
        .filter(key => typeof filter[key] === 'string')
        .every(key => new RegExp(lodash.get(filter, key)).test(lodash.get(props, key)))
    })
    .sort((...args) => {
      const sort = options.sort || 'package.name'
      const multiplier = sort.startsWith('-') ? -1 : 1
      const key = sort.replace(/^-/, '')
      const [a, b] = args.map(arg => lodash.get(arg, key))
      const comp = a < b ? -1 : a > b ? 1 : 0
      return comp * multiplier
    })
    .map(props => ({relativePath: props.path, leafPkg: props.package, readme: props.readme}))
    .map(({relativePath, leafPkg, readme}, index) => {
      const description = (() => {
        return readme
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean)
          .find(line => line.match(/^[a-zA-Z]/))
      })()
      const name = leafPkg.name
      const homepage = leafPkg.homepage || `./${relativePath}`
      return [`- [${name}](${homepage})`, description].filter(Boolean).join(' - ').trim()
    })

  return leafPackages.join(os.EOL)
}

/**
 * Define your own codegen function, which will receive all options specified.
 *
 * Import the `Preset` type from this library to define a strongly-typed preset function:
 *
 * @example
 * import {Preset} from 'eslint-plugin-codegen'
 *
 * export const jsonPrinter: Preset<{myCustomProp: string}> = ({meta, options}) => {
 *   return 'filename: ' + meta.filename + '\\ncustom prop: ' + options.myCustomProp
 * }
 *
 * @description
 * This can be used with:
 *
 * `<!-- codegen:start {preset: custom, source: ./lib/my-custom-preset.js, export: jsonPrinter, myCustomProp: hello}`
 *
 * @param source Relative path to the module containing the custom preset
 * @param export The name of the export. If omitted, the module itself should be a preset function.
 */
export const custom: Preset<{source: string; export?: string} & Record<string, any>> = ({meta, options}) => {
  const sourcePath = path.join(path.dirname(meta.filename), options.source)
  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
    throw Error(`Source path doesn't exist: ${sourcePath}`)
  }
  const sourceModule = require(sourcePath)
  const func = options.export ? sourceModule[options.export] : sourceModule
  if (typeof func !== 'function') {
    throw Error(`Couldn't find export ${options.export || 'function'} from ${sourcePath} - got ${typeof func}`)
  }
  return func({meta, options})
}

/**
 * Removes all content between start and end markers.
 */
export const empty: Preset<{}> = () => ''
