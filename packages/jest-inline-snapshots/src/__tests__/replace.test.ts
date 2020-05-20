import {expectShim} from '..'

expectShim.register()

test('replaces', () => {
  expect({a: 1, f: () => 1, g: () => 1}).toMatchInlineSnapshot({
    a: 1,
    f: Object.assign(expect.any(Function), {generated: true}),
    g: Object.assign(expect.any(Function), {generated: true}),
  })
})

test('multiline string', () => {
  expect({
    a: 1,
    b: `
      c
      d
      e
    `,
  }).toMatchInlineSnapshot({
    a: 1,
    b: `
      c
      d
      e
    `,
  })
})

// const getAdminUser = () => ({id: 'alice123', name: 'Alice McAlice', age: 40})

// test('get user', () => {
//   expect(getAdminUser()).toMatchInlineSnapshot(`
//     Object {
//       "age": 40,
//       "id": "alice123",
//       "name": "Alice McAlice",
//     }
//   `)
// })
