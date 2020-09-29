/** @type {string[]} */
const argv = process.argv
const [command] = argv.splice(2, 1)
const commands = {
  tsc: 'typescript/bin/tsc',
  eslint: 'eslint/bin/eslint',
  jest: 'jest/bin/jest',
  rimraf: 'rimraf/bin',
}
if (command === 'jest') {
  // hack: workaround https://github.com/facebook/jest/issues/5064 to avoid "completed with warnings" messages
  Object.defineProperty(process, 'stderr', {get: () => process.stdout})
}
require(commands[command])
