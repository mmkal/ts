import {sparseType, optional} from '../index'
import * as t from 'io-ts'

const expectLeft = (val: any) => {
  expect(val).toMatchObject({_tag: 'Left', left: expect.anything()})
}
const expectRight = (val: any) => {
  expect(val).not.toMatchObject({_tag: 'Left', left: expect.anything()})
  expect(val).toMatchObject({_tag: 'Right', right: expect.anything()})
}

describe('partialPartial', () => {
  it('handles some optional props', () => {
    const Person = sparseType({name: t.string, age: optional(t.number)})
    expectLeft(Person.decode({name: 'bob', age: 'thirty'}))
    expectRight(Person.decode({name: 'bob', age: 30}))
    expectRight(Person.decode({name: 'bob'}))
    expectLeft(Person.decode({}))
  })

  it('handles all required props', () => {
    const Person = sparseType({name: t.string, age: t.number})
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
