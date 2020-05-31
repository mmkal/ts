const glob = require('glob')
const fs = require('fs')
const path = require('path')
const readPkgUp = require('read-pkg-up')
const childProcess = require('child_process')

const readmes = glob.sync('**/*.md', {ignore: ['**/node_modules/**', '**/CHANGELOG.md']})

const repoPkg = readPkgUp.sync()
const repo = repoPkg.packageJson.repository.url.replace(/^git\+/, '').replace(/\.git$/, '')
const gitHash = childProcess.execSync('git rev-parse --short HEAD').toString().trim()

readmes.forEach(file => {
  const packageDir = path.dirname(file)
  const leafPkg = readPkgUp.sync({cwd: packageDir})
  if (leafPkg.path === repoPkg.path) {
    return
  }
  const tag = gitHash
  const content = fs.readFileSync(file).toString()
  const withPermaLinks = content.replace(/\[(.*?)]\((.*?)\)/g, (match, text, href) => {
    if (
      href.startsWith('#') ||
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.includes('../') ||
      href.match(/\s/)
    ) {
      return match
    }

    const isImage = href.endsWith('.jpg') || href.endsWith('.png') || href.endsWith('.gif')
    const baseURL = isImage ? repo.replace('github.com', 'raw.githubusercontent.com') : `${repo}/tree`
    const permalinkedHref = `${baseURL}/${encodeURIComponent(tag)}/${packageDir}/` + href.replace(/^\.\//, '')

    return `[${text}](${permalinkedHref})`
  })
  fs.writeFileSync(file, withPermaLinks, 'utf8')
})
