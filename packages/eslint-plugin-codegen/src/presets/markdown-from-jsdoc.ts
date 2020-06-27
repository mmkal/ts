import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import * as lodash from 'lodash'

import type {Preset} from '.'

/**
 * Convert jsdoc for an es export from a javascript/typescript file to markdown.
 *
 * ##### Example
 *
 * `<!-- codegen:start {preset: markdownFromJsdoc, source: src/foo.ts, export: bar} -->`
 *
 * @param source {string} relative file path containing the export with jsdoc that should be copied to markdown
 * @param export {string} the name of the export
 */
export const markdownFromJsdoc: Preset<{source: string; export?: string}> = ({
  meta,
  options: {source: relativeFile, export: exportName},
}) => {
  const targetFile = path.join(path.dirname(meta.filename), relativeFile)
  const targetContent = fs.readFileSync(targetFile).toString()
  const lines = targetContent.split('\n').map(line => line.trim())
  const exportLineIndex = lines.findIndex(line => line.startsWith(`export const ${exportName}`))
  if (exportLineIndex < 2 || lines[exportLineIndex - 1] !== '*/') {
    throw Error(`Couldn't find export in ${relativeFile} with jsdoc called ${exportName}`)
  }
  const contentUpToExport = lines.slice(0, exportLineIndex).join('\n')
  const jsdoc = contentUpToExport
    .slice(contentUpToExport.lastIndexOf('/**'))
    .split('\n')
    .map(line => line.trim())
    .map(line => {
      return line
        .replace(/^\/\*\*$/, '') // clean up: /**
        .replace(/^\* /g, '') // clean up:     * blah
        .replace(/^\*$/g, '') // clean up:     *
        .replace(/^\*\/$/, '') // clean up     */
    })
    .join(os.EOL)
  const sections = `\n@description ${jsdoc}`
    .split(/\n@/)
    .map(section => section.trim())
    .filter(Boolean)
    .map((section, index) => {
      const firstSpace = section.search(/\s/)
      return {type: section.slice(0, firstSpace), index, content: section.slice(firstSpace).trim()}
    })
  const formatted = sections.map((sec, i, arr) => {
    if (sec.type === 'example') {
      return ['##### Example', '', '```typescript', sec.content, '```'].join(os.EOL)
    }
    if (sec.type === 'param') {
      const allParams = arr.filter(other => other.type === sec.type)
      if (sec !== allParams[0]) {
        return null
      }
      return [
        '##### Params',
        '',
        '|name|description|',
        '|-|-|',
        ...allParams.map(p => {
          const firstSpace = p.content.indexOf(' ')
          const name = p.content.slice(0, firstSpace)
          const description = p.content.slice(firstSpace + 1)
          return `|${name}|${description}|`
        }),
      ].join(os.EOL)
    }
    if (sec.type === 'description') {
      // line breaks that run into letters aren't respected by jsdoc, so shouldn't be in markdown either
      return sec.content.replace(/\r?\n\s*([A-Za-z])/g, ' $1')
    }
    if (sec.type === 'see') {
      return null
    }
    return [`##### ${lodash.startCase(sec.type)}`, sec.content].join(os.EOL + os.EOL)
  })
  return [`#### [${exportName}](./${relativeFile}#L${exportLineIndex + 1})`, ...formatted]
    .filter(Boolean)
    .join(os.EOL + os.EOL)
}
