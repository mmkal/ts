import {TypeOf, RefinementC, RefinementType, success, failure, getFunctionName, Context, Any} from 'io-ts'
import {either} from 'fp-ts/lib/Either'

const chain = either.chain

/**
 * Like io-ts's refinement type but:
 * 1. Not deprecated (see https://github.com/gcanti/io-ts/issues/373)
 * 2. Passes in `Context` to the predicate argument, so you can check parent key names etc.
 */
export function refinement<C extends Any>(
  codec: C,
  predicate: (value: TypeOf<C>, context: Context) => boolean,
  name: string = `(${codec.name} | ${getFunctionName(predicate)})`
): RefinementC<C> {
  return new RefinementType(
    name,
    (u): u is TypeOf<C> => codec.is(u) && predicate(u, []),
    (i, c) => chain(codec.validate(i, c), a => (predicate(a, c) ? success(a) : failure(a, c))),
    codec.encode,
    codec,
    predicate as any
  )
}
