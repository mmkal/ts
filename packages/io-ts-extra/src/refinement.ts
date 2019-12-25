import {TypeOf, RefinementC, RefinementType, success, failure, getFunctionName, Context, Any} from 'io-ts'
import {Either, either, isLeft, left, right} from 'fp-ts/lib/Either'

const chain = either.chain

export function refinement<C extends Any>(
  codec: C,
  predicate: (value: TypeOf<C>, context: Context) => boolean,
  name: string = `(${codec.name} | ${getFunctionName(predicate)})`
): // tslint:disable-next-line: deprecation
RefinementC<C> {
  return new RefinementType(
    name,
    (u): u is TypeOf<C> => codec.is(u) && predicate(u, []),
    (i, c) => chain(codec.validate(i, c), a => (predicate(a, c) ? success(a) : failure(a, c))),
    codec.encode,
    codec,
    predicate as any
  )
}
