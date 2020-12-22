type Route = string[]

export const get = (obj: any, path: Route) => path.reduce((val, key) => val?.[key], obj)

export const getPaths = (obj: unknown, route: Route = []): Route[] => {
  if (typeof obj !== 'object' || !obj) {
    return [route]
  }

  const newRoutes = Object.entries(obj).map(e => {
    return getPaths(e[1], [...route, e[0]])
  })

  return ([] as Route[]).concat(...newRoutes)
}

/** Along the lines of https://github.com/tc39/proposal-string-dedent */
export const dedent = (str: string) => {
  const lines = str.split('\n')
  if (lines.length === 1 || lines[0]) {
    return str
  }
  lines.shift()
  if (lines[lines.length - 1].trim() === '') {
    lines[lines.length - 1] = ''
  }

  const commonMargin =
    lines.filter(Boolean).reduce((common, next) => {
      const lineMargin = next.split(/\S/)[0]
      if (typeof common === 'string') {
        return lineMargin.startsWith(common) ? common : common.startsWith(lineMargin) ? lineMargin : ''
      }
      return lineMargin
    }, null as string | null) || ''

  return lines.map(line => line.replace(commonMargin, '')).join('\n')
}
