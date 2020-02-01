# @mmkal/type-assertions

Compile-time tests for types. Useful to make sure types don't regress into being overly-permissive as changes go in over time.

## Usage

```cli
npm install @mmkal/type-assertions
```

<!-- example:start -->
```typescript
import {expectTypeOf} from '@mmkal/type-assertions'

it('tests types', () => {
  expectTypeOf({a: 1}).toEqualTypeOf({a: 1})
  expectTypeOf({a: 1, b: 1}).toMatchTypeOf({a: 1})
  expectTypeOf({a: 1}).not.toMatchTypeOf({b: 1})

  expectTypeOf({a: 1}).toEqualTypeOf({a: 2})

  expectTypeOf<unknown>().toBeUnknown()
  expectTypeOf<any>().toBeAny()
  expectTypeOf<never>().toBeNever()

  expectTypeOf(() => 1).toBeFunction()
  expectTypeOf({}).toBeObject()
  expectTypeOf([]).toBeArray()
  expectTypeOf('').toBeString()
  expectTypeOf(1).toBeNumber()
  expectTypeOf(true).toBeBoolean()
  expectTypeOf(Promise.resolve(123)).resolves.toBeNumber()
  expectTypeOf(Symbol(1)).toBeSymbol()

  expectTypeOf(undefined).toBeUndefined()
  expectTypeOf(undefined).toBeNullable()
  expectTypeOf(undefined).not.toBeNull()

  expectTypeOf(null).toBeNull()
  expectTypeOf(null).toBeNullable()
  expectTypeOf(null).not.toBeUndefined()

  expectTypeOf<1 | undefined>().toBeNullable()
  expectTypeOf<1 | null>().toBeNullable()
  expectTypeOf<1 | undefined | null>().toBeNullable()

  expectTypeOf(1).not.toBeUnknown()
  expectTypeOf(1).not.toBeAny()
  expectTypeOf(1).not.toBeNever()
  expectTypeOf(1).not.toBeNull()
  expectTypeOf(1).not.toBeUndefined()
  expectTypeOf(1).not.toBeNullable()

  const obj = {a: 1, b: ''}

  expectTypeOf(obj)
    .property('a')
    .toEqualTypeOf(1)
  expectTypeOf(obj)
    .property('b')
    .toEqualTypeOf<string>()

  const f = (a: number) => [a, a]

  expectTypeOf(f).toBeFunction()
  expectTypeOf('hi').not.toBeFunction()

  expectTypeOf(f).toBeCallableWith(1)
  expectTypeOf(f).not.toBeAny()
  expectTypeOf(f).returns.not.toBeAny()
  expectTypeOf(f).returns.toEqualTypeOf([1, 2])
  expectTypeOf(f).returns.toEqualTypeOf([1, 2, 3])
  expectTypeOf(f)
    .parameter(0)
    .not.toEqualTypeOf('1')
  expectTypeOf(f)
    .parameter(0)
    .toEqualTypeOf(1)
  expectTypeOf(1)
    .parameter(0)
    .toBeNever()

  const twoArgFunc = (a: number, b: string) => ({a, b})

  expectTypeOf(twoArgFunc).parameters.toEqualTypeOf<[number, string]>()

  const asyncFunc = async () => 123

  expectTypeOf(asyncFunc).returns.resolves.toBeNumber()

  const thrower = () => {
    throw Error()
  }

  expectTypeOf(thrower).returns.toBeNever()

  expectTypeOf([1, 2, 3]).items.toBeNumber()
  expectTypeOf([1, 2, 3]).items.not.toBeString()

  expectTypeOf<{a: number; b?: number}>().not.toEqualTypeOf<{a: number}>()
  expectTypeOf<{a: number; b?: number | null}>().not.toEqualTypeOf<{a: number; b?: number}>()
  expectTypeOf<{a: number; b?: number | null}>().toEqualTypeOf<{a: number; b?: number | null}>()
})
```
<!-- example:end -->
