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
 */
export const custom: Preset<{source: string; export?: string} & Record<string, any>> = ({meta, options}) => {
  const sourcePath = path.join(path.dirname(meta.filename), options.source)
  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
    throw Error(`Source path doesn't exist: ${sourcePath}`)
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sourceModule = require(sourcePath)
  const func = options.export ? sourceModule[options.export] : sourceModule
  if (typeof func !== 'function') {
    throw Error(`Couldn't find export ${options.export || 'function'} from ${sourcePath} - got ${typeof func}`)
  }
  return func({meta, options})
}
