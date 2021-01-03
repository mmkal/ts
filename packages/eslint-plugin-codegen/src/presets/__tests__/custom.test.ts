import * as preset from '../custom'
import * as path from 'path'

jest.mock('ts-node/register/transpile-only')

test('custom preset validation', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const customPreset = require('./custom-preset')

  expect(Object.keys(customPreset)).toEqual(['getText', 'thrower'])

  expect(customPreset.getText.toString().trim()).toMatch(/'Named export with input: ' \+ options.input/)
})

test('named export', () => {
  expect(
    preset.custom({
      meta: {filename: __filename, existingContent: ''},
      options: {source: './custom-preset.js', export: 'getText', input: 'abc'},
    })
  ).toMatchInlineSnapshot(`"Named export with input: abc"`)
})

test('whole module export', () => {
  expect(
    preset.custom({
      meta: {filename: __filename, existingContent: ''},
      options: {source: './custom-preset.js', input: 'def'},
    })
  ).toMatchInlineSnapshot(`"Whole module export with input: def"`)
})

test('load typescript with ts-node', () => {
  expect(
    preset.custom({
      meta: {filename: __filename, existingContent: ''},
      options: {source: './custom-preset.ts', export: 'getText'},
    })
  ).toMatchInlineSnapshot(`"typescript text"`)
})

test('dev mode, deletes require cache', () => {
  expect(
    preset.custom({
      meta: {filename: __filename, existingContent: ''},
      options: {source: './custom-preset.js', input: 'ghi', dev: true},
    })
  ).toMatchInlineSnapshot(`"Whole module export with input: ghi"`)
})

test(`when source isn't specified, uses filename`, () => {
  expect(
    preset.custom({
      meta: {filename: path.join(__dirname, 'custom-preset.js'), existingContent: ''},
      options: {input: 'abc'},
    })
  ).toEqual('Whole module export with input: abc')
})

test('errors for non-existent source file', () => {
  expect(() =>
    preset.custom({
      meta: {filename: __filename, existingContent: ''},
      options: {source: './does-not-exist.ts'},
    })
  ).toThrowError(/Source path is not a file: .*does-not-exist.ts/)
})

test('errors if directory passed as source', () => {
  expect(() =>
    preset.custom({
      meta: {filename: __filename, existingContent: ''},
      options: {source: '__tests__'},
    })
  ).toThrowError(/Source path is not a file: .*__tests__/)
})

test('errors for non-existent export', () => {
  expect(() =>
    preset.custom({
      meta: {filename: __filename, existingContent: ''},
      options: {source: './custom-preset.js', export: 'doesNotExist', input: 'abc'},
    })
  ).toThrowError(/Couldn't find export doesNotExist from .*custom-preset.js - got undefined/)
})

test('errors for export with wrong type', () => {
  expect(() =>
    preset.custom({
      meta: {filename: __filename, existingContent: ''},
      options: {source: './invalid-custom-preset.js', input: 'abc'},
    })
  ).toThrowError(/Couldn't find export function from .*invalid-custom-preset.js - got object/)
})

test('can require module first', () => {
  expect(() =>
    preset.custom({
      meta: {filename: __filename, existingContent: ''},
      options: {source: './custom-preset.js', require: 'thismoduledoesnotexist'},
    })
  ).toThrowError(/Cannot find module 'thismoduledoesnotexist' from 'src\/presets\/custom.ts'/)
})
