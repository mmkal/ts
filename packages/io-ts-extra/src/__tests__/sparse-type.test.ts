import {sparseType, optional} from '../index'
import * as t from 'io-ts'
import {expectRight, expectLeft} from './either-serializer'
import {expectTypeOf} from '@mmkal/type-assertions'

describe('partialPartial', () => {
  it('handles some optional props', () => {
    const Person = sparseType({name: t.string, age: optional(t.number)})
    expectTypeOf(Person._A).toMatchTypeOf({} as {name: string; age?: number | null | undefined})
    expectTypeOf(Person._A).not.toMatchTypeOf({} as {name: string; age: number | null | undefined})
    type k = keyof typeof Person._A
    expectLeft(Person.decode({name: 'bob', age: 'thirty'}))
    expectRight(Person.decode({name: 'bob', age: 30}))
    expectRight(Person.decode({name: 'bob'}))
    expectLeft(Person.decode({}))
  })

  it('handles all required props', () => {
    const Person = sparseType({name: t.string, age: t.number})
    expectTypeOf(Person._A).toEqualTypeOf({} as {name: string; age: number})
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
