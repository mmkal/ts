import * as t from 'io-ts'

export type ShorthandPrimitive = string | number | boolean | null | undefined | typeof String | typeof Number
export type ShorthandComplex1 =
  | ShorthandPrimitive
  | []
  | [ShorthandComplex1]
  | [1, [ShorthandComplex1]]
  | [2, [ShorthandComplex1, ShorthandComplex1]]
  | [3, [ShorthandComplex1, ShorthandComplex1, ShorthandComplex1]]
  // | TuplePair<Size, ShorthandComplex>
  | {[K in string]: ShorthandComplex1}
  | t.Type<any, any, any>

export type ShorthandComplex2 =
  | ShorthandPrimitive
  | []
  | [ShorthandComplex1]
  | {tuples: {[S in Size]: TuplePair<S, ShorthandComplex2>}}
  | {[K in string]: ShorthandComplex2}
  | t.Type<any, any, any>

export type ShorthandComplex3 =
  | Exclude<ShorthandComplex2, {tuples: any}>
  | Extract<ShorthandComplex2, {tuples: any}>['tuples'][Size]

export type ShorthandComplex = ShorthandComplex3

type TupleCounter<T> = {
  1: [T]
  2: [T, T]
  3: [T, T, T]
}

type Size = keyof TupleCounter<unknown>

type TuplePair<S extends Size, T> = [S, TupleCounter<T>[S]]

type TCS2 = TupleCounter<string>[2]
type X = {
  [K in keyof TCS2]: {hello: TCS2[K]}
}
type ToTuple<M extends {0: any}> = M extends {0: any; 1: any; 2: any; 3: any}
  ? [M[0], M[1], M[2], M[3]]
  : M extends {0: any; 1: any; 2: any}
  ? [M[0], M[1], M[2]]
  : M extends {0: any; 1: any}
  ? [M[0], M[1]]
  : M extends {0: any}
  ? [M[0]]
  : never

export type Shorthand2<V extends ShorthandComplex> = V extends string | number | boolean
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
  : V extends [ShorthandComplex]
  ? t.ArrayC<Shorthand2<V[0]>>
  : V extends TuplePair<infer S, ShorthandComplex>
  ? t.TupleC<
      ToTuple<{[K in keyof V[1]]: Shorthand2<V[1][K]>}>
    > /*
  // : V extends [1, [ShorthandComplex]]
  // ? t.TupleC<[Shorthand2<V[1][0]>]>
  // : V extends [2, [ShorthandComplex, ShorthandComplex]]
  // ? t.TupleC<[Shorthand2<V[1][0]>, Shorthand2<V[1][1]>]>
  */
  : V extends t.Type<any, any, any>
  ? V
  : V extends {[K: string]: any}
  ? t.TypeC<{[K in keyof V]: Shorthand<V[K]>}>
  : never

export type CodecFromShortHand2 = {
  (): t.UnknownC
  <V extends ShorthandComplex>(v: V): Shorthand2<V>
}

export type UnknownTuple =
  | []
  | [unknown]
  | [unknown, unknown]
  | [unknown, unknown, unknown]
  | [unknown, unknown, unknown, unknown]
  | [unknown, unknown, unknown, unknown, unknown]

export type ShorthandInput = string | number | boolean | null | undefined | UnknownTuple | object
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
  : V extends []
  ? t.ArrayC<t.UnknownC>
  : V extends [ShorthandInput]
  ? t.ArrayC<Shorthand<V[0]>>
  : V extends [ShorthandInput, ShorthandInput]
  ? t.TupleC<[Shorthand<V[0]>, Shorthand<V[1]>]>
  : V extends [ShorthandInput, ShorthandInput, ShorthandInput]
  ? t.TupleC<[Shorthand<V[0]>, Shorthand<V[1]>, Shorthand<V[2]>]>
  : V extends [ShorthandInput, ShorthandInput, ShorthandInput, ShorthandInput]
  ? t.TupleC<[Shorthand<V[0]>, Shorthand<V[1]>, Shorthand<V[2]>, Shorthand<V[3]>]>
  : V extends [ShorthandInput, ShorthandInput, ShorthandInput, ShorthandInput, ShorthandInput]
  ? t.TupleC<[Shorthand<V[0]>, Shorthand<V[1]>, Shorthand<V[2]>, Shorthand<V[3]>, Shorthand<V[4]>]>
  : V extends t.Type<any, any, any>
  ? V
  : V extends {[K: string]: any}
  ? t.TypeC<{[K in keyof V]: Shorthand<V[K]>}>
  : never

export type CodecFromShortHand = {
  (): t.UnknownC
  <V extends ShorthandInput>(v: V): Shorthand<V>
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
 * |Tuples e.g. `[String, Number]`|`t.tuple` e.g. `t.tuple([t.string, t.number])`|
 * |io-ts codecs|unchanged|
 * |Unions, intersections, partials, one-element tuples and other complex types|not supported, except by passing in an io-ts codec|
 */
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
  if (Array.isArray(v)) {
    return t.tuple(v.map(codecFromShorthand) as any)
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
