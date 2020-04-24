import {getPaths} from '../util'

describe('getPaths', () => {
  test('nested object', () => {
    expect(getPaths({a: {b: {c: 1, d: {e: null}}, x: 'y'}})).toMatchInlineSnapshot(`
    Array [
      Array [
        "a",
        "b",
        "c",
      ],
      Array [
        "a",
        "b",
        "d",
        "e",
      ],
      Array [
        "a",
        "x",
      ],
    ]
  `)
  })

  test('empty object', () => {
    expect(getPaths({})).toEqual([])
  })
})
