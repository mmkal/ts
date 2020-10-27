const fs = require('fs')
const path = require('path')

const permalinkable = ['readme.md']

permalinkable.forEach(file => {
  const filepath = path.join(process.cwd(), file)
  const backupPath = filepath + '.bak'

  if (fs.existsSync(backupPath)) {
    fs.renameSync(backupPath, filepath)
  }
})
