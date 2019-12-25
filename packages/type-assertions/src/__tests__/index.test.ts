import {expectTypeOf} from '..'
import * as a from '..'

it('tests types', () => {
  expectTypeOf(1).not.toBeUnknown()
  expectTypeOf(1).not.toBeAny()
  expectTypeOf(1).not.toBeNever()

  expectTypeOf({a: 123}).toEqualTypeOf({a: 23})
  const f = (a: number) => [a, a]

  expectTypeOf(f).toBeCallableWith(123)
  expectTypeOf(f).not.toBeAny()
  expectTypeOf(f).returns.not.toBeAny()
  expectTypeOf(f).returns.toEqualTypeOf([123, 456])
  expectTypeOf(f)
    .parameter(0)
    .not.toEqualTypeOf('123')
  expectTypeOf(f)
    .parameter(0)
    .toEqualTypeOf(123)
  expectTypeOf(1)
    .parameter(0)
    .toBeNever()

  expectTypeOf({a: 1, b: 1}).toMatchTypeOf({a: 1})

  const thrower = () => {
    throw Error()
  }

  expectTypeOf(thrower).returns.toBeNever()
})

it('can do boolean type logic', () => {
  const true_ = true as const
  const false_ = false as const

  expectTypeOf({} as a.And<[true, true]>).toEqualTypeOf(true_)
  expectTypeOf({} as a.And<[true, false]>).toEqualTypeOf(false_)
  expectTypeOf({} as a.And<[false, true]>).toEqualTypeOf(false_)
  expectTypeOf({} as a.And<[false, false]>).toEqualTypeOf(false_)

  expectTypeOf({} as a.Or<[true, true]>).toEqualTypeOf(true_)
  expectTypeOf({} as a.Or<[true, false]>).toEqualTypeOf(true_)
  expectTypeOf({} as a.Or<[false, true]>).toEqualTypeOf(true_)
  expectTypeOf({} as a.Or<[false, false]>).toEqualTypeOf(false_)

  expectTypeOf({} as a.Xor<[true, true]>).toEqualTypeOf(false_)
  expectTypeOf({} as a.Xor<[true, false]>).toEqualTypeOf(true_)
  expectTypeOf({} as a.Xor<[false, true]>).toEqualTypeOf(true_)
  expectTypeOf({} as a.Xor<[false, false]>).toEqualTypeOf(false_)

  expectTypeOf({} as a.Not<true>).toEqualTypeOf(false_)
  expectTypeOf({} as a.Not<false>).toEqualTypeOf(true_)

  expectTypeOf({} as a.IsAny<any>).toEqualTypeOf(true_)
  expectTypeOf({} as a.IsUnknown<any>).toEqualTypeOf(false_)
  expectTypeOf({} as a.IsNever<any>).toEqualTypeOf(false_)

  expectTypeOf({} as a.IsAny<unknown>).toEqualTypeOf(false_)
  expectTypeOf({} as a.IsUnknown<unknown>).toEqualTypeOf(true_)
  expectTypeOf({} as a.IsNever<unknown>).toEqualTypeOf(false_)

  expectTypeOf({} as a.IsAny<never>).toEqualTypeOf(false_)
  expectTypeOf({} as a.IsUnknown<never>).toEqualTypeOf(false_)
  expectTypeOf({} as a.IsNever<never>).toEqualTypeOf(true_)

  expectTypeOf({} as a.Extends<1, number>).toEqualTypeOf(true_)
  expectTypeOf({} as a.Extends<number, 1>).toEqualTypeOf(false_)
})
