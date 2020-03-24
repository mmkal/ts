import {processors} from '..'
import dedent from 'dedent'
import {Linter} from 'eslint'

describe('markdown processor', () => {
  const markdownProcessor = processors['.md']

  test('preprocessor comments out markdown correctly', () => {
    const markdown = dedent`
      # Title

      <!-- comment -->

      <div>html</div>

      \`\`\`js
      // some javascript
      const x = 1
      \`\`\`
    `

    const preprocessed = markdownProcessor.preprocess!(markdown)

    expect(preprocessed).toMatchInlineSnapshot(`
      Array [
        "/* eslint-disable prettier/prettier */ // eslint-plugin-codegen:remove
      // eslint-plugin-codegen:trim# Title
      // eslint-plugin-codegen:trim
      // eslint-plugin-codegen:trim<!-- comment -->
      // eslint-plugin-codegen:trim
      // eslint-plugin-codegen:trim<div>html</div>
      // eslint-plugin-codegen:trim
      // eslint-plugin-codegen:trim\`\`\`js
      // eslint-plugin-codegen:trim// some javascript
      // eslint-plugin-codegen:trimconst x = 1
      // eslint-plugin-codegen:trim\`\`\`",
      ]
    `)
  })

  test('postprocessor flattens message lists', () => {
    // @ts-ignore
    const postprocessed = markdownProcessor.postprocess!([[{line: 1}], [{line: 2}]])

    expect(postprocessed).toEqual([{line: 1}, {line: 2}])
  })
})
