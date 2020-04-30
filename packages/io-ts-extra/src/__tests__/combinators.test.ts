import {sparseType, optional} from '..'
import * as t from 'io-ts'
import {expectRight, expectLeft} from './either-serializer'
import {expectTypeOf} from 'expect-type'
import {inspect} from 'util'
import {instanceOf, regex} from '../combinators'

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
  const AllCaps = regex(/^[A-Z]*$/)
  expectRight(AllCaps.decode('HELLO'))
  expectLeft(AllCaps.decode('hello'))
  expectLeft(AllCaps.decode(123))
})
