import {yamlishPrinter} from '../yaml'

test(`undefined is handled`, () => {
  expect(yamlishPrinter({a: 1, b: undefined, c: null})).toMatchInlineSnapshot(`
    "---
    a: 1
    b: 
    c: "
  `)
})
