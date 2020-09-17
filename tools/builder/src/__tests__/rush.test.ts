import {join} from 'path'
import {getChangeLog, getRushJson} from '../rush'

test('snapshot rush.json keys', () => {
  expect(Object.keys(getRushJson().rush)).toMatchInlineSnapshot(`
    Array [
      "$schema",
      "rushVersion",
      "pnpmVersion",
      "pnpmOptions",
      "nodeSupportedVersionRange",
      "ensureConsistentVersions",
      "gitPolicy",
      "repository",
      "eventHooks",
      "variants",
      "projects",
    ]
  `)
})

test('snapshot changelog.json', () => {
  const {directory, rush} = getRushJson()
  expect(Object.keys(getChangeLog(join(directory, rush.projects[0].projectFolder)))).toMatchInlineSnapshot(`
    Array [
      "entries",
      "name",
    ]
  `)
})
