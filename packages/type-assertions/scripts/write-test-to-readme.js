// todo: consolidate a generalised, parameterised version of this into barrelme

const fs = require('fs')
const path = require('path')

const tests = fs.readFileSync(path.join(__dirname, '../src/__tests__/index.test.ts')).toString()

const exampleMarkers = {
  start: '<!-- example:start -->',
  end: '<!-- example:end -->',
}

const readmePath = path.join(__dirname, '../readme.md')
const readme = fs.readFileSync(readmePath).toString() + '\n' + exampleMarkers.start + '\n' + exampleMarkers.end

const exampleTestDeclaration = `it('tests types'`
const exampleTestSlicePoints = [tests.indexOf(exampleTestDeclaration)]
exampleTestSlicePoints.push(tests.indexOf(`it(`, exampleTestSlicePoints + 1))

if (exampleTestSlicePoints.some(i => i === -1)) {
  throw Error(`expect to find test declared with "${exampleTestDeclaration}..."` + exampleTestSlicePoints)
}

const exampleTest = tests.slice(exampleTestSlicePoints[0], exampleTestSlicePoints[1]).trim()

const [beforeExample, afterExample] = readme.split(exampleMarkers.start)
const newReadmeContent = [
  beforeExample.trim(),
  '\n' + exampleMarkers.start,
  '```typescript',
  `import {expectTypeOf} from '@mmkal/type-assertions'`,
  '',
  exampleTest,
  '```',
  exampleMarkers.end + '\n',
  afterExample.split(exampleMarkers.end)[1].trim(),
].join('\n')

fs.writeFileSync(readmePath, newReadmeContent.trim() + '\n', 'utf8')
