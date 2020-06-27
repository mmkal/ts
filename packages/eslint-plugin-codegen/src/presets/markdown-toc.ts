import * as fs from 'fs'
import * as os from 'os'
import * as lodash from 'lodash'

import type {Preset} from '.'

/**
 * Generate a table of contents from the current markdown file, based on markdown headers (e.g. `### My section title`)
 *
 * ##### Example
 *
 * `<!-- codegen:start {preset: markdownTOC, minDepth: 2, maxDepth: 5} -->`
 *
 * @param minDepth exclude headers with lower "depth". e.g. if set to 2, `# H1` would be excluded but `## H2` would be included.
 * @param maxDepth exclude headers with higher "depth". e.g. if set to 3, `#### H4` would be excluded but `### H3` would be included.
 */
export const markdownTOC: Preset<{minDepth?: number; maxDepth?: number}> = ({meta, options}) => {
  const lines = fs
    .readFileSync(meta.filename)
    .toString()
    .split('\n')
    .map(line => line.trim())
  const headings = lines
    .filter(line => line.match(/^#+ /))
    .filter(line => line.startsWith('#'.repeat(options.minDepth || 1)))
    .filter(line => line.split(' ')[0].length < (options.maxDepth || Infinity))
  const minHashes = lodash.min(headings.map(h => h.split(' ')[0].length))!
  return headings
    .map(h => {
      const hashes = h.split(' ')[0]
      const indent = ' '.repeat(3 * (hashes.length - minHashes))
      const text = h
        .slice(hashes.length + 1)
        .replace(/]\(.*\)/g, '')
        .replace(/[[\]]/g, '')
      const href = text
        .toLowerCase()
        .replace(/\s/g, '-')
        .replace(/[^\w-]/g, '')
      return {indent, text, href}
    })
    .map(({indent, text, href}, i, arr) => {
      const previousDupes = arr.filter((x, j) => x.href === href && j < i)
      const fixedHref = previousDupes.length === 0 ? href : `${href}-${previousDupes.length}`
      return `${indent}- [${text}](#${fixedHref})`
    })
    .join(os.EOL)
}
