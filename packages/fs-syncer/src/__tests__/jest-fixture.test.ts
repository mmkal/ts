import {jestFixture} from '..'
import * as fs from 'fs'
import * as path from 'path'

beforeAll(() => {
  jestFixture.wipe()
})

afterAll(() => {
  // make sure any test renaming gets cleaned up
  expect(fs.readdirSync(path.join(__dirname, 'fixtures', 'jest-fixture.test.ts')).sort()).toEqual([
    'a-suite-another-test-doesn-t-have-nice-path-formatting',
    'fixture-dir-is-created',
    'yaml-snapshot',
  ])
})

test('fixture dir is created', () => {
  const fixture = jestFixture({'one.txt': 'uno'})

  fixture.sync()

  expect(fs.existsSync(path.join(__dirname, 'fixtures', 'jest-fixture.test.ts', 'fixture-dir-is-created'))).toBe(true)
  expect(
    fs
      .readFileSync(path.join(__dirname, 'fixtures', 'jest-fixture.test.ts', 'fixture-dir-is-created', 'one.txt'))
      .toString()
      .trim()
  ).toBe('uno')
})

describe('A suite', () => {
  test(`another test (doesn't have nice path formatting!)`, () => {
    const fixture = jestFixture({'two.txt': 'dos'})

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

jestFixture.addYamlSnapshotSerializer()

test('yaml snapshot', () => {
  const fixture = jestFixture({
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
  })

  fixture.sync()

  expect(fixture.read()).toMatchInlineSnapshot(`
    multiline.py: |-
      if __name__ == "__main__":
        print("hello world")
      
    singleline.js: |-
      console.log('hello world')
      
    nested: 
      directory: 
        withfile.txt: |-
          hello world
          
        with: 
          multiline.rs: |-
            fn main() {
              println!("hello world");
            }
            
  `)
})
