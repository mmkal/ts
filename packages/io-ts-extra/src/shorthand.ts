import * as t from 'io-ts'

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

export const codecFromShorthand: CodecFromShortHand = (...args: unknown[]): any => {
  if (args.length === 0) return t.unknown
  const v = args[0]
  if (v === String) return t.string
  if (v === Number) return t.number
  if (v === Boolean) return t.boolean
  if (v === null) return t.null
  if (typeof v === 'undefined') return t.undefined
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return t.literal(v)
  if (Array.isArray(v) && v.length === 0) return t.array(t.unknown)
  if (Array.isArray(v) && v.length === 1) return t.array(codecFromShorthand(v[0]))
  if (Array.isArray(v)) return t.tuple(v.map(codecFromShorthand) as any)
  if (v instanceof t.Type) return v
  if (typeof v === 'object' && v)
    return t.type(
      Object.entries(v).reduce((acc, [prop, val]) => {
        return {...acc, [prop]: codecFromShorthand(val)}
      }, {})
    )
  return t.never
}

const codecs = [
  //
  codecFromShorthand({foo: {bar: Number, baz: String}}),
  codecFromShorthand('hello'),
  codecFromShorthand(String),
  codecFromShorthand({hi: String}),
  codecFromShorthand([String, Number] as const),
  codecFromShorthand([Boolean]),
  codecFromShorthand(t.type({x: t.string})),
  codecFromShorthand('!!!!!!!!!!!!!!!!!!!!!!!!!!!'),
] as const

// codecs[0]._A.foo.baz
