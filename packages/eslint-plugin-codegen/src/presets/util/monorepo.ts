import * as readPkgUp from 'read-pkg-up'
import {match} from 'io-ts-extra'
import * as path from 'path'
import * as glob from 'glob'
import * as lodash from 'lodash'
import * as fs from 'fs'
import {inspect} from 'util'

export interface PackageGlobbable {
  repoRoot?: string
}

export const getLeafPackages = (repoRoot: string | undefined, filename: string) => {
  const contextDir = match(repoRoot)
    .case(String, s => path.join(path.dirname(filename), s))
    .default(() => path.dirname(readPkgUp.sync({cwd: path.dirname(filename)})!.path))
    .get()

  const readJsonFile = (f: string) => JSON.parse(fs.readFileSync(path.join(contextDir, f)).toString())
  const parseLernaJson = () => readJsonFile('lerna.json').packages
  const pkg = readJsonFile('package.json')
  const packageGlobs = pkg.workspaces?.packages || pkg.workspaces || parseLernaJson()

  if (!Array.isArray(packageGlobs)) {
    throw Error(`Expected to find workspaces array, got ${inspect(packageGlobs)}`)
  }

  const packages = lodash
    .flatMap(packageGlobs, pattern => glob.sync(`${pattern}/package.json`, {cwd: contextDir}))
    .map(p => ({path: p, packageJson: readJsonFile(p)}))
  return lodash.compact(packages)
}
