export const memoize = <Params extends any[], T>(func: (...args: Params) => T, getKey = JSON.stringify) => {
  const cache = new Map<string, T>()
  const wrapped = (...args: Params) => {
    const key = getKey(args)
    if (cache.has(key)) {
      return cache.get(key)!
    }
    const result = func(...args)
    cache.set(key, result)
    return result
  }
  return Object.assign(wrapped, {cache, getKey})
}
