# expect-type

Compile-time tests for types. Useful to make sure types don't regress into being overly-permissive as changes go in over time.

![Node CI](https://github.com/mmkal/ts/workflows/Node%20CI/badge.svg)
![codecov](https://codecov.io/gh/mmkal/ts/branch/master/graph/badge.svg)

<!-- codegen:start {preset: markdownFromJsdoc, source: src/index.ts, export: expectTypeOf} -->
#### [expectTypeOf](./src/index.ts#L67)

Similar to Jest's `expect`, but with type-awareness. Gives you access to a number of type-matchers that let you make assertions about the form of a reference or generic type parameter.

##### Example

```typescript
expectTypeOf({a: 1}).toMatchTypeOf({a: 2})
expectTypeOf({a: 1}).property('a').toBeNumber()
```

See the [full docs](https://npmjs.com/package/expect-type#documentation) for lots more examples.
<!-- codegen:end -->

## Contents
<!-- codegen:start {preset: markdownTOC, minDepth: 2, maxDepth: 5} -->
- [expectTypeOf](#expecttypeof)
- [Contents](#contents)
- [Installation and usage](#installation-and-usage)
- [Documentation](#documentation)
- [Similar projects](#similar-projects)
<!-- codegen:end -->

## Installation and usage

```cli
npm install expect-type
```

```typescript
import {expectTypeOf} from 'expect-type'
```

## Documentation

<!-- codegen:start {preset: markdownFromTests, source: src/__tests__/index.test.ts} -->
Type-check object references:

```typescript
expectTypeOf({a: 1}).toEqualTypeOf({a: 1})
expectTypeOf({a: 1, b: 1}).toMatchTypeOf({a: 1})
expectTypeOf({a: 1}).toEqualTypeOf({a: 2})
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

Assertions can be inverted with `.not`:

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

expectTypeOf(obj).property('a').toEqualTypeOf(1)
expectTypeOf(obj).property('b').toEqualTypeOf<string>()
```

Assert on function parameters (using `.parameter(n)` or `.parameters`) and return values (using `.return`):

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
  throw Error()
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
