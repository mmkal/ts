import {right} from 'fp-ts/lib/Either'
import {RichError} from '../util'
import * as t from 'io-ts'
import {mapper, parser} from '../mapper'

import './either-serializer'
import {instanceOf} from '../combinators'

describe('mapper', () => {
  it('maps', () => {
    const BoolToStringArray = mapper(t.boolean, t.array(t.string), b => b.toString().split(''))
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
})

describe('parser', () => {
  it('parses', () => {
    const IntFromString = parser(t.Integer, parseFloat)
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
                name: string |> parseFloat |> Integer
              actual: '123.1'
    `)
    expect(IntFromString.decode('xyz')).toMatchInlineSnapshot(`
      _tag: Left
      left:
        - value: .nan
          context:
            - key: ''
              type:
                name: string |> parseFloat |> Integer
              actual: xyz
    `)
  })

  it('parses dates', () => {
    const ValidDate = t.refinement(instanceOf(Date), d => !isNaN(d.getTime()))
    const DateFromString = parser(ValidDate, s => new Date(s), d => d.toISOString())
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
    const BadBoolToString = mapper(t.boolean, t.string, b => (b ? RichError.throw({b}) : 'nope'))
    expect(BadBoolToString.decode(false)).toEqual(right('nope'))
    expect(BadBoolToString.decode(true)).toMatchInlineSnapshot(`
      _tag: Left
      left:
        - value: true
          context:
            - key: ''
              type:
                name: 'boolean |> function (b) { ... } |> string'
              actual: true
            - key: |-
                decoder [function (b) { ... }]: error thrown decoding: [Error: {
                  "b": true
                }]
              type:
                name: string
                _tag: StringType
    `)
  })
})
