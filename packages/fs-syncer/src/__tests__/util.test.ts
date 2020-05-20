import {getPaths} from '../util'

describe('getPaths', () => {
  test('nested object', () => {
    expect(getPaths({a: {b: {c: 1, d: {e: null}}, x: 'y'}})).toMatchInlineSnapshot([
      ['a', 'b', 'c'],
      ['a', 'b', 'd', 'e'],
      ['a', 'x'],
    ])
  })

  test('empty object', () => {
    expect(getPaths({})).toEqual([])
  })
})
