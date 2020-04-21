const dedent = require('dedent')
const readPkgUp = require('read-pkg-up')
const path = require('path')

/** @type {import('eslint-plugin-codegen').Preset<{}>} */
module.exports = params => {
  const {path: rootPath, packageJson: rootPkg} = readPkgUp.sync()
  const {path: leafPath, packageJson: leafPkg} = readPkgUp.sync({cwd: params.meta.filename})

  const relativePath = path.relative(path.dirname(rootPath), path.dirname(leafPath)).replace(/\\/g, '/')

  const repo = 'https://github.com/mmkal/ts'

  return dedent`
    [![Node CI](${repo}/workflows/Node%20CI/badge.svg)](${repo}/actions?query=workflow%3A%22Node+CI%22)
    [![codecov](https://codecov.io/gh/mmkal/ts/branch/master/graph/badge.svg)](https://codecov.io/gh/mmkal/ts/tree/master/${relativePath})
    [![npm version](https://badge.fury.io/js/${leafPkg.name}.svg)](https://npmjs.com/package/${leafPkg.name})
  `
}
