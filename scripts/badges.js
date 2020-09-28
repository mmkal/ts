const dedent = require('../packages/eslint-plugin-codegen/node_modules/dedent')
const {getRushJson} = require('../tools/builder')

/** @type {import('../packages/eslint-plugin-codegen').Preset<{}>} */
module.exports = params => {
  const {rush} = getRushJson()
  const matchedProject = rush.projects.find(p => params.meta.filename.replace(/\\/g, '/').includes(p.projectFolder))
  const relativePath = matchedProject.projectFolder
  const leafPkg = {name: matchedProject.packageName}

  const repo = 'https://github.com/mmkal/ts'

  return dedent`
    [![Node CI](${repo}/workflows/Node%20CI/badge.svg)](${repo}/actions?query=workflow%3A%22Node+CI%22)
    [![codecov](https://codecov.io/gh/mmkal/ts/branch/main/graph/badge.svg)](https://codecov.io/gh/mmkal/ts/tree/main/${relativePath})
    [![npm version](https://badge.fury.io/js/${leafPkg.name}.svg)](https://npmjs.com/package/${leafPkg.name})
  `
}
