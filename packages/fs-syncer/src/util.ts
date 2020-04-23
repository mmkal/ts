type Route = string[]

export const get = (obj: any, path: Route) => path.reduce((val, key) => val?.[key], obj)

export const getPaths = (obj: unknown, route: Route = []): Route[] => {
  if (typeof obj !== 'object' || !obj) {
    return [route]
  }
  const entries = Object.entries(obj)
  if (entries.length === 0) {
    return [route]
  }
  const newRoutes = entries.map(e => {
    return getPaths(e[1], [...route, e[0]])
  })

  return ([] as Route[]).concat(...newRoutes)
}
