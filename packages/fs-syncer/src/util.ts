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
