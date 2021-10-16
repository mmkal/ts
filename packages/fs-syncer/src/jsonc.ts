import {createHash} from 'crypto'
import {get} from './util'

export const jsonC = Symbol('jsonc')
export type JSONC = string & {[jsonC]: true}

/**
 * Parses json, and handles **some** jsonc-style comments, preserving them as real properties.
 * Note: the parsed output is usually **not** something you'd want to serialise or persist, but it
 * is useful for modifying config files which include comments (e.g. https://github.com/microsoft/rushstack/tree/master/rush.json)
 *
 * Note: not all jsonc comments are handled:
 * - Comments on the same line as other properties e.g.
 * ```
 * {
 *   "foo": "bar" // this comment will cause an error
 * }
 * ```
 * - Comments that aren't preceding properties e.g.
 * ```
 * {
 *   "foo": "bar"
 *   // this comment will cause an error
 * }
 * ```
 *
 * @example
 * ```
 * const oldContent `{
 *   // this setting is set to true because of important reasons
 *   "originalSetting": true
 * }`
 *
 * const config = JSONC.parse(oldContent)
 *
 * config.additionalSetting = 'abc'
 *
 * expect(JSONC.stringify(config)).toEqual(`{
 *   // this setting is set to true because of important reasons
 *   "originalSetting": true,
 *   "additionalSetting": "abc"
 * }`)
 * ```
 */
export const parse = (jsonc: JSONC) => {
  const hash = createHash('md5').update(jsonc).digest('hex')
  const clashes = jsonc.match(/\/\/\d+/g)
  let commentCounter = 0
  for (const m of clashes || []) {
    commentCounter = Math.max(commentCounter, Number.parseInt(m.replace('//', ''), 10) + 1)
  }
  const lines = jsonc.split('\n')
  let blockStart = -1
  const withCommentValues = lines.map((s, i, arr) => {
    const trimmed = s.trim()
    let commentProp = ''
    if (blockStart === -1 && trimmed.startsWith('/*')) {
      blockStart = i
    }

    if (blockStart > -1 && trimmed.endsWith('*/')) {
      commentProp = lines
        .slice(blockStart, i + 1)
        .join('\n')
        .trim()
      blockStart = -1
    } else if (trimmed.startsWith('//')) {
      commentProp = trimmed
    }

    if (commentProp) {
      const addedJson = {
        [`//${++commentCounter} jsonc comment ${hash}`]: JSON.stringify({
          comment: commentProp,
          nextLine: arr[i + 1],
        }),
      }
      return JSON.stringify(addedJson).slice(1, -1) + ','
    } else if (blockStart > -1) {
      return ''
    }

    return s
  })

  const json = withCommentValues.join('\n')
  try {
    return JSON.parse(json)
  } catch (e: unknown) {
    if (e instanceof SyntaxError && e.message.match(/position \d+$/)) {
      const position = Number.parseInt(e.message.split(' ').slice(-1)[0], 10)
      e.message += `\n${json.slice(0, position)} --> ${json[position]} <-- ${json.slice(position + 1)}`
    }
    throw e
  }
}

// No 'z' - this a private variable so I'll spell it how I damn well please.
const normaliseJsonLine = (line: string) => line.trim().replace(/\s*,$/, '')

export const stringify = (obj: any, replacer: Array<string | number> | null = null, space?: string | number): JSONC => {
  const json = JSON.stringify(obj, replacer, space ?? 2)
  const lines = json.split('\n')
  const withComments = lines.map((s, i, arr) => {
    const trimmed = s.trim()
    if (trimmed.match(/^"\/\/\d+ jsonc comment \w+"/)) {
      const margin = s.slice(0, s.indexOf(`"`))
      // json json json json
      const jsonjson = JSON.parse(`{${trimmed.replace(/,?\r?$/, '')}}`)
      const {comment, nextLine} = JSON.parse(jsonjson[Object.keys(jsonjson)[0]])
      if (normaliseJsonLine(nextLine) !== normaliseJsonLine(arr[i + 1])) {
        return `${margin}// comment on ${nextLine.split(':')[0].trim()} removed due to content change.`
      }
      return margin + comment
    }
    return s
  })

  return withComments.join('\n') as JSONC
}

