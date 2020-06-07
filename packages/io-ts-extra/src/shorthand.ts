import * as t from 'io-ts'

export type ShorthandPrimitive = typeof String | typeof Number | typeof Boolean
export type ShorthandLiteral = string | number | boolean | null | undefined
export type ShorthandInput =
  | ShorthandPrimitive
  | ShorthandLiteral
  | RegExp
  | []
  | [ShorthandInput]
  | [1, [ShorthandInput]]
  | [2, [ShorthandInput, ShorthandInput]]
  | [3, [ShorthandInput, ShorthandInput, ShorthandInput]]
  | [4, [ShorthandInput, ShorthandInput, ShorthandInput, ShorthandInput]]
  | {[K in string]: ShorthandInput}
  | t.Type<any, any, any>

// TODO [>=1.0.0] Consolidate RegExp functionality here with ./combinators
export const RegExpMatchArrayStructure = t.intersection([
  t.array(t.string),
  t.type({
    index: t.number,
    input: t.string,
  }),
])

export type Shorthand<V extends ShorthandInput> = V extends string | number | boolean
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
  : V extends RegExp
  ? t.Type<typeof RegExpMatchArrayStructure._A, string>
  : V extends []
  ? t.ArrayC<t.UnknownC>
  : V extends [ShorthandInput]
  ? t.ArrayC<Shorthand<V[0]>>
  : V extends [1, [ShorthandInput]]
  ? t.TupleC<[Shorthand<V[1][0]>]>
  : V extends [2, [ShorthandInput, ShorthandInput]]
  ? t.TupleC<[Shorthand<V[1][0]>, Shorthand<V[1][1]>]>
  : V extends [3, [ShorthandInput, ShorthandInput, ShorthandInput]]
  ? t.TupleC<[Shorthand<V[1][0]>, Shorthand<V[1][1]>, Shorthand<V[1][2]>]>
  : V extends [4, [ShorthandInput, ShorthandInput, ShorthandInput, ShorthandInput]]
  ? t.TupleC<[Shorthand<V[1][0]>, Shorthand<V[1][1]>, Shorthand<V[1][2]>, Shorthand<V[1][3]>]>
  : V extends t.Type<any, any, any>
  ? V
  : V extends {[K: string]: any}
  ? t.TypeC<{[K in keyof V]: Shorthand<V[K]>}>
  : never

export type CodecFromShorthand = {
  (): t.UnknownC
  <V extends ShorthandInput>(v: V): Shorthand<V>
}

/* eslint-disable complexity */

/**
 * Gets an io-ts codec from a shorthand input:
 *
 * |shorthand|io-ts type|
 * |-|-|
 * |`String`, `Number`, `Boolean`|`t.string`, `t.number`, `t.boolean`|
 * |Literal raw strings, numbers and booleans e.g. `7` or `'foo'`|`t.literal(7)`, `t.literal('foo')` etc.|
 * |Regexes e.g. `/^foo/`|A custom type which validates its input as a string, then decodes with `string.match`|
 * |`null` and `undefined`|`t.null` and `t.undefined`|
 * |No input (_not_ the same as explicitly passing `undefined`)|`t.unknown`|
 * |Objects e.g. `{ foo: String, bar: { baz: Number } }`|`t.type(...)` e.g. `t.type({foo: t.string, bar: t.type({ baz: t.number }) })`
 * |Empty arrays|`t.array(t.unknown)`|
 * |One-element arrays e.g. `[String]`|`t.array(...)` e.g. `t.array(t.string)`|
 * |Tuples with explicit length e.g. `[2, [String, Number]]`|`t.tuple` e.g. `t.tuple([t.string, t.number])`|
 * |io-ts codecs|unchanged|
 * |Unions, intersections, partials, tuples with more than 3 elements, and other complex types|not supported, except by passing in an io-ts codec|
 */
export const codecFromShorthand: CodecFromShorthand = (...args: unknown[]): any => {
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
  if (v instanceof RegExp) {
    const RegExpMatchArrayDecoder = new t.Type<typeof RegExpMatchArrayStructure._A, string, string>(
      `RegExp<${v.source}>`,
      RegExpMatchArrayStructure.is,
      (s, c) => RegExpMatchArrayStructure.validate(s.match(v), c),
      val => val.input
    )
    return t.string.pipe(RegExpMatchArrayDecoder)
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
  if (Array.isArray(v)) {
    throw new TypeError(
      `Invalid type. Arrays should be in the form \`[shorthand]\`, and tuples should be in the form \`[3, [shorthand1, shorthand2, shorthand3]]\``
    )
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
  return t.unknown
}
