import {MergeStrategy} from './types'
import * as JSONC from './jsonc'
import {uniq} from './util'

const isMergeable = (obj: unknown) => obj && typeof obj === 'object' && obj.toString() === '[object Object]'

/**
 * @experimental
 * Deep merge two objects. The `right` object "wins" when values can't be merged (primitives, arrays etc.).
 */
export const mergeObjects = (left: any, right: any): any => {
  if (isMergeable(left) && isMergeable(right)) {
    const keys = uniq([...Object.keys(right), ...Object.keys(left)])
    return keys.reduce((acc, next) => ({...acc, [next]: mergeObjects(left[next], right[next])}), {} as any)
  }

  return typeof right === 'undefined' ? left : right
}

// todo: consider whether this is making too much of an assumption that we "prefer" the target content
// a lot of scenarios would need a more cautious algorithm which throws on conflicts, or a more agressive
// one which prefers "target" content (say, important settings like package naming conventions), or some
// kind of mixture based on filename (let users have their own vscode settings, but don't let them choose
// their own package naming conventions).
// so maybe some options are needed into these params?
/**
 * @experimental
 * Deep-merge two json-like config files. Comments will be _mostly_ preserved. The second argument
 * "wins" when a property that can't be merged (primitives, arrays etc.) is found in both.
 */
export const mergeJsonConfigs: MergeStrategy = params => {
  if (params.filepath.endsWith('.ts')) {
    console.log({params})
  }
  if (!params.filepath.endsWith('.json')) {
    return params.targetContent || params.existingContent
  }
  let merged: any
  JSONC.edit(params.existingContent || '{}', existing => {
    JSONC.edit(params.targetContent || '{}', target => {
      // todo: make this less callback-ish? would need `addComment` to push args to a queue instead of doing stuff right away
      merged = mergeObjects(existing, target)
    })
  })

  return JSONC.stringify(merged)
}
