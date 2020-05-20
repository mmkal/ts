import {expectShim} from '..'

test('replaces', () => {
  expectShim({a: 1}).toMatchInlineSnapshot({
    a: 1,
  })
})

const getAdminUser = () => ({id: 'alice123', name: 'Alice McAlice', age: 40})

test('get user', () => {
  expect(getAdminUser()).toMatchInlineSnapshot(`
    Object {
      "age": 40,
      "id": "alice123",
      "name": "Alice McAlice",
    }
  `)
})
