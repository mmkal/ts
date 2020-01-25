const path = require('path')
const fs = require('fs')

module.exports = {
  rules: {
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
            const expectedBarrelCode = expectedBarrelLines.join('\n')
            const message = `expected barrel:\n${expectedBarrelCode}`
            if (tokensBetween.length === 0 && filesToBarrel.length > 0) {
              context.report({
                message,
                loc: {start: startComment.loc.start, end: endComment.loc.end},
                fix: fixer => fixer.insertTextAfter(startComment, '\n' + expectedBarrelCode),
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
