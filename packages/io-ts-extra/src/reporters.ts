import * as t from 'io-ts'
import {inspect} from 'util'

export const validationErrors = (validation: t.Validation<unknown>, typeAlias?: string) => {
  if (validation._tag === 'Right') {
    return ['no errors']
  }
  return validation.left.map(e => {
    const name = typeAlias || (e.context[0] && e.context[0].type.name)
    const lastType = e.context.length && e.context[e.context.length - 1].type.name
    const path = name + e.context.map(c => c.key).join('.')
    return `Invalid value {${inspect(e.value)}} supplied to ${path}. Expected ${lastType}.`
  })
}
