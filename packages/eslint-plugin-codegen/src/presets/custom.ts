import * as path from 'path'
import * as fs from 'fs'

import type {Preset} from '.'

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
 * @param require A module to load before `source`. For example, set to `ts-node/register` to use a custom typescript function
 * @param dev Set to `true` to clear the require cache for `source` before loading. Allows editing the function without requiring an IDE reload
 */
export const custom: Preset<
  {
    source?: string
    export?: string
    require?: string
    dev?: boolean
  } & Record<string, unknown>
> = ({meta, options}) => {
  const sourcePath = options.source ? path.join(path.dirname(meta.filename), options.source) : meta.filename
  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
    throw Error(`Source path is not a file: ${sourcePath}`)
  }

  const requireFirst = options.require || (sourcePath.endsWith('.ts') ? 'ts-node/register/transpile-only' : undefined)
  if (requireFirst) {
    require(requireFirst)
  }

  if (options.dev) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete require.cache[sourcePath]
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sourceModule = require(sourcePath)
  const func = options.export ? sourceModule[options.export] : sourceModule
  if (typeof func !== 'function') {
    throw Error(`Couldn't find export ${options.export || 'function'} from ${sourcePath} - got ${typeof func}`)
  }
  return func({meta, options})
}
