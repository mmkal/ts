import * as realFs from 'fs'
import * as path from 'path'
import * as os from 'os'
import {getPaths, get, dedent, tryCatch} from './util'
import {fsSyncerFileTreeMarker, CreateSyncerParams, MergeStrategy} from './types'
import {yamlishPrinter} from './yaml'

export * from './types'

export {jestFixture} from './jest'

export * as JSONC from './jsonc'

export * from './merge-config'

export const defaultMergeStrategy: MergeStrategy = params => {
  return params.targetContent && dedent(params.targetContent).trim() + os.EOL
}

/**
 * @experimental
 * More flexible alternative to `fsSyncer`.
 */
export const createFSSyncer = <T extends object>({
  baseDir,
  targetState,
  exclude = ['node_modules'],
  mergeStrategy = defaultMergeStrategy,
  fs: _fs = realFs,
}: CreateSyncerParams<T>) => {
  const fs = _fs as typeof realFs
  const write = () => {
    fs.mkdirSync(baseDir, {recursive: true})
    const paths = getPaths(targetState)
    paths.forEach(p => {
      const filepath = path.join(baseDir, ...p)
      fs.mkdirSync(path.dirname(filepath), {recursive: true})

      let targetContent: string | undefined = `${get(targetState, p)}`

      const existingContent = tryCatch(() => fs.readFileSync(filepath).toString())
      targetContent = mergeStrategy({filepath, existingContent, targetContent})

      if (typeof targetContent === 'string') {
        fs.writeFileSync(filepath, targetContent)
      }
    })
  }

  const readdir = (dir: string): T => {
    const result = fs
      .readdirSync(dir, {withFileTypes: true})
      .sort((...entries) => {
        const [left, right] = entries.map(e => Number(e.isDirectory()))
        return left - right
      })
      .reduce<T>((state, entry) => {
        const subpath = path.join(dir, entry.name)

        const relativePath = path.relative(baseDir, subpath)
        if (exclude.some(r => relativePath.match(r))) {
          return state
        }

        return {
          ...state,
          [entry.name]: fs.statSync(subpath).isFile() ? fs.readFileSync(subpath).toString() : readdir(subpath),
        }
      }, {} as T)
    Object.defineProperty(result, fsSyncerFileTreeMarker, {value: 'directory', enumerable: false})
    return result
  }

  const read = (): any => (fs.existsSync(baseDir) ? readdir(baseDir) : {})

  const yaml = ({tab, path = []}: {tab?: string; path?: string[]} = {}): string =>
    yamlishPrinter(get(read(), path), tab)

  /** writes all target files to file system, and deletes files not in the target state object */
  const sync = () => {
    write()
    const fsState = read()
    const fsPaths = getPaths(fsState)
    fsPaths.forEach(p => {
      const filepath = path.join(baseDir, ...p)
      const targetContent = get(targetState, p)
      const existingContent = tryCatch(() => fs.readFileSync(filepath).toString())
      const resolved = mergeStrategy({
        filepath,
        targetContent,
        existingContent,
      })
      if (typeof resolved === 'string') {
        // todo: make it necessary to write here
        // we don't need to now because we already did in write()
        // above, but that's weird and involves calling mergeStrategy twice.
        // fs.writeFileSync(filepath, resolved)
      } else {
        tryCatch(() => fs.unlinkSync(filepath))
      }
    })

    return syncer
  }

  const syncer = {read, yaml, write, sync, targetState, baseDir}

  return syncer
}

// Backwards-compatible export, may be deprecated if the above one proves nice to work with:

/**
 * A helper to read and write text files to a specified directory.
 *
 * @param baseDir file paths relative to this
 * @param targetState a nested dictionary. A string property is a file, with the key
 * being the filename and the value the content. A nested object represents a directory.
 */
export const fsSyncer = <T extends object>(baseDir: string, targetState: T) => {
  return createFSSyncer({
    baseDir,
    targetState,
    // legacy behaviour: no dedenting, so can't use defaultMergeStrategy
    mergeStrategy: params => params.targetContent,
  })
}