/**
 * Parses json, and handles **some** jsonc-style comments, preserving them as real properties.
 * This is useful for modifying config files which include comments (e.g. https://github.com/microsoft/rushstack/tree/master/rush.json)
 *
 * The function should be called with a json-like string and an `edit` function, which will receive the parsed
 * object, and a `comment` function. Mutate the parsed content to add, remove or change properties, and
 * use the `comment` function to add comments which will be rendered above the specified property.
 *
 * @example
 * ```
 * const oldContent `{
 *   // this setting is set to true because of important reasons
 *   "originalSetting": true
 * }`
 * 
 * const newContent = JSONC.edit(oldContent, (config, comment) => {
 *   config.additionalSetting = {foo: 'bar'}
 * 
 *   comment(
 *     ['additionalSetting', 'foo'],
 *     'This value must be either "bar" or "baz" or things will explode!',
 *   )
 * })
 *
 * expect(newContent).toEqual(`{
 *   // this setting is set to true because of important reasons
 *   "originalSetting": true,
 *   "additionalSetting": {
 *     // This value must be either "bar" or "baz" or things will explode!
 *     "foo": "bar"
 *   }
 * }`)
 * ```
 *
 * Note: not all jsonc comments are handled:
 * - Comments on the same line as other properties e.g.
 * ```
 * {
 *   "foo": "bar" // this comment will cause an error
 * }
 * ```
 * - Comments that aren't above properties e.g.
 * ```
 * {
 *   "foo": "bar"
 *   // this comment will cause an error
 * }
 * ```

 *
 * @param jsonc json-ish string input. This can include comments with some caveats.
 * @param editor A function which modifies the parsed
 */
export const edit = <T = any>(
  jsonc: string,
  editor: (obj: T, addComment: (path: string[], comment: string) => void) => void
): JSONC => {
  const obj = parse(jsonc as JSONC)
  // const indent = typeof space === 'string' ? space : ' '.repeat(space ?? 2)
  const indent = jsonc?.split('\n')[1]?.match(/^\s+/)?.[0] || '  '

  const addComment = (path: string[], comment: string) => {
    const parent = get(obj, path.slice(0, -1))
    const last = path[path.length - 1]
    if (!parent) {
      throw new TypeError(`Can't add comment to path [${path}]. Parent path is not defined.`)
    }
    const parentJson = stringify(parent, null, indent)

    // this searches for key that needs to be commented. It should be reliable because
    // JSON doesn't allow newlines, and requires key-quoting. So if you see a newline,
    // some whitespace and a then "thekey", you know that corresponds to the right property.
    // todo: escape `JSON.stringify(last)` or don't use new RegExp
    const keyToBeCommentedRegExp = new RegExp(`\\n\\s+${JSON.stringify(last)}`)

    const withExtraComment = parentJson.replace(keyToBeCommentedRegExp, r => {
      const padding = r.split('"')[0] + indent.repeat(path.length - 1)

      const commentedOutComment = comment.includes('\n')
        ? '/**' +
          comment
            .trim()
            .split('\n')
            .map(c => `${padding} * ${c}`)
            .join('') +
          padding +
          ' */'
        : `// ${comment}`

      return `${padding}${commentedOutComment}${r}`
    })

    // need to modify the object in place, so delete all the old keys and add all the new ones

    const parentReplacement = parse(withExtraComment as JSONC)
    Object.keys(parent).forEach(k => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete parent[k]
    })
    Object.keys(parentReplacement).forEach(k => {
      parent[k] = parentReplacement[k]
    })
  }

  editor(obj, addComment)

  return stringify(obj, null, indent)
}
