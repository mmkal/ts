import * as os from 'os'
import {dedent} from './util'
import {MergeStrategy, BeforeWrite} from './types'

export const defaultMergeStrategy: MergeStrategy = params => params.targetContent

export const defaultBeforeWrites: BeforeWrite[] = [
  params => dedent(params.content),
  params => params.content.trim() + os.EOL,
]
