# expect-type

Compile-time tests for types. Useful to make sure types don't regress into being overly-permissive as changes go in over time.

<!-- codegen:start {preset: badges} -->
[![Node CI](https://github.com/mmkal/ts/workflows/Node%20CI/badge.svg)](https://github.com/mmkal/ts/actions?query=workflow%3A%22Node+CI%22)
[![codecov](https://codecov.io/gh/mmkal/ts/branch/master/graph/badge.svg)](https://codecov.io/gh/mmkal/ts/tree/master/packages/expect-type)
[![npm version](https://badge.fury.io/js/expect-type.svg)](https://npmjs.com/package/expect-type)
<!-- codegen:end -->

Similar to Jest's `expect`, but with type-awareness. Gives you access to a number of type-matchers that let you make assertions about the form of a reference or generic type parameter.

It can be used in your existing test files - or anywhere other type-checked file you'd like.

##### Example

```typescript
import {foo, bar} from '../foo'
import {expectTypeOf} from 'expect-type'

test('foo types', () => {
  // make sure `foo` has type {a: number}
  expectTypeOf(foo).toMatchTypeOf({a: 1})
  expectTypeOf(foo).toHaveProperty('a').toBeNumber()

  // make sure `bar` is a function taking a string:
  expectTypeOf(bar).parameter(0).toBeString()
  expectTypeOf(bar).returns.not.toBeAny()
})
```

See the [documentation](#documentation) for lots more examples.

## Contents
<!-- codegen:start {preset: markdownTOC, minDepth: 2, maxDepth: 5} -->
- [Contents](#contents)
- [Installation and usage](#installation-and-usage)
- [Documentation](#documentation)
   - [Features](#features)
- [Similar projects](#similar-projects)
   - [Comparison](#comparison)
<!-- codegen:end -->

## Installation and usage

```cli
npm install expect-type
```

```typescript
import {expectTypeOf} from 'expect-type'
```

## Documentation

The `expectTypeOf` method takes a single argument, or a generic parameter. Neither it, nor the functions chained off its return value, have any meaningful runtime behaviour. The assertions you write will be _compile-time_ errors if they don't hold true.

### Features

<!-- codegen:start {preset: markdownFromTests, source: src/__tests__/index.test.ts} -->
Check that two objects have equivalent types to `.toEqualTypeOf`:

```typescript
expectTypeOf({a: 1}).toEqualTypeOf({a: 1})
```

`.toEqualTypeOf` succeeds for objects with different values, but the same type:

```typescript
expectTypeOf({a: 1}).toEqualTypeOf({a: 2})
```

When there's no instance/runtime variable for the expected type, you can use generics:

```typescript
expectTypeOf({a: 1}).toEqualTypeOf<{a: number}>()
```

`.toEqualTypeOf` fails on extra properties:

```typescript
// @ts-expect-error
expectTypeOf({a: 1, b: 1}).toEqualTypeOf({a: 1})
```

To allow for extra properties, use `.toMatchTypeOf`. This checks that an object "matches" a type. This is similar to jest's `.toMatchObject`:

```typescript
expectTypeOf({a: 1, b: 1}).toMatchTypeOf({a: 1})
```

Another example of the difference between `.toMatchTypeOf` and `.toEqualTypeOf`, using generics. `.toMatchTypeOf` can be used for "is-a" relationships:

```typescript
type Fruit = {type: 'Fruit'; edible: boolean}
type Apple = {type: 'Fruit'; name: 'Apple'; edible: true}

expectTypeOf<Apple>().toMatchTypeOf<Fruit>()

// @ts-expect-error
expectTypeOf<Apple>().toEqualTypeOf<Fruit>()
```

Assertions can be inverted:

```typescript
expectTypeOf({a: 1}).not.toMatchTypeOf({b: 1})
```

Catch any/unknown/never types:

```typescript
expectTypeOf<unknown>().toBeUnknown()
expectTypeOf<any>().toBeAny()
expectTypeOf<never>().toBeNever()
```

Test for basic javascript types:

```typescript
expectTypeOf(() => 1).toBeFunction()
expectTypeOf({}).toBeObject()
expectTypeOf([]).toBeArray()
expectTypeOf('').toBeString()
expectTypeOf(1).toBeNumber()
expectTypeOf(true).toBeBoolean()
expectTypeOf(Promise.resolve(123)).resolves.toBeNumber()
expectTypeOf(Symbol(1)).toBeSymbol()
```

Nullable types:

```typescript
expectTypeOf(undefined).toBeUndefined()
expectTypeOf(undefined).toBeNullable()
expectTypeOf(undefined).not.toBeNull()

expectTypeOf(null).toBeNull()
expectTypeOf(null).toBeNullable()
expectTypeOf(null).not.toBeUndefined()

expectTypeOf<1 | undefined>().toBeNullable()
expectTypeOf<1 | null>().toBeNullable()
expectTypeOf<1 | undefined | null>().toBeNullable()
```

Most assertions can be inverted with `.not`:

```typescript
expectTypeOf(1).not.toBeUnknown()
expectTypeOf(1).not.toBeAny()
expectTypeOf(1).not.toBeNever()
expectTypeOf(1).not.toBeNull()
expectTypeOf(1).not.toBeUndefined()
expectTypeOf(1).not.toBeNullable()
```

Make assertions about object properties:

```typescript
const obj = {a: 1, b: ''}

// check that properties exist (or don't) with `.toHaveProperty`
expectTypeOf(obj).toHaveProperty('a')
expectTypeOf(obj).not.toHaveProperty('c')

// check types of properties
expectTypeOf(obj).toHaveProperty('a').toBeNumber()
expectTypeOf(obj).toHaveProperty('b').toBeString()
expectTypeOf(obj).toHaveProperty('a').not.toBeString()
```

Assert on function parameters (using `.parameter(n)` or `.parameters`) and return values (using `.returns`):

```typescript
const f = (a: number) => [a, a]

expectTypeOf(f).toBeFunction()

expectTypeOf(f).toBeCallableWith(1)
expectTypeOf(f).not.toBeAny()
expectTypeOf(f).returns.not.toBeAny()
expectTypeOf(f).returns.toEqualTypeOf([1, 2])
expectTypeOf(f).returns.toEqualTypeOf([1, 2, 3])
expectTypeOf(f).parameter(0).not.toEqualTypeOf('1')
expectTypeOf(f).parameter(0).toEqualTypeOf(1)
expectTypeOf(1).parameter(0).toBeNever()

const twoArgFunc = (a: number, b: string) => ({a, b})

expectTypeOf(twoArgFunc).parameters.toEqualTypeOf<[number, string]>()
```

Assert on constructor parameters:

```typescript
expectTypeOf(Date).toBeConstructibleWith('1970')
expectTypeOf(Date).toBeConstructibleWith(0)
expectTypeOf(Date).toBeConstructibleWith(new Date())
expectTypeOf(Date).toBeConstructibleWith()

expectTypeOf(Date).constructorParameters.toEqualTypeOf<[] | [string | number | Date]>()
```

Class instance types:

```typescript
expectTypeOf(Date).instance.toHaveProperty('toISOString')
```

Promise resolution types can be checked with `.resolves`:

```typescript
const asyncFunc = async () => 123

expectTypeOf(asyncFunc).returns.resolves.toBeNumber()
```

Array items can be checked with `.items`:

```typescript
expectTypeOf([1, 2, 3]).items.toBeNumber()
expectTypeOf([1, 2, 3]).items.not.toBeString()
```

Check that functions never return:

```typescript
const thrower = () => {
  throw Error('oh no')
}

expectTypeOf(thrower).returns.toBeNever()
```

Generics can be used rather than references:

```typescript
expectTypeOf<{a: number; b?: number}>().not.toEqualTypeOf<{a: number}>()
expectTypeOf<{a: number; b?: number | null}>().not.toEqualTypeOf<{a: number; b?: number}>()
expectTypeOf<{a: number; b?: number | null}>().toEqualTypeOf<{a: number; b?: number | null}>()
```
<!-- codegen:end -->

## Similar projects

Other projects with similar goals:

- [`ts-expect`](https://github.com/TypeStrong/ts-expect) exports several generic helper types to perform type assertions
- [`dtslint`](https://github.com/Microsoft/dtslint) does type checks via comment directives and tslint
- [`tsd-check`](https://github.com/SamVerschueren/tsd-check/issues/10) is a CLI that runs the TypeScript type checker over assertions
- [`type-plus`](https://github.com/unional/type-plus) comes with various type and runtime TypeScript assertions
- [`static-type-assert`](https://github.com/ksxnodemodules/static-type-assert) type assertion functions

### Comparison

The key differences in this project are:

- a fluent, jest-inspired API, making the difference between `actual` and `expected` clear. This is helpful with complex types and assertions.
- inverting assertions intuitively and easily via `expectType(...).not`
- first-class support for:
  - `any` (as well as `unknown` and `never`).
    - This can be especially useful in combination with `not`, to protect against functions returning too-permissive types. For example, `const parseFile = (filename: string) => JSON.parse(readFileSync(filename).toString())` returns `any`, which could lead to errors. After giving it a proper return-type, you can add a test for this with `expect(parseFile).returns.not.toBeAny()`
  - object properties
  - function parameters
  - function return values
  - array item values
  - nullable
- assertions on types "matching" rather than exact type equality, for "is-a" relationships e.g. `expectTypeOf(square).toMatchTypeOf<Shape>()`
- built into existing tooling with no dependencies. No extra build step, cli tool, or lint plugin is needed. Just import the function and start writing tests.
