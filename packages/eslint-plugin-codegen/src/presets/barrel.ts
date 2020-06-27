import * as path from 'path'
import * as lodash from 'lodash'
import * as glob from 'glob'
import {match} from 'io-ts-extra'
import {parse} from '@babel/parser'
import generate from '@babel/generator'

import type {Preset} from '.'

/**
 * Bundle several modules into a single convenient one.
 *
 * @example
 * // codegen:start {preset: barrel, include: some/path/*.ts, exclude: some/path/*util.ts}
 * export * from './some/path/module-a'
 * export * from './some/path/module-b'
 * export * from './some/path/module-c'
 * // codegen:end
 *
 * @param include [optional] If specified, the barrel will only include file paths that match this glob pattern
 * @param exclude [optional] If specified, the barrel will exclude file paths that match these glob patterns
 * @param import [optional] If specified, matching files will be imported and re-exported rather than directly exported with `export * from './xyz'`. Use `import: star` for `import * as xyz from './xyz'` style imports. Use `import: default` for `import xyz from './xyz'` style imports.
 * @param export [optional] Only valid if the import style has been specified (either `import: star` or `import: default`). If specified, matching modules will be bundled into a const or default export based on this name. If set to `{name: someName, keys: path}` the relative file paths will be used as keys. Otherwise the file paths will be camel-cased to make them valid js identifiers.
 */
export const barrel: Preset<{
  include?: string
  exclude?: string | string[]
  import?: 'default' | 'star'
  export?: string | {name: string; keys: 'path' | 'camelCase'}
}> = ({meta, options: opts}) => {
  const cwd = path.dirname(meta.filename)

  const ext = meta.filename.split('.').slice(-1)[0]
  const pattern = opts.include || `*.${ext}`

  const relativeFiles = glob
    .sync(pattern, {cwd, ignore: opts.exclude})
    .filter(f => path.resolve(cwd, f) !== path.resolve(meta.filename))
    .map(f => `./${f}`.replace(/(\.\/)+\./g, '.'))
    .filter(file => ['.js', '.ts', '.tsx'].includes(path.extname(file)))
    .map(f => f.replace(/\.\w+$/, ''))

  const expectedContent = match(opts.import)
    .case(undefined, () => {
      return relativeFiles.map(f => `export * from '${f}'`).join('\n')
    })
    .case(String, s => {
      const importPrefix = s === 'default' ? '' : '* as '
      const withIdentifiers = relativeFiles.map(f => ({
        file: f,
        identifier: lodash.camelCase(f),
      }))

      const imports = withIdentifiers.map(i => `import ${importPrefix}${i.identifier} from '${i.file}'`).join('\n')
      const exportProps = match(opts.export)
        .case({name: String, keys: 'path'}, () =>
          withIdentifiers.map(i => `${JSON.stringify(i.file)}: ${i.identifier}`)
        )
        .default(() => withIdentifiers.map(i => i.identifier))
        .get()

      const exportPrefix = match(opts.export)
        .case(undefined, () => 'export')
        .case('default', () => 'export default')
        .case({name: 'default'}, () => 'export default')
        .case(String, name => `export const ${name} =`)
        .case({name: String}, ({name}) => `export const ${name} =`)
        .get()

      const exports = exportProps.join(',\n ')

      return `${imports}\n\n${exportPrefix} {\n ${exports}\n}\n`
    })
    .get()

  // ignore stylistic differences. babel generate deals with most
  const normalise = (str: string) =>
    generate(parse(str, {sourceType: 'module', plugins: ['typescript']}) as any)
      .code.replace(/'/g, `"`)
      .replace(/\/index/g, '')

  try {
    if (normalise(expectedContent) === normalise(meta.existingContent)) {
      return meta.existingContent
    }
  } catch {}

  return expectedContent
}
