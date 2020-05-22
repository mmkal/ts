export type Route = string[]

export const get = (obj: any, path: Route) => path.reduce((val, key) => val?.[key], obj)

export const set = (obj: any, path: Route, value: any) => {
  const setOrPush = (parent: any, key: any, child: any) => {
    if (Array.isArray(parent) && key === parent.length) {
      parent.push(child)
    } else {
      parent[key] = child
    }
  }
  path.reduce((parent, key, i, arr) => {
    const child = parent[key]
    if (!child || (typeof child !== 'object' && typeof child !== 'function')) {
      if (arr[i + 1]?.match(/^\d+$/)) {
        parent[key] = []
      } else {
        parent[key] = {}
      }
    }
    if (i === path.length - 1) {
      setOrPush(parent, key, value)
    }
    return parent[key]
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
