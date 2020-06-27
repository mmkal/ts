import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import * as lodash from 'lodash'
import {parse} from '@babel/parser'
import traverse from '@babel/traverse'

import type {Preset} from '.'

/**
 * Use a test file to generate library usage documentation.
 *
 * Note: this has been tested with jest. It _might_ also work fine with mocha, and maybe ava, but those haven't been tested.
 *
 * ##### Example
 *
 * `<!-- codegen:start {preset: markdownFromTests, source: test/foo.test.ts, headerLevel: 3} -->`
 *
 * @param source the jest test file
 * @param headerLevel The number of `#` characters to prefix each title with
 */
export const markdownFromTests: Preset<{source: string; headerLevel?: number}> = ({meta, options}) => {
  const sourcePath = path.join(path.dirname(meta.filename), options.source)
  const sourceCode = fs.readFileSync(sourcePath).toString()
  const ast = parse(sourceCode, {sourceType: 'module', plugins: ['typescript']})
  const specs: any[] = []
  // todo: fix types/babel package versions - shouldn't need any here
  traverse(ast as any, {
    CallExpression(ce) {
      const identifier: any = lodash.get(ce, 'node')
      const isSpec = identifier && ['it', 'test'].includes(lodash.get(identifier, 'callee.name'))
      if (!isSpec) {
        return
      }
      const hasArgs =
        identifier.arguments.length >= 2 &&
        identifier.arguments[0].type === 'StringLiteral' &&
        identifier.arguments[1].body
      if (!hasArgs) {
        return
      }
      const func = identifier.arguments[1]
      const lines = sourceCode.slice(func.start, func.end).split(/\r?\n/).slice(1, -1)
      const indent = lodash.min(lines.filter(Boolean).map(line => line.length - line.trim().length))!
      const body = lines.map(line => line.replace(' '.repeat(indent), '')).join(os.EOL)
      specs.push({title: identifier.arguments[0].value, code: body})
    },
  })
  return specs
    .map(s => {
      const lines = [
        `${'#'.repeat(options.headerLevel || 0)} ${s.title}${lodash.get(s, 'suffix', ':')}${os.EOL}`.trimLeft(),
        '```typescript',
        s.code,
        '```',
      ]
      return lines.join(os.EOL).trim()
    })
    .join(os.EOL + os.EOL)
}
