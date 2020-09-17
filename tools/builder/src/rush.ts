import * as ESON from 'eson-parser' // Fork of json5, probably wouldn't use it if it weren't mine. Should be easy to switch to json5 if there are any problems. https://github.com/json5/json5/issues/190#issuecomment-636935746
import * as findUp from 'find-up'
import * as fs from 'fs'
import * as path from 'path'
import type {RushConfiguration} from '@microsoft/rush-lib'
import type {IChangelog} from '@microsoft/rush-lib/lib/api/Changelog'

export const getRushJson = (): {directory: string; rush: RushConfiguration} => {
  const rushJsonPath = findUp.sync('rush.json') as string
  return {
    directory: path.dirname(rushJsonPath),
    rush: ESON.parse(fs.readFileSync(rushJsonPath).toString())
  }
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
