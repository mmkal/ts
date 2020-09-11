import {sparseType, optional} from '..'
import * as t from 'io-ts'
import {expectRight, expectLeft} from './either-serializer'
import {expectTypeOf} from 'expect-type'
import {inspect} from 'util'
import {instanceOf, regexp, strict} from '../combinators'
import {validationErrors} from '../reporters'
import {mapValues} from 'lodash'

describe('sparseType', () => {
  it('handles mixed props', () => {
    const Person = sparseType({name: t.string, age: optional(t.number)})

    expectTypeOf(Person.props).toMatchTypeOf({
      name: t.string,
      age: optional(t.number),
    })
    expect(inspect(Person.props)).toEqual(
      inspect({
        name: t.string,
        age: optional(t.number),
      })
    )

    expectTypeOf(Person._A).toEqualTypeOf<{name: string; age?: number | null | undefined}>()
    expectTypeOf(Person._A).not.toMatchTypeOf<{name: string; age: number | null | undefined}>()

    expectTypeOf({name: 'bob'}).toMatchTypeOf(Person._A)
    expectTypeOf({name: 'bob', age: 30}).toMatchTypeOf(Person._A)
    expectTypeOf({name: 'bob', age: 'thirty'}).not.toMatchTypeOf(Person._A)

    expectLeft(Person.decode({name: 'bob', age: 'thirty'}))
    expectRight(Person.decode({name: 'bob', age: 30}))
    expectRight(Person.decode({name: 'bob'}))
    expectLeft(Person.decode({}))
  })

  it('handles all required props', () => {
    const Person = sparseType({name: t.string, age: t.number})

    expectTypeOf(Person._A).toEqualTypeOf<{name: string; age: number}>()

    expectLeft(Person.decode({name: 'bob', age: 'thirty'}))
    expectRight(Person.decode({name: 'bob', age: 30}))
    expectLeft(Person.decode({name: 'bob'}))
    expectLeft(Person.decode({}))
  })

  it('handles all optional props', () => {
    const Person = sparseType({name: optional(t.string), age: optional(t.number)})
    expectLeft(Person.decode({name: 'bob', age: 'thirty'}))
    expectRight(Person.decode({name: 'bob', age: 30}))
    expectRight(Person.decode({name: 'bob'}))
    expectRight(Person.decode({}))
  })
})

test('instanceOf', () => {
  const DateType = instanceOf(Date)
  expectRight(DateType.decode(new Date()))
  expectLeft(DateType.decode('not a date'))

  expect(DateType.is(new Date())).toBe(true)
  expect(DateType.is('not a date')).toBe(false)
})

test('instanceOf names anonymous functions appropriately', () => {
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  class Foo {}
  Object.defineProperty(Foo, 'name', {value: null})
  expect(instanceOf(Foo).name).toEqual('InstanceOf<anonymous>')
})

test('regex', () => {
  const AllCaps = regexp(/^[A-Z]*$/)
  expectRight(AllCaps.decode('HELLO'))
  expectLeft(AllCaps.decode('hello'))
  expectLeft(AllCaps.decode(123))
})

test('regex can encode and decode', () => {
  const s = 'foo bar baz'
  const R = regexp(/b(a)(r)/)

  const success = R.decode(s)
  expectRight(success).toEqual({
    _tag: 'Right',
    right: Object.assign(['bar', 'a', 'r'], {index: 4, input: s}),
  })

  if (success._tag === 'Right') {
    expectTypeOf(success.right).toEqualTypeOf(Object.assign(['bar', 'a', 'r'], {index: 4, input: s}))
    // eslint-disable-next-line jest/no-conditional-expect
    expect(R.encode(success.right)).toEqual(s)
  }

  expectLeft(R.decode('abc'))
  expectLeft(R.decode(null))
})

test('strict', () => {
  const Person = strict({name: t.string, age: t.number})

  expectRight(Person.decode({name: 'Alice', age: 30}))
  expectLeft(Person.decode({name: 'Bob', age: 30, unexpectedProp: 'abc'}))
  expectRight(Person.decode({name: 'Bob', age: 30, unexpectedProp: undefined}))

  expect(Person.is({name: 'Alice', age: 30})).toBe(true)
  expect(Person.is({name: 'Bob', age: 30, unexpectedProp: 'abc'})).toBe(false)
  expect(Person.is({name: 'Bob', age: 30, unexpectedProp: undefined})).toBe(false)

  const errorCases = {
    null: null,
    undefined: undefined,
    withExtraProp: {name: 'Bob', age: 30, unexpectedProp: 'abc'},
    withInvalidAndExtraProp: {name: 123, age: 30, unexpectedProp: 'abc'},
  }
  expect(
    mapValues(errorCases, val => {
      const decoded = Person.decode(val)
      expectLeft(decoded)
      return validationErrors(decoded)
    })
  ).toMatchInlineSnapshot(`
    Object {
      "null": Array [
        "Invalid value {null} supplied to Strict<{ name: string, age: number }. Expected Strict<{ name: string, age: number }.",
      ],
      "undefined": Array [
        "Invalid value {undefined} supplied to Strict<{ name: string, age: number }. Expected Strict<{ name: string, age: number }.",
      ],
      "withExtraProp": Array [
        "Invalid value {'abc'} supplied to Strict<{ name: string, age: number }.unexpectedProp. Expected undefined.",
      ],
      "withInvalidAndExtraProp": Array [
        "Invalid value {123} supplied to Strict<{ name: string, age: number }.name. Expected string.",
        "Invalid value {'abc'} supplied to Strict<{ name: string, age: number }.unexpectedProp. Expected undefined.",
      ],
    }
  `)
})
