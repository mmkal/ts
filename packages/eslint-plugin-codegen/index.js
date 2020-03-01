const path = require('path')
const fs = require('fs')
const os = require('os')
const jsYaml = require('js-yaml')
const t = require('io-ts')
const {tryCatch} = require('fp-ts/lib/Either')
const util = require('util')

const simpleReporter = (validation, typeAlias) => {
  if (validation._tag === 'Right') {
    return PathReporter.report(validation)
  }
  return validation.left.map(e => {
    const name = typeAlias || (e.context[0] && e.context[0].type.name)
    const lastType = e.context.length && e.context[e.context.length - 1].type.name
    const path = name + e.context.map(c => c.key).join('.')
    return `Invalid value {${util.inspect(e.value)}} supplied to ${path}. Expected ${lastType}.`
  })
}

/* eslint-disable local/codegen */
module.exports = {
  processors: {
    '.md': {
      preprocess: text => [
        '/* eslint-disable prettier/prettier */' +
          os.EOL +
          text
            .split(os.EOL)
            .map(line => `// ${line}`)
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
          const markdown = context
            .getSourceCode()
            .text.split(os.EOL)
            .slice(1)
            .map(line => `${line}`.replace('// ', ''))
            .join(os.EOL)

          const markers = {
            start: /<!-- codegen:start (.*?) ?-->/,
            end: /<!-- codegen:end -->/,
          }
          const position = index => {
            const stringUpToPosition = markdown.slice(0, index)
            const lines = stringUpToPosition.split(os.EOL)
            return {line: lines.length, column: lines[lines.length - 1].length}
          }

          const startMatch = markdown.match(markers.start)
          if (!startMatch) {
            return
          }
          const start = position(startMatch.index)
          const startMarkerLoc = {start, end: {...start, column: start.column + startMatch[0].length}}
          const endMatch = markdown.match(markers.end)
          if (!endMatch) {
            return context.report({
              message: `couldn't find end marker (expected regex ${markers.end})`,
              loc: startMarkerLoc,
            })
          }
          const Options = t.type({source: t.string, between: t.tuple([t.string, t.string])}, 'Options')
          const maybeOptions = tryCatch(() => jsYaml.safeLoad(startMatch[1]), err => err)
          const optionsEither = Options.decode(maybeOptions.right || maybeOptions.left)
          if (optionsEither._tag !== 'Right') {
            return context.report({
              message: `failed to parse options: ${simpleReporter(optionsEither)}`,
              loc: startMarkerLoc,
            })
          }
          const options = optionsEither.right
          const sourcePath = path.join(path.dirname(context.getFilename()), options.source)
          if (!fs.existsSync(sourcePath)) {
            return context.report({
              message: `Source path doesn't exist: ${sourcePath}`,
              loc: startMarkerLoc,
            })
          }
          const source = fs.readFileSync(sourcePath).toString()
          const slicePoints = [source.indexOf(options.between[0])]
          slicePoints.push(source.indexOf(options.between[1], slicePoints[0] + 1))
          if (!slicePoints.every(i => i >= 0)) {
            return context.report({
              message: `couldn't find markers in source file: ${sourcePath}: ${options.between.join(', ')}`,
              loc: startMarkerLoc,
            })
          }

          const example = source.slice(slicePoints[0], slicePoints[1]).trim()

          const [beforeExample, _opts, afterExample] = markdown.split(markers.start)
          const betweenMarkers =
            ['```typescript', options.header ? `${options.header}${os.EOL}` : '', example, '```']
              .filter(Boolean)
              .join(os.EOL)
              .trim() + os.EOL
          const range = [startMatch.index + startMatch[0].length + os.EOL.length, endMatch.index]

          if (betweenMarkers !== markdown.slice(...range)) {
            const loc = {start: position(range[0]), end: position(range[1])}
            return context.report({
              message: `example doesn't match ${util.inspect(options)}`,
              loc,
              fix: fixer => fixer.replaceTextRange(range, betweenMarkers),
            })
          }
        }
        validate()
        return {}
      },
    },
    barrelme: {
      meta: {
        docs: {
          description: 'makes sure a barrel file is implemented properly',
          category: '',
          recommended: true,
        },
        fixable: true,
        schema: [],
      },
      /**
       * @param context {import('eslint').Rule.RuleContext}
       */
      create: context => {
        return {
          Program: () => {
            const sourceCode = context.getSourceCode()
            const comments = sourceCode.getAllComments()
            const [startText, endText] = ['barrelme:start', 'barrelme:end']
            const startComments = comments.filter(c => c.value.includes(startText))
            if (startComments.length === 0) {
              return
            }
            const endComments = comments.filter(c => c.value.includes(endText))
            startComments.slice(1).forEach(superfluous =>
              context.report({
                node: superfluous,
                message: `there should be exactly one ${startText} comment`,
              })
            )
            endComments.slice(startComments.length).forEach(superfluous =>
              context.report({
                node: superfluous,
                message: `${endText} comment should correspond to ${startText} comment`,
              })
            )

            const [startComment] = startComments
            const [endComment] = endComments
            if (!endComment) {
              context.report({
                message: `${startText} comment should have corresponding ${endText} comment`,
                node: startComment,
                fix: fixer => fixer.insertTextAfter(startComments[0], `\n// ${endText}`),
              })
              return
            }
            const barrelFile = context.getFilename()
            const barrelDir = path.dirname(barrelFile)
            const filesToBarrel = fs
              .readdirSync(barrelDir)
              .filter(file => path.resolve(barrelDir, file) !== path.resolve(barrelFile))
              .filter(file => ['.js', '.ts', '.tsx'].includes(path.extname(file)))
              .map(file => file.replace(/\.\w+$/, ''))
            const tokensBetween = sourceCode.getTokensBetween(startComment, endComment)
            const allLines = sourceCode.getLines()
            const actualBarrelLines = allLines.slice(startComment.loc.start.line, endComment.loc.start.line - 1)
            const expectedBarrelLines = filesToBarrel.map(f => `export * from './${f}'`)
            const normalisedActualLines = actualBarrelLines.map(s => s.replace(/['"`]/g, `'`).replace(/;$/, ''))
            if (JSON.stringify(normalisedActualLines) === JSON.stringify(expectedBarrelLines)) {
              return
            }
            const expectedBarrelCode = expectedBarrelLines.join(os.EOL)
            const message = `expected barrel:\n${expectedBarrelCode}`
            if (tokensBetween.length === 0 && filesToBarrel.length > 0) {
              context.report({
                message,
                loc: {start: startComment.loc.start, end: endComment.loc.end},
                fix: fixer => fixer.insertTextAfter(startComment, os.EOL + expectedBarrelCode),
              })
              return
            }
            context.report({
              message,
              loc: {start: startComment.loc.start, end: endComment.loc.end},
              fix: fixer =>
                fixer.replaceTextRange(
                  [tokensBetween[0].range[0], tokensBetween[tokensBetween.length - 1].range[1]],
                  expectedBarrelCode
                ),
            })
          },
        }
      },
    },
  },
}
