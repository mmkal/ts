const path = require('path')
const fs = require('fs')
const os = require('os')
const jsYaml = require('js-yaml')
const t = require('io-ts')
const {tryCatch, left, right} = require('fp-ts/lib/Either')
const util = require('util')
const lodash = require('lodash')
const matchAll = require('string.prototype.matchall')
const glob = require('glob')
const {match} = require('io-ts-extra')

const readableReporter = (validation, typeAlias) => {
  if (validation._tag === 'Right') {
    return ['No errors!']
  }
  return validation.left.map(e => {
    const name = typeAlias || (e.context[0] && e.context[0].type.name)
    const lastType = e.context.length && e.context[e.context.length - 1].type.name
    const path = name + e.context.map(c => c.key).join('.')
    return `Invalid value {${util.inspect(e.value)}} supplied to ${path}. Expected ${lastType}.`
  })
}

/* eslint-disable codegen/codegen */
module.exports = {
  processors: {
    '.md': {
      preprocess: text => [
        '/* eslint-disable prettier/prettier */ // eslint-plugin-codegen:remove' +
          os.EOL +
          text
            .split(os.EOL)
            .map(line => `// eslint-plugin-codegen:trim${line}`)
            .join(os.EOL),
      ],
      postprocess: messageLists => [].concat(...messageLists),
      supportsAutofix: true,
    },
  },
  rules: {
    codegen: {
      meta: {
        docs: {
          description: 'copy some code into documentation file',
        },
        fixable: true,
      },
      /**
       * @param context {import('eslint').Rule.RuleContext}
       */
      create: context => {
        const validate = () => {
          let sourceCode = context
            .getSourceCode()
            .text.split(os.EOL)
            .filter(line => !line.includes('eslint-plugin-codegen:remove'))
            .map(line => `${line}`.replace('// eslint-plugin-codegen:trim', ''))
            .join(os.EOL)

          const markersByExtension = {
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
          const position = index => {
            const stringUpToPosition = sourceCode.slice(0, index)
            const lines = stringUpToPosition.split(os.EOL)
            return {line: lines.length, column: lines[lines.length - 1].length}
          }

          const startMatches = [...matchAll(sourceCode, markers.start)]
          startMatches.forEach((startMatch, startMatchesIndex) => {
            const start = position(startMatch.index)
            const startMarkerLoc = {start, end: {...start, column: start.column + startMatch[0].length}}
            if (startMatch === startMatches.slice(0, startMatchesIndex).find(other => other[0] === startMatch[0])) {
              return context.report({message: `duplicate start marker`, loc: startMarkerLoc})
            }
            const searchForEndMarkerUpTo =
              startMatchesIndex === startMatches.length - 1
                ? sourceCode.length
                : startMatches[startMatchesIndex + 1].index
            const endMatch = [...matchAll(sourceCode.slice(0, searchForEndMarkerUpTo), markers.end)].find(
              e => e.index > startMatch.index
            )
            if (!endMatch) {
              const afterStartMatch = startMatch.index + startMatch[0].length
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
            if (typeof presets[opts.preset] !== 'function') {
              return context.report({
                message: `unknown preset ${opts.preset}. Available presets: ${Object.keys(presets).join(', ')}`,
                loc: startMarkerLoc,
              })
            }

            const range = [startMatch.index + startMatch[0].length + os.EOL.length, endMatch.index]
            const existingContent = sourceCode.slice(...range)
            const normalise = val => val.trim().replace(/\r?\n/g, os.EOL)

            const result = tryCatch(
              () => {
                const meta = {filename: context.getFilename(), existingContent}
                return presets[opts.preset]({meta, options: opts})
              },
              err => `${err}`
            )

            if (result._tag === 'Left') {
              return context.report({message: result.left, loc: startMarkerLoc})
            }
            const expected = result.right
            if (normalise(existingContent) !== normalise(expected)) {
              const loc = {start: position(range[0]), end: position(range[1])}
              return context.report({
                message: `content doesn't match ${util.inspect({existingContent, expected})}`,
                loc,
                fix: fixer => fixer.replaceTextRange(range, normalise(expected) + os.EOL),
              })
            }

            return
          })
        }
        validate()
        return {}
      },
    },
  },
}

const presets = {
  empty: () => right(''),
  barrel: ({meta}) => {
    const barrelDir = path.dirname(meta.filename)
    const filesToBarrel = fs
      .readdirSync(barrelDir)
      .filter(file => path.resolve(barrelDir, file) !== path.resolve(meta.filename))
      .filter(file => ['.js', '.ts', '.tsx'].includes(path.extname(file)))
      .map(file => file.replace(/\.\w+$/, ''))
    const expectedBarrelLines = filesToBarrel.map(f => `export * from './${f}'`)
    const expectedContent = expectedBarrelLines.join(os.EOL)

    // ignore differences that are just semicolons and quotemarks
    // prettier-ignore
    const normalise = s => s.replace(/['"`]/g, `'`).replace(/;/, '').trim()
    if (normalise(expectedContent) === normalise(meta.existingContent)) {
      return meta.existingContent
    }

    return expectedContent
  },
  jsdoc: ({meta, options: {module: relativeFile, export: exportName, loc, markers}}) => {
    const targetFile = path.join(path.dirname(meta.filename), relativeFile)
    if (!fs.existsSync(targetFile) || !fs.statSync(targetFile).isFile()) {
      throw Error(`Couldn't find module ${targetFile}`)
    }
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
    const sections = `@description ${jsdoc}`
      .split('@')
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
        return sec.content.replace(/\r?\n\s*([a-zA-Z])/g, ' $1')
      }
      if (sec.type === 'see') {
        return null
      }
      return [`##### ${lodash.startCase(sec.type)}`, sec.content].join(os.EOL + os.EOL)
    })
    return [`#### [${exportName}](./${relativeFile}#L${exportLineIndex + 1})`, ...formatted]
      .filter(Boolean)
      .join(os.EOL + os.EOL)
  },
  regex: ({meta, options}) => {
    const sourcePath = path.join(path.dirname(meta.filename), options.source)
    if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
      throw Error(`Source path doesn't exist: ${sourcePath}`)
    }
    const source = fs.readFileSync(sourcePath).toString()
    const slicePoints = [source.indexOf(options.between[0])]
    slicePoints.push(source.indexOf(options.between[1], slicePoints[0] + 1))
    if (!slicePoints.every(i => i >= 0)) {
      throw Error(`couldn't find markers in source file: ${sourcePath}: ${options.between.join(', ')}`)
    }

    const example = source.slice(slicePoints[0], slicePoints[1]).trim()

    return (
      ['```typescript', options.header ? `${options.header}${os.EOL}` : '', example, '```']
        .filter(Boolean)
        .join(os.EOL)
        .trim() + os.EOL
    )
  },
  'md-toc': ({meta, options}) => {
    const lines = fs
      .readFileSync(meta.filename)
      .toString()
      .split('\n')
      .map(line => line.trim())
    const headings = lines.filter(line => line.match(/^#+ /))
    const minHashes = lodash.min(headings.map(h => h.split(' ')[0].length))
    return headings
      .map(h => {
        const hashes = h.split(' ')[0]
        const indent = ' '.repeat(3 * (hashes.length - minHashes))
        const text = h
          .slice(hashes.length + 1)
          .split(']')[0]
          .split('[')
          .slice(-1)[0]
        const href = text.replace(/\W+/g, '-')
        return {indent, text, href}
      })
      .map(({indent, text, href}, i, arr) => {
        const previousDupes = arr.filter((x, j) => x.href === href && j < i)
        const fixedHref = previousDupes.length === 0 ? href : `${href}-${previousDupes.length}`
        return `${indent}- [${text}](#${fixedHref})`
      })
      .join(os.EOL)
  },
  'monorepo-toc': ({meta, options}) => {
    const contextDir = match(options.repoRoot)
      .case(t.string, s => path.join(path.dirname(meta.filename), s))
      .default(() => path.dirname(meta.filename))
      .get()
    const readJsonFile = f => JSON.parse(fs.readFileSync(path.join(contextDir, f)).toString())
    const packageGlobs = match(options.workspaces)
      .case(t.array(t.string), arr => arr)
      .case(t.literal('lerna'), () => readJsonFile('lerna.json').packages)
      .default(() => readJsonFile('package.json').workspaces)
      .get()
    if (!Array.isArray(packageGlobs)) {
      throw Error(`expected to find workspaces array in ${options.workspaces}`)
    }
    const leafPackages = lodash
      .flatMap(packageGlobs, pattern => glob.sync(`${pattern}/package.json`))
      .map(leafPath => {
        const relativePath = path
          .dirname(leafPath)
          .replace(contextDir, '')
          .replace(/\\/g, '/')
        const leafPkg = readJsonFile(leafPath)
        if (typeof options.filter === 'string' && !new RegExp(options.filter).test(leafPkg.name)) {
          return null
        }
        return {relativePath, leafPkg}
      })
      .filter(Boolean)
      .map(({relativePath, leafPkg}, index) => {
        const description = (() => {
          const readmePath = [
            path.join(contextDir, relativePath, 'readme.md'),
            path.join(contextDir, relativePath, 'README.md'),
          ].find(p => fs.existsSync(p))
          const readme = [readmePath && fs.readFileSync(readmePath).toString(), leafPkg.description]
            .filter(Boolean)
            .join(os.EOL + os.EOL)
          return readme
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .find(line => line.match(/^[a-zA-Z]/))
        })()
        const name = leafPkg.name
        const homepage = leafPkg.homepage || `./${relativePath}`
        return `${index + 1}. [${name}](${homepage}) - ${description}`.trim()
      })

    return leafPackages.join(os.EOL)
  },
}
