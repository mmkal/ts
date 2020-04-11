import {Type, TypeOf, RefinementC, RefinementType, success, failure, getFunctionName, Context, Any} from 'io-ts'
import {either} from 'fp-ts/lib/Either'

const chain = either.chain

/**
 * Like io-ts's refinement type but:
 * 1. Not deprecated (see https://github.com/gcanti/io-ts/issues/373)
 * 2. Passes in `Context` to the predicate argument, so you can check parent key names etc.
 * 3. Optionally allows returning another io-ts codec instead of a boolean for better error messages.
 *
 * @example
 * const CloudResources = narrow(
 *   t.type({
 *     database: t.type({username: t.string, password: t.string}),
 *     service: t.type({dbConnectionString: t.string}),
 *   }),
 *   ({database}) => t.type({
 *     service: t.type({dbConnectionString: t.literal(`${database.username}:${database.password}`)}),
 *   })
 * )
 *
 * const valid = CloudResources.decode({
 *   database: {username: 'user', password: 'pass'},
 *   service: {dbConnectionString: 'user:pass'},
 * })
 * // returns a `Right`
 *
 * const invalid = CloudResources.decode({
 *   database: {username: 'user', password: 'pass'},
 *   service: {dbConnectionString: 'user:wrongpassword'},
 * })
 * // returns a `Left` - service.dbConnectionString expected "user:pass", but got "user:wrongpassword"
 */
export const narrow = <C extends Any, D extends Any>(
  codec: C,
  predicate: (value: TypeOf<C>, context: Context) => D | boolean,
  name: string = `(${codec.name} | ${getFunctionName(predicate)})`
): RefinementC<C> => {
  return new RefinementType(
    name,
    (u): u is TypeOf<C> => {
      if (!codec.is(u)) {
        return false
      }
      const refined = predicate(u, [])
      if (refined instanceof Type) {
        return refined.is(u)
      }
      return refined
    },
    (i, c) =>
      chain(codec.validate(i, c), a => {
        const refined = predicate(a, c)
        if (refined instanceof Type) {
          return refined.validate(a, c)
        }
        if (refined) {
          return success(a)
        }
        return failure(a, c)
      }),
    codec.encode,
    codec,
    predicate as any
  )
}
