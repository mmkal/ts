import * as preset from '../custom'

test('loads custom export', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const customPreset = require('./custom-preset')

  expect(Object.keys(customPreset)).toEqual(['getText', 'thrower'])

  expect(customPreset.getText.toString().trim()).toMatch(/'Named export with input: ' \+ options.input/)

  expect(
    preset.custom({
      meta: {filename: __filename, existingContent: ''},
      options: {source: './custom-preset.js', export: 'getText', input: 'abc'},
    })
  ).toMatchInlineSnapshot(`"Named export with input: abc"`)

  expect(
    preset.custom({
      meta: {filename: __filename, existingContent: ''},
      options: {source: './custom-preset.js', input: 'def'},
    })
  ).toMatchInlineSnapshot(`"Whole module export with input: def"`)

  expect(() =>
    preset.custom({
      meta: {filename: __filename, existingContent: ''},
      options: {source: './does-not-exist.ts', export: 'getText', input: 'abc'},
    })
  ).toThrowError(/Source path doesn't exist: .*does-not-exist.ts/)

  expect(() =>
    preset.custom({
      meta: {filename: __filename, existingContent: ''},
      options: {source: './custom-preset.js', export: 'doesNotExist', input: 'abc'},
    })
  ).toThrowError(/Couldn't find export doesNotExist from .*custom-preset.js - got undefined/)

  expect(() =>
    preset.custom({
      meta: {filename: __filename, existingContent: ''},
      options: {source: './invalid-custom-preset.js', input: 'abc'},
    })
  ).toThrowError(/Couldn't find export function from .*invalid-custom-preset.js - got object/)
})
