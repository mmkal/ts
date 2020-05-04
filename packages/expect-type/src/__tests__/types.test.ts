import * as a from '..'
import {expectTypeOf} from '..'

test('boolean type logic', () => {
  expectTypeOf<a.And<[true, true]>>().toEqualTypeOf<true>()
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

  expectTypeOf<a.Equal<1, 1>>().toEqualTypeOf<true>()
  expectTypeOf<a.Equal<1, number>>().toEqualTypeOf<false>()
  expectTypeOf<a.Equal<{a: 1}, {a: 1}>>().toEqualTypeOf<true>()
  expectTypeOf<a.Equal<[{a: 1}], [{a: 1}]>>().toEqualTypeOf<true>()
  expectTypeOf<a.Equal<never, never>>().toEqualTypeOf<true>()
  expectTypeOf<a.Equal<any, any>>().toEqualTypeOf<true>()
  expectTypeOf<a.Equal<unknown, unknown>>().toEqualTypeOf<true>()
  expectTypeOf<a.Equal<any, never>>().toEqualTypeOf<false>()
  expectTypeOf<a.Equal<any, unknown>>().toEqualTypeOf<false>()
  expectTypeOf<a.Equal<never, unknown>>().toEqualTypeOf<false>()
})

test('constructor params', () => {
  // The built-in ConstructorParameters type helper fails to pick up no-argument overloads.
  // This test checks that's still the case to avoid unnecessarily maintaining a workaround,
  // in case it's fixed in a future version

  // broken built-in behaviour:
  expectTypeOf<ConstructorParameters<typeof Date>>().toEqualTypeOf<[string | number | Date]>()
  expectTypeOf<typeof Date extends new (...args: infer Args) => any ? Args : never>().toEqualTypeOf<
    [string | number | Date]
  >()

  // workaround:
  expectTypeOf<a.ConstructorParams<typeof Date>>().toEqualTypeOf<[] | [string | number | Date]>()
})
