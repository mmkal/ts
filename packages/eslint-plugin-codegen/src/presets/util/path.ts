import * as path from 'path'

/** replace backslashes with forward slashes */
export const unixify = (filepath: string) => filepath.replace(/\\/g, '/')

/** get a relative unix-style path between two existing paths */
export const relative = (from: string, to: string) => `./${unixify(path.relative(from, to))}`.replace(/^\.\/\./, '.')
