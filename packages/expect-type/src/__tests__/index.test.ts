import {expectTypeOf} from '..'

test('Type-check object references', () => {
  expectTypeOf({a: 1}).toEqualTypeOf({a: 1})
  expectTypeOf({a: 1, b: 1}).toMatchTypeOf({a: 1})
  expectTypeOf({a: 1}).toEqualTypeOf({a: 2})
})

test('Assertions can be inverted', () => {
  expectTypeOf({a: 1}).not.toMatchTypeOf({b: 1})
})

test('Overloads', () => {
  type Overloaded = ((a: string) => string) | ((a: number) => number)

  // @ts-expect-error
  expectTypeOf<Overloaded>().returns.toMatchTypeOf<string>()

  // @ts-expect-error
  expectTypeOf<Overloaded>().returns.toBeNumber()

  expectTypeOf<Overloaded>().with<(b: string) => any>().parameter(0).toBeString()
  expectTypeOf<Overloaded>().with<(b: number) => number>().parameter(0).toBeNumber()

  expectTypeOf<Overloaded>().withParams<[string]>().parameter(0).toBeString()
  expectTypeOf<Overloaded>().withParams<[number]>().parameter(0).toBeNumber()

  expectTypeOf<Overloaded>().withReturnType<string>().parameter(0).toBeString()
  expectTypeOf<Overloaded>().withReturnType<number>().parameter(0).toBeNumber()
})

test('Catch any/unknown/never types', () => {
  expectTypeOf<unknown>().toBeUnknown()
  expectTypeOf<any>().toBeAny()
  expectTypeOf<never>().toBeNever()
})

test('Test for basic javascript types', () => {
  expectTypeOf(() => 1).toBeFunction()
  expectTypeOf({}).toBeObject()
  expectTypeOf([]).toBeArray()
  expectTypeOf('').toBeString()
  expectTypeOf(1).toBeNumber()
  expectTypeOf(true).toBeBoolean()
  expectTypeOf(Promise.resolve(123)).resolves.toBeNumber()
  expectTypeOf(Symbol(1)).toBeSymbol()
})

test('Nullable types', () => {
  expectTypeOf(undefined).toBeUndefined()
  expectTypeOf(undefined).toBeNullable()
  expectTypeOf(undefined).not.toBeNull()

  expectTypeOf(null).toBeNull()
  expectTypeOf(null).toBeNullable()
  expectTypeOf(null).not.toBeUndefined()

  expectTypeOf<1 | undefined>().toBeNullable()
  expectTypeOf<1 | null>().toBeNullable()
  expectTypeOf<1 | undefined | null>().toBeNullable()
})

test('Assertions can be inverted with `.not`', () => {
  expectTypeOf(1).not.toBeUnknown()
  expectTypeOf(1).not.toBeAny()
  expectTypeOf(1).not.toBeNever()
  expectTypeOf(1).not.toBeNull()
  expectTypeOf(1).not.toBeUndefined()
  expectTypeOf(1).not.toBeNullable()
})

test('Make assertions about object properties', () => {
  const obj = {a: 1, b: ''}

  // check that properties exist (or don't) with `.toHaveProperty`
  expectTypeOf(obj).toHaveProperty('a')
  expectTypeOf(obj).not.toHaveProperty('c')

  // check types of properties
  expectTypeOf(obj).toHaveProperty('a').toBeNumber()
  expectTypeOf(obj).toHaveProperty('b').toBeString()
  expectTypeOf(obj).toHaveProperty('a').not.toBeString()
})

test('Assert on function parameters (using `.parameter(n)` or `.parameters`) and return values (using `.returns`)', () => {
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
})

test('Promise resolution types can be checked with `.resolves`', () => {
  const asyncFunc = async () => 123

  expectTypeOf(asyncFunc).returns.resolves.toBeNumber()
})

test('Array items can be checked with `.items`', () => {
  expectTypeOf([1, 2, 3]).items.toBeNumber()
  expectTypeOf([1, 2, 3]).items.not.toBeString()
})

test('Check that functions never return', () => {
  const thrower = () => {
    throw Error()
  }

  expectTypeOf(thrower).returns.toBeNever()
})

test('Generics can be used rather than references', () => {
  expectTypeOf<{a: number; b?: number}>().not.toEqualTypeOf<{a: number}>()
  expectTypeOf<{a: number; b?: number | null}>().not.toEqualTypeOf<{a: number; b?: number}>()
  expectTypeOf<{a: number; b?: number | null}>().toEqualTypeOf<{a: number; b?: number | null}>()
})
