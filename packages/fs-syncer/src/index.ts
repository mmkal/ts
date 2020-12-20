import * as fs from 'fs'
import * as path from 'path'
import {getPaths, get} from './util'
import {fsSyncerFileTreeMarker, CreateSyncerParams} from './types'
import {defaultMergeStrategy, defaultBeforeWrites} from './defaults'

export * from './types'
export * from './defaults'
export {jestFixture} from './jest'

export const isFsSyncerFileTree = (obj: any): boolean => Boolean(obj?.[fsSyncerFileTreeMarker])

const tryCatch = <T, U = undefined>(fn: () => T, onError: (error: unknown) => U = () => (undefined as any) as U) => {
  try {
    return fn()
  } catch (e: unknown) {
    return onError(e)
  }
}

/** @experimental */
export const createFSSyncer = <T extends object>({
  baseDir,
  targetState,
  exclude = ['node_modules'],
  mergeStrategy = defaultMergeStrategy,
  beforeWrites = defaultBeforeWrites,
}: CreateSyncerParams<T>) => {
  const write = () => {
    fs.mkdirSync(baseDir, {recursive: true})
    const paths = getPaths(targetState)
    paths.forEach(p => {
      const filepath = path.join(baseDir, ...p)
      fs.mkdirSync(path.dirname(filepath), {recursive: true})

      let targetContent: string | undefined = `${get(targetState, p)}`

      targetContent = beforeWrites.reduce((content, next) => content && next({filepath, content}), targetContent)

      if (mergeStrategy !== defaultMergeStrategy) {
        const existingContent = tryCatch(() => fs.readFileSync(filepath).toString())
        targetContent = mergeStrategy({filepath, existingContent, targetContent})
      }
      if (typeof targetContent === 'string') {
        fs.writeFileSync(filepath, targetContent)
      } else {
        fs.unlinkSync(filepath)
      }
    })
  }
  const readdir = (dir: string): T => {
    const result = fs.readdirSync(dir).reduce<T>((state, name) => {
      const subpath = path.join(dir, name)
      const relativePath = path.relative(baseDir, subpath)
      if (exclude.some(r => relativePath.match(r))) {
        return state
      }
      return {
        ...state,
        [name]: fs.statSync(subpath).isFile() ? fs.readFileSync(subpath).toString() : readdir(subpath),
      }
    }, {} as T)
    Object.defineProperty(result, fsSyncerFileTreeMarker, {value: 'directory', enumerable: false})
    return result
  }

  const read = (): any => (fs.existsSync(baseDir) ? readdir(baseDir) : {})

  /** writes all target files to file system, and deletes files not in the target state object */
  const sync = () => {
    write()
    const fsState = read()
    const fsPaths = getPaths(fsState)
    fsPaths
      .filter(p => typeof get(targetState, p) === 'undefined')
      .forEach(p => fs.unlinkSync(path.join(baseDir, ...p)))
    return syncer
  }

  const add = (relativePath: string, content: string) => {
    const route = relativePath.split(/[/\\]/)
    let parent: any = targetState
    for (const segment of route.slice(0, -1)) {
      parent[segment] = parent[segment] ?? {}
      parent = parent[segment]
      if (typeof parent === 'string') {
        throw new TypeError(`Can't overwrite file with folder`)
      }
    }
    parent[route.length - 1] = content
  }

  const syncer = {read, write, sync, targetState, baseDir}

  return syncer
}

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
    mergeStrategy: defaultMergeStrategy,
    // legacy behaviour: no dedenting
    beforeWrites: [],
  })
}
