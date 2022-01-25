import * as t from 'io-ts'
import {RichError, funcLabel} from './util'
import * as Either from 'fp-ts/lib/Either'
import {pipe} from 'fp-ts/lib/pipeable'
import { flow } from 'fp-ts/lib/function'

export type Decoder<A, O = A, I = unknown> = Omit<t.Type<A, O, I>, 'encode'>
// prettier-ignore
interface Mapper {
  <
    TFrom extends t.Any,
    TTo extends t.Any,
  >(
    from: TFrom,
    to: TTo,
    map: (f: t.TypeOf<TFrom>) => t.OutputOf<TTo>,
    unmap: (t: t.TypeOf<TTo>) => t.TypeOf<TFrom>
  ): t.Type<t.TypeOf<TTo>, t.TypeOf<TFrom>> & {from: t.TypeOf<TFrom>; to: t.TypeOf<TTo>};

  <
    TFrom extends t.Any,
    TTo extends t.Any
  >(
    from: TFrom,
    to: TTo,
    map: (f: t.TypeOf<TFrom>) => t.OutputOf<TTo>
  ): Decoder<t.TypeOf<TTo>, t.TypeOf<TFrom>> & {from: t.TypeOf<TFrom>; to: t.TypeOf<TTo>};
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
 export const mapper: Mapper = <TFrom extends t.Any, TTo extends t.Any>(
  from: TFrom,
  to: TTo,
  map: (f: t.TypeOf<TFrom>) => t.OutputOf<TTo>,
  unmap: (t: t.TypeOf<TTo>) => t.TypeOf<TFrom> = RichError.thrower('unmapper/encoder not implemented')
) => {
  type From = t.TypeOf<typeof from>;
  type To = t.TypeOf<typeof to>;

  const fail = (s: From, c: t.Context, info: string) =>
    t.failure<To>(s, c.concat([{key: `decoder [${funcLabel(map)}]: ${info}`, type: to}]));
  const piped = from.pipe(
    new t.Type<To, From, From>(
      to.name,
      to.is,
      (s, c) =>
        pipe(
          Either.tryCatch(
            () => map(s),
            err => `error thrown decoding: [${err}]`
          ),
          Either.fold(
            e => fail(s, c, e),
            value => to.validate(value, c)
          )
        ),
      flow(
        to.encode,
        unmap as any
      )
    ),
    `${from.name} |> ${funcLabel(map)} |> ${to.name}`
  ) as any;
  return Object.assign(piped, {from, to});
};

/**
 * A helper for parsing strings into other types. A wrapper around `mapper` where the `from` type is `t.string`.
 * @see mapper
 *
 * @example
 * const IntFromString = parser(t.Int, parseFloat)
 * IntFromString.decode('123')          // right(123)
 * IntFromString.decode('123.4')        // left(...)
 * IntFromString.decode('not a number') // left(...)
 * IntFromString.decode(123)            // left(...)
 *
 * @param type the target type
 * @param decode transform a string into the target type
 * @param encode transform the target type back into a string
 */
export const parser = <TTo extends t.Any>(
  type: TTo,
  decode: (value: string) => t.OutputOf<TTo>,
  encode: (value: t.TypeOf<TTo>) => string = String
): t.Type<t.TypeOf<TTo>, string> & {from: string; to: t.TypeOf<TTo>} => mapper(t.string, type, decode, encode)

