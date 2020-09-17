import {join} from 'path'
import {getChangeLog, getRushJson} from '../rush'

test('rush.json', () => {
  expect(getRushJson().rush).toMatchObject({
    projects: expect.arrayContaining([expect.anything()]),
  })
})

test('example changelog.json', () => {
  const {directory} = getRushJson()
  const exampleChangelog = getChangeLog(join(directory, 'packages/eslint-plugin-codegen'))
  expect(exampleChangelog).toMatchObject({name: 'eslint-plugin-codegen'})
  expect(exampleChangelog).toMatchObject({
    name: 'eslint-plugin-codegen',
    entries: expect.arrayContaining([expect.anything()]),
  })
})

test('non-existent changelog', () => {
  expect(getChangeLog('this/path/does/not/exist')).toEqual({
    name: '',
    entries: [],
  })
})
