import * as fsSyncer from '..'
import * as fs from 'fs'
import * as path from 'path'
import {wipe} from '../jest'

test('fixture dir is created', () => {
  const fixture = fsSyncer.jestFixture({
    targetState: {'one.txt': 'uno'},
  })

  fixture.sync()

  expect(fs.existsSync(path.join(__dirname, 'fixtures', 'jest-fixture.test.ts', 'fixture-dir-is-created'))).toBe(true)
  expect(
    fs
      .readFileSync(path.join(__dirname, 'fixtures', 'jest-fixture.test.ts', 'fixture-dir-is-created', 'one.txt'))
      .toString()
      .trim()
  ).toBe('uno')
})

test('wipe() deletes existing files', () => {
  const before = fsSyncer.jestFixture({
    targetState: {'one.txt': '1'},
  })

  before.sync()

  expect(
    fs.readdirSync(path.join(__dirname, 'fixtures', 'jest-fixture.test.ts', 'wipe-deletes-existing-files'))
  ).toEqual(['one.txt'])

  wipe()

  expect(
    fs.readdirSync(path.join(__dirname, 'fixtures', 'jest-fixture.test.ts', 'wipe-deletes-existing-files'))
  ).toEqual([])
})

describe('A suite', () => {
  test(`another test (doesn't have nice path formatting!)`, () => {
    const fixture = fsSyncer.jestFixture({
      targetState: {'two.txt': 'dos'},
    })

    fixture.sync()

    expect(
      fs.existsSync(
        path.join(
          __dirname,
          'fixtures',
          'jest-fixture.test.ts',
          'a-suite-another-test-doesn-t-have-nice-path-formatting'
        )
      )
    ).toBe(true)
    expect(
      fs
        .readFileSync(
          path.join(
            __dirname,
            'fixtures',
            'jest-fixture.test.ts',
            'a-suite-another-test-doesn-t-have-nice-path-formatting',
            'two.txt'
          )
        )
        .toString()
        .trim()
    ).toBe('dos')
  })
})

test('yaml snapshot', () => {
  const fixture = fsSyncer.jestFixture({
    targetState: {
      'singleline.js': `console.log('hello world')`,
      'multiline.py':
        `if __name__ == "__main__":\n` + // prettier-break
        `  print("hello world")`,
      nested: {
        directory: {
          'withfile.txt': 'hello world',
          with: {
            'multiline.rs':
              `fn main() {\n` + // prettier-break
              `  println!("hello world");\n` +
              `}`,
          },
        },
      },
    },
  })

  fixture.sync()

  expect(fixture.yaml()).toMatchInlineSnapshot(`
    "---
    multiline.py: |-
      if __name__ == \\"__main__\\":
        print(\\"hello world\\")
      
    singleline.js: |-
      console.log('hello world')
      
    nested: 
      directory: 
        withfile.txt: |-
          hello world
          
        with: 
          multiline.rs: |-
            fn main() {
              println!(\\"hello world\\");
            }
            "
  `)
})
