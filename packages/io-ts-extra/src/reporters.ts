import {inspect} from 'util'
import {EOL} from 'os'

/**
 * Similar to io-ts's PathReporter, but gives slightly less verbose output.
 * @param validation Usually the result of calling `.decode` with an io-ts codec.
 * @param typeAlias io-ts type names can be very verbose. If the type you're using doesn't have a name, you can use this to keep error messages shorter.
 */
export const validationErrors = (validation: t.Validation<unknown>, typeAlias?: string) => {
  if (validation._tag === 'Right') {
    return ['No errors!']
  }
  return validation.left.map(e => {
    const name = typeAlias || (e.context[0] && e.context[0].type.name)
    const lastType = e.context.length && e.context[e.context.length - 1].type.name
    const path = name + e.context.map(c => c.key).join('.')
    return `Invalid value {${inspect(e.value)}} supplied to ${path}. Expected ${lastType}.`
  })
}

/**
 * Either returns the `.right` of a io-ts `Validation`, or throws with a report of the validation error.
 * @see validationErrors
 */
export const getRightUnsafe = <T>(validation: t.Validation<T>, typeAlias?: string) => {
  if (validation._tag === 'Right') {
    return validation.right
  }
  throw Error(validationErrors(validation, typeAlias).join(EOL))
}
