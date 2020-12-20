// todo: make .read() have a more helpful return type
// todo: mergeStrategy. tried before
// todo: fixture

export const fsSyncerFileTreeMarker = Symbol('fs-syncer-marker')

export type MergeStrategy = (params: {
  filepath: string
  existingContent: string | undefined
  targetContent: string | undefined
}) => string | undefined

export type BeforeWrite = (params: {filepath: string; content: string}) => string

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
  beforeWrites?: BeforeWrite[]
}
