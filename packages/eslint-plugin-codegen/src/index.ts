import * as path from 'path'
import * as os from 'os'
import * as jsYaml from 'js-yaml'
import {tryCatch} from 'fp-ts/lib/Either'
import * as eslint from 'eslint'
import * as presets from './presets'
import expect from 'expect'

type MatchAll = (text: string, pattern: string | RegExp) => Iterable<NonNullable<ReturnType<string['match']>>>
const matchAll: MatchAll = require('string.prototype.matchall')

export {Preset} from './presets'

export {presets}

export const processors: Record<string, eslint.Linter.LintOptions> = {
  '.md': {
    preprocess: text => [
      '/* eslint-disable prettier/prettier */ // eslint-plugin-codegen:remove' +
        os.EOL +
        text
          .split(/\r?\n/)
          .map(line => `// eslint-plugin-codegen:trim${line}`)
          .join(os.EOL),
    ],
    postprocess: messageLists => ([] as eslint.Linter.LintMessage[]).concat(...messageLists),
    // @ts-ignore
    supportsAutofix: true,
  },
}

const codegen: eslint.Rule.RuleModule = {
  // @ts-ignore
  meta: {fixable: true},
  create: (context: eslint.Rule.RuleContext) => {
    const validate = () => {
      let sourceCode = context
        .getSourceCode()
        .text.split(os.EOL)
        .filter(line => !line.includes('eslint-plugin-codegen:remove'))
        .map(line => `${line}`.replace('// eslint-plugin-codegen:trim', ''))
        .join(os.EOL)

      const markersByExtension: Record<string, {start: RegExp; end: RegExp}> = {
        '.md': {
          start: /<!-- codegen:start (.*?) ?-->/g,
          end: /<!-- codegen:end -->/g,
        },
        '.ts': {
          start: /\/\/ codegen:start ?(.*)/g,
          end: /\/\/ codegen:end/g,
        },
      }
      markersByExtension['.js'] = markersByExtension['.ts']

      const markers = markersByExtension[path.extname(context.getFilename())]
      const position = (index?: number) => {
        const stringUpToPosition = sourceCode.slice(0, index)
        const lines = stringUpToPosition.split(os.EOL)
        return {line: lines.length, column: lines[lines.length - 1].length}
      }

      const startMatches = [...matchAll(sourceCode, markers.start)].filter(startMatch => {
        const prevCharacter = sourceCode[startMatch.index! - 1]
        return !prevCharacter || prevCharacter === '\n'
      })

      startMatches.forEach((startMatch, startMatchesIndex) => {
        const startIndex = startMatch.index!.valueOf()
        const start = position()
        const startMarkerLoc = {start, end: {...start, column: start.column + startMatch[0].length}}
        const searchForEndMarkerUpTo =
          startMatchesIndex === startMatches.length - 1 ? sourceCode.length : startMatches[startMatchesIndex + 1].index
        const endMatch = [...matchAll(sourceCode.slice(0, searchForEndMarkerUpTo), markers.end)].find(
          e => e.index! > startMatch.index!
        )
        if (!endMatch) {
          const afterStartMatch = startIndex + startMatch[0].length
          return context.report({
            message: `couldn't find end marker (expected regex ${markers.end})`,
            loc: startMarkerLoc,
            fix: fixer =>
              fixer.replaceTextRange(
                [afterStartMatch, afterStartMatch],
                os.EOL + markers.end.source.replace(/\\/g, '')
              ),
          })
        }
        const maybeOptions = tryCatch(() => jsYaml.safeLoad(startMatch[1]), err => err)
        if (maybeOptions._tag === 'Left') {
          return context.report({message: `Error parsing options. ${maybeOptions.left}`, loc: startMarkerLoc})
        }
        const opts = maybeOptions.right || {}
        if (typeof (presets as any)[opts.preset] !== 'function') {
          return context.report({
            message: `unknown preset ${opts.preset}. Available presets: ${Object.keys(presets).join(', ')}`,
            loc: startMarkerLoc,
          })
        }

        const range: eslint.AST.Range = [startIndex + startMatch[0].length + os.EOL.length, endMatch.index!]
        const existingContent = sourceCode.slice(...range)
        const normalise = (val: string) => val.trim().replace(/\r?\n/g, os.EOL)

        const result = tryCatch(
          () => {
            const meta = {filename: context.getFilename(), existingContent}
            return presets[opts.preset as keyof typeof presets]({meta, options: opts})
          },
          err => `${err}`
        )

        if (result._tag === 'Left') {
          return context.report({message: result.left, loc: startMarkerLoc})
        }
        const expected = result.right
        try {
          expect(normalise(existingContent)).toBe(normalise(expected))
        } catch (e) {
          const loc = {start: position(range[0]), end: position(range[1])}
          return context.report({
            message: `content doesn't match: ${e}`,
            loc,
            fix: fixer => fixer.replaceTextRange(range, normalise(expected) + os.EOL),
          })
        }
        if (normalise(existingContent) !== normalise(expected)) {
        }

        return
      })
    }
    validate()
    return {}
  },
}

export const rules = {codegen}
