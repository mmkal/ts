import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'

// stolen from https://github.com/errwischt/stacktrace-parser/blob/3dec2937958f1c867e22bea7ae287d6085cf5266/src/stack-trace-parser.js#L121
const nodeRe = /^\s*at (?:((?:\[object object])?[^/\\]+(?: \[as \S+])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$/i

type StackLine = ReturnType<typeof parseStackLine>
const parseStackLine = (line: string) => {
  const parts = nodeRe.exec(line)

  if (!parts) {
    return null
  }

  return {
    line,
    file: parts[2],
    methodName: parts[1] || 'UNKNOWN_FUNCTION',
    arguments: [],
    lineNumber: Number(parts[3]),
    column: parts[4] ? Number(parts[4]) : null,
  }
}

const parseStack = (stack: string | undefined) => (stack || '').split(/\r?\n/).slice(1).map(parseStackLine)

export const filterStack = (
  stack: string | undefined,
  fn: (line: StackLine, index: number, array: StackLine[]) => unknown
) =>
  stack &&
  parseStack(stack)
    .filter(fn)
    .map(line => line?.line)
    .join(os.EOL)
    .replace(/\r?\n\s+\n/g, os.EOL)

/** returns the parsed stack frame for the external call site. */
export const getCallSite = (ignoreFiles = fs.readdirSync(__dirname).map(f => path.join(__dirname, f))) => {
  const allIgnoredFiles = new Set([...ignoreFiles, __filename].map(f => path.resolve(f)))

  return parseStack(Error().stack).find(s => s?.file && !allIgnoredFiles.has(path.resolve(s.file))) || undefined
}
