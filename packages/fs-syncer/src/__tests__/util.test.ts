import {dedent, getPaths} from '../util'

describe('getPaths', () => {
  test('nested object', () => {
    expect(getPaths({a: {b: {c: 1, d: {e: null}}, x: 'y'}})).toMatchInlineSnapshot(`
          Array [
            Array [
              "a",
              "b",
              "c",
            ],
            Array [
              "a",
              "b",
              "d",
              "e",
            ],
            Array [
              "a",
              "x",
            ],
          ]
      `)
  })

  test('empty object', () => {
    expect(getPaths({})).toEqual([])
  })
})

describe('dedent', () => {
  test('calculates common indent', () => {
    const dedented = dedent(`
      def main():
        if 1 > 0:
          print('hello')
        elif: 2 < 1:
          print('goodbye')

      if __name__ == '__main__':
        main()
    `)

    expect(dedented).toMatchInlineSnapshot(`
      "def main():
        if 1 > 0:
          print('hello')
        elif: 2 < 1:
          print('goodbye')

      if __name__ == '__main__':
        main()
      "
    `)
  })

  test('respects tabs with tabs', () => {
    const withTabs = `
\t\t\tconst x = {
\t\t\t\ta: 'a',
\t\t\t\tb: {
\t\t\t\t\tc: 'c
\t\t\t\t}
\t\t\t}
\t\t`

    expect(dedent(withTabs)).toMatchInlineSnapshot(`
      "const x = {
      	a: 'a',
      	b: {
      		c: 'c
      	}
      }
      "
    `)
  })

  test('allows trailing line', () => {
    const withTrailing = `
      foo
      bar
    `

    const withoutTrailing = `
      foo
      bar`
    expect(dedent(withTrailing)).toEqual('foo\nbar\n')

    expect(dedent(withoutTrailing)).toEqual('foo\nbar')
  })

  test('allows single lines', () => {
    expect(dedent(`foo bar`)).toEqual('foo bar')
  })

  test(`doesn't indent value with content on first line`, () => {
    const withLeadingContent = `foo
      bar
      baz
    `
    expect(dedent(withLeadingContent)).toEqual(withLeadingContent)
  })
})
