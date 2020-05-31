import {expectTypeOf} from '..'

test('Check that two objects have equivalent types with `.toEqualTypeOf`', () => {
  expectTypeOf({a: 1}).toEqualTypeOf({a: 1})
})

test('`.toEqualTypeOf` succeeds for objects with different values, but the same type', () => {
  expectTypeOf({a: 1}).toEqualTypeOf({a: 2})
})

test("When there's no instance/runtime variable for the expected type, you can use generics", () => {
  expectTypeOf({a: 1}).toEqualTypeOf<{a: number}>()
})

test('`.toEqualTypeOf` fails on extra properties', () => {
  // @ts-expect-error
  expectTypeOf({a: 1, b: 1}).toEqualTypeOf({a: 1})
})

test('To allow for extra properties, use `.toMatchTypeOf`. This checks that an object "matches" a type. This is similar to jest\'s `.toMatchObject`', () => {
  expectTypeOf({a: 1, b: 1}).toMatchTypeOf({a: 1})
})

test('Another example of the difference between `.toMatchTypeOf` and `.toEqualTypeOf`, using generics. `.toMatchTypeOf` can be used for "is-a" relationships', () => {
  type Fruit = {type: 'Fruit'; edible: boolean}
  type Apple = {type: 'Fruit'; name: 'Apple'; edible: true}

  expectTypeOf<Apple>().toMatchTypeOf<Fruit>()

  // @ts-expect-error
  expectTypeOf<Fruit>().toMatchTypeOf<Apple>()

  // @ts-expect-error
  expectTypeOf<Apple>().toEqualTypeOf<Fruit>()
})

test('Assertions can be inverted with `.not`', () => {
  expectTypeOf({a: 1}).not.toMatchTypeOf({b: 1})
})

test('`.not` can be easier than relying on `// @ts-expect-error`', () => {
  type Fruit = {type: 'Fruit'; edible: boolean}
  type Apple = {type: 'Fruit'; name: 'Apple'; edible: true}

  expectTypeOf<Apple>().toMatchTypeOf<Fruit>()

  expectTypeOf<Fruit>().not.toMatchTypeOf<Apple>()
  expectTypeOf<Apple>().not.toEqualTypeOf<Fruit>()
})

test('Catch any/unknown/never types', () => {
  expectTypeOf<unknown>().toBeUnknown()
  expectTypeOf<any>().toBeAny()
  expectTypeOf<never>().toBeNever()
})

test('`.toEqualTypeOf` distinguishes between deeply-nested `any` and `unknown` properties', () => {
  expectTypeOf<{deeply: {nested: any}}>().not.toEqualTypeOf<{deeply: {nested: unknown}}>()
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

test('More `.not` examples', () => {
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

test('Assert on constructor parameters', () => {
  expectTypeOf(Date).toBeConstructibleWith('1970')
  expectTypeOf(Date).toBeConstructibleWith(0)
  expectTypeOf(Date).toBeConstructibleWith(new Date())
  expectTypeOf(Date).toBeConstructibleWith()

  expectTypeOf(Date).constructorParameters.toEqualTypeOf<[] | [string | number | Date]>()
})

test('Class instance types', () => {
  expectTypeOf(Date).instance.toHaveProperty('toISOString')
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
    throw Error('oh no')
  }

  expectTypeOf(thrower).returns.toBeNever()
})

test('Generics can be used rather than references', () => {
  expectTypeOf<{a: number; b?: number}>().not.toEqualTypeOf<{a: number}>()
  expectTypeOf<{a: number; b?: number | null}>().not.toEqualTypeOf<{a: number; b?: number}>()
  expectTypeOf<{a: number; b?: number | null}>().toEqualTypeOf<{a: number; b?: number | null}>()
})
