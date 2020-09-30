const {EOL} = require('os')
const {getRushJson} = require('.')

/** @type {import('../../packages/eslint-plugin-codegen').Preset<{}>} */
module.exports = params => {
  const {rush} = getRushJson()
  const matchedProject = rush.projects.find(p => params.meta.filename.replace(/\\/g, '/').includes(p.projectFolder))
  const relativePath = matchedProject.projectFolder
  const leafPkg = {name: matchedProject.packageName}

  const {url: repo, defaultBranch: branch} = rush.repository
  const codecovUrl = repo.replace('github.com', 'codecov.io/gh')

  return `
    [![Node CI](${repo}/workflows/Node%20CI/badge.svg)](${repo}/actions?query=workflow%3A%22Node+CI%22)
    [![codecov](${codecovUrl}/branch/${branch}/graph/badge.svg)](${codecovUrl}/tree/${branch}/${relativePath})
    [![npm version](https://badge.fury.io/js/${leafPkg.name}.svg)](https://npmjs.com/package/${leafPkg.name})
  `
    .replace(/\r?\n +/g, EOL)
    .trim()
}
