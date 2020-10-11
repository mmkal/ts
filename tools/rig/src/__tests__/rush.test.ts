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
  const {directory} = getRushJson()
  const exampleChangelog = getChangeLog(join(directory, 'packages/eslint-plugin-codegen'))!
  expect(exampleChangelog).toMatchObject({name: 'eslint-plugin-codegen'})
  expect(Object.keys(exampleChangelog)).toMatchInlineSnapshot(`
    Array [
      "name",
      "entries",
    ]
  `)
})

test('non-existent changelog', () => {
  expect(getChangeLog('this/path/does/not/exist')).toBeUndefined()
})
