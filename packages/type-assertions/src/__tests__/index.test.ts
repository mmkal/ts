import * as a from '..'
import {expectTypeOf} from '..'

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
  expectTypeOf(Symbol(1)).toBeSymbol()
  expectTypeOf(undefined).toBeUndefined()
  expectTypeOf(null).toBeNull()
  expectTypeOf(null).not.toBeNumber()

  expectTypeOf(1).not.toBeUnknown()
  expectTypeOf(1).not.toBeAny()
  expectTypeOf(1).not.toBeNever()

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

it('can do boolean type logic', () => {
  expectTypeOf<a.And<[true, true]>>().toEqualTypeOf<true>()
  expectTypeOf<a.And<[true, false]>>().toEqualTypeOf<false>()
  expectTypeOf<a.And<[false, true]>>().toEqualTypeOf<false>()
  expectTypeOf<a.And<[false, false]>>().toEqualTypeOf<false>()

  expectTypeOf<a.Or<[true, true]>>().toEqualTypeOf<true>()
  expectTypeOf<a.Or<[true, false]>>().toEqualTypeOf<true>()
  expectTypeOf<a.Or<[false, true]>>().toEqualTypeOf<true>()
  expectTypeOf<a.Or<[false, false]>>().toEqualTypeOf<false>()

  expectTypeOf<a.Xor<[true, true]>>().toEqualTypeOf<false>()
  expectTypeOf<a.Xor<[true, false]>>().toEqualTypeOf<true>()
  expectTypeOf<a.Xor<[false, true]>>().toEqualTypeOf<true>()
  expectTypeOf<a.Xor<[false, false]>>().toEqualTypeOf<false>()

  expectTypeOf<a.Not<true>>().toEqualTypeOf<false>()
  expectTypeOf<a.Not<false>>().toEqualTypeOf<true>()

  expectTypeOf<a.IsAny<any>>().toEqualTypeOf<true>()
  expectTypeOf<a.IsUnknown<any>>().toEqualTypeOf<false>()
  expectTypeOf<a.IsNever<any>>().toEqualTypeOf<false>()

  expectTypeOf<a.IsAny<unknown>>().toEqualTypeOf<false>()
  expectTypeOf<a.IsUnknown<unknown>>().toEqualTypeOf<true>()
  expectTypeOf<a.IsNever<unknown>>().toEqualTypeOf<false>()

  expectTypeOf<a.IsAny<never>>().toEqualTypeOf<false>()
  expectTypeOf<a.IsUnknown<never>>().toEqualTypeOf<false>()
  expectTypeOf<a.IsNever<never>>().toEqualTypeOf<true>()

  expectTypeOf<a.Extends<1, number>>().toEqualTypeOf<true>()
  expectTypeOf<a.Extends<number, 1>>().toEqualTypeOf<false>()
})
