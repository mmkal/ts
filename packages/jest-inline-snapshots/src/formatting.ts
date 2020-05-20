export const getClosingParen = (code: string, from: number, style = '()'): number => {
  const [open, close] = style.split('')
  if (code[from] !== open) {
    throw Error(`must start with a ${open} character`)
  }
  const recurse = (code: string, from: number): number => {
    if (from >= code.length) {
      throw Error(`Expected to find ${close} but reached end of text`)
    }
    if (code[from] === close) {
      return from
    }
    const next = from + 1
    if (code[next] === open) {
      const innerClose = recurse(code, next)
      return recurse(code, innerClose + 1)
    }
    return recurse(code, next)
  }
  return recurse(code, from)
}

export type Format = (code: string, filePath: string) => string | Promise<string>
export const defaultFormatter = ((): Format => {
  const ESLint = (() => {
    try {
      return require('eslint').ESLint
    } catch (e) {
      return null
    }
  })()
  if (!ESLint) {
    return code => code
  }
  const eslint = new ESLint({fix: true})
  return async (code, filePath) => {
    const [linted] = await eslint.lintText(code, {filePath})
    return linted.output || code
  }
})()

export const guessFormatting = (code: string) => {
  const lines = code.split(/\r?\n/)
  const withIndent = lines.map(s => s.match(/^\s+/)!).filter(Boolean)
  const minIndent = withIndent.sort((left, right) => left[0].length - right[0].length)[0]
  const quote = [`'`, `"`]
    .map(type => ({type, count: code.split(type).length}))
    .sort((left, right) => right.count - left.count)[0].type
  return {
    indent: minIndent?.[0] || '  ',
    quote,
  }
}
