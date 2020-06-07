import * as t from 'io-ts'
import {codecFromShorthand as shorthand, codecFromShorthand} from '../shorthand'
import {expectTypeOf as e} from 'expect-type'
import {expectLeft, expectRight} from './either-serializer'

const expectTypeRuntimeBehaviour = (inverted = false): typeof e => (actual: any): any => {
  if (typeof actual === 'undefined') {
    return e(actual)
  }
  // eslint-disable-next-line jest/valid-expect
  const jestExpect = (inverted ? (...args) => expect(...args).not : expect) as typeof expect
  const json = (obj: unknown) => JSON.stringify(obj, null, 2)
  const assertions = {
    ...e,
    toEqualTypeOf: (...other: any[]) => {
      if (other.length === 0) {
        return
      }
      jestExpect(json(actual)).toEqual(json(other[0]))
    },
    toMatchTypeOf: (...other: any[]) => {
      if (other.length === 0) {
        return
      }
      jestExpect(json(actual)).toMatchObject(json(other[0]))
    },
    toHaveProperty: (prop: string) => {
      jestExpect(actual).toHaveProperty(prop)
      return expectTypeRuntimeBehaviour(inverted)(actual[prop])
    },
  }
  Object.defineProperty(assertions, 'not', {get: () => expectTypeRuntimeBehaviour(!inverted)(actual)})

  return assertions
}

const expectTypeOf = expectTypeRuntimeBehaviour()

test('nullish types', () => {
  expectTypeOf(shorthand()).toEqualTypeOf(t.unknown)
  expectTypeOf(shorthand(undefined)).toEqualTypeOf(t.undefined)
  expectTypeOf(shorthand(null)).toEqualTypeOf(t.null)
})

test('primitives', () => {
  expectTypeOf(shorthand(String)).toEqualTypeOf(t.string)
  expectTypeOf(shorthand(Number)).toEqualTypeOf(t.number)
  expectTypeOf(shorthand(Boolean)).toEqualTypeOf(t.boolean)
  expectTypeOf(shorthand(t.string)).toEqualTypeOf(t.string)
})

test('regex', () => {
  const type = codecFromShorthand(/^abc/)
  expectRight(type.decode('abcdef'))
  expectLeft(type.decode('xyz123'))
})

test('literals', () => {
  expectTypeOf(shorthand('hi')).toEqualTypeOf(t.literal('hi'))
  expectTypeOf(shorthand(1)).toEqualTypeOf(t.literal(1))
})

test('arrays', () => {
  expectTypeOf(shorthand([])).toEqualTypeOf(t.array(t.unknown))

  expectTypeOf(shorthand([String])).toEqualTypeOf(t.array(t.string))
  expectTypeOf(shorthand([[String]])).toEqualTypeOf(t.array(t.array(t.string)))

  expectTypeOf(shorthand([{foo: String}])).toEqualTypeOf(t.array(t.type({foo: t.string})))
  expectTypeOf(shorthand([[String]])).toEqualTypeOf(t.array(t.array(t.string)))
})

test('tuples', () => {
  expectTypeOf(shorthand([1, [String]])).toEqualTypeOf(t.tuple([t.string]))

  expectTypeOf(shorthand([2, [String, Number]])).toEqualTypeOf(t.tuple([t.string, t.number]))

  expectTypeOf(shorthand([3, [String, Number, String]])).toEqualTypeOf(t.tuple([t.string, t.number, t.string]))

  expectTypeOf(shorthand([4, [String, Number, String, Number]])).toEqualTypeOf(
    t.tuple([t.string, t.number, t.string, t.number])
  )

  expectTypeOf(shorthand([2, [{foo: [String]}, Number]])).toEqualTypeOf(
    t.tuple([t.type({foo: t.array(t.string)}), t.number])
  )
})

test('complex interfaces', () => {
  expectTypeOf(shorthand({foo: String, bar: {baz: Number}})).toEqualTypeOf(
    t.type({foo: t.string, bar: t.type({baz: t.number})})
  )
})
