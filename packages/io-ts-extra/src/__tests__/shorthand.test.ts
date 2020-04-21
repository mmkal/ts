import * as t from 'io-ts'
import {codecFromShorthand} from '../shorthand'
import {expectTypeOf as e} from 'expect-type'

const expectTypeRuntimeBehaviour = (inverted = false): typeof e => (actual: any): any => {
  if (typeof actual === 'undefined') return e(actual)
  const jestExpect = (inverted ? (...args) => expect(...args).not : expect) as typeof expect
  const json = (obj: unknown) => JSON.stringify(obj, null, 2)
  const assertions = {
    ...e,
    toEqualTypeOf: (...other: any[]) => (other.length === 0 ? {} : jestExpect(json(actual)).toEqual(json(other[0]))),
    toMatchTypeOf: (...other: any[]) =>
      other.length === 0 ? {} : jestExpect(json(actual)).toMatchObject(json(other[0])),
    toHaveProperty: (prop: string) => {
      jestExpect(actual).toHaveProperty(prop)
      return expectTypeRuntimeBehaviour(actual[prop])
    },
  }
  Object.defineProperty(assertions, 'not', {get: () => expectTypeRuntimeBehaviour(!inverted)})

  return assertions
}

const expectTypeOf = expectTypeRuntimeBehaviour()

test('shorthand types', () => {
  expectTypeOf(codecFromShorthand(String)).toEqualTypeOf(t.string)
  expectTypeOf(codecFromShorthand(t.string)).toEqualTypeOf(t.string)
  expectTypeOf(codecFromShorthand('hi')).toEqualTypeOf(t.literal('hi'))
  expectTypeOf(codecFromShorthand(1)).toEqualTypeOf(t.literal(1))
  expectTypeOf(codecFromShorthand([String])).toEqualTypeOf(t.array(t.string))
  expectTypeOf(codecFromShorthand([String, Number] as const)._A)
    .toHaveProperty('0')
    .toMatchTypeOf<string>()
  expectTypeOf(codecFromShorthand([String, Number] as const)._A)
    .toHaveProperty('1')
    .toMatchTypeOf<number>()
  expectTypeOf(codecFromShorthand([String, Number] as const)._A).not.toHaveProperty('2')
  expectTypeOf(codecFromShorthand({foo: String, bar: {baz: Number}})).toEqualTypeOf(
    t.type({foo: t.string, bar: t.type({baz: t.number})})
  )
})
