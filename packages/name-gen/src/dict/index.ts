// barrelme:start
export * from './animal'
export * from './femaleName'
export * from './lastName'
export * from './maleName'
export * from './positiveAdjective'
// barrelme:end

Object.entries(module.exports).forEach(([name, list]: any) => {
  while (list[0].length === 0) {
    list.shift()
  }
  while (list[list.length - 1].length === 0) {
    list.pop()
  }
})
