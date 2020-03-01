import * as t from 'io-ts'
import {RichError, funcLabel} from './util'
import * as Either from 'fp-ts/lib/Either'
import {pipe} from 'fp-ts/lib/pipeable'

export type Decoder<A, O = A, I = unknown> = Omit<t.Type<A, O, I>, 'encode'>
// prettier-ignore
interface Mapper {
  <From, To>(from: t.Type<From>, to: t.Type<To>, map: (f: From) => To): Decoder<To, From> & {from: From; to: To}
  <From, To>(from: t.Type<From>, to: t.Type<To>, map: (f: From) => To, unmap: (t: To) => From): t.Type<To, From, From> & {from: From; to: To}
}

/**
 * A helper for building "parser-decoder" types - that is, types that validate an input,
 * transform it into another type, and then validate the target type.
 *
 * @example
 * const StringsFromMixedArray = mapper(
 *   t.array(t.any),
 *   t.array(t.string),
 *   mixedArray => mixedArray.filter(value => typeof value === 'string')
 * )
 * StringsFromMixedArray.decode(['a', 1, 'b', 2]) // right(['a', 'b'])
 * StringsFromMixedArray.decode('not an array')   // left(...)
 *
 * @see parser
 *
 * @param from the expected type of input value
 * @param to the expected type of the decoded value
 * @param map transform (decode) a `from` type to a `to` type
 * @param unmap transfrom a `to` type back to a `from` type
 */
export const mapper: Mapper = <From, To>(
  from: t.Type<From>,
  to: t.Type<To>,
  map: (f: From) => To,
  unmap: (t: To) => From = RichError.thrower('unmapper/encoder not implemented')
) => {
  const fail = (s: From, c: t.Context, info: string) =>
    t.failure<To>(s, c.concat([{key: `decoder [${funcLabel(map)}]: ${info}`, type: to}]))
  const piped = from.pipe(
    new t.Type<To, From, From>(
      to.name,
      to.is,
      (s, c) =>
        pipe(
          Either.tryCatch(() => map(s), err => `error thrown decoding: [${err}]`),
          Either.fold(e => fail(s, c, e), value => to.validate(value, c))
        ),
      unmap
    ),
    `${from.name} |> ${funcLabel(map)} |> ${to.name}`
  ) as any
  return Object.assign(piped, {from, to})
}

/**
 * A helper for parsing strings into other types. A wrapper around `mapper` where the `from` type is `t.string`.
 * @see mapper
 *
 * @example
 * const IntFromString = parser(t.string, parseFloat)
 * IntFromString.decode('123')          // right(123)
 * IntFromString.decode('123.4')        // left(...)
 * IntFromString.decode('not a number') // left(...)
 * IntFromString.decode(123)            // left(...)
 *
 * @param type the target type
 * @param decode transform a string into the target type
 * @param encode transform the target type back into a string
 */
export const parser = <T>(type: t.Type<T>, decode: (value: string) => T, encode: (value: T) => string = String) =>
  mapper(t.string, type, decode, encode)
