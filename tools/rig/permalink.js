const {getRushJson} = require('.')
const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')

const permalinkable = ['readme.md']

const gitHash = childProcess.execSync('git rev-parse --short HEAD').toString().trim()

permalinkable.forEach(file => {
  const {rush} = getRushJson()
  const matchedProject = rush.projects.find(p => path.join(process.cwd(), file).replace(/\\/g, '/').includes(p.projectFolder))
  const repo = rush.repository.url

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
    const permalinkedHref = `${baseURL}/${encodeURIComponent(tag)}/${matchedProject.projectFolder}/` + href.replace(/^\.\//, '')

    return `[${text}](${permalinkedHref})`
  })
  if (withPermaLinks !== content) {
    fs.writeFileSync(file + '.bak', content, 'utf8')
    fs.writeFileSync(file, withPermaLinks, 'utf8')
  }
})
