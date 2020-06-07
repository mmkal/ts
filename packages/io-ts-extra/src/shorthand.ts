import * as t from 'io-ts'

export type ShorthandPrimitive = typeof String | typeof Number | typeof Boolean
export type ShorthandLiteral = string | number | boolean | null | undefined
export type ShortHandInput =
  | ShorthandPrimitive
  | ShorthandLiteral
  | []
  | [ShortHandInput]
  | [1, [ShortHandInput]]
  | [2, [ShortHandInput, ShortHandInput]]
  | [3, [ShortHandInput, ShortHandInput, ShortHandInput]]
  | [4, [ShortHandInput, ShortHandInput, ShortHandInput, ShortHandInput]]
  | {[K in string]: ShortHandInput}
  | t.Type<any, any, any>

export type Shorthand<V extends ShortHandInput> = V extends string | number | boolean
  ? t.LiteralC<V>
  : V extends null
  ? t.NullC
  : V extends undefined
  ? t.UndefinedC
  : V extends typeof String
  ? t.StringC
  : V extends typeof Number
  ? t.NumberC
  : V extends typeof Boolean
  ? t.BooleanC
  : V extends []
  ? t.ArrayC<t.UnknownC>
  : V extends [ShortHandInput]
  ? t.ArrayC<Shorthand<V[0]>>
  : V extends [1, [ShortHandInput]]
  ? t.TupleC<[Shorthand<V[1][0]>]>
  : V extends [2, [ShortHandInput, ShortHandInput]]
  ? t.TupleC<[Shorthand<V[1][0]>, Shorthand<V[1][1]>]>
  : V extends [3, [ShortHandInput, ShortHandInput, ShortHandInput]]
  ? t.TupleC<[Shorthand<V[1][0]>, Shorthand<V[1][1]>, Shorthand<V[1][2]>]>
  : V extends [4, [ShortHandInput, ShortHandInput, ShortHandInput, ShortHandInput]]
  ? t.TupleC<[Shorthand<V[1][0]>, Shorthand<V[1][1]>, Shorthand<V[1][2]>, Shorthand<V[1][3]>]>
  : V extends t.Type<any, any, any>
  ? V
  : V extends {[K: string]: any}
  ? t.TypeC<{[K in keyof V]: Shorthand<V[K]>}>
  : never

export type CodecFromShortHand2 = {
  (): t.UnknownC
  <V extends ShortHandInput>(v: V): Shorthand<V>
}

/**
 * Gets an io-ts codec from a shorthand input:
 *
 * |shorthand|io-ts type|
 * |-|-|
 * |`String`, `Number`, `Boolean`|`t.string`, `t.number`, `t.boolean`|
 * |Literal raw strings, numbers and booleans|`t.literal(...)`|
 * |`null` and `undefined`|`t.null` and `t.undefined`|
 * |No input (_not_ the same as explicitly passing `undefined`)|`t.unknown`|
 * |Objects e.g. `{ foo: String, bar: { baz: Number } }`|`t.type(...)` e.g. `t.type({foo: t.string, bar: t.type({ baz: t.number }) })`
 * |Empty arrays|`t.array(t.unknown)`|
 * |One-element arrays e.g. `[String]`|`t.array(...)` e.g. `t.array(t.string)`|
 * |Tuples with explicit length e.g. `[2, [String, Number]]`|`t.tuple` e.g. `t.tuple([t.string, t.number])`|
 * |io-ts codecs|unchanged|
 * |Unions, intersections, partials, one-element tuples and other complex types|not supported, except by passing in an io-ts codec|
 */
// eslint-disable-next-line complexity
export const codecFromShorthand: CodecFromShortHand2 = (...args: unknown[]): any => {
  if (args.length === 0) {
    return t.unknown
  }
  const v = args[0]
  if (v === String) {
    return t.string
  }
  if (v === Number) {
    return t.number
  }
  if (v === Boolean) {
    return t.boolean
  }
  if (v === null) {
    return t.null
  }
  if (typeof v === 'undefined') {
    return t.undefined
  }
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return t.literal(v)
  }
  if (Array.isArray(v) && v.length === 0) {
    return t.array(t.unknown)
  }
  if (Array.isArray(v) && v.length === 1) {
    return t.array(codecFromShorthand(v[0]))
  }
  if (Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && Array.isArray(v[1])) {
    return t.tuple(v[1].map(codecFromShorthand) as any)
  }
  if (v instanceof t.Type) {
    return v
  }
  if (typeof v === 'object' && v) {
    return t.type(
      Object.entries(v).reduce((acc, [prop, val]) => {
        return {...acc, [prop]: codecFromShorthand(val)}
      }, {})
    )
  }
  return t.never
}
