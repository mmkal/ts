// todo: make .read() have a more helpful return type
// todo: mergeStrategy. tried before
// todo: fixture

export const fsSyncerFileTreeMarker = Symbol('fs-syncer-marker')

/**
 * Interface that's compatible with both `require('fs')` and a `memfs` volume.
 * Annoyingly, memfs doesn't strictly conform to the `fs` interface, it deals with
 * nullish values differently, etc.
 *
 * Note: this only includes methods that this library actually uses.
 */
export interface FSLike {
  readFileSync(path: string): {toString(): string}
  writeFileSync(path: string, content: string): void
  existsSync(filepath: string): boolean
  mkdirSync(path: string, opts?: {recursive?: boolean}): void
  // memfs uses crazy generics here, just make sure some kinda function exists
  readdirSync(path: string, opts?: {encoding: any; withFileTypes?: false}): any[]
  readdirSync(path: string, opts: {withFileTypes?: true}): any[]
  statSync(path: string): {isFile(): boolean}
  unlinkSync(path: string): void
}

export type MergeStrategy = (params: {
  filepath: string
  existingContent: string | undefined
  targetContent: string | undefined
}) => string | undefined

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
   * @default
   * ```
   * ['node_modules']
   * ```
   *
   * @example
   * ```
   * ['node_modules', 'dist']
   * ```
   *
   * @example
   * ```
   * ['node_modules', 'dist', /.*\.(test|spec)\.ts/]
   * ```
   *
   * @example
   * ```
   * /^((?!src).)*$/ // ignore all paths not containing `src`. Note - this effectively means paths must _start_ with `src`, since they will be short-circuited otherwise.
   * ```
   */
  exclude?: Array<string | RegExp>

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
  /**
   * Replacement file-system. Defaults to `require('fs')`. You can use `memfs` to perform in-memory operations.
   */
  fs?: FSLike
  // beforeWrites?: BeforeWrite[]
}
