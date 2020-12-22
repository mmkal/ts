import {MergeStrategy} from './types'
import * as JSONC from './jsonc'
import {uniq} from './util'

const isMergeable = (obj: unknown) => obj && typeof obj === 'object' && !Array.isArray(obj)

export const mergeObjects = (left: any, right: any): any => {
  if (isMergeable(left) && isMergeable(right)) {
    const keys = uniq([...Object.keys(right), ...Object.keys(left)])
    return keys.reduce((acc, next) => ({...acc, [next]: mergeObjects(left[next], right[next])}), {} as any)
  }

  return typeof right === 'undefined' ? left : right
}

export const mergeConfigs: MergeStrategy = params => {
  let merged: any
  JSONC.edit(params.existingContent || '{}', existing => {
    JSONC.edit(params.targetContent || '{}', target => {
      merged = mergeObjects(existing, target)
    })
  })

  return JSONC.stringify(merged)
}
