import {RichError} from '..'

test('RichError throws', () => {
  expect(() => RichError.throw({foo: 'bar'})).toThrowErrorMatchingInlineSnapshot(`
"{
  \\"foo\\": \\"bar\\"
}"
`)
  expect(RichError.throw).toThrowErrorMatchingInlineSnapshot(`
"{
  \\"details\\": \\"none!\\"
}"
`)
  expect(RichError.thrower('foobar')).toThrowErrorMatchingInlineSnapshot(`
"{
  \\"context\\": \\"foobar\\"
}"
`)
})
