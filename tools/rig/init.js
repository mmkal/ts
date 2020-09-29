const fs = require('fs')
const path = require('path')
const os = require('os')

exports.init = () => {
  const helperPkgJson = require('./package.json')

  const cwd = process.cwd()
  const pkgJsonPath = path.join(cwd, 'package.json')
  const oldContent = fs.existsSync(pkgJsonPath) ? fs.readFileSync(pkgJsonPath).toString() : '{}'
  const pkgJson = JSON.parse(oldContent)

  pkgJson.name = pkgJson.name || path.basename(cwd)
  pkgJson.version = pkgJson.version || '0.0.1'
  pkgJson.main = pkgJson.main || 'dist/index.js'
  pkgJson.types = pkgJson.types || 'dist/index.d.ts'
  pkgJson.scripts = pkgJson.scripts || {}
  pkgJson.scripts.clean = pkgJson.scripts.clean || 'rig rimraf dist'
  pkgJson.scripts.prebuild = pkgJson.scripts.prebuild || 'npm run clean'
  pkgJson.scripts.build = pkgJson.scripts.build || 'rig tsc -p .'
  pkgJson.scripts.lint = pkgJson.scripts.lint || 'rig eslint --cache .'
  pkgJson.scripts.test = pkgJson.scripts.test || 'rig jest'
  pkgJson.devDependencies = pkgJson.devDependencies || {}
  pkgJson.devDependencies[helperPkgJson.name] = pkgJson.devDependencies[helperPkgJson.name] || helperPkgJson.version

  const stringify = obj => JSON.stringify(obj, null, 2) + os.EOL
  const newContent = stringify(pkgJson)
  if (newContent !== oldContent) {
    fs.writeFileSync(pkgJsonPath, newContent, 'utf8')
  }

  const eslintrcPath = path.join(process.cwd(), '.eslintrc.js')
  if (!fs.existsSync(eslintrcPath)) {
    fs.writeFileSync(eslintrcPath, `module.exports = require('${helperPkgJson.name}/.eslintrc')${os.EOL}`, 'utf8')
  }

  const jestConfigPath = path.join(cwd, 'jest.config.js')
  if (!fs.existsSync(jestConfigPath)) {
    fs.writeFileSync(jestConfigPath, `module.exports = require('${helperPkgJson.name}/jest.config')${os.EOL}`, 'utf8')
  }

  const tsconfigPath = path.join(cwd, 'tsconfig.json')
  if (!fs.existsSync(tsconfigPath)) {
    fs.writeFileSync(
      tsconfigPath,
      stringify({
        extends: './node_modules/@mmkal/rig/tsconfig.json',
        compilerOptions: {
          rootDir: 'src',
          outDir: 'dist',
          tsBuildInfoFile: 'dist/buildinfo.json',
          typeRoots: ['node_modules/@mmkal/rig/node_modules/@types'],
        },
        exclude: ['node_modules', 'dist'],
      }),
      'utf8'
    )
  }

  const npmIgnorePath = path.join(cwd, '.npmignore')
  const content = `
    node_modules
    **/__tests__
    dist/buildinfo.json
    .eslintcache
    .eslintrc.js
    .rush
    .heft
    *.log
    tsconfig.json
    config/jest.config.json
    jest.config.js
  `.trim().replace(/\r?\n +/g, os.EOL)
  const exists = fs.existsSync(npmIgnorePath)
  if (exists && !fs.readFileSync(npmIgnorePath).toString().startsWith(content)) {
    throw Error(`${npmIgnorePath} is expected to include this content:\n\n${content}`)
  } else if (!exists) {
    fs.writeFileSync(npmIgnorePath, content + os.EOL)
  }

  const readmePath = path.join(cwd, 'readme.md')
  if (!fs.existsSync(readmePath) && !fs.existsSync(path.join(cwd, 'README.md'))) {
    fs.writeFileSync(readmePath, `# ${pkgJson.name}${os.EOL}${os.EOL}${pkgJson.description || ''}`.trim(), 'utf8')
  }
}

if (require.main === module) {
  exports.init()
}
