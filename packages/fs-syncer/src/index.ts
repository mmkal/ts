import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import {getPaths, get, dedent} from './util'

// todo: make .read() have a more helpful return type
// todo: mergeStrategy. tried before
// todo: fixture

const fsSyncerFileTreeMarker = Symbol('fs-syncer-marker')

export type FsSyncerFile =
  | string
  | {
      [fsSyncerFileTreeMarker]: () => string
    }

export type MergeStrategy = (params: {
  filepath: string
  existingContent: string | undefined
  targetContent: string | undefined
}) => string | undefined

export type BeforeWrite = (params: {
  filepath: string;
  content: string
}) => string

export const defaultMergeStrategy: MergeStrategy = params => params.targetContent

export const defaultBeforeWrites: BeforeWrite[] = [
  params => dedent(params.content),
  params => params.content.trim() + os.EOL,
]

export interface CreateSyncerParams<T extends object> {
  /** Path that all files will be synced relative to. */
  baseDir: string
  /**
   * Object representation of desired file tree.
   *
   * @example
   * ```
   * {
   *   'one.txt': 'uno',
   *   'two.txt': 'dos',
   *   'subfolder': {
   *     'three.txt': 'tres'
   *   }
   * }
   * ```
   */
  targetState: T
  /**
   * Any file or folder matching one of these regexes will not be read from the file system
   *
   * @default ['node_modules']
   *
   * @example
   * ```
   * ['node_modules', 'dist']
   * ```
   *
   * @example
   * ```
   * ['node_modules', 'dist', /.*\.(test|spect)\.ts/]
   * ```
   * 
   * @example
   * ```
   * /^((?!src).)*$/ // ignore all paths not containing `src`. Note - this effectively means paths must _start_ with `src`, since they will be short-circuited otherwise.
   * ```
   */
  exclude?: Array<string | RegExp>
  /**
   * If specified, any file or folder must match this regex to be read from the file system.
   * 
   * @default '.*'
   * 
   * @example
   * ```
   * /(src|.vscode)/ // only include files in the `src` or `.vscode` directories
   */
  include?: string | RegExp
  /**
   * A function which takes a filepath, old content and new content strings, and returns a string. The returned string is written to disk.
   * If `undefined` is returned, the file is deleted.
   *
   * You can use this to implement custom merges. e.g. a json config file with some default properties could use a strategy which merges existing and target contents:
   *
   * @example
   * ```
   * ({filepath, targetContent, existingContent}) => {
   *   if (!existingContent) {
   *     return targetContent
   *   }
   *   const existingConfig = JSON.parse(existingContent)
   *   const targetConfig = JSON.parse(targetContent || '{}')
   *
   *   return {
   *     ...targetConfig,
   *     ...existingConfig,
   *   }
   * }
   * ```
   *
   * @default params => params.targetContent
   */
  mergeStrategy?: MergeStrategy
  beforeWrites?: Array<BeforeWrite>
}

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
  include = /.*/,
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

      targetContent = beforeWrites.reduce(
        (content, next) => content && next({filepath, content}),
        targetContent
      )

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
  const read = (): T => (fs.existsSync(baseDir) ? readdir(baseDir) : ({} as T))

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
    const route = relativePath.split(/[\/\\]/)
    let parent: any = targetState
    for (const segment of route.slice(0, -1)) {
      parent[segment] = parent[segment] ?? {}
      parent = parent[segment]
      if (typeof parent === 'string') {
        throw new Error(`Can't overwrite file with folder`)
      }
    }
    parent[route.length - 1] = content
  }

  const syncer = {read, write, sync, targetState, baseDir}

  return syncer
}

// export interface JestFixtureOptions extends CreateSyncerParams {
//   disableYamlSerializer
// }

/**
 * @experimental
 * Call from a jest test to setup a syncer in a `baseDir` based on the current file, suite and test name.
 * This reduces the risk of copy-paste errors resulting in two tests trying to write to the same directory.
 * @param targetState target file tree
 */
export const jestFixture = Object.assign(
  (targetState: object) => {
    return createFSSyncer<any>({
      baseDir: jestFixture.baseDir(),
      targetState,
    })
  },
  {
    baseDir: () => path.join(
      path.dirname(expect.getState().testPath),
      'fixtures',
      path.basename(expect.getState().testPath),
      expect
        .getState()
        .currentTestName.toLowerCase()
        .replace(/[^\da-z]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-*/, '')
        .replace(/-*$/, '')
    ),
    addYamlSnapshotSerializer: () => {
      expect.addSnapshotSerializer({
        test: isFsSyncerFileTree,
        print: printYaml,
      })
    },
    wipe: () => createFSSyncer({
      baseDir: path.join(path.dirname(expect.getState().testPath), 'fixtures'),
      targetState: {}
    }).sync(),
  }
)

const printYaml = (val: any) => {
  const buffer: string[] = []
  const printNode = (node: any, indent: number) => {
    if (typeof node === 'undefined') {
      return
    }
    if (node && typeof node === 'object') {
      const entries = Object.entries(node).sort((...items) => {
        const keys = items.map(e => (e[1] && typeof e[1] === 'object' ? 'z' : typeof e[1]))
        return keys[0].localeCompare(keys[1])
      })
      entries.forEach(e => {
        buffer.push('\n' + ' '.repeat(indent) + e[0] + ': ')
        printNode(e[1], indent + 2)
      })
      return
    }
    if (typeof node === 'string' && node.includes('\n')) {
      buffer.push('|-\n')
      node.split('\n').forEach((line, i, arr) => {
        buffer.push(' '.repeat(indent) + line + (i === arr.length - 1 ? '' : '\n'))
      })
      return
    }

    buffer.push(node?.toString())
  }

  printNode(val, 0)
  return buffer.join('').trimLeft()
}

const isFsSyncerFileTree = (obj: any): boolean => Boolean(obj?.[fsSyncerFileTreeMarker])

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
