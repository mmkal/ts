import * as t from 'io-ts'
import {RichError, funcLabel} from './util'
import * as Either from 'fp-ts/lib/Either'
import {pipe} from 'fp-ts/lib/pipeable'

export type Decoder<A, O = A, I = unknown> = Omit<t.Type<A, O, I>, 'encode'>
interface Mapper {
  <From, To>(from: t.Type<From>, to: t.Type<To>, map: (f: From) => To): Decoder<To, From>
  <From, To>(from: t.Type<From>, to: t.Type<To>, map: (f: From) => To, unmap: (t: To) => From): t.Type<To, From, From>
}
export const mapper: Mapper = <From, To>(
  from: t.Type<From>,
  to: t.Type<To>,
  map: (f: From) => To,
  unmap: (t: To) => From = RichError.throw
) => {
  const fail = (s: From, c: t.Context, info: string) =>
    t.failure<To>(s, c.concat([{key: `decoder [${funcLabel(map)}]: ${info}`, type: to}]))
  return from.pipe(
    new t.Type<To, From, From>(
      to.name,
      to.is,
      (s, c) =>
        pipe(
          Either.tryCatch(() => map(s), e => e),
          Either.fold(err => fail(s, c, `error thrown decoding: [${err}]`), value => to.validate(value, c))
        ),
      unmap
    ),
    `${from.name} |> ${funcLabel(map)} |> ${to.name}`
  ) as any
}

export const parser = <T>(type: t.Type<T>, decode: (value: string) => T, encode: (value: T) => string = String) =>
  mapper(t.string, type, decode, encode)
