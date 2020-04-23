import {getPaths} from '../util'

test('getPaths', () => {
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
