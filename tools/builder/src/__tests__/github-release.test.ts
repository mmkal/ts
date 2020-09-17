import {createGitHubRelease, getReleaseContent} from '../github-release'
import * as jsYaml from 'js-yaml'
import * as rushMock from '../rush'
import * as childProcess from 'child_process'
import * as lodash from 'lodash'

expect.addSnapshotSerializer({
  test: val => typeof val !== 'function',
  print: val => jsYaml.safeDump(val).trim(),
})

expect.addSnapshotSerializer({
  test: jest.isMockFunction,
  print: (val: any) => jsYaml.safeDump({mock: true, calls: val.mock.calls}).trim(),
})

jest.mock('child_process')
jest.mock('../rush')

beforeEach(jest.clearAllMocks)

type PartialMock<T> = {
  [K in keyof T]+?: T[K] extends (...args: infer A) => infer R
    ? jest.Mock<R, A>
    : T[K] extends Array<infer X>
    ? Array<PartialMock<X>>
    : T[K] extends string | boolean | number | symbol | bigint
    ? T[K]
    : PartialMock<T[K]>
}

const buildMockParams = <Arg>(_fn: (...args: [Arg]) => unknown) => (partial: PartialMock<Arg>) =>
  partial as Arg & typeof partial

const getMockReleaseParams = () =>
  buildMockParams(createGitHubRelease)({
    context: {
      repo: {owner: 'test-owner', repo: 'test-repo'},
    },
    github: {
      repos: {
        createRelease: jest.fn(),
      },
    },
    logger: {
      info: jest.fn(),
    },
  })

jest.spyOn(rushMock, 'getChangeLog').mockReturnValue(changelogSamples().multipleChanges)
jest.spyOn(rushMock, 'getRushJson').mockReturnValue({
  directory: 'a/b/c',
  rush: {projects: [{projectFolder: 'd/e/f'}]} as any,
})

test('create release', async () => {
  jest.spyOn(childProcess, 'execSync').mockReturnValue(Buffer.from('some-pkg_v2\nother-pkg-v3'))

  const params = getMockReleaseParams()
  await createGitHubRelease(params)

  expect(params.github?.repos?.createRelease).toMatchInlineSnapshot(`
    mock: true
    calls:
      - - owner: test-owner
          repo: test-repo
          tag_name: some-pkg_v2
          name: sample-pkg v2.0.0
          body: |-
            ## major changes

            - feat(some-feature): change the api
              this is a BREAKING CHANGE

            ## patch changes

            - chore: patch one.1
            - chore: patch one.2 (@test-author) abc1234
            - chore: patch one.3 (@test-author)
            - chore: patch one.4 def9876
  `)
})

test('create release with header and footer', async () => {
  jest.spyOn(childProcess, 'execSync').mockReturnValue(Buffer.from('some-pkg_v2\nother-pkg-v3'))

  const params = getMockReleaseParams()
  const withHeaderAndFooter = lodash.merge(params, {
    context: {
      payload: {inputs: {header: '# I am a header', footer: 'I am a footer'}},
    },
  })
  await createGitHubRelease(params)

  expect(params.github?.repos?.createRelease).toMatchInlineSnapshot(`
    mock: true
    calls:
      - - owner: test-owner
          repo: test-repo
          tag_name: some-pkg_v2
          name: sample-pkg v2.0.0
          body: |-
            # I am a header

            ## major changes

            - feat(some-feature): change the api
              this is a BREAKING CHANGE

            ## patch changes

            - chore: patch one.1
            - chore: patch one.2 (@test-author) abc1234
            - chore: patch one.3 (@test-author)
            - chore: patch one.4 def9876

            I am a footer
      - - owner: test-owner
          repo: test-repo
          tag_name: other-pkg-v3
          name: sample-pkg
          body: |-
            # I am a header

            I am a footer
  `)
})

test('if git tag returns no tags found in changelog, release is not created', async () => {
  jest.spyOn(childProcess, 'execSync').mockReturnValue(Buffer.from('other-pkg-v3'))

  const params = getMockReleaseParams()
  await createGitHubRelease(params)

  expect(childProcess.execSync).toMatchInlineSnapshot(`
    mock: true
    calls:
      - - git tag --points-at HEAD
  `)

  expect(params.github.repos.createRelease).toHaveBeenCalledTimes(0)
})

test('changelog content', () => {
  expect(getReleaseContent(changelogSamples().multipleChanges, 'some-pkg_v2')).toMatchInlineSnapshot(`
    name: sample-pkg v2.0.0
    body: |-
      ## major changes

      - feat(some-feature): change the api
        this is a BREAKING CHANGE

      ## patch changes

      - chore: patch one.1
      - chore: patch one.2 (@test-author) abc1234
      - chore: patch one.3 (@test-author)
      - chore: patch one.4 def9876
  `)
})

test('nothing returned when tag does not match', () => {
  expect(getReleaseContent(changelogSamples().multipleChanges, 'other-tag-xyz')).toMatchInlineSnapshot(`
    name: sample-pkg
    body: ''
  `)
})

function changelogSamples() {
  type Changelog = Parameters<typeof getReleaseContent>[0]
  const multipleChanges: Changelog = {
    name: 'sample-pkg',
    entries: [
      {
        version: '2.0.0',
        tag: 'some-pkg_v2',
        date: 'Thu, 17 Sep 2020 10:47:43 GMT',
        comments: {
          patch: [
            {
              comment: 'chore: patch one.1',
            },
            {
              comment: 'chore: patch one.2',
              author: 'test-author',
              commit: 'abc1234',
            },
            {
              comment: 'chore: patch one.3',
              author: 'test-author',
            },
            {
              comment: 'chore: patch one.4',
              commit: 'def9876',
            },
          ],
        },
      },
      {
        version: '2.0.0',
        tag: 'some-pkg_v2',
        date: 'Thu, 17 Sep 2020 10:47:43 GMT',
        comments: {
          major: [
            {
              comment: 'feat(some-feature): change the api\nthis is a BREAKING CHANGE',
            },
          ],
        },
      },
      {
        version: '1.9.9',
        tag: 'some-pkg_v1.9.9',
        date: 'Wed, 16 Sep 2020 21:06:32 GMT',
        comments: {
          patch: [
            {
              comment: 'chore: bump io-ts version (#161)',
            },
          ],
        },
      },
    ],
  }

  return {multipleChanges}
}
