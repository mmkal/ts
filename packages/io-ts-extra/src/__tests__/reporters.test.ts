import * as t from 'io-ts'
import {validationErrors, getRightUnsafe} from '../reporters'

test('validationErrors', () => {
  const Person = t.type({name: t.string, age: t.number})
  expect(validationErrors(Person.decode({foo: 'bar'}), 'Person')).toMatchInlineSnapshot(`
    Array [
      "Invalid value {undefined} supplied to Person.name. Expected string.",
      "Invalid value {undefined} supplied to Person.age. Expected number.",
    ]
  `)
  expect(validationErrors(Person.decode({name: 'Bob', age: 90}), 'Person')).toMatchInlineSnapshot(`
    Array [
      "No errors!",
    ]
  `)
})

test('getRightUnsafe', () => {
  const Person = t.type({name: t.string, age: t.number})
  expect(() => getRightUnsafe(Person.decode({foo: 'bar'}), 'Person')).toThrowErrorMatchingInlineSnapshot(`
"Invalid value {undefined} supplied to Person.name. Expected string.
Invalid value {undefined} supplied to Person.age. Expected number."
`)
  expect(getRightUnsafe(Person.decode({name: 'Bob', age: 90}), 'Person')).toMatchInlineSnapshot(`
    Object {
      "age": 90,
      "name": "Bob",
    }
  `)
})
