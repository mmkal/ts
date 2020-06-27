import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import * as lodash from 'lodash'
import * as glob from 'glob'
import {match} from 'io-ts-extra'
import {inspect} from 'util'

import type {Preset} from '.'

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
    .case(String, s => path.join(path.dirname(meta.filename), s))
    .default(() => path.dirname(meta.filename))
    .get()

  const readJsonFile = (f: string) => JSON.parse(fs.readFileSync(path.join(contextDir, f)).toString())
  const parseLernaJson = () => readJsonFile('lerna.json').packages
  const packageGlobs = match(options.workspaces)
    .case([String], arr => arr)
    .case('lerna', parseLernaJson)
    .default(() => {
      const pkg = readJsonFile('package.json')
      return pkg.workspaces?.packages || pkg.workspaces || parseLernaJson()
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
      const filter = typeof options.filter === 'object' ? options.filter : {'package.name': options.filter!}
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
    .map(({relativePath, leafPkg, readme}) => {
      const description = (() => {
        return readme
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean)
          .find(line => line.match(/^[A-Za-z]/))
      })()
      const name = leafPkg.name
      const homepage = leafPkg.homepage || `./${relativePath}`
      return [`- [${name}](${homepage})`, description].filter(Boolean).join(' - ').trim()
    })

  return leafPackages.join(os.EOL)
}
