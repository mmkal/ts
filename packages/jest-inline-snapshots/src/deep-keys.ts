export type Route = string[]

export const get = (obj: any, path: Route) => path.reduce((val, key) => val?.[key], obj)

export const set = (obj: any, path: Route, value: any) => {
  path.reduce((val, key, i) => {
    const child = val[key]
    if (!child || (typeof child !== 'object' && typeof child !== 'function')) {
      val[key] = {}
    }
    if (i === path.length - 1) {
      val[key] = value
    }
    return val[key]
  }, obj)
  return value
}

export const deepKeys = (parent: unknown, isLeaf = (_val: unknown) => false) => {
  const recurse = (obj: unknown, route: Route): Route[] => {
    if (typeof obj !== 'object' || !obj || isLeaf(obj)) {
      return [route]
    }
    const newRoutes = Object.entries(obj).map(e => {
      return recurse(e[1], [...route, e[0]])
    })
    return ([] as Route[]).concat(...newRoutes)
  }
  return recurse(parent, [])
}
