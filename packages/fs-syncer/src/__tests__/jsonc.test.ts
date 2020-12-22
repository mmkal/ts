import * as JSONC from '../jsonc'
import {dedent} from '../util'

expect.addSnapshotSerializer({
  test: () => false,
  print: val => JSON.stringify(val, null, 2),
})

test('parse jsonc', () => {
  const jsonc = dedent(`
    {
      // inline comment
      "a": 1,
      /* block comment on single line */
      "b": 2,
      /**
       * multiline block comment
       */
      "c": 3,
      "d": {
        // nested comment
        "e": 5
      },
      // comment on prop that is going to be deleted
      "deleteable": "abc",
      /**
       * This value is "def" because of important reasons.
       * You wouldn't want to see this comment if the value was changed;
       * that would be quite confusing.
       */
      "editable": "def",
      "f": 6
    }
  `)

  const parsed = JSONC.parse(jsonc as JSONC.JSONC)

  parsed.extraProp = 'added dynamically'

  delete parsed.deleteable // the comment for this prop should be removed too

  parsed.editable = 'xyz' // the comment for this prop will be removed; it may be out of date

  expect(JSONC.stringify(parsed)).toMatchInlineSnapshot(`
    "{
      // inline comment
      \\"a\\": 1,
      /* block comment on single line */
      \\"b\\": 2,
      /**
       * multiline block comment
       */
      \\"c\\": 3,
      \\"d\\": {
        // nested comment
        \\"e\\": 5
      },
      // comment on \\"deleteable\\" removed due to content change.
      // comment on \\"editable\\" removed due to content change.
      \\"editable\\": \\"xyz\\",
      \\"f\\": 6,
      \\"extraProp\\": \\"added dynamically\\"
    }"
  `)
})

test('edit jsonc', () => {
  const jsonc = dedent(`
    {
      // foobar comment
      "foo": "bar",
      "nested": {
        // nested comment
        "a": 1,
        "nestedMore": {
          "x": "y",
          "y": "z"
        }
      }
    }
  `)

  const edited = JSONC.edit(jsonc, (obj, comment) => {
    obj.nested.nestedMore.newProp = 123

    comment(
      ['nested', 'nestedMore', 'newProp'], // break
      'This was added because of important reasons you should know about'
    )

    comment(
      ['nested', 'nestedMore', 'y'],
      dedent(`
        A verbose, multiline comment
        about 'y'
      `)
    )

    expect(() => comment(['non', 'existent', 'path'], 'are ignored')).toThrowErrorMatchingInlineSnapshot(
      `"Can't add comment to path [non,existent,path]. Parent path is not defined."`
    )
  })

  expect(edited).toMatchInlineSnapshot(`
    "{
      // foobar comment
      \\"foo\\": \\"bar\\",
      \\"nested\\": {
        // nested comment
        \\"a\\": 1,
        \\"nestedMore\\": {
          \\"x\\": \\"y\\",
          /**
           * A verbose, multiline comment
           * about 'y'
           */
          \\"y\\": \\"z\\",
          // This was added because of important reasons you should know about
          \\"newProp\\": 123
        }
      }
    }"
  `)
})

test('edit jsonc respects existing indentation', () => {
  const jsonc = dedent(`
    {
    \t"a1": "b1"
    }
  `)

  const edited = JSONC.edit(jsonc, (obj, comment) => {
    obj.a2 = 'b2'
    obj.a3 = {x: 'y'}

    comment(['a1'], 'Comment 1')
    comment(['a3', 'x'], 'Comment 2')
  })

  expect(edited).toEqual(
    dedent(`
    {
    \t// Comment 1
    \t"a1": "b1",
    \t"a2": "b2",
    \t"a3": {
    \t\t// Comment 2
    \t\t"x": "y"
    \t}
    }`)
  )
})

test('edit jsonc double-space indents by default', () => {
  const jsonc = dedent(`{"a1": "b1"}`)

  const edited = JSONC.edit(jsonc, (obj, comment) => {
    obj.a2 = 'b2'

    comment(['a1'], 'Comment for a1')
  })

  expect(edited).toMatchInlineSnapshot(`
    "{
      // Comment for a1
      \\"a1\\": \\"b1\\",
      \\"a2\\": \\"b2\\"
    }"
  `)
})
