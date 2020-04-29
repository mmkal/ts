import {right} from 'fp-ts/lib/Either'
import {RichError} from '../util'
import * as t from 'io-ts'
import {mapper, parser} from '../mapper'
import {expectTypeOf} from 'expect-type'
import './either-serializer'
import {instanceOf} from '../combinators'

describe('mapper', () => {
  it('maps', () => {
    const BoolToStringArray = mapper(t.boolean, t.array(t.string), b => b.toString().split(''))
    expectTypeOf(BoolToStringArray._O).toEqualTypeOf(true)
    expectTypeOf(BoolToStringArray._A).toEqualTypeOf(['t', 'r', 'u', 'e'])
    expect(BoolToStringArray.decode(true)).toMatchInlineSnapshot(`
      _tag: Right
      right:
        - t
        - r
        - u
        - e
    `)
    expect(BoolToStringArray.decode(['input/output confusion'])).toMatchInlineSnapshot(`
      _tag: Left
      left:
        - value: &ref_0
            - input/output confusion
          context:
            - key: ''
              type:
                name: 'boolean |> function (b) { ... } |> Array<string>'
                from:
                  name: boolean
                  _tag: BooleanType
                to:
                  name: Array<string>
                  type:
                    name: string
                    _tag: StringType
                  _tag: ArrayType
              actual: *ref_0
    `)
  })

  it('can unmap', () => {
    const BoolToStringArray = mapper(
      t.boolean,
      t.array(t.string),
      b => b.toString().split(''),
      arr => JSON.parse(arr.join(''))
    )
    expect(BoolToStringArray.encode(['f', 'a', 'l', 's', 'e'])).toEqual(false)
  })

  it('throws helpfully when unmap not implemented', () => {
    const BoolToStringArray = mapper(t.boolean, t.array(t.string), b => b.toString().split(''))
    expect(() => (BoolToStringArray as any).encode(['f', 'a', 'l', 's', 'e'])).toThrowErrorMatchingInlineSnapshot(`
"{
  \\"context\\": \\"unmapper/encoder not implemented\\",
  \\"details\\": [
    \\"f\\",
    \\"a\\",
    \\"l\\",
    \\"s\\",
    \\"e\\"
  ]
}"
`)
  })
})

describe('parser', () => {
  it('parses', () => {
    const IntFromString = parser(t.Int, parseFloat)
    expectTypeOf(IntFromString._A).toMatchTypeOf<number>()
    expectTypeOf(IntFromString._A).toEqualTypeOf<t.Branded<number, t.IntBrand>>()
    expectTypeOf(IntFromString._O).toBeString()
    expect(IntFromString.decode('123')).toMatchInlineSnapshot(`
      _tag: Right
      right: 123
    `)
    expect(IntFromString.decode('123.1')).toMatchInlineSnapshot(`
      _tag: Left
      left:
        - value: 123.1
          context:
            - key: ''
              type:
                name: string |> parseFloat |> Int
                from:
                  name: string
                  _tag: StringType
                to:
                  name: Int
                  type:
                    name: number
                    _tag: NumberType
                  _tag: RefinementType
              actual: '123.1'
    `)
    expect(IntFromString.decode('xyz')).toMatchInlineSnapshot(`
      _tag: Left
      left:
        - value: .nan
          context:
            - key: ''
              type:
                name: string |> parseFloat |> Int
                from:
                  name: string
                  _tag: StringType
                to:
                  name: Int
                  type:
                    name: number
                    _tag: NumberType
                  _tag: RefinementType
              actual: xyz
    `)
  })

  it('parses dates', () => {
    const ValidDate = t.refinement(instanceOf(Date), d => !isNaN(d.getTime()))
    const DateFromString = parser(
      ValidDate,
      s => new Date(s),
      d => d.toISOString()
    )
    expect(DateFromString.decode('2000')).toMatchInlineSnapshot(`
      _tag: Right
      right: 2000-01-01T00:00:00.000Z
    `)
    expect(DateFromString.decode('not a date')).toMatchObject({_tag: 'Left'})
    expect(DateFromString.decode(null as any)).toMatchObject({_tag: 'Left'})
    expect(DateFromString.decode(123 as any)).toMatchObject({_tag: 'Left'})

    expect(DateFromString.encode(new Date('2001'))).toMatchInlineSnapshot(`"2001-01-01T00:00:00.000Z"`)
  })

  it('catches failures', () => {
    const StringFromBool_WithDecoderBug = mapper(t.boolean, t.string, b => (b ? RichError.throw({b}) : 'nope'))
    expect(StringFromBool_WithDecoderBug.decode(false)).toEqual(right('nope'))
    expect(StringFromBool_WithDecoderBug.decode(true)).toMatchInlineSnapshot(`
      _tag: Left
      left:
        - value: true
          context:
            - key: ''
              type:
                name: 'boolean |> function (b) { ... } |> string'
                from:
                  name: boolean
                  _tag: BooleanType
                to: &ref_0
                  name: string
                  _tag: StringType
              actual: true
            - key: |-
                decoder [function (b) { ... }]: error thrown decoding: [Error: {
                  "b": true
                }]
              type: *ref_0
    `)
  })
})
