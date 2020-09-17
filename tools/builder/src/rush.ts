import * as ESON from 'eson-parser'
import * as findUp from 'find-up'
import * as fs from 'fs'
import * as path from 'path'
import type {RushConfiguration} from '@microsoft/rush-lib'
import type {IChangelog} from '@microsoft/rush-lib/lib/api/Changelog'

export const getRushJson = (): RushConfiguration => {
  const rushJsonPath = findUp.sync('rush.json')
  return ESON.parse(fs.readFileSync(rushJsonPath || 'rush.json').toString())
}

export const getChangeLog = (projectFolder: string): IChangelog => {
  const changeLogPath = path.join(projectFolder, 'CHANGELOG.json')
  if (!fs.existsSync(changeLogPath)) {
    return {
      entries: [],
      name: '',
    }
  }
  return ESON.parse(fs.readFileSync(changeLogPath).toString())
}
