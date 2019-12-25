import {expectTypeOf} from '..'

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

  const thrower = () => {
    throw Error()
  }

  expectTypeOf(thrower).returns.toBeNever()
})
