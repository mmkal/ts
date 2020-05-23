# jest-inline-snapshots

A backwards-compatible shim for jest's `expect(...).toMatchInlineSnapshot()` which uses javascript values for snapshots rather than ugly templated strings.

<!-- codegen:start {preset: badges} -->
[![Node CI](https://github.com/mmkal/ts/workflows/Node%20CI/badge.svg)](https://github.com/mmkal/ts/actions?query=workflow%3A%22Node+CI%22)
[![codecov](https://codecov.io/gh/mmkal/ts/branch/master/graph/badge.svg)](https://codecov.io/gh/mmkal/ts/tree/master/packages/jest-inline-snapshots)
[![npm version](https://badge.fury.io/js/jest-inline-snapshots.svg)](https://npmjs.com/package/jest-inline-snapshots)
<!-- codegen:end -->

Example usage:

```typescript
import {getAdminUser} from '../some-module'

test('admin user', () => {
  expect(getAdminUser()).toMatchInlineSnapshot()
})
```

When running tests with `jest`, this will turn into:

```typescript
const getAdminUser = () => ({id: 'alice123', name: 'Alice McAlice', age: 40})

test('admin user', () => {
  expect(getAdminUser()).toMatchInlineSnapshot({
    id: 'alice123',
    name: 'Alice McAlice',
    age: 40,
  })
})
```

Contrast this to using regular jest inline snapshots, which use templated strings:

```typescript
const getAdminUser = () => ({id: 'alice123', name: 'Alice McAlice', age: 40})

test('get user', () => {
  expect(getAdminUser()).toMatchInlineSnapshot(`
    Object {
      "age": 40,
      "id": "alice123",
      "name": "Alice McAlice",
    }
  `)
})
```

## Usage

Install via npm or yarn:

```bash
npm install --save-dev jest-inline-snapshots
```

or

```bash
yarn add --dev jest-inline-snapshots
```

Then register the shim by adding its `register` script to your jest config, e.g. in `jest.config.js`:

```js
module.exports = {
  ...,
  setupFilesAfterEnv: ['jest-inline-snapshots/register'],
  ...
}
```

You can also register by adding `require('jest-inline-snapshots/register')` or `import 'jest-inline-snapshots/register'` to the top of an individual test file, if you don't want to use it for an entire codebase.

You can also use the shim directly without modifying the global `expect` function:

```typescript
import {getAdminUser} from '../some-module'
import {expectShim} from 'jest-inline-snapshots'

test('admin user', () => {
  expectShim(getAdminUser()).toMatchInlineSnapshot()
})
```

### Property matchers

Built-in jest snapshot allow use of ["asymmetric matchers"](https://jestjs.io/docs/en/snapshot-testing#property-matchers) for snapshotting objects with fields that aren't consistent. This library also supports them - they can be defined inline alongside the generated snapshot properties:

```typescript
test('property matchers', () => {
  const user = {
    createdAt: new Date(),
    id: Math.floor(Math.random() * 20),
    name: 'LeBron James',
  }

  expect(user).toMatchInlineSnapshot({
    createdAt: expect.any(Date),
    id: expect.any(Number)
  })
})
```

becomes:

```typescript
test('property matchers', () => {
  const user = {
    createdAt: new Date(),
    id: Math.floor(Math.random() * 20),
    name: 'LeBron James',
  }

  expect(user).toMatchInlineSnapshot({
    createdAt: expect.any(Date),
    id: expect.any(Number),
    name: 'LeBron James',
  })
})
```

### Formatting

By default, when snapshots are updated, the library will try to "fix" the generated code according to your project's style rules by running `eslint` on the generated code. If you don't have eslint installed or set up, the snapshots will try to detect indentation and quote style in the file they're in, and stick to that. So they should normally look ok. You can use a different linting/formatting tool by overriding the format function in a setup script. This example uses [prettier](https://prettier.io/docs/en/api.html#prettierformatsource--options):

```typescript
import {formatter} from 'jest-inline-snapshots'
import * as prettier from 'prettier'

formatter.format = (code, file) => {
  if (file.match(/should-use-semicolons/)) {
    return prettier.format(code, {semi: true})
  } else {
    return prettier.format(code, {semi: false})
  }
}
```

(Personally, I would recommend setting prettier via eslint with `eslint-plugin-prettier` rather than doing this, but the above approach should work with other tools like tslint, standardjs, xo, your-company's-in-house-custom-formatter, etc.)

### Migrating

Just run jest with `-u` to migrate old style template snapshots to objects.

One advantage of the snapshots being plain javascript objects, rather than templates, is that you can very easily switch between `.toEqual(...)`, `.toMatchObject(...)` and `.toMatchInlineSnapshot(...)`, since the signatures are identical. For all of the examples above, you can simply change `toMatchInlineSnapshot` to `toEqual` at any point, if you no longer expect the "snapshot" to need to be updated. Similarly, for any existing usages of `toEqual`, a quick and easy way to update the assertion would be to change it to `toMatchInlineSnapshot`, run `yarn test -u`, then change it back.

### Limitations

- If you don't have babel 7 installed, you won't be able to use asymmetric matchers.
- Comments within snapshots will get wiped out when the snapshot updates.
- Comments with unbalanced parentheses could cause the snapshot to fail to write, or screw up your file. They do some not-very-sophisticated code-parsing that assumes you're not doing anything too weird. So don't put comments inside snapshots!
- [JSON5](https://github.com/json5/json5) is used to format the inline snapshots. This means values can be serialised based on their `.toJSON()` methods, but if they don't have one, and aren't simple objects, they might end up as `{}`
- If you don't have eslint installed or configured, the snapshots generated might not match the formatting for your project.
- [Interactive snapshots don't work](https://jestjs.io/docs/en/snapshot-testing#interactive-snapshot-mode)
- Snapshots being written/udpated are logged to the jest console slightly differently - you won't get a handy summary at the end of the run about how many were updated overall, you will be told how many snapshots were updated for each file.
- Asymmetric matchers won't be updated even when you run with `-u`. If values matched by property matchers change, you'll have to remove/updated the asymmetric matcher manually. This is for parity with the in-built inline snapshot feature, where property matchers aren't affected by `-u`.
- React/JSX snapshots haven't been tested. They might not work very well.
- Performance:
  - When updating, there are several stages of parsing/stringifying, so updating snapshots might be slower than when using jest.
  - When not updating, assertions will be slightly slower than when using `expect(...).toEqual(...)` because of a round of preprocessing.
- Newlines are normalised to the OS default, so this library shouldn't be used for assertions that distinguish between `\r\n` and `\n`.
- Strings are automatically "dedented" so the output is readable. There could side-effects for text with unusual formatting.

### Under the hood

So that you know what's actually happening when using this library:

- When the library is imported, it adds an `afterAll` hook to your test suite responsible for writing snapshots to disk
- When `expect(...).toMatchInlineSnapshot()` is called:
   - If running in CI (as determined by the `CI` environment variable), the test will fail.
   - Otherwise, a snapshot will created. It isn't written to disk immediately - it's saved in an in-memory array, so that multiple changes to a single file can be written in one shot.
- When `expect(...).toMatchInlineSnapshot(...)` is called (i.e. with one or more parameters, whether they're strings or objects):
   - First, a standard `expect(...).toEqual(...)` call will be made. If that fails:
     - If the `-u` cli arg has been passed:
        - If there are any asymmetric matchers defined, they will be validated.
        - If that succeeds, a snapshot update will be saved which replaces the `.toMatchInlineSnapshot` params with the updated code.
     - Otherwise, the test fails with the assertion message from the `.toEqual(...)` call.
- When the `afterAll` hook runs, it iterates through all snapshots, grouped by file. It modifies the original code, then runs the formatter on the modified code before writing to disk.
