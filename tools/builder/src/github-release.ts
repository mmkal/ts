import * as childProcess from 'child_process'
import {getChangeLog, getRushJson} from './rush'
import * as lodash from 'lodash'
import type {Context} from '@actions/github/lib/context'
import type {GitHub} from '@actions/github/lib/utils'
import type {IChangelog} from '@microsoft/rush-lib/lib/api/Changelog'

export type GH = typeof GitHub extends new (...args: any[]) => infer G ? G : never

/**
 * Reads tags pointing at the current git head, compares them with CHANGELOG.json files for each rush project,
 * and creates a GitHub release accordingly. This assumes that the git head is a commit created by `rush publish`.
 * @param param an object consisting of `context` and `github` values, as supplied by the `github-script` action.
 */
export const createGitHubRelease = async ({context, github}: {context: Context; github: GH}) => {
  const tags: string[] =
    context.payload?.inputs?.tags?.split(',') ||
    childProcess
      .execSync('git tag --points-at HEAD')
      .toString()
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean)

  const rushJson = getRushJson()

  const allReleaseParams = lodash
    .chain(rushJson.projects)
    .flatMap(project => tags.map(tag => ({tag, project})))
    .map(({project, tag}): Parameters<typeof github.repos.createRelease>[0] => {
      const changelog = getChangeLog(project.projectFolder)
      const {name, body} = getReleaseContent(changelog, tag)
      const inputs = context?.payload?.inputs

      return {
        owner: context.repo.owner,
        repo: context.repo.repo,
        tag_name: tag,
        name,
        body: [inputs?.header, body, inputs?.footer].filter(Boolean).join('\n\n'),
      }
    })
    .filter(p => Boolean(p?.name && p.body))
    .value()

  console.log('releasing', allReleaseParams)
  // await Promise.all(allReleaseParams.map(github.repos.createRelease))
}

export const getReleaseContent = (changelog: IChangelog, tag: string) => {
  const relevantEntries = changelog.entries.filter(e => e.tag === tag)

  const versions = lodash.uniq(relevantEntries.map(e => 'v' + e.version))
  const name = `${changelog.name} ${versions.join(', ')}`.trim()

  const body = lodash
    .chain(relevantEntries)
    .flatMap(({comments, ...e}) => Object.entries(comments).map(([type, comment]) => ({...e, type, comment})))
    .flatMap(({comment, ...e}) => comment!.map(c => ({...e, ...c})))
    .map(e => ({
      ...e,
      bullet: ['-', e.comment.replace(/\n/g, '\n  '), e.author && `(@${e.author})`, e.commit].filter(Boolean).join(' '),
    }))
    .groupBy(e => e.type)
    .entries()
    .sortBy(([type]) => (type === 'major' ? 0 : type === 'minor' ? 1 : 2))
    .map(([type, group]) => [`## ${type} changes\n`, ...group.map(c => c.bullet)].join('\n'))
    .join('\n\n')
    .value()
    .trim()

  return {name, body}
}
