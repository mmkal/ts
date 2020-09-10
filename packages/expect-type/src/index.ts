/* eslint-disable @typescript-eslint/no-unused-vars */
export type Not<T extends boolean> = T extends true ? false : true
export type Or<Types extends boolean[]> = Types[number] extends false ? false : true
export type And<Types extends boolean[]> = Types[number] extends true ? true : false
export type Eq<Left extends boolean, Right extends boolean> = Left extends true ? Right : Not<Right>
export type Xor<Types extends [boolean, boolean]> = Not<Eq<Types[0], Types[1]>>

const secret = Symbol('secret')
type Secret = typeof secret

export type IsNever<T> = [T] extends [never] ? true : false
export type IsAny<T> = [T] extends [Secret] ? Not<IsNever<T>> : false
export type IsUnknown<T> = [unknown] extends [T] ? Not<IsAny<T>> : false
export type IsNeverOrAny<T> = Or<[IsNever<T>, IsAny<T>]>

type DeepBrand<T> = IsAny<T> extends true // avoid `any` matching `unknown`
  ? Secret
  : T extends (...args: infer P) => infer R // avoid functions with different params/return values matching
  ? {params: DeepBrand<P>; return: DeepBrand<R>; function: Secret}
  : {[K in keyof T]: DeepBrand<T[K]>}

export type Extends<L, R> = L extends R ? true : false
export type StrictExtends<L, R> = Extends<DeepBrand<L>, DeepBrand<R>>

export type Equal<Left, Right> = And<
  [
    StrictExtends<Left, Right>,
    StrictExtends<Right, Left>,
    StrictExtends<keyof Left, keyof Right>,
    StrictExtends<keyof Right, keyof Left>
  ]
>

export type Params<Actual> = Actual extends (...args: infer P) => any ? P : never
export type ConstructorParams<Actual> = Actual extends new (...args: infer P) => any
  ? Actual extends new () => any
    ? P | []
    : P
  : never

type MismatchArgs<B extends boolean, C extends boolean> = Eq<B, C> extends true ? [] : [never]

export interface Extendables {
  function: (...args: any[]) => any
  object: object
  array: any[]
  number: number
  string: string
  boolean: boolean
  symbol: symbol
  null: null
  undefined: undefined
}

export type SimpleChecks<Actual, B extends boolean> = {
  any: IsAny<Actual>
  unknown: IsUnknown<Actual>
  never: IsNever<Actual>
  nullable: Not<Equal<Actual, NonNullable<Actual>>>
} & {
  [K in keyof Extendables]: Extends<Actual, Extendables[K]>
}

export type ExpectTypeOf_SimpleChecks<Actual, B extends boolean> = {
  [K in keyof SimpleChecks<Actual, B> as `toBe${capitalize K}`]: () => SimpleChecks<Actual, B>[K] extends B ? true : throw `expected ${B extends true ? K : `not ${K}`}, got ${typeof Actual}`
}

type Expection<B extends boolean, Relationship extends string, Expected, Actual> = `expected type ${B extends true ? Relationship : `not ${Relationship}`} ${typeof Expected}, got ${typeof Actual}`

export interface ExpectTypeOf<Actual, B extends boolean> extends ExpectTypeOf_SimpleChecks<Actual, B> {
  toMatchTypeOf: <Expected>(e?: Expected) => Extends<Actual, Expected> extends B ? true : throw `expected type {B} extending {typeof Expected}, got {typeof Actual}` // todo format in types https://github.com/microsoft/TypeScript/pull/40402#issuecomment-689881024
  toEqualTypeOf: <Expected>(e?: Expected) => Equal<Actual, Expected> extends B ? true : throw `expected type {B} equivalent to {typeof Expected}, got {typeof Actual}` // todo ditto
  toBeCallableWith: B extends true ? ((...args: Params<Actual>) => true) : throw `don't use .not.toBeCallableWith. Use // @ts-expect-error. See github issues`
  toBeConstructibleWith: B extends true ? (...args: ConstructorParams<Actual>) => true : throw `don't use .not.toBeConstructibleWith. Use // @ts-expect-error. See github issues`
  toHaveProperty: <K extends string>(key: K) =>
    Extends<K, keyof Actual> extends B
      ? ExpectTypeOf<Actual[K & keyof Actual], B>
      : throw `expected ${Exclude<keyof Actual, symbol>}, got ${K}`
  parameter: <K extends keyof Params<Actual>>(number: K) => ExpectTypeOf<Params<Actual>[K], B>
  parameters: ExpectTypeOf<Params<Actual>, B>
  constructorParameters: ExpectTypeOf<ConstructorParams<Actual>, B>
  instance: Actual extends new (...args: any[]) => infer I ? ExpectTypeOf<I, B> : throw `${typeof Actual} is not constructible`
  returns: Actual extends (...args: any[]) => infer R ? ExpectTypeOf<R, B> : throw `${typeof Actual} is not a function`
  resolves: Actual extends PromiseLike<infer R> ? ExpectTypeOf<R, B> : throw `${typeof Actual} is not a promise`
  items: Actual extends ArrayLike<infer R> ? ExpectTypeOf<R, B> : throw `${typeof Actual} is not an array`
  not: ExpectTypeOf<Actual, Not<B>>
}
const fn: any = () => true

/**
 * Similar to Jest's `expect`, but with type-awareness.
 * Gives you access to a number of type-matchers that let you make assertions about the
 * form of a reference or generic type parameter.
 *
 * @example
 * import {foo, bar} from '../foo'
 * import {expectTypeOf} from 'expect-type'
 *
 * test('foo types', () => {
 *   // make sure `foo` has type {a: number}
 *   expectTypeOf(foo).toMatchTypeOf({a: 1})
 *   expectTypeOf(foo).toHaveProperty('a').toBeNumber()
 *
 *   // make sure `bar` is a function taking a string:
 *   expectTypeOf(bar).parameter(0).toBeString()
 *   expectTypeOf(bar).returns.not.toBeAny()
 * })
 *
 * @description
 * See the [full docs](https://npmjs.com/package/expect-type#documentation) for lots more examples.
 */
export const expectTypeOf = <Actual>(actual?: Actual): ExpectTypeOf<Actual, true> => {
  const nonFunctionProperties = [
    'parameters',
    'returns',
    'resolves',
    'not',
    'items',
    'constructorParameters',
    'instance',
  ] as const
  type Keys = keyof ExpectTypeOf<any, any>

  type FunctionsDict = Record<Exclude<Keys, typeof nonFunctionProperties[number]>, any>
  const obj: FunctionsDict = {
    toBeAny: fn,
    toBeUnknown: fn,
    toBeNever: fn,
    toBeFunction: fn,
    toBeObject: fn,
    toBeArray: fn,
    toBeString: fn,
    toBeNumber: fn,
    toBeBoolean: fn,
    toBeSymbol: fn,
    toBeNull: fn,
    toBeUndefined: fn,
    toBeNullable: fn,
    toMatchTypeOf: fn,
    toEqualTypeOf: fn,
    toBeCallableWith: fn,
    toBeConstructibleWith: fn,
    toHaveProperty: expectTypeOf,
    parameter: expectTypeOf,
  }

  const getterProperties: readonly Keys[] = nonFunctionProperties
  getterProperties.forEach((prop: Keys) => Object.defineProperty(obj, prop, {get: () => expectTypeOf({})}))

  return obj as any
}
