import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import * as lodash from 'lodash'

import type {Preset} from '.'
import {getLeafPackages} from './util/monorepo'
import {relative} from './util/path'

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
 * @param repoRoot
 * [optional] the relative path to the root of the git repository. Defaults to the current md file directory.
 * @param filter
 * [optional] a dictionary of filter rules to whitelist packages. Filters can be applied based on package.json keys,
 * e.g. `filter: { package.name: someRegex, path: some/relative/path }`
 * @param sort
 * [optional] sort based on package properties (see `filter`), or readme length. Use `-` as a prefix to sort descending.
 * e.g. `sort: -readme.length`
 */
export const monorepoTOC: Preset<{
  repoRoot?: string
  filter?: string | Record<string, string>
  sort?: string
}> = ({meta, options}) => {
  const packages = getLeafPackages(options.repoRoot, meta.filename)

  const leafPackages = packages
    .map(({path: leafPath, packageJson: leafPkg}) => {
      const dirname = path.dirname(leafPath)
      const readmePath = [path.join(dirname, 'readme.md'), path.join(dirname, 'README.md')].find(p => fs.existsSync(p))
      const readme = [readmePath && fs.readFileSync(readmePath).toString(), leafPkg.description]
        .filter(Boolean)
        .join(os.EOL + os.EOL)
      return {package: leafPkg, leafPath, readme}
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
    .map(props => ({leafPath: props.leafPath, leafPkg: props.package, readme: props.readme}))
    .map(({leafPath, leafPkg, readme}) => {
      const description = (() => {
        return readme
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean)
          .find(line => line.match(/^[A-Za-z]/))
      })()
      const name = leafPkg.name
      const homepage =
        leafPkg.homepage || relative(path.dirname(meta.filename), leafPath).replace(/\/package.json$/, '')
      return [`- [${name}](${homepage})`, description].filter(Boolean).join(' - ').trim()
    })

  return leafPackages.join(os.EOL)
}
