import * as t from 'io-ts'

// const mappings = [
//   //
//   [String, t.string],
//   []
// ] as const

export type ShorthandInput = string | number | boolean | null | undefined | object
export type Sh<V extends ShorthandInput> = V extends string | number | boolean
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
  : V extends {0: ShorthandInput; 999999: ShorthandInput} // total hack - if 999999 is defined, it's _probably_ an array, not a tuple
  ? t.ArrayC<Sh<V[0]>>
  : V extends Array<infer X>
  ? X extends ShorthandInput
    ? t.ArrayC<Sh<X>>
    : never
  : V extends t.Type<any, any, any>
  ? V
  : V extends {[K: string]: any}
  ? t.TypeC<{[K in keyof V]: Sh<V[K]>}>
  : never

export type CodecFromShortHand = <V extends ShorthandInput>(v: V) => Sh<V>

export const codecFromShorthand: CodecFromShortHand = (v: unknown): any => {
  if (v === String) return t.string
  if (v === Number) return t.number
  if (v === Boolean) return t.boolean
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return t.literal(v)
  if (v === null) return t.null
  if (typeof v === 'undefined') return t.undefined
  if (Array.isArray(v) && v.length === 1) return t.array(codecFromShorthand(v[0]))
  if (Array.isArray(v)) return t.tuple(v.map(codecFromShorthand) as any)
  if (v instanceof t.Type) return v
  if (typeof v === 'object')
    return t.type(
      Object.entries(v!).reduce((acc, [prop, val]) => {
        return {...acc, [prop]: codecFromShorthand(val)}
      }, {})
    )
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
